/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { MultiStepInput } from '../multipleStepInput';
import { load } from 'js-yaml';
import { readFile } from 'fs/promises';
import path = require('path');
import { CONFIG_ADD_ICON, CONFIG_CLEAR_ALL_ICON } from '../icons';
import { Authentication } from '../model';
import { FEATURE_EXPERIMENTATION_CLEAR_CONFIG } from '../commands/const';
import { AuthenticationStore } from '../store/AuthenticationStore';

const configMethods = ['Insert credentials', 'Import credentials from file'];

const configurationMethod: vscode.QuickPickItem[] = configMethods.map((label) => ({
  label,
}));

class CustomButton implements vscode.QuickInputButton {
  constructor(
    public iconPath: { light: vscode.Uri; dark: vscode.Uri } | vscode.ThemeIcon,
    public tooltip: string,
    public method: string,
  ) {}
}

const ClearAllAuthenticationButton = new CustomButton(CONFIG_CLEAR_ALL_ICON, 'Clear all Authentications', 'clear_all');
const CreateAuthenticationButton = new CustomButton(CONFIG_ADD_ICON, 'Create new configuration', 'create');

export class AuthenticationMenu {
  private title: string;
  private authentication!: Authentication;
  private authenticationList: Authentication[];
  private authenticationListItem: vscode.QuickPickItem[];
  private currentAuthentication: Authentication;
  private authenticationStore: AuthenticationStore;
  private addingMode: boolean;
  private deletingMode: boolean;
  private cancelMode: boolean;

  constructor(
    authenticationList: Authentication[],
    currentAuthentication: Authentication,
    authenticationStore: AuthenticationStore,
  ) {
    this.title = 'Configure Feature Experimentation';
    this.authentication = {
      account_environment_id: '',
      account_id: '',
      client_id: '',
      client_secret: '',
      username: '',
    } as Authentication;
    this.currentAuthentication = currentAuthentication;
    this.authenticationList = authenticationList;
    this.authenticationListItem = authenticationList.map((p) => ({
      label: p.username,
    }));
    this.addingMode = false;
    this.deletingMode = false;
    this.cancelMode = false;
    this.authenticationStore = authenticationStore;
  }

  async collectInputs() {
    const credential = {} as Authentication;
    if (this.authenticationList.length !== 0 || !this.currentAuthentication) {
      await MultiStepInput.run((input) => this.manageAuthentication(input, credential));
      return credential;
    }
    await MultiStepInput.run((input) => this.inputCredentialUsername(input, credential));
    return credential;
  }

  async manageAuthentication(input: MultiStepInput, credential: Authentication) {
    return this.pickManageAuthentication(input, credential);
  }

  async inputCredentialUsername(input: MultiStepInput, credential: Authentication) {
    credential.username = await input.showInputBox({
      title: this.title,
      step: 1,
      totalSteps: 2,
      placeholder: 'Authentication username',
      shouldResume: this.shouldResume,
      value: credential.username,
      ignoreFocusOut: true,
      prompt: 'Enter your authentication name',
      validate: (value) => this.validateCredentials(value, 'Authentication username'),
    });
    return (input: MultiStepInput) => this.pickAuthenticationMethod(input, credential);
  }

  async pickAuthenticationMethod(input: MultiStepInput, credential: Authentication) {
    const pick = await input.showQuickPick({
      title: this.title,
      step: 2,
      totalSteps: 2,
      placeholder: 'Pick an authentication method',
      items: configurationMethod,
      ignoreFocusOut: true,
      //buttons: [createResourceGroupButton, deleteResourceGroupButton, ClearAllResourceGroupButton],
      shouldResume: this.shouldResume,
    });
    if (pick.label === 'Import credentials from file') {
      return (input: MultiStepInput) => this.inputAuthenticationPath(input, credential);
    }
    return (input: MultiStepInput) => this.inputClientID(input, credential);
  }

  async inputClientID(input: MultiStepInput, credential: Authentication) {
    credential.client_id = await input.showInputBox({
      title: this.title,
      step: 1,
      totalSteps: 4,
      placeholder: 'Client ID',
      shouldResume: this.shouldResume,
      value: credential.client_id,
      ignoreFocusOut: true,
      prompt: 'Enter your client ID',
      validate: (value) => this.validateCredentials(value, 'ClientID'),
    });
    return (input: MultiStepInput) => this.inputClientSecret(input, credential);
  }

  async inputClientSecret(input: MultiStepInput, credential: Authentication) {
    credential.client_secret = await input.showInputBox({
      title: this.title,
      step: 2,
      totalSteps: 4,
      value: credential.client_secret,
      placeholder: 'Client Secret',
      ignoreFocusOut: true,
      prompt: 'Enter your client Secret',
      validate: (value) => this.validateCredentials(value, 'ClientSecret'),
      shouldResume: this.shouldResume,
    });
    return (input: MultiStepInput) => this.inputAccountID(input, credential);
  }

  async inputAccountID(input: MultiStepInput, credential: Authentication) {
    credential.account_id = await input.showInputBox({
      title: this.title,
      step: 3,
      totalSteps: 4,
      value: credential.account_id,
      placeholder: 'Account ID',
      ignoreFocusOut: true,
      prompt: 'Enter your account id',
      validate: (value) => this.validateCredentials(value, 'AccountID'),
      shouldResume: this.shouldResume,
    });

    return (input: MultiStepInput) => this.inputAccountEnvID(input, credential);
  }

  async inputAccountEnvID(input: MultiStepInput, credential: Authentication) {
    credential.account_environment_id = await input.showInputBox({
      title: this.title,
      step: 4,
      totalSteps: 4,
      value: credential.account_environment_id,
      placeholder: 'Account Environment ID',
      ignoreFocusOut: true,
      prompt: 'Enter your account environment id',
      validate: (value) => this.validateCredentials(value, 'AccountEnvID'),
      shouldResume: this.shouldResume,
    });

    this.authentication = credential;
  }

  async inputAuthenticationPath(input: MultiStepInput, authentication: Authentication) {
    const uriFile = await vscode.window.showOpenDialog({
      defaultUri: vscode.workspace.workspaceFolders?.[0].uri,
      title: 'Select Configuration file',
      filters: {
        Yaml: ['yaml', 'json', 'yml'],
      },
      canSelectFolders: false,
      canSelectFiles: true,
      canSelectMany: false,
    });

    const uri = vscode.workspace.workspaceFolders?.[0].uri;

    try {
      const pathConfig =
        process.platform.toString() === 'win32'
          ? path.resolve(uri!.path, uriFile![0].path).replace(/\\/g, '/').replace('C:/', '')
          : uriFile![0].path;
      const configFile = await readFile(pathConfig, 'utf8');
      this.authentication = load(configFile) as Authentication;

      if (
        !this.authentication.username ||
        !this.authentication.client_id ||
        !this.authentication.client_secret ||
        !this.authentication.account_id ||
        !this.authentication.account_environment_id ||
        !validPathCredentials(
          this.authentication.client_id,
          this.authentication.client_secret,
          this.authentication.account_id,
          this.authentication.account_environment_id,
        )
      ) {
        vscode.window.showErrorMessage("[Flagship] Might be an Error: can't read the credentials");
        this.cancelMode = true;
        return;
      }
    } catch (e) {
      vscode.window.showErrorMessage('[Flagship] No such file or directory');
      console.error(`[Flagship] Failed configuring Flagship Extension(provider): File or directory might not exist`);
      this.cancelMode = true;
      return;
    }
  }

  async pickManageAuthentication(input: MultiStepInput, credential: Authentication) {
    const pick = await input.showQuickPick({
      title: this.title,
      step: 1,
      totalSteps: 1,
      placeholder: 'Pick an authentication',
      items: this.authenticationList.map((i) => createQuickPickItem(this.currentAuthentication, i)),
      activeItem: this.authenticationListItem.find((i) => i.label === credential.username),
      buttons: [CreateAuthenticationButton, ClearAllAuthenticationButton],
      shouldResume: this.shouldResume,
      ignoreFocusOut: true,
    });
    if (pick instanceof CustomButton) {
      if (pick.method === 'create') {
        this.addingMode = true;
        return (input: MultiStepInput) => this.inputCredentialUsername(input, credential);
      } else if (pick.method === 'clear_all') {
        return this.pickConfirmationClearAll();
      }
    } else {
      return (input: MultiStepInput) => this.pickOperationForAuthentication(input, pick);
    }
  }

  async pickOperationForAuthentication(input: MultiStepInput, pick: vscode.QuickPickItem) {
    const choices = ['select', 'delete'];
    const credential = this.authenticationList.find((c) =>
      pick.label.includes('$(play)') ? '$(play)' + c.username === pick.label : c.username === pick.label,
    )!;

    const picked = await input.showQuickPick({
      title: this.title,
      step: 1,
      totalSteps: 2,
      placeholder: 'Pick an operation',
      items: choices.map((i) => createQuickPickOperation(i)),
      ignoreFocusOut: true,
      shouldResume: this.shouldResume,
    });

    if (picked.label === 'select') {
      this.authentication = credential;
    } else if (picked.label === 'delete') {
      return (input: MultiStepInput) => this.pickConfirmationDelete(input, pick);
    }
  }

  async pickConfirmationClearAll() {
    const picked = await vscode.window.showQuickPick(['yes', 'no'], {
      placeHolder: 'Do you confirm ?',
      ignoreFocusOut: true,
    });
    if (picked === 'yes') {
      this.deletingMode = true;
      vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_CLEAR_CONFIG);
      vscode.window.showInformationMessage('[Flagship] All configurations cleared');
      return;
    }
    return;
  }

  async pickConfirmationDelete(input: MultiStepInput, pick: vscode.QuickPickItem) {
    const picked = await vscode.window.showQuickPick(['yes', 'no'], {
      placeHolder: `Do you confirm the deleting of the configuration ${pick.label} ?`,
      ignoreFocusOut: true,
    });
    if (picked === 'yes') {
      await this.authenticationStore.deleteAuthentication(pick.label);

      const newList =
        this.authenticationList.length > 1
          ? this.authenticationList.filter((i) => i.username !== pick.label)
          : this.authenticationList.filter((i) => '$(play)' + i.username !== pick.label);
      //await this.stateConfig.updateGlobalState(CONFIGURATION_LIST, newList);
      this.deletingMode = true;
      this.authenticationList = [...newList];

      if (newList.length === 0) {
        vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_CLEAR_CONFIG);
        vscode.window.showInformationMessage('[Flagship] All configurations cleared');
        return;
      }

      if ('$(play)' + this.currentAuthentication.username === pick.label && this.authenticationList.length > 1) {
        this.deletingMode = false;
        return () => this.pickConfigAfterDeletingCurrentConfig(pick);
      }

      return;
    }
    return;
  }

  async pickConfigAfterDeletingCurrentConfig(pick: vscode.QuickPickItem) {
    const picked = await vscode.window.showQuickPick(
      this.authenticationList.filter((i) => '$(play)' + i.username !== pick.label).map((i) => i.username),
      {
        placeHolder: 'Choose a config ?',
        ignoreFocusOut: true,
      },
    );
    if (picked) {
      this.authenticationList.filter((i) => '$(play)' + i.username !== pick.label);
      await this.authenticationStore.deleteAuthentication(pick.label);

      this.authentication = this.authenticationList.find((i) => i.username === picked)!;
    }
    return;
  }

  shouldResume() {
    return new Promise<boolean>(() => {});
  }

  async validatePath(path: string) {
    if (!path.match(/\w\.\w/g)) {
      return 'Error in path in should include the file.';
    }
  }

  async validateCredentials(value: string, credentialAttribute: string) {
    if (
      credentialAttribute === 'Credential name' &&
      !!this.authenticationList.map((i) => i.username).find((i) => i === value)
    ) {
      return 'Authentication name already exists';
    }

    if (
      (credentialAttribute === 'AccountID' || credentialAttribute === 'AccountEnvID') &&
      !value.match(/^[a-zA-Z0-9]{20}$/g)
    ) {
      return `Invalid ${credentialAttribute}`;
    }

    if (
      credentialAttribute === 'ClientID' &&
      !value.match(/^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/g)
    ) {
      return `Invalid ${credentialAttribute}`;
    }

    if (credentialAttribute === 'ClientSecret' && !value.match(/^[a-zA-Z0-9]{64}$/g)) {
      return `Invalid ${credentialAttribute}`;
    }

    if (value === '' || value.match(/[^a-zA-Z\d\-]/g)) {
      return `Invalid ${credentialAttribute}`;
    }
  }

  async configure(): Promise<Authentication> {
    await this.collectInputs();

    if (this.deletingMode || this.cancelMode) {
      return {} as Authentication;
    }

    if (this.addingMode) {
      await this.authenticationStore.saveAuthentication(this.authentication);

      return {} as Authentication;
    }

    if (this.authentication.username) {
      await this.authenticationStore.saveAuthentication(this.authentication);
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Progress Notification',
          cancellable: true,
        },
        (progress, token) => {
          token.onCancellationRequested(() => {
            console.error('Canceled the long running operation');
            this.cancelMode = true;
          });

          progress.report({ increment: 0 });

          setTimeout(() => {
            progress.report({ increment: 10, message: 'Check credentials...' });
          }, 500);

          setTimeout(() => {
            progress.report({ increment: 40, message: 'Validating credentials...' });
          }, 1000);

          setTimeout(() => {
            progress.report({ increment: 50, message: 'Configuring the extension...' });
          }, 1500);

          setTimeout(() => {
            progress.report({ increment: 70, message: 'Storing credentials...' });
          }, 2000);

          const p = new Promise<void>(async (resolve) => {
            setTimeout(async () => {
              resolve();
            }, 2000);
          });

          return p;
        },
      );
      return this.authentication;
    }

    return {} as Authentication;
  }
}

function createQuickPickItem(currentConfig: Authentication, resource: Authentication): vscode.QuickPickItem {
  return {
    label: (currentConfig.username === resource.username ? '$(play)' : '') + resource.username,
    description: `${resource.account_environment_id ? "Environment ID: '${resource.account_environment_id}', " : ''} ${
      resource.account_id ? "Environment ID: Account ID: '${resource.account_id}'" : ''
    }`,
    detail: `Client ID: 'xxxx${resource.client_id.substr(
      resource.client_id.length - 6,
    )}' Client Secret: 'xxxx${resource.client_secret.substr(resource.client_secret.length - 6)}'`,
  };
}

function createQuickPickOperation(operation: string): vscode.QuickPickItem {
  return {
    label: operation,
  };
}

function validPathCredentials(clientId: string, clientSecret: string, accountId: string, accountEnvironmentId: string) {
  return (
    accountId.match(/^[a-zA-Z0-9]{20}$/g) &&
    accountEnvironmentId.match(/^[a-zA-Z0-9]{20}$/g) &&
    clientId.match(/^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/g) &&
    clientSecret.match(/^[a-zA-Z0-9]{64}$/g)
  );
}

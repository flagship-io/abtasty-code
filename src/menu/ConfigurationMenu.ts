/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { MultiStepInput } from '../multipleStepInput';
import { Cli } from '../providers/Cli';
import { Configuration } from '../configuration';
import { load } from 'js-yaml';
import { readFile } from 'fs/promises';
import path = require('path');
import { CONFIG_ADD_ICON, CONFIG_CLEAR_ALL_ICON } from '../icons';
import { Credential, CredentialStore } from '../model';
import { CLEAR_CONFIG } from '../commands/const';
import { CONFIGURATION_LIST, CURRENT_CONFIGURATION } from '../const';

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

const ClearAllConfigurationButton = new CustomButton(CONFIG_CLEAR_ALL_ICON, 'Clear all configurations', 'clear_all');
const CreateConfigurationButton = new CustomButton(CONFIG_ADD_ICON, 'Create new configuration', 'create');

export class ConfigurationMenu {
  private title: string;
  private readonly config: Configuration;
  private credState!: CredentialStore;
  private configurationList: CredentialStore[];
  private configurationListItem: vscode.QuickPickItem[];
  private currentConfiguration: CredentialStore;
  private cli: Cli;
  private editionMode: boolean;
  private addingMode: boolean;
  private deletingMode: boolean;
  private cancelMode: boolean;

  constructor(
    config: Configuration,
    credentialsStore: CredentialStore[],
    currentConfiguration: CredentialStore,
    cli: Cli,
  ) {
    this.title = 'Configure Extension';
    this.config = config;
    this.credState = {
      accountEnvId: '',
      accountId: '',
      clientId: '',
      clientSecret: '',
      name: '',
    } as CredentialStore;
    this.currentConfiguration = currentConfiguration;
    this.configurationList = credentialsStore;
    this.cli = cli;
    this.configurationListItem = credentialsStore.map((p) => ({
      label: p.name,
    }));
    this.editionMode = false;
    this.addingMode = false;
    this.deletingMode = false;
    this.cancelMode = false;
  }

  async collectInputs() {
    const credential = {} as CredentialStore;
    if ((await this.config.isWorkspaceConfigured()) || (await this.config.hasWorkspaceConfigured())) {
      await MultiStepInput.run((input) => this.manageConfiguration(input, credential));
      return credential;
    }
    await MultiStepInput.run((input) => this.inputCredentialName(input, credential));
    return credential;
  }

  async manageConfiguration(input: MultiStepInput, credential: CredentialStore) {
    return this.pickManageConfiguration(input, credential);
  }

  async inputCredentialName(input: MultiStepInput, credential: CredentialStore) {
    credential.name = await input.showInputBox({
      title: this.title,
      step: 1,
      totalSteps: 2,
      placeholder: 'Credential configuration name',
      shouldResume: this.shouldResume,
      value: credential.name,
      ignoreFocusOut: true,
      prompt: 'Enter your credentials configuration name',
      validate: (value) => this.validateCredentials(value, 'Credential name'),
    });
    this.editionMode = false;
    return (input: MultiStepInput) => this.pickConfigurationMethod(input, credential);
  }

  async pickConfigurationMethod(input: MultiStepInput, credential: CredentialStore) {
    const pick = await input.showQuickPick({
      title: this.title,
      step: 2,
      totalSteps: 2,
      placeholder: 'Pick a configuration method',
      items: configurationMethod,
      ignoreFocusOut: true,
      //buttons: [createResourceGroupButton, deleteResourceGroupButton, ClearAllResourceGroupButton],
      shouldResume: this.shouldResume,
    });
    if (pick.label === 'Import credentials from file') {
      return (input: MultiStepInput) => this.inputCredentialPath(input, credential);
    }
    return (input: MultiStepInput) => this.inputClientID(input, credential);
  }

  async inputClientID(input: MultiStepInput, credential: CredentialStore) {
    credential.clientId = await input.showInputBox({
      title: this.title,
      step: 1,
      totalSteps: 4,
      placeholder: 'Client ID',
      shouldResume: this.shouldResume,
      value: credential.clientId,
      ignoreFocusOut: true,
      prompt: 'Enter your client ID',
      validate: (value) => this.validateCredentials(value, 'ClientID'),
    });
    return (input: MultiStepInput) => this.inputClientSecret(input, credential);
  }

  async inputClientSecret(input: MultiStepInput, credential: CredentialStore) {
    credential.clientSecret = await input.showInputBox({
      title: this.title,
      step: 2,
      totalSteps: 4,
      value: credential.clientSecret,
      placeholder: 'Client Secret',
      ignoreFocusOut: true,
      prompt: 'Enter your client Secret',
      validate: (value) => this.validateCredentials(value, 'ClientSecret'),
      shouldResume: this.shouldResume,
    });
    return (input: MultiStepInput) => this.inputAccountID(input, credential);
  }

  async inputAccountID(input: MultiStepInput, credential: CredentialStore) {
    credential.accountId = await input.showInputBox({
      title: this.title,
      step: 3,
      totalSteps: 4,
      value: credential.accountId,
      placeholder: 'Account ID',
      ignoreFocusOut: true,
      prompt: 'Enter your account id',
      validate: (value) => this.validateCredentials(value, 'AccountID'),
      shouldResume: this.shouldResume,
    });
    return (input: MultiStepInput) => this.inputAccountEnvID(input, credential);
  }

  async inputAccountEnvID(input: MultiStepInput, credential: CredentialStore) {
    credential.accountEnvId = await input.showInputBox({
      title: this.title,
      step: 4,
      totalSteps: 4,
      value: credential.accountEnvId,
      placeholder: 'Account Environment ID',
      ignoreFocusOut: true,
      prompt: 'Enter your account environment id',
      validate: (value) => this.validateCredentials(value, 'AccountEnvID'),
      shouldResume: this.shouldResume,
    });

    this.credState = credential;
  }

  async inputCredentialPath(input: MultiStepInput, credential: CredentialStore) {
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
      const { client_id, client_secret, account_id, account_environment_id } = load(configFile) as Credential;

      if (
        !client_id ||
        !client_secret ||
        !account_id ||
        !account_environment_id ||
        !validePathCredentials(client_id, client_secret, account_id, account_environment_id)
      ) {
        vscode.window.showErrorMessage("[Flagship] Might be an Error: can't read the credentials");
        this.cancelMode = true;
        return;
      }

      credential.clientId = client_id;
      credential.clientSecret = client_secret;
      credential.accountId = account_id;
      credential.accountEnvId = account_environment_id;

      (<any>this.credState) = credential;
    } catch (e) {
      vscode.window.showErrorMessage('[Flagship] No such file or directory');
      console.error(`[Flagship] Failed configuring Flagship Extension(provider): File or directory might not exist`);
      this.cancelMode = true;
      return;
    }
  }

  async pickManageConfiguration(input: MultiStepInput, credential: CredentialStore) {
    const pick = await input.showQuickPick({
      title: this.title,
      step: 1,
      totalSteps: 1,
      placeholder: 'Pick a configuration',
      items: this.configurationList.map((i) => createQuickPickItem(this.currentConfiguration, i)),
      activeItem: this.configurationListItem.find((i) => i.label === credential.name),
      buttons: [CreateConfigurationButton, ClearAllConfigurationButton],
      shouldResume: this.shouldResume,
      ignoreFocusOut: true,
    });
    if (pick instanceof CustomButton) {
      if (pick.method === 'create') {
        this.addingMode = true;
        return (input: MultiStepInput) => this.inputCredentialName(input, credential);
      } else if (pick.method === 'clear_all') {
        return this.pickConfirmationClearAll();
      }
    } else {
      return (input: MultiStepInput) => this.pickOperationForConfiguration(input, pick);
    }
  }

  async pickOperationForConfiguration(input: MultiStepInput, pick: vscode.QuickPickItem) {
    const choices = ['select', 'edit', 'delete'];
    const credential = this.configurationList.find((c) =>
      pick.label.includes('$(play)') ? '$(play)' + c.name === pick.label : c.name === pick.label,
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
      this.editionMode = false;
      (<any>this.credState) = credential;
      vscode.window.showInformationMessage('[Flagship] Configuration selected !');
    } else if (picked.label === 'edit') {
      this.editionMode = '$(play)' + this.currentConfiguration.name !== pick.label;
      return (input: MultiStepInput) => this.inputClientID(input, credential);
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
      vscode.commands.executeCommand(CLEAR_CONFIG);
      vscode.window.showInformationMessage('[Flagship] All configurations cleared');
      return;
    }
    return;
  }

  async pickConfirmationDelete(input: MultiStepInput, pick: vscode.QuickPickItem) {
    const picked = await vscode.window.showQuickPick(['yes', 'no'], {
      placeHolder: 'Do you confirm ?',
      ignoreFocusOut: true,
    });
    if (picked === 'yes') {
      const newList =
        this.configurationList.length > 1
          ? this.configurationList.filter((i) => i.name !== pick.label)
          : this.configurationList.filter((i) => '$(play)' + i.name !== pick.label);
      await this.config.updateWorkspaceState(CONFIGURATION_LIST, newList);
      this.deletingMode = true;
      this.configurationList = [...newList];

      if (newList.length === 0) {
        vscode.commands.executeCommand(CLEAR_CONFIG);
        vscode.window.showInformationMessage('[Flagship] All configurations cleared');
        return;
      }

      if ('$(play)' + this.currentConfiguration.name === pick.label && this.configurationList.length > 1) {
        this.deletingMode = false;
        return (input: MultiStepInput) => this.pickConfigAfterDeletingCurrentConfig(input, pick);
      }
      vscode.window.showInformationMessage('[Flagship] Configuration deleted !');
      return;
    }
    return;
  }

  async pickConfigAfterDeletingCurrentConfig(input: MultiStepInput, pick: vscode.QuickPickItem) {
    const picked = await vscode.window.showQuickPick(
      this.configurationList.filter((i) => '$(play)' + i.name !== pick.label).map((i) => i.name),
      {
        placeHolder: 'Choose a config ?',
        ignoreFocusOut: true,
      },
    );
    if (picked) {
      await this.config.updateWorkspaceState(
        CONFIGURATION_LIST,
        this.configurationList.filter((i) => '$(play)' + i.name !== pick.label),
      );
      vscode.window.showInformationMessage('[Flagship] Configuration deleted !');
      (<any>this.credState) = this.configurationList.find((i) => i.name === picked);
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

  async validateCredentials(value: string, credentialAttribut: string) {
    if (
      credentialAttribut === 'Credential name' &&
      !!this.configurationList.map((i) => i.name).find((i) => i === value)
    ) {
      return 'Configuration name already exists';
    }

    if (
      (credentialAttribut === 'AccountID' || credentialAttribut === 'AccountEnvID') &&
      !value.match(/^[a-zA-Z0-9]{20}$/g)
    ) {
      return `Invalid ${credentialAttribut}`;
    }

    if (
      credentialAttribut === 'ClientID' &&
      !value.match(/^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/g)
    ) {
      return `Invalid ${credentialAttribut}`;
    }

    if (credentialAttribut === 'ClientSecret' && !value.match(/^[a-zA-Z0-9]{64}$/g)) {
      return `Invalid ${credentialAttribut}`;
    }

    if (value === '' || value.match(/[^a-zA-Z\d\-]/g)) {
      return `Invalid ${credentialAttribut}`;
    }
  }

  async configure() {
    await this.collectInputs();

    if (this.deletingMode || this.cancelMode) {
      return;
    }

    if (this.editionMode || this.addingMode) {
      if (!this.configurationList.map((i) => i.name).find((i) => i === (<any>this.credState).name)) {
        await this.config.updateWorkspaceState(CONFIGURATION_LIST, [...this.configurationList, <any>this.credState]);
      }
      this.editionMode
        ? vscode.window.showInformationMessage('[Flagship] Configuration edited !')
        : vscode.window.showInformationMessage('[Flagship] Configuration added !');
      return;
    }

    const configured = await this.cli.Credentials(
      (<any>this.credState).clientId,
      (<any>this.credState).clientSecret,
      (<any>this.credState).accountId,
      (<any>this.credState).accountEnvId,
    );

    if (configured) {
      if (!this.configurationList.map((i) => i.name).find((i) => i === (<any>this.credState).name)) {
        await this.config.updateWorkspaceState(CONFIGURATION_LIST, [...this.configurationList, <any>this.credState]);
      }

      await this.config.updateWorkspaceState(CURRENT_CONFIGURATION, <any>this.credState);
    }

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
    return true;
  }
}

function createQuickPickItem(currentConfig: CredentialStore, resource: CredentialStore): vscode.QuickPickItem {
  return {
    label: (currentConfig.name === resource.name ? '$(play)' : '') + resource.name,
    description: `Environment ID: '${resource.accountEnvId}', Account ID: '${resource.accountId}'`,
    detail: `Client ID: 'xxxx${resource.clientId.substr(
      resource.clientId.length - 6,
    )}' Client Secret: 'xxxx${resource.clientSecret.substr(resource.clientSecret.length - 6)}'`,
  };
}

function createQuickPickOperation(operation: string): vscode.QuickPickItem {
  return {
    label: operation,
  };
}

function validePathCredentials(
  clientId: string,
  clientSecret: string,
  accountId: string,
  accountEnvironmentId: string,
) {
  return (
    accountId.match(/^[a-zA-Z0-9]{20}$/g) &&
    accountEnvironmentId.match(/^[a-zA-Z0-9]{20}$/g) &&
    clientId.match(/^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/g) &&
    clientSecret.match(/^[a-zA-Z0-9]{64}$/g)
  );
}

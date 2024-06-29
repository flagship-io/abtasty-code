/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { MultiStepInput } from '../../multipleStepInput';
import { load } from 'js-yaml';
import { readFile } from 'fs/promises';
import path = require('path');
import { CONFIG_ADD_ICON, CONFIG_CLEAR_ALL_ICON } from '../../icons';
import { AccountWE, Authentication } from '../../model';
import { WEB_EXPERIMENTATION_CLEAR_CONFIG } from '../../commands/const';
import { AuthenticationStore } from '../../store/webExperimentation/AuthenticationStore';
import { rootPath } from '../../setupWebExpProviders';

class CustomButton implements vscode.QuickInputButton {
  constructor(
    public iconPath: { light: vscode.Uri; dark: vscode.Uri } | vscode.ThemeIcon,
    public tooltip: string,
    public method: string,
  ) {}
}

const ClearAllAuthenticationButton = new CustomButton(CONFIG_CLEAR_ALL_ICON, 'Clear all Authentications', 'clear_all');
const CreateAuthenticationButton = new CustomButton(CONFIG_ADD_ICON, 'Create new configuration', 'create');

const CreateAccountButton = new CustomButton(CONFIG_ADD_ICON, 'Insert new account ID', 'create');

export class AuthenticationMenu {
  private title: string;
  private authentication!: Authentication;
  private authenticationList: Authentication[];
  private authenticationListItem: vscode.QuickPickItem[];
  private currentAuthentication: Authentication;
  private authenticationStore: AuthenticationStore;
  private deletingMode: boolean;
  private cancelMode: boolean;

  constructor(
    authenticationList: Authentication[],
    currentAuthentication: Authentication,
    authenticationStore: AuthenticationStore,
  ) {
    this.title = 'Configure Web Experimentation';
    this.authentication = {
      account_id: '',
      client_id: '',
      client_secret: '',
      username: '',
      working_dir: '',
    } as Authentication;
    this.currentAuthentication = currentAuthentication;
    this.authenticationList = authenticationList;
    this.authenticationListItem = authenticationList.map((p) => ({
      label: p.username,
    }));
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
    return this.pickAuthentication(input, credential);
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

    this.authentication = credential;

    const authSuccess = await this.authenticationStore.createOrSetAuthentication(this.authentication);
    if (authSuccess) {
      return (input: MultiStepInput) => this.pickAccountID(input, credential);
    }
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

    this.authentication = credential;
  }

  async pickAuthentication(input: MultiStepInput, credential: Authentication) {
    const pick = await input.showQuickPick({
      title: this.title,
      step: 1,
      totalSteps: 1,
      placeholder: 'Pick an authentication',
      items: this.authenticationList.map((i) => quickPickAuthentication(this.currentAuthentication, i)),
      activeItem: this.authenticationListItem.find((i) => i.label === credential.username),
      buttons: [CreateAuthenticationButton, ClearAllAuthenticationButton],
      shouldResume: this.shouldResume,
      ignoreFocusOut: true,
    });
    if (pick instanceof CustomButton) {
      if (pick.method === 'create') {
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
      const authSuccess = await this.authenticationStore.createOrSetAuthentication(this.authentication);
      if (authSuccess) {
        return (input: MultiStepInput) => this.pickAccountID(input, credential);
      }
      return;
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
      vscode.commands.executeCommand(WEB_EXPERIMENTATION_CLEAR_CONFIG);
      vscode.window.showInformationMessage('[AB Tasty] All configurations cleared');
      return;
    }
    return;
  }

  async pickAccountID(input: MultiStepInput, credential: Authentication) {
    const accountList = await this.authenticationStore.getAccountList();
    const pick = await input.showQuickPick({
      title: this.title,
      step: 1,
      totalSteps: 1,
      placeholder: 'Pick an account',
      items: accountList.map((i) => quickPickAccount(i)),
      buttons: [CreateAccountButton],
      shouldResume: this.shouldResume,
      ignoreFocusOut: true,
    });
    if (pick instanceof CustomButton) {
      if (pick.method === 'create') {
        return (input: MultiStepInput) => this.inputAccountID(input, credential);
      }
    } else {
      credential.account_id = pick.label;
      this.authentication = credential;
    }
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
      this.deletingMode = true;
      this.authenticationList = [...newList];

      if (newList.length === 0) {
        vscode.commands.executeCommand(WEB_EXPERIMENTATION_CLEAR_CONFIG);
        vscode.window.showInformationMessage('[AB Tasty] All configurations cleared');
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

      return (input: MultiStepInput) => this.inputAccountID(input, this.authentication);
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
      credentialAttribute === 'Authentication username' &&
      !!this.authenticationList.map((i) => i.username).find((i) => i === value)
    ) {
      return 'Authentication name already exists';
    }

    if (credentialAttribute === 'AccountID' && !value.match(/^[a-zA-Z0-9]{5}$/g)) {
      return `Invalid ${credentialAttribute}`;
    }

    if (credentialAttribute === 'ClientID' && !value.match(/^\w{53}$/g)) {
      return `Invalid ${credentialAttribute}`;
    }

    if (credentialAttribute === 'ClientSecret' && !value.match(/^[a-zA-Z0-9]{50}$/g)) {
      return `Invalid ${credentialAttribute}`;
    }

    if (value === '' || value.match(/[^a-zA-Z\d\-\_]/g)) {
      return `Invalid ${credentialAttribute}`;
    }
  }

  async configure(): Promise<Authentication> {
    await this.collectInputs();

    if (this.deletingMode || this.cancelMode) {
      return {} as Authentication;
    }

    if (this.authentication.username) {
      if (rootPath) {
        this.authentication.working_dir = rootPath;
        await this.authenticationStore.selectDefaultWorkingDir(this.authentication);
      }

      await this.authenticationStore.selectAccount(this.authentication);
      configuringExtension(this.cancelMode);
      return this.authentication;
    }

    return {} as Authentication;
  }
}

function quickPickAuthentication(currentConfig: Authentication, resource: Authentication): vscode.QuickPickItem {
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

function quickPickAccount(resource: AccountWE): vscode.QuickPickItem {
  return {
    label: String(resource.id),
    description: `Name: '${resource.name}'`,
  };
}

function createQuickPickOperation(operation: string): vscode.QuickPickItem {
  return {
    label: operation,
  };
}

function validateCredentials(cancelMode: boolean) {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Progress Notification',
      cancellable: true,
    },
    (progress, token) => {
      token.onCancellationRequested(() => {
        console.error('Canceled the long running operation');
        cancelMode = true;
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
}

function openBrowserForAuthentication(cancelMode: boolean) {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Progress Notification',
      cancellable: true,
    },
    (progress, token) => {
      token.onCancellationRequested(() => {
        console.error('Canceled the long running operation');
        cancelMode = true;
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
}

function configuringExtension(cancelMode: boolean) {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Progress Notification',
      cancellable: true,
    },
    (progress, token) => {
      token.onCancellationRequested(() => {
        console.error('Canceled the long running operation');
        cancelMode = true;
      });

      progress.report({ increment: 0 });

      setTimeout(() => {
        progress.report({ increment: 10, message: 'Configuring the extension...' });
      }, 500);

      const p = new Promise<void>(async (resolve) => {
        setTimeout(async () => {
          resolve();
        }, 500);
      });

      return p;
    },
  );
}

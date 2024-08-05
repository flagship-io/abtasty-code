import * as vscode from 'vscode';
import { Cli } from '../cli/cmd/webExperimentation/Cli';
import {
  SET_CONTEXT,
  WEB_EXPERIMENTATION_ACCOUNT_LIST_LOAD,
  WEB_EXPERIMENTATION_ACCOUNT_LIST_REFRESH,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_REFRESH,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_REFRESH,
  WEB_EXPERIMENTATION_QUICK_ACCESS_REFRESH,
  WEB_EXPERIMENTATION_SET_CREDENTIALS,
  WEB_EXPERIMENTATION_VARIATION_LIST_REFRESH,
} from './const';

import { AuthenticationMenu } from '../menu/webExperimentation/AuthenticationMenu';
import { WEB_EXPERIMENTATION_CONFIGURED } from '../services/webExperimentation/const';
import { AuthenticationStore } from '../store/webExperimentation/AuthenticationStore';

export let currentConfigurationNameStatusBar: vscode.StatusBarItem;

export default async function configureWebExperimentationCmd(context: vscode.ExtensionContext, cli: Cli) {
  const authenticationStore: AuthenticationStore = new AuthenticationStore(context, cli);
  const configureExtension: vscode.Disposable = vscode.commands.registerCommand(
    WEB_EXPERIMENTATION_SET_CREDENTIALS,
    async () => {
      try {
        const authenticationList = (await authenticationStore.refreshAuthentication()) || [];
        const currentAuthentication = (await authenticationStore.getCurrentAuthentication()) || {};
        const sortedAuth = authenticationList.sort((a, b) => {
          if (a.username === currentAuthentication.username) {
            return -1;
          } else if (b.username === currentAuthentication.username) {
            return 1;
          } else {
            return a.username < b.username ? -1 : a.username > b.username ? 1 : 0;
          }
        });

        const authenticationMenu = new AuthenticationMenu(sortedAuth, currentAuthentication, authenticationStore);

        const configurationAddedOrSelected = await authenticationMenu.configure();
        const cliAuthenticated = !!configurationAddedOrSelected.username;
        if (cliAuthenticated) {
          const updatedCurrentConfiguration = await authenticationStore.getCurrentAuthentication();

          await context.globalState.update(WEB_EXPERIMENTATION_CONFIGURED, true);
          await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'webExperimentation');

          updateStatusBarItem(updatedCurrentConfiguration.username);

          const progressIndicator = showIndefiniteProgress('Fetching Resources');
          try {
            await Promise.all([
              vscode.commands.executeCommand(WEB_EXPERIMENTATION_CAMPAIGN_LIST_REFRESH),
              vscode.commands.executeCommand(WEB_EXPERIMENTATION_QUICK_ACCESS_REFRESH),
              vscode.commands.executeCommand(WEB_EXPERIMENTATION_ACCOUNT_LIST_REFRESH),
            ]);
          } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to fetch accounts: ${error.message}`);
          } finally {
            progressIndicator.done();
            return;
          }
        }

        if (!currentAuthentication.username) {
          setTimeout(async () => {
            updateStatusBarItem();
            vscode.window.showErrorMessage('[AB Tasty] Not configured.');
            console.error('Authentication error.');
          }, 2000);
        }

        return;
      } catch (err) {
        console.error(`[AB Tasty] Failed configuring AB Tasty Extension: ${err}`);
        vscode.window.showErrorMessage('[AB Tasty] An unexpected error occurred, please try again later.');
      }
    },
  );

  currentConfigurationNameStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  context.subscriptions.push(configureExtension, currentConfigurationNameStatusBar);
}

function updateStatusBarItem(currName?: string) {
  if (currName !== undefined) {
    currentConfigurationNameStatusBar.text = `$(megaphone) Current Web Experimentation configuration: ${currName}`;
    currentConfigurationNameStatusBar.command = WEB_EXPERIMENTATION_SET_CREDENTIALS;
    currentConfigurationNameStatusBar.show();
    return;
  }
  currentConfigurationNameStatusBar.hide();
  return;
}

export function showIndefiniteProgress(title: string): { done: () => void } {
  let progressResolve: () => void = () => {
    console.warn('Attempted to resolve progress before it was properly initialized.');
  };

  const promise = new Promise<void>((resolve) => {
    // Properly assign the function to resolve the promise.
    progressResolve = resolve;
  });

  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: title,
      cancellable: true,
    },
    (progress, token) => {
      token.onCancellationRequested(() => {
        console.log('User canceled the operation');
        progressResolve(); // Now safely callable
      });

      return promise;
    },
  );

  return {
    done: progressResolve,
  };
}

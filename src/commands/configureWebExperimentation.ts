import * as vscode from 'vscode';
import { Cli } from '../cli/cmd/webExperimentation/Cli';
import {
  SET_CONTEXT,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_REFRESH,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_REFRESH,
  WEB_EXPERIMENTATION_QUICK_ACCESS_REFRESH,
  WEB_EXPERIMENTATION_SET_CREDENTIALS,
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

          await Promise.all([
            vscode.commands.executeCommand(WEB_EXPERIMENTATION_MODIFICATION_LIST_REFRESH),
            vscode.commands.executeCommand(WEB_EXPERIMENTATION_CAMPAIGN_LIST_REFRESH),
            vscode.commands.executeCommand(WEB_EXPERIMENTATION_QUICK_ACCESS_REFRESH),
          ]);
          return;
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

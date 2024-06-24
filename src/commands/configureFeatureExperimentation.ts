import * as vscode from 'vscode';
import { Cli } from '../providers/Cli';
import {
  FEATURE_EXPERIMENTATION_FLAG_IN_FILE_REFRESH,
  FEATURE_EXPERIMENTATION_FLAG_LIST_REFRESH,
  FEATURE_EXPERIMENTATION_GOAL_LIST_REFRESH,
  FEATURE_EXPERIMENTATION_PROJECT_LIST_REFRESH,
  FEATURE_EXPERIMENTATION_QUICK_ACCESS_REFRESH,
  SET_CONTEXT,
  FEATURE_EXPERIMENTATION_SET_CREDENTIALS,
  WEB_EXPERIMENTATION_SET_CREDENTIALS,
  FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_REFRESH,
} from './const';

import { AuthenticationStore } from '../store/featureExperimentation/AuthenticationStore';
import { AuthenticationMenu } from '../menu/featureExperimentation/AuthenticationMenu';
import { FEATURE_EXPERIMENTATION_CONFIGURED } from '../services/featureExperimentation/const';

export let currentConfigurationNameStatusBar: vscode.StatusBarItem;

export default async function configureFeatureExperimentationCmd(context: vscode.ExtensionContext, cli: Cli) {
  const authenticationStore: AuthenticationStore = new AuthenticationStore(context, cli);
  const configureExtension: vscode.Disposable = vscode.commands.registerCommand(
    FEATURE_EXPERIMENTATION_SET_CREDENTIALS,
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

          await context.globalState.update(FEATURE_EXPERIMENTATION_CONFIGURED, true);
          await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'featureExperimentation');

          updateStatusBarItem(updatedCurrentConfiguration.username);

          await Promise.all([
            vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_FLAG_LIST_REFRESH),
            vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_FLAG_IN_FILE_REFRESH),
            vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_GOAL_LIST_REFRESH),
            vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_REFRESH),
            vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_PROJECT_LIST_REFRESH),
            vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_QUICK_ACCESS_REFRESH),
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
        console.error(`[AB Tasty] Failed configuring Flagship Extension: ${err}`);
        vscode.window.showErrorMessage('[AB Tasty] An unexpected error occurred, please try again later.');
      }
    },
  );

  currentConfigurationNameStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  context.subscriptions.push(configureExtension, currentConfigurationNameStatusBar);
}

function updateStatusBarItem(currName?: string) {
  if (currName !== undefined) {
    currentConfigurationNameStatusBar.text = `$(megaphone) Current Flagship configuration: ${currName}`;
    currentConfigurationNameStatusBar.command = FEATURE_EXPERIMENTATION_SET_CREDENTIALS;
    currentConfigurationNameStatusBar.show();
    return;
  }
  currentConfigurationNameStatusBar.hide();
  return;
}

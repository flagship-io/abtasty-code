import * as vscode from 'vscode';
import { StateConfiguration } from '../stateConfiguration';
import { ConfigurationMenu } from '../menu/ConfigurationMenu';
import { Cli } from '../providers/Cli';
import {
  FEATURE_EXPERIMENTATION_FLAG_IN_FILE_REFRESH,
  FEATURE_EXPERIMENTATION_FLAG_LIST_REFRESH,
  FEATURE_EXPERIMENTATION_GOAL_LIST_REFRESH,
  FEATURE_EXPERIMENTATION_PROJECT_LIST_REFRESH,
  FEATURE_EXPERIMENTATION_QUICK_ACCESS_REFRESH,
  SET_CONTEXT,
  FEATURE_EXPERIMENTATION_SET_CREDENTIALS,
  SET_CREDENTIALS_WE,
  FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_REFRESH,
} from './const';

import { ConfigurationStore } from '../store/ConfigurationStore';

export let currentConfigurationNameStatusBar: vscode.StatusBarItem;

export default async function configureFlagshipCmd(context: vscode.ExtensionContext, cli: Cli) {
  const configurationStore: ConfigurationStore = new ConfigurationStore(context, cli);
  const configureExtension: vscode.Disposable = vscode.commands.registerCommand(
    FEATURE_EXPERIMENTATION_SET_CREDENTIALS,
    async () => {
      try {
        const configurationList = (await configurationStore.refreshConfiguration()) || [];
        const currentConfiguration = (await configurationStore.getCurrentConfiguration()) || {};
        const sortedConfig = configurationList.sort((a, b) => {
          if (a.name === currentConfiguration.name) {
            return -1;
          } else if (b.name === currentConfiguration.name) {
            return 1;
          } else {
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
          }
        });
        const configurationMenu = new ConfigurationMenu(sortedConfig, currentConfiguration, configurationStore);

        const configurationAddedOrSelected = await configurationMenu.configure();
        const cliAuthenticated = !!configurationAddedOrSelected.name;
        if (cliAuthenticated) {
          const updatedCurrentConfiguration = await configurationStore.getCurrentConfiguration();

          await context.globalState.update('FSConfigured', true);
          await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'featureExperimentation');

          updateStatusBarItem(updatedCurrentConfiguration.name);

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

        if (!currentConfiguration.name) {
          setTimeout(async () => {
            updateStatusBarItem();
            vscode.window.showErrorMessage('[Flagship] Not configured.');
            console.error('Authentication error.');
          }, 2000);
        }

        return;
      } catch (err) {
        console.error(`[Flagship] Failed configuring Flagship Extension: ${err}`);
        vscode.window.showErrorMessage('[Flagship] An unexpected error occurred, please try again later.');
      }
    },
  );

  const configureExtensionWE: vscode.Disposable = vscode.commands.registerCommand(SET_CREDENTIALS_WE, async () => {
    await context.globalState.update('FSConfigured', true);
    await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'webExperimentation');
  });
  currentConfigurationNameStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  context.subscriptions.push(configureExtension, configureExtensionWE, currentConfigurationNameStatusBar);
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

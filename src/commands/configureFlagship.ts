import * as vscode from 'vscode';
import { Configuration } from '../configuration';
import { ConfigurationMenu } from '../menu/ConfigurationMenu';
import { Cli } from '../providers/Cli';
import { CredentialStore } from '../model';
import {
  FLAG_IN_FILE_REFRESH,
  FLAG_LIST_REFRESH,
  GOAL_LIST_REFRESH,
  PROJECT_LIST_REFRESH,
  QUICK_ACCESS_REFRESH,
  SET_CONTEXT,
  SET_CREDENTIALS,
  TARGETING_KEY_LIST_REFRESH,
} from './const';
import { CONFIGURATION_LIST, CURRENT_CONFIGURATION } from '../const';
import { extensionReload } from '../extensionReload';

export let currentConfigurationNameStatusBar: vscode.StatusBarItem;

export default async function configureFlagshipCmd(context: vscode.ExtensionContext, config: Configuration, cli: Cli) {
  const configureExtension: vscode.Disposable = vscode.commands.registerCommand(SET_CREDENTIALS, async () => {
    try {
      const configurationStore = ((await config.getGlobalState(CONFIGURATION_LIST)) as CredentialStore[]) || [];
      const currentConfiguration = (await config.getGlobalState(CURRENT_CONFIGURATION)) as CredentialStore;
      const sortedConfig = configurationStore.sort((a, b) => {
        if (a.name === currentConfiguration.name) {
          return -1;
        } else if (b.name === currentConfiguration.name) {
          return 1;
        } else {
          return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        }
      });
      const configurationMenu = new ConfigurationMenu(config, sortedConfig, currentConfiguration, cli);
      const cliConfigured = await configurationMenu.configure();
      const cliAuthenticated = cliConfigured && (await cli.Authenticate());

      if (cliAuthenticated) {
        const tokenInfo = await cli.GetTokenInfo();
        await context.globalState.update('FSConfigured', true);
        await vscode.commands.executeCommand(SET_CONTEXT, 'flagship:enableFlagshipExplorer', true);
        const updatedCurrentConfiguration = (await config.getGlobalState(CURRENT_CONFIGURATION)) as CredentialStore;
        updatedCurrentConfiguration.scope = tokenInfo.scope;
        await config.updateGlobalState(CURRENT_CONFIGURATION, updatedCurrentConfiguration);
        updateStatusBarItem(updatedCurrentConfiguration.name);
        await Promise.all([
          vscode.commands.executeCommand(FLAG_LIST_REFRESH),
          vscode.commands.executeCommand(FLAG_IN_FILE_REFRESH),
          vscode.commands.executeCommand(GOAL_LIST_REFRESH),
          vscode.commands.executeCommand(TARGETING_KEY_LIST_REFRESH),
          vscode.commands.executeCommand(PROJECT_LIST_REFRESH),
          vscode.commands.executeCommand(QUICK_ACCESS_REFRESH),
        ]);

        setTimeout(async () => {
          vscode.window.showInformationMessage('[Flagship] Configured successfully');
        }, 2000);
        return;
      }
      await Promise.all([
        vscode.commands.executeCommand(FLAG_LIST_REFRESH),
        vscode.commands.executeCommand(FLAG_IN_FILE_REFRESH),
        vscode.commands.executeCommand(PROJECT_LIST_REFRESH),
        vscode.commands.executeCommand(GOAL_LIST_REFRESH),
        vscode.commands.executeCommand(TARGETING_KEY_LIST_REFRESH),
        vscode.commands.executeCommand(QUICK_ACCESS_REFRESH),
      ]);
      if (!cliAuthenticated && cliConfigured !== undefined) {
        setTimeout(async () => {
          updateStatusBarItem();
          vscode.window.showErrorMessage('[Flagship] Not configured.');
          console.error('Authentication error.');
        }, 2000);
      }

      if (cliConfigured !== undefined) {
        console.error('[Flagship] Configuration failed');
      }
    } catch (err) {
      console.error(`[Flagship] Failed configuring Flagship Extension: ${err}`);
      vscode.window.showErrorMessage('[Flagship] An unexpected error occurred, please try again later.');
    }
  });

  currentConfigurationNameStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  context.subscriptions.push(configureExtension, currentConfigurationNameStatusBar);
}

function updateStatusBarItem(currName?: string) {
  if (currName !== undefined) {
    currentConfigurationNameStatusBar.text = `$(megaphone) Current Flagship configration: ${currName}`;
    currentConfigurationNameStatusBar.command = SET_CREDENTIALS;
    currentConfigurationNameStatusBar.show();
    return;
  }
  currentConfigurationNameStatusBar.hide();
  return;
}

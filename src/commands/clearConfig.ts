import * as vscode from 'vscode';
import { Configuration } from '../configuration';
import { currentConfigurationNameStatusBar } from './configureFlagship';
import { CLEAR_CONFIG, SET_CONTEXT } from './const';

export default async function clearConfigCmd(context: vscode.ExtensionContext, config: Configuration) {
  const clearConfig: vscode.Disposable = vscode.commands.registerCommand(CLEAR_CONFIG, async () => {
    try {
      await Promise.all([
        config.clearWorkspaceConfig(),
        context.workspaceState.update('FSConfigured', false),
        vscode.commands.executeCommand(SET_CONTEXT, 'flagship:enableFlagshipExplorer', false),
      ]);
      currentConfigurationNameStatusBar.hide();
      vscode.window.showInformationMessage('[Flagship] Configuration removed.');
      vscode.window.showErrorMessage('[Flagship] Not configured.');
    } catch (err) {
      console.error(`[Flagship] Failed clearing configuration: ${err}`);
      vscode.window.showErrorMessage('[Flagship] An unexpected error occurred, please try again later.');
    }
  });
  context.subscriptions.push(clearConfig);
}

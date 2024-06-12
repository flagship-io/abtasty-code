import * as vscode from 'vscode';
import { StateConfiguration } from '../stateConfiguration';
import { currentConfigurationNameStatusBar } from './configureFeatureExperimentation';
import { FEATURE_EXPERIMENTATION_CLEAR_CONFIG, SET_CONTEXT } from './const';

export default async function clearConfigCmd(context: vscode.ExtensionContext, stateConfig: StateConfiguration) {
  const clearConfig: vscode.Disposable = vscode.commands.registerCommand(
    FEATURE_EXPERIMENTATION_CLEAR_CONFIG,
    async () => {
      try {
        await Promise.all([
          stateConfig.clearGlobalConfig(),
          context.globalState.update('FSConfigured', false),
          vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'welcomePage'),
        ]);
        currentConfigurationNameStatusBar.hide();
        vscode.window.showErrorMessage('[Flagship] Not configured.');
      } catch (err) {
        console.error(`[Flagship] Failed clearing configuration: ${err}`);
        vscode.window.showErrorMessage('[Flagship] An unexpected error occurred, please try again later.');
      }
    },
  );

  context.subscriptions.push(clearConfig);
}

import * as vscode from 'vscode';
import { StateConfiguration } from '../stateConfiguration';
import { currentConfigurationNameStatusBar } from './configureFeatureExperimentation';
import { FEATURE_EXPERIMENTATION_CLEAR_CONFIG, SET_CONTEXT, WEB_EXPERIMENTATION_CLEAR_CONFIG } from './const';
import { FEATURE_EXPERIMENTATION_CONFIGURED } from '../services/featureExperimentation/const';
import { WEB_EXPERIMENTATION_CONFIGURED } from '../services/webExperimentation/const';

export default async function clearConfigCmd(context: vscode.ExtensionContext, stateConfig: StateConfiguration) {
  const clearConfigFeatExp: vscode.Disposable = vscode.commands.registerCommand(
    FEATURE_EXPERIMENTATION_CLEAR_CONFIG,
    async () => {
      try {
        await Promise.all([
          stateConfig.clearGlobalConfigFeatExp(),
          context.globalState.update(FEATURE_EXPERIMENTATION_CONFIGURED, false),
          vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'welcomePage'),
        ]);
        currentConfigurationNameStatusBar.hide();
        vscode.window.showErrorMessage('[AB Tasty] Not configured.');
      } catch (err) {
        console.error(`[AB Tasty] Failed clearing configuration: ${err}`);
        vscode.window.showErrorMessage('[AB Tasty] An unexpected error occurred, please try again later.');
      }
    },
  );

  const clearConfigWebExp: vscode.Disposable = vscode.commands.registerCommand(
    WEB_EXPERIMENTATION_CLEAR_CONFIG,
    async () => {
      try {
        await Promise.all([
          stateConfig.clearGlobalConfigWebExp(),
          context.globalState.update(WEB_EXPERIMENTATION_CONFIGURED, false),
          vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'welcomePage'),
        ]);
        currentConfigurationNameStatusBar.hide();
        vscode.window.showErrorMessage('[AB Tasty] Not configured.');
      } catch (err) {
        console.error(`[AB Tasty] Failed clearing configuration: ${err}`);
        vscode.window.showErrorMessage('[AB Tasty] An unexpected error occurred, please try again later.');
      }
    },
  );

  context.subscriptions.push(clearConfigFeatExp, clearConfigWebExp);
}

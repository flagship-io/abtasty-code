import * as vscode from 'vscode';
import { setupFeatExpProviders } from './setupFeatExpProviders';
import { StateConfiguration } from './stateConfiguration';
import { Cli } from './cli/cmd/featureExperimentation/Cli';
import { SET_CONTEXT } from './commands/const';
import { FEATURE_EXPERIMENTATION_CONFIGURED } from './services/featureExperimentation/const';

export async function featureExpExtensionReload(
  context: vscode.ExtensionContext,
  stateConfig: StateConfiguration,
  cli: Cli,
) {
  await setupFeatExpProviders(context, stateConfig, cli);

  if (await stateConfig.isGlobalConfiguredFeatExp()) {
    await context.globalState.update(FEATURE_EXPERIMENTATION_CONFIGURED, true);
    await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'featureExperimentation');
    return;
  }

  await context.globalState.update(FEATURE_EXPERIMENTATION_CONFIGURED, false);
  await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'welcomePage');
  return;
}

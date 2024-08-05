import * as vscode from 'vscode';
import { SET_CONTEXT } from './commands/const';
import { Cli } from './cli/cmd/webExperimentation/Cli';
import { WEB_EXPERIMENTATION_CONFIGURED } from './services/webExperimentation/const';
import { StateConfiguration } from './stateConfiguration';
import { setupWebExpProviders } from './setupWebExpProviders';

export async function webExpExtensionReload(
  context: vscode.ExtensionContext,
  stateConfig: StateConfiguration,
  cli: Cli,
) {
  await setupWebExpProviders(context, cli);

  if (await stateConfig.isGlobalConfiguredWebExp()) {
    await context.globalState.update(WEB_EXPERIMENTATION_CONFIGURED, true);
    await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'webExperimentation');
    return;
  }

  await context.globalState.update(WEB_EXPERIMENTATION_CONFIGURED, false);
  await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'welcomePage');
  return;
}

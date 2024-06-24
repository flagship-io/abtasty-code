import * as vscode from 'vscode';
import { setupProviders } from './setupProviders';
import { StateConfiguration } from './stateConfiguration';
import { Cli } from './providers/Cli';
import { SET_CONTEXT } from './commands/const';
import { WEB_EXPERIMENTATION_CONFIGURED } from './services/webExperimentation/const';

export async function webExpExtensionReload(
  context: vscode.ExtensionContext,
  stateConfig: StateConfiguration,
  cli: Cli,
) {
  // TODO: setProviders for WEB
  //await setupProviders(context, stateConfig, cli);

  if (await stateConfig.isGlobalConfiguredWebExp()) {
    await context.globalState.update(WEB_EXPERIMENTATION_CONFIGURED, true);
    await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'webExperimentation');
    return;
  }

  await context.globalState.update(WEB_EXPERIMENTATION_CONFIGURED, false);
  await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'welcomePage');
  return;
}

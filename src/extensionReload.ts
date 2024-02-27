import * as vscode from 'vscode';
import { setupProviders } from './setupProviders';
import { StateConfiguration } from './stateConfiguration';
import { Cli } from './providers/Cli';
import { SET_CONTEXT } from './commands/const';

export async function extensionReload(context: vscode.ExtensionContext, stateConfig: StateConfiguration, cli: Cli) {
  await setupProviders(context, stateConfig, cli);

  if (await stateConfig.isGlobalConfigured()) {
    await context.globalState.update('FSConfigured', true);
    await vscode.commands.executeCommand(SET_CONTEXT, 'flagship:enableFlagshipExplorer', true);
    return;
  }

  await context.globalState.update('FSConfigured', false);
  await vscode.commands.executeCommand(SET_CONTEXT, 'flagship:enableFlagshipExplorer', false);
  return;
}

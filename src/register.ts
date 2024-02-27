import * as vscode from 'vscode';
import { StateConfiguration } from './stateConfiguration';
import configureFlagshipCmd from './commands/configureFlagship';
import clearConfigCmd from './commands/clearConfig';
import { extensionReload } from './extensionReload';
import checkCliVersionCmd from './commands/checkCliVersion';
import { Cli } from './providers/Cli';

export async function register(context: vscode.ExtensionContext, stateConfig: StateConfiguration): Promise<void> {
  const cli = new Cli(context);
  await Promise.all([
    configureFlagshipCmd(context, stateConfig, cli),
    clearConfigCmd(context, stateConfig),
    checkCliVersionCmd(context, cli),
    extensionReload(context, stateConfig, cli),
  ]);
}

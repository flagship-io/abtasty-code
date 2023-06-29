import * as vscode from 'vscode';
import { Configuration } from './configuration';
import configureFlagshipCmd from './commands/configureFlagship';
import clearConfigCmd from './commands/clearConfig';
import { extensionReload } from './extensionReload';
import checkCliVersionCmd from './commands/checkCliVersion';
import { Cli } from './providers/Cli';

export async function register(context: vscode.ExtensionContext, config: Configuration): Promise<void> {
  const cli = new Cli(context);
  await Promise.all([
    configureFlagshipCmd(context, config, cli),
    clearConfigCmd(context, config),
    checkCliVersionCmd(context, cli),
    extensionReload(context, config, cli),
  ]);
}

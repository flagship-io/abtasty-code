import * as vscode from 'vscode';
import { Cli } from '../providers/Cli';
import { CHECK_CLI_VERSION } from './const';

export default async function checkCliVersionCmd(context: vscode.ExtensionContext, cli: Cli) {
  const checkCliVersion: vscode.Disposable = vscode.commands.registerCommand(CHECK_CLI_VERSION, async () => {
    try {
      vscode.window.showInformationMessage(await cli.Version());
    } catch (err) {
      console.error(`[Flagship] Failed checking the CLI version: ${err}`);
      vscode.window.showErrorMessage('[Flagship] An unexpected error occurred, please try again later.');
    }
  });
  context.subscriptions.push(checkCliVersion);
}

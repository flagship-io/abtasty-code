import * as vscode from 'vscode';
import { CHECK_CLI_VERSION } from './const';
import { Cli } from '../cli/cmd/featureExperimentation/Cli';

export default async function checkCliVersionCmd(context: vscode.ExtensionContext, cli: Cli) {
  const checkCliVersion: vscode.Disposable = vscode.commands.registerCommand(CHECK_CLI_VERSION, async () => {
    try {
      vscode.window.showInformationMessage(await cli.Version());
    } catch (err) {
      console.error(`[AB Tasty] Failed checking the CLI version: ${err}`);
      vscode.window.showErrorMessage('[AB Tasty] An unexpected error occurred, please try again later.');
    }
  });
  context.subscriptions.push(checkCliVersion);
}

/* eslint-disable @typescript-eslint/naming-convention */
import * as fs from 'fs';
import * as vscode from 'vscode';
import { CliDownloader, CliVersion } from './cli/cliDownloader';
import { FLAG_IN_FILE_REFRESH } from './commands/const';
import { Configuration } from './configuration';
import { register as registerCommands } from './register';

let timer: NodeJS.Timeout | undefined;

async function handleActiveTextEditorChange() {
  if (timer) {
    clearTimeout(timer);
    timer = undefined;
  }

  timer = setTimeout(async () => {
    const activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
      await vscode.commands.executeCommand(FLAG_IN_FILE_REFRESH, activeEditor?.document.uri.path);
    } else {
      await vscode.commands.executeCommand(FLAG_IN_FILE_REFRESH);
    }
  }, 100);
}

export async function activate(context: vscode.ExtensionContext) {
  const config = new Configuration(context);

  const binaryDir = `${context.asAbsolutePath('flagship')}/${CliVersion}`;

  fs.access(binaryDir, fs.constants.F_OK, async (err) => {
    if (err) {
      await CliDownloader(context, binaryDir);
      return;
    }
  });

  vscode.window.onDidChangeActiveTextEditor(handleActiveTextEditorChange);

  try {
    await registerCommands(context, config);
  } catch (err) {
    console.error(err);
  }
}

/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as fs from 'fs';
import { CliDownloader, CliVersion } from './cli/cliDownloader';
import { Configuration } from './configuration';
import { register as registerCommands } from './register';
import {
  FLAG_IN_FILE_REFRESH,
  FLAG_LIST_REFRESH,
  GOAL_LIST_REFRESH,
  PROJECT_LIST_REFRESH,
  QUICK_ACCESS_REFRESH,
  TARGETING_KEY_LIST_REFRESH,
} from './commands/const';

var stateTrigger: boolean = false;

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

  vscode.window.onDidChangeWindowState(async (p: any) => {
    if (stateTrigger !== p.active) {
      stateTrigger = p.active;
      if (stateTrigger) {
        await Promise.all([
          vscode.commands.executeCommand(FLAG_LIST_REFRESH),
          vscode.commands.executeCommand(FLAG_IN_FILE_REFRESH),
          vscode.commands.executeCommand(GOAL_LIST_REFRESH),
          vscode.commands.executeCommand(TARGETING_KEY_LIST_REFRESH),
          vscode.commands.executeCommand(PROJECT_LIST_REFRESH),
          vscode.commands.executeCommand(QUICK_ACCESS_REFRESH),
        ]);
      }
    }
  });

  try {
    await registerCommands(context, config);
  } catch (err) {
    console.error(err);
  }
}

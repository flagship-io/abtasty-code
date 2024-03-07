/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from 'vscode';
import { Cli } from './Cli';
import { FlagAnalyzedType } from '../model';
import { FIND_IN_FILE, FLAG_IN_FILE_REFRESH } from '../commands/const';
import { rootPath } from '../setupProviders';

export class FileAnalyzed extends vscode.TreeItem {
  public readonly file: string | undefined;
  public readonly fileURL: string | undefined;
  public readonly error: string | undefined;
  public readonly results: FlagAnalyzedType[] | undefined;

  // children represent branches, which are also items
  public children: FlagAnalyzed[] = [];

  constructor(file: string, fileURL: string, error: string, label: string, flagNumber?: number) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.file = file;
    this.fileURL = fileURL;
    this.error = error;
    this.tooltip = `File URL: ${this.fileURL}`;
    this.description = `${flagNumber || 0} flag(s) found`;
  }

  public add_child(child: FlagAnalyzed) {
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    this.children.push(child);
  }
}

export class FlagAnalyzed extends vscode.TreeItem {
  public readonly lineNumber: number;
  public readonly file: string;
  public readonly flagKey: string;
  public readonly flagDefaultValue: string;
  public readonly flagType: string;
  public readonly label!: string;

  constructor(
    flagKey: string,
    flagType: string,
    flagDefaultValue: string,
    lineNumber: number,
    label: string,
    file: string,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.flagKey = flagKey;
    this.flagType = flagType;
    this.flagDefaultValue = flagDefaultValue;
    this.lineNumber = lineNumber;
    this.file = file;

    this.tooltip = flagType;
    this.description = `Type: ${flagType}, default value: ${flagDefaultValue}`;

    this.contextValue = 'flagAnalyzedItem';
  }
}

export class FileAnalyzedProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private fileAnalyzed: FileAnalyzed[] = [];
  private cli: Cli;
  private path: string | undefined;
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<
    vscode.TreeItem | undefined
  >();

  readonly onDidChangeTreeData?: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

  public constructor(private context: vscode.ExtensionContext, path: string | undefined, cli: Cli) {
    this.path = path;
    this.cli = cli;

    vscode.commands.registerCommand(FLAG_IN_FILE_REFRESH, async (path: string, forceListFlags: boolean) => {
      if (path) {
        return await this.refresh(path, forceListFlags);
      }
      return await this.refresh(rootPath, forceListFlags);
    });
  }

  public getTreeItem(item: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return item;
  }

  public getChildren(element: FileAnalyzed | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
    if (element === undefined) {
      if (this.path === rootPath) {
        return this.fileAnalyzed.filter((f) => f.children.length !== 0);
      }
      return this.fileAnalyzed;
    }

    return this.fileAnalyzed.filter((f) => f === element).flatMap((a) => a.children);
  }

  public async refresh(path?: string, forceListFlags?: boolean) {
    this.fileAnalyzed = [];
    if (vscode.workspace.workspaceFolders) {
      this.path = path;
      if (this.path) {
        await this.getFileAnalyzed(path !== undefined ? path : rootPath!, !!forceListFlags);
        this._onDidChangeTreeData.fire(undefined);
        return;
      }
    }
  }

  private async getFileAnalyzed(path: string, forceListFlags: boolean) {
    const OSPath =
      (process.platform.toString() === 'win32'
        ? forceListFlags
          ? path
          : vscode.window.activeTextEditor?.document.uri.path!.substring(1)
        : forceListFlags
        ? path
        : vscode.window.activeTextEditor?.document.uri.path!) || rootPath;
    const filesAnalyzed = await this.cli.ListAnalyzedFlag(OSPath!);
    if (filesAnalyzed) {
      filesAnalyzed.map(({ File, FileURL, Error, Results }) => {
        const fileClass = new FileAnalyzed(
          File,
          FileURL,
          Error,
          File.split(process.platform.toString() === 'win32' ? '\\' : '/').slice(-1)[0],
          Results?.length,
        );
        Results?.map((result) => {
          if (result.FlagKey) {
            const flagAnalyzed = new FlagAnalyzed(
              result.FlagKey,
              result.FlagType,
              result.FlagDefaultValue,
              result.LineNumber,
              result.FlagKey,
              fileClass.file!,
            );
            fileClass.add_child(flagAnalyzed);
          }
        });

        this.fileAnalyzed.push(fileClass);
      });
    }
  }
}

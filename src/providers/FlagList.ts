/* eslint-disable @typescript-eslint/naming-convention */
import * as path from 'path';
import * as vscode from 'vscode';
import { Cli } from './Cli';
import { CredentialStore, ItemResource } from '../model';
import { CURRENT_CONFIGURATION, DEFAULT_BASE_URI } from '../const';
import { FLAGSHIP_OPEN_BROWSER, FLAG_LIST_OPEN_IN_BROWSER, FLAG_LIST_REFRESH } from '../commands/const';

export class FlagListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _flags: FlagItem[] = [];
  private cli: Cli;

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private context: vscode.ExtensionContext, cli: Cli) {
    //commands.registerCommand('flagList.on_item_clicked', (item) => this.on_item_clicked(item));

    vscode.commands.registerCommand(FLAG_LIST_REFRESH, async () => await this.refresh());
    vscode.commands.registerCommand(FLAG_LIST_OPEN_IN_BROWSER, async () => {
      const baseUrl = `${DEFAULT_BASE_URI}/env`;
      const { accountEnvId } = (await this.context.workspaceState.get(CURRENT_CONFIGURATION)) as CredentialStore;
      await vscode.commands.executeCommand(FLAGSHIP_OPEN_BROWSER, `${baseUrl}/${accountEnvId}/flags-list`);
    });
    this.cli = cli;
  }

  /*
  public on_item_clicked(item: TreeItem) {
    console.log(item);
  } */

  public async refresh() {
    const { scope } = this.context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
    this._flags = [];
    if (scope?.includes('flag.list')) {
      await this.getFlags();
    }
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(item: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    /*     let title = item.label ? item.label.toString() : '';
    item.command = {
      command: 'flagList.on_item_clicked',
      title: title,
      arguments: [item],
    }; */
    return item;
  }

  getChildren(element?: FlagItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
    const { scope } = this.context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
    let items: vscode.TreeItem[] = [];

    if (!scope?.includes('flag.list')) {
      return [new vscode.TreeItem("You don't have the correct scope for this feature")];
    }

    if (this._flags.length === 0) {
      const noFlag = new vscode.TreeItem('No flag found');
      return [noFlag];
    }

    if (typeof element === 'undefined') {
      return this._flags;
    }

    Object.entries(this._flags.find((f) => f === element)!).forEach(([k, v]) => {
      if (k === 'id' || k === 'key' || k === 'type' || k === 'flagDescription') {
        if (k === 'flagDescription') {
          k = 'description';
        }
        if (v !== undefined && v !== '') {
          items.push(this.getFlagInfo(k, v));
        }
      }
    });

    return items;
  }

  private async getFlags() {
    const flagList = await this.cli.ListFlag();
    flagList.map((f) => {
      const flag = new FlagItem(
        f.id,
        f.name,
        f.type,
        f.description,
        f.default_value,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      this._flags.push(flag);
    });
  }

  private getFlagInfo(label: string, labelValue: string): vscode.TreeItem {
    return new ItemResource(label, labelValue);
  }

  public get flags() {
    return this._flags;
  }

  public set flags(flags: FlagItem[]) {
    this._flags = flags;
  }
}

export class FlagItem extends vscode.TreeItem {
  constructor(
    public readonly id?: string,
    public key?: string,
    public type?: string,
    public flagDescription?: string,
    public defaultValue?: any,
    public collapsibleState?: vscode.TreeItemCollapsibleState,
  ) {
    super(key!, collapsibleState);

    this.tooltip = `Type: ${type}`;
    this.description = type;
  }
  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'flag.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'flag.svg'),
  };

  contextValue = 'flagItem';
}

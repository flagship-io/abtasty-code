/* eslint-disable @typescript-eslint/naming-convention */
import * as path from 'path';
import * as vscode from 'vscode';
import { Authentication, Configuration, ItemResource } from '../../model';
import { DEFAULT_BASE_URI, PERMISSION_DENIED_PANEL } from '../../const';
import {
  FEATURE_EXPERIMENTATION_OPEN_BROWSER,
  FEATURE_EXPERIMENTATION_FLAG_LIST_LOAD,
  FEATURE_EXPERIMENTATION_FLAG_LIST_OPEN_IN_BROWSER,
  FEATURE_EXPERIMENTATION_FLAG_LIST_REFRESH,
} from '../../commands/const';
import { FlagStore } from '../../store/featureExperimentation/FlagStore';
import { GLOBAL_CURRENT_AUTHENTICATION_FE } from '../../services/featureExperimentation/const';

export class FlagListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _flags: FlagItem[] = [];
  private flagStore: FlagStore;

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private context: vscode.ExtensionContext, flagStore: FlagStore) {
    //commands.registerCommand('flagList.on_item_clicked', (item) => this.on_item_clicked(item));
    this.flagStore = flagStore;

    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_FLAG_LIST_LOAD, () => this.load());
    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_FLAG_LIST_REFRESH, async () => await this.refresh());
    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_FLAG_LIST_OPEN_IN_BROWSER, async () => {
      const baseUrl = `${DEFAULT_BASE_URI}/env`;
      const { account_environment_id } =
        ((await this.context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE)) as Authentication) || {};
      await vscode.commands.executeCommand(
        FEATURE_EXPERIMENTATION_OPEN_BROWSER,
        `${baseUrl}/${account_environment_id}/flags-list`,
      );
    });
  }

  /*
  public on_item_clicked(item: TreeItem) {
  } 
  */

  public async refresh() {
    const { scope } = (this.context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
    this._flags = [];
    if (scope?.includes('flag.list')) {
      await this.getRefreshedFlags();
    }
    this._onDidChangeTreeData.fire();
  }

  public load() {
    const { scope } = (this.context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
    this._flags = [];
    if (scope?.includes('flag.list')) {
      this.getLoadedFlags();
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
    const { scope } = (this.context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
    let items: vscode.TreeItem[] = [];

    if (!scope?.includes('flag.list')) {
      return [new vscode.TreeItem(PERMISSION_DENIED_PANEL)];
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

  private async getRefreshedFlags() {
    const flagList = await this.flagStore.refreshFlag();
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

  private getLoadedFlags() {
    const flagList = this.flagStore.loadFlag();
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

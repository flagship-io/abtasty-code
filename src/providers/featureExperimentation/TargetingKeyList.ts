import * as vscode from 'vscode';
import {
  FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_LOAD,
  FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_REFRESH,
} from '../../commands/const';
import { PERMISSION_DENIED_PANEL } from '../../const';
import { KEY } from '../../icons';
import { Authentication, Configuration, ItemResource } from '../../model';
import { TargetingKeyStore } from '../../store/featureExperimentation/TargetingKeyStore';
import { GLOBAL_CURRENT_AUTHENTICATION_FE } from '../../services/featureExperimentation/const';

export class TargetingKeyListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _targetingKeyList: TargetingKeyItem[] = [];
  private targetingKeyStore: TargetingKeyStore;

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private context: vscode.ExtensionContext, targetingKeyStore: TargetingKeyStore) {
    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_LOAD, () => this.load());
    vscode.commands.registerCommand(
      FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_REFRESH,
      async () => await this.refresh(),
    );
    this.targetingKeyStore = targetingKeyStore;
  }

  async refresh() {
    this._targetingKeyList = [];
    const { scope } = (this.context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
    if (scope?.includes('targeting_key.list')) {
      await this.getRefreshedTargetingKeys();
    }
    this._onDidChangeTreeData.fire();
  }

  load() {
    this._targetingKeyList = [];
    const { scope } = (this.context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
    if (scope?.includes('targeting_key.list')) {
      this.getLoadedTargetingKeys();
    }
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    const { scope } = (this.context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};

    if (!scope?.includes('targeting_key.list')) {
      return [new vscode.TreeItem(PERMISSION_DENIED_PANEL)];
    }

    if (this._targetingKeyList.length === 0) {
      const noTargetingKey = new vscode.TreeItem('No Targeting key found');
      return [noTargetingKey];
    }

    if (typeof element === 'undefined') {
      return this._targetingKeyList;
    }

    Object.entries(this._targetingKeyList.find((f) => f === element)!).forEach(([k, v]) => {
      if (k === 'id' || k === 'name' || k === 'type' || k === 'targetingKeyDescription') {
        if (k === 'targetingKeyDescription') {
          k = 'description';
        }
        items.push(this.getTargetingKeyInfo(k, v));
      }
    });

    return items;
  }

  private async getRefreshedTargetingKeys() {
    const targetingKeyList = await this.targetingKeyStore.refreshTargetingKey();
    targetingKeyList.map((tk) => {
      const targetingKey = new TargetingKeyItem(
        tk.id,
        tk.name,
        tk.type,
        tk.description,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      this._targetingKeyList.push(targetingKey);
    });
  }

  private getLoadedTargetingKeys() {
    const targetingKeyList = this.targetingKeyStore.loadTargetingKey();
    targetingKeyList.map((tk) => {
      const targetingKey = new TargetingKeyItem(
        tk.id,
        tk.name,
        tk.type,
        tk.description,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      this._targetingKeyList.push(targetingKey);
    });
  }

  private getTargetingKeyInfo(label: string, labelValue: string): vscode.TreeItem {
    return new ItemResource(label, labelValue);
  }
}

export class TargetingKeyItem extends vscode.TreeItem {
  constructor(
    public readonly id?: string,
    public readonly name?: string,
    public readonly type?: string,
    public readonly targetingKeyDescription?: string,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
  ) {
    super(name!, collapsibleState);
    this.tooltip = `Type: ${this.type}`;
    this.description = type;
  }
  iconPath = KEY;

  contextValue = 'targetingKeyItem';
}

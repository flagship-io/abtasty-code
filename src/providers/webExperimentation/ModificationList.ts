import * as vscode from 'vscode';
import {
  WEB_EXPERIMENTATION_MODIFICATION_LIST_LOAD,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_REFRESH,
} from '../../commands/const';
import { CIRCLE_FILLED, ROCKET } from '../../icons';
import { ItemResource, ModificationWE } from '../../model';
import { CURRENT_SET_CAMPAIGN_ID } from '../../services/webExperimentation/const';
import { ModificationStore } from '../../store/webExperimentation/ModificationStore';
import { NO_RESOURCE_FOUND, SET_CAMPAIGN_ID_FOR_MODIFICATION } from '../../const';

export class ModificationListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _modifications: ModificationTreeItem = {
    children: undefined,
    parentID: undefined,
  };
  private modificationStore: ModificationStore;

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private context: vscode.ExtensionContext, modificationStore: ModificationStore) {
    this.modificationStore = modificationStore;

    vscode.commands.registerCommand(WEB_EXPERIMENTATION_MODIFICATION_LIST_REFRESH, async () => await this.refresh());
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_MODIFICATION_LIST_LOAD, () => this.load());
  }

  async refresh() {
    this._modifications = {
      children: undefined,
      parentID: undefined,
    };
    const campaignID = ((await this.context.globalState.get(CURRENT_SET_CAMPAIGN_ID)) as number) || 0;
    if (campaignID) {
      await this.getRefreshedModifications(campaignID);
    }
    this._onDidChangeTreeData.fire();
  }

  async load() {
    this._modifications = {
      children: undefined,
      parentID: undefined,
    };
    const campaignID = ((await this.context.globalState.get(CURRENT_SET_CAMPAIGN_ID)) as number) || 0;
    if (campaignID) {
      this.getLoadedModifications(campaignID);
    }
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: ModificationTreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    const campaignID = (this.context.globalState.get(CURRENT_SET_CAMPAIGN_ID) as number) || 0;
    if (typeof element === 'undefined') {
      if (!campaignID) {
        return [new ModificationTreeItem(SET_CAMPAIGN_ID_FOR_MODIFICATION)];
      }

      return [this._modifications];
    }

    if (element.children?.length === 0) {
      return [new ModificationTreeItem(NO_RESOURCE_FOUND)];
    }
    return element.children;
  }

  private mappingTree(campaignID: number, modificationList: ModificationWE[]) {
    const modificationsItem = modificationList.map((m) => {
      const modifItem = Object.entries(m).map(([key, value]) => new SimpleModificationItem(key, value, undefined));
      return new ModificationItem(
        String(m.id),
        m.name,
        m.type,
        m.value,
        String(m.variation_id),
        m.selector,
        m.engine,
        vscode.TreeItemCollapsibleState.Collapsed,
        campaignID,
        modifItem,
      );
    });
    return new _CampaignItem(String(campaignID), String(campaignID), modificationsItem);
  }

  private async getRefreshedModifications(campaignID: number) {
    const modificationList = await this.modificationStore.refreshModification(campaignID);
    this._modifications = this.mappingTree(campaignID, modificationList);
  }

  private getLoadedModifications(campaignId: number) {
    const modificationList = this.modificationStore.loadModification();
    this._modifications = this.mappingTree(campaignId, modificationList);
  }
}

class ModificationTreeItem extends vscode.TreeItem {
  children: ModificationTreeItem[] | undefined;
  parentID: string | undefined;

  constructor(label?: string, children?: ModificationTreeItem[], parentID?: string, iconPath?: vscode.ThemeIcon) {
    super(
      label!,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
    );
    this.children = children;
    this.parentID = parentID;
    this.iconPath = iconPath;
  }
}

export class ModificationItem extends ModificationTreeItem {
  constructor(
    public readonly id?: string,
    public readonly name?: string,
    public readonly type?: string,
    public readonly value?: string,
    public readonly variationId?: string,
    public readonly selector?: string,
    public readonly engine?: string,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
    public readonly campaignId?: number,
    children?: ModificationTreeItem[],
    parent?: any,
  ) {
    super(name!, children, parent);
    this.tooltip = `Type: ${this.type}`;
    this.description = type;
  }
  iconPath = ROCKET;

  contextValue = 'modificationWEItem';
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class _CampaignItem extends ModificationTreeItem {
  constructor(public readonly id?: string, public readonly name?: string, children?: ModificationItem[], parent?: any) {
    super(name!, children, parent);
    this.tooltip = `- id: ${this.id}`;
    this.description = `- id: ${this.id}`;
  }
  iconPath = ROCKET;

  contextValue = '_campaignItem';
}

class SimpleModificationItem extends ModificationTreeItem {
  constructor(
    public readonly key?: string,
    public readonly value?: unknown,
    children?: ModificationTreeItem[],
    parent?: any,
  ) {
    super(key!, children, parent);
    this.tooltip = JSON.stringify(value);
    this.description = JSON.stringify(value);
  }
  iconPath = CIRCLE_FILLED;

  contextValue = 'simpleItem';
}

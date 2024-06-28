import * as vscode from 'vscode';
import {
  WEB_EXPERIMENTATION_MODIFICATION_LIST_LOAD,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_REFRESH,
} from '../../commands/const';
import { ROCKET } from '../../icons';
import { ItemResource } from '../../model';
import { CURRENT_SET_CAMPAIGN_ID } from '../../services/featureExperimentation/const';
import { ModificationStore } from '../../store/webExperimentation/ModificationStore';

export class ModificationListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _modifications: ModificationItem[] = [];
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
    this._modifications = [];
    // TODO: to be set later
    /*     const campaignID = (this.context.globalState.get(CURRENT_SET_CAMPAIGN_ID) as number) || 0;
    if (campaignID) {
      await this.getRefreshedModifications(campaignID);
    } */
    await this.getRefreshedModifications(0);
    this._onDidChangeTreeData.fire();
  }

  async load() {
    this._modifications = [];
    const campaignID = (this.context.globalState.get(CURRENT_SET_CAMPAIGN_ID) as number) || 0;
    if (campaignID) {
      this.getLoadedModifications(campaignID);
    }
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    // TODO: to set later
    /*     const campaignID = (this.context.globalState.get(CURRENT_SET_CAMPAIGN_ID) as number) || 0;
    if (!campaignID) {
      return [new vscode.TreeItem(SET_CAMPAIGN_ID_FOR_MODIFICATION)];
    }
 */
    if (this._modifications.length === 0) {
      const noModification = new vscode.TreeItem('No Modification found');
      return [noModification];
    }

    if (typeof element === 'undefined') {
      return this._modifications;
    }

    Object.entries(this._modifications.find((f) => f === element)!).forEach(([k, v]) => {
      if (k === 'id' || k === 'name' || k === 'type' || k === 'variationId' || k === 'selector' || k === 'engine') {
        if (v !== undefined && v !== '') {
          items.push(this.getModificationInfo(k, v));
        }
      }
    });

    return items;
  }

  private async getRefreshedModifications(campaignID: number) {
    const modificationList = await this.modificationStore.refreshModification(campaignID);
    modificationList.map((m) => {
      const modification = new ModificationItem(
        String(m.id),
        m.name,
        m.type,
        m.value,
        String(m.variation_id),
        m.selector,
        m.engine,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      this._modifications.push(modification);
    });
  }

  private getLoadedModifications(campaignID: number) {
    const modificationList = this.modificationStore.loadModification(campaignID);
    modificationList.map((m) => {
      const modification = new ModificationItem(
        String(m.id),
        m.name,
        m.type,
        m.value,
        String(m.variation_id),
        m.selector,
        m.engine,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      this._modifications.push(modification);
    });
  }

  private getModificationInfo(label: string, labelValue: string): vscode.TreeItem {
    return new ItemResource(label, labelValue);
  }
}

export class ModificationItem extends vscode.TreeItem {
  constructor(
    public readonly id?: string,
    public readonly name?: string,
    public readonly type?: string,
    public readonly value?: string,
    public readonly variationId?: string,
    public readonly selector?: string,
    public readonly engine?: string,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
  ) {
    super(name!, collapsibleState);
    this.tooltip = `Type: ${this.type}`;
    this.description = type;
  }
  iconPath = ROCKET;

  contextValue = 'modificationWEItem';
}

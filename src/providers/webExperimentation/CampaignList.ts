import * as vscode from 'vscode';
import {
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_REFRESH,
} from '../../commands/const';
import { ROCKET } from '../../icons';
import { ItemResource } from '../../model';
import { CampaignStore } from '../../store/webExperimentation/CampaignStore';

export class CampaignListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _campaigns: CampaignItem[] = [];
  private campaignStore: CampaignStore;

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private context: vscode.ExtensionContext, campaignStore: CampaignStore) {
    this.campaignStore = campaignStore;

    vscode.commands.registerCommand(WEB_EXPERIMENTATION_CAMPAIGN_LIST_REFRESH, async () => await this.refresh());
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD, () => this.load());
  }

  async refresh() {
    this._campaigns = [];
    await this.getRefreshedCampaigns();
    this._onDidChangeTreeData.fire();
  }

  async load() {
    this._campaigns = [];
    this.getLoadedCampaigns();
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    if (this._campaigns.length === 0) {
      const noCampaign = new vscode.TreeItem('No Campaign found');
      return [noCampaign];
    }

    if (typeof element === 'undefined') {
      return this._campaigns;
    }

    Object.entries(this._campaigns.find((f) => f === element)!).forEach(([k, v]) => {
      if (
        k === 'id' ||
        k === 'name' ||
        k === 'type' ||
        k === 'url' ||
        k === 'state' ||
        k === 'global_code' ||
        k === 'source_code' ||
        k === 'sub_type'
      ) {
        if (v !== undefined && v !== '') {
          items.push(this.getCampaignInfo(k, v));
        }
      }
    });

    return items;
  }

  private async getRefreshedCampaigns() {
    const campaignList = await this.campaignStore.refreshCampaign();
    campaignList.map((c) => {
      const campaign = new CampaignItem(
        String(c.id),
        c.name,
        c.type,
        c.url,
        c.state,
        c.global_code,
        c.source_code,
        c.sub_type,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      this._campaigns.push(campaign);
    });
  }

  private getLoadedCampaigns() {
    const campaignList = this.campaignStore.loadCampaign();
    campaignList.map((c) => {
      const campaign = new CampaignItem(
        String(c.id),
        c.name,
        c.type,
        c.url,
        c.state,
        c.global_code,
        c.source_code,
        c.sub_type,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      this._campaigns.push(campaign);
    });
  }

  private getCampaignInfo(label: string, labelValue: string): vscode.TreeItem {
    return new ItemResource(label, labelValue);
  }
}

export class CampaignItem extends vscode.TreeItem {
  constructor(
    public readonly id?: string,
    public readonly name?: string,
    public readonly type?: string,
    public readonly url?: string,
    public readonly state?: string,
    public readonly globalCode?: string,
    public readonly sourceCode?: string,
    public readonly subType?: string,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
  ) {
    super(name!, collapsibleState);
    this.tooltip = `Type: ${this.type}`;
    this.description = type;
  }
  iconPath = ROCKET;

  contextValue = 'campaignWEItem';
}

import * as vscode from 'vscode';
import {
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_REFRESH,
} from '../../commands/const';
import {
  CIRCLE_FILLED,
  CIRCLE_OUTLINE,
  MILESTONE,
  MILESTONE_ACTIVE,
  MILESTONE_INTERRUPTED,
  MILESTONE_PAUSED,
  ROCKET,
} from '../../icons';
import { CampaignWE, ItemResource } from '../../model';
import { CampaignStore } from '../../store/webExperimentation/CampaignStore';

export class CampaignListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _tree: CampaignTreeItem[] = [];
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
    await this.getRefreshedCampaigns();
    this._onDidChangeTreeData.fire();
  }

  async load() {
    this.getLoadedCampaigns();
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: CampaignTreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    if (typeof element === 'undefined') {
      if (this._tree.length === 0) {
        const noCampaign = new vscode.TreeItem('No Campaign found');
        return [noCampaign];
      }
      return this._tree;
    }

    if (element.children?.length === 0) {
      return [new CampaignTreeItem('No resource found')];
    }
    return element.children;
  }

  private mappingTree(campaignList: CampaignWE[]) {
    const campaignTreeList: CampaignTreeItem[] = [];
    const abCampaigns: CampaignTreeItem[] = [];
    const masterSegmentCampaigns: CampaignTreeItem[] = [];
    const subSegmentCampaigns: CampaignTreeItem[] = [];
    const multiPageCampaigns: CampaignTreeItem[] = [];
    const multiVariateCampaigns: CampaignTreeItem[] = [];

    campaignList.map((c: CampaignWE) => {
      let variations: VariationWEItem[] = [];
      const campaignData: CampaignTreeItem[] = [];
      let subTests: CampaignTreeItem[] = [];
      const campaignDetails = Object.entries(c)
        .filter(([key, value]) => key !== 'variations' && key !== 'global_code' && key !== 'source_code')
        .map(([key, value]) => {
          if (key === 'traffic') {
            const traffic = Object.entries(c.traffic).map(([key, value]) => {
              return new SimpleItem(key, value, undefined, c.id);
            });
            return new SimpleItem(key, value, traffic, c.id);
          }
          if (key === 'created_at') {
            const traffic = Object.entries(c.created_at).map(([key, value]) => {
              return new SimpleItem(key, value, undefined, c.id);
            });
            return new SimpleItem(key, value, traffic, c.id);
          }
          if (key === 'live_at') {
            const traffic = Object.entries(c.live_at).map(([key, value]) => {
              return new SimpleItem(key, value, undefined, c.id);
            });
            return new SimpleItem(key, value, traffic, c.id);
          }
          if (key === 'last_pause') {
            const traffic = Object.entries(c.last_pause).map(([key, value]) => {
              return new SimpleItem(key, value, undefined, c.id);
            });
            return new SimpleItem(key, value, traffic, c.id);
          }
          if (key === 'last_play') {
            const traffic = Object.entries(c.last_play).map(([key, value]) => {
              return new SimpleItem(key, value, undefined, c.id);
            });
            return new SimpleItem(key, value, traffic, c.id);
          }
          if (key === 'start_on') {
            const traffic = Object.entries(c.start_on).map(([key, value]) => {
              return new SimpleItem(key, value, undefined, c.id);
            });
            return new SimpleItem(key, value, traffic, c.id);
          }
          if (key === 'reset_at') {
            const traffic = Object.entries(c.reset_at).map(([key, value]) => {
              return new SimpleItem(key, value, undefined, c.id);
            });
            return new SimpleItem(key, value, traffic, c.id);
          }
          return new SimpleItem(key, value, undefined, c.id);
        });
      if (c.variations) {
        variations = c.variations.map((v) => {
          const vData = Object.entries(v)
            .filter(([key, value]) => key !== 'components')
            .map(([key, value]) => {
              return new SimpleItem(key, value, undefined, c.id);
            });
          return new VariationWEItem(String(v.id), v.name, [...vData], c.id);
        });
      }

      if (c.sub_tests) {
        subTests = this.mappingTree(c.sub_tests);
      }

      if (campaignDetails.length !== 0) {
        campaignData.push(new CampaignTreeItem('Info/Details', campaignDetails));
      }

      if (variations.length !== 0) {
        campaignData.push(new CampaignTreeItem('Variations', variations));
      }

      if (subTests.length !== 0) {
        campaignData.push(new CampaignTreeItem('Sub Tests', subTests));
      }

      switch (c.type) {
        case 'ab':
          abCampaigns.push(
            new CampaignWEItem(
              String(c.id),
              c.name,
              c.type,
              c.state,
              c.variations.flatMap((v) => v.id),
              campaignData,
            ),
          );
          break;
        case 'mastersegment':
          masterSegmentCampaigns.push(
            new CampaignWEItem(
              String(c.id),
              c.name,
              c.type,
              c.state,
              c.variations.flatMap((v) => v.id),
              campaignData,
            ),
          );
          break;

        case 'subsegment':
          subSegmentCampaigns.push(
            new CampaignWEItem(
              String(c.id),
              c.name,
              c.type,
              c.state,
              c.variations.flatMap((v) => v.id),
              campaignData,
            ),
          );
          break;

        case 'multipage':
          multiPageCampaigns.push(
            new CampaignWEItem(
              String(c.id),
              c.name,
              c.type,
              c.state,
              c.variations.flatMap((v) => v.id),
              campaignData,
            ),
          );
          break;

        case 'multivariate':
          multiVariateCampaigns.push(
            new CampaignWEItem(
              String(c.id),
              c.name,
              c.type,
              c.state,
              c.variations.flatMap((v) => v.id),
              campaignData,
            ),
          );
          break;
      }
      return;
    });

    if (abCampaigns.length !== 0) {
      campaignTreeList.push(new CampaignTreeItem(`AB Test - ${abCampaigns.length} campaign(s)`, abCampaigns));
    }

    if (false && masterSegmentCampaigns.length !== 0) {
      campaignTreeList.push(
        new CampaignTreeItem(`Master Segment - ${masterSegmentCampaigns.length} campaign(s)`, masterSegmentCampaigns),
      );
    }

    if (false && subSegmentCampaigns.length !== 0) {
      campaignTreeList.push(
        new CampaignTreeItem(`Sub Segment - ${subSegmentCampaigns.length} campaign(s)`, subSegmentCampaigns),
      );
    }

    if (false && multiPageCampaigns.length !== 0) {
      campaignTreeList.push(
        new CampaignTreeItem(`Multi Page - ${multiPageCampaigns.length} campaign(s)`, multiPageCampaigns),
      );
    }

    if (false && multiVariateCampaigns.length !== 0) {
      campaignTreeList.push(
        new CampaignTreeItem(`Multi Variate - ${multiVariateCampaigns.length} campaign(s)`, multiVariateCampaigns),
      );
    }

    return campaignTreeList;
  }

  private async getRefreshedCampaigns() {
    const campaignList = await this.campaignStore.refreshCampaign();
    this._tree = this.mappingTree(campaignList);
  }

  private getLoadedCampaigns() {
    const campaignList = this.campaignStore.loadCampaign();
    this._tree = this.mappingTree(campaignList);
  }
}

class CampaignTreeItem extends vscode.TreeItem {
  children: CampaignTreeItem[] | undefined;
  parentID: string | undefined;

  constructor(label?: string, children?: CampaignTreeItem[], parentID?: string, iconPath?: vscode.ThemeIcon) {
    super(
      label!,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
    );
    this.children = children;
    this.parentID = parentID;
    this.iconPath = iconPath;
  }
}

export class CampaignWEItem extends CampaignTreeItem {
  constructor(
    public readonly id?: string,
    public readonly name?: string,
    public readonly type?: string,
    public readonly state?: string,
    public readonly variationIds?: number[],
    children?: CampaignTreeItem[],
    parent?: any,
  ) {
    super(name!, children, parent);
    this.tooltip = `Type: ${this.id}`;
    this.description = `- id: ${this.id}`;

    switch (state) {
      case 'play':
        this.iconPath = MILESTONE_ACTIVE;
        break;
      case 'pause':
        this.iconPath = MILESTONE_PAUSED;
        break;
      case 'interrupt':
        this.iconPath = MILESTONE_INTERRUPTED;
        break;
      default:
        this.iconPath = MILESTONE;
        break;
    }
  }

  contextValue = 'campaignWEItem';
}

export class VariationWEItem extends CampaignTreeItem {
  constructor(public readonly id?: string, public readonly name?: string, children?: CampaignTreeItem[], parent?: any) {
    super(name!, children, parent);
    this.tooltip = `- id: ${this.id}`;
    this.description = `- id: ${this.id}`;
  }
  iconPath = CIRCLE_OUTLINE;

  contextValue = 'variationWEItem';
}

class SimpleItem extends CampaignTreeItem {
  constructor(
    public readonly key?: string,
    public readonly value?: unknown,
    children?: CampaignTreeItem[],
    parent?: any,
  ) {
    super(key!, children, parent);
    this.tooltip = JSON.stringify(value);
    this.description = JSON.stringify(value);
  }
  iconPath = CIRCLE_FILLED;

  contextValue = 'simpleItem';
}

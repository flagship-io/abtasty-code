import * as vscode from 'vscode';
import {
  WEB_EXPERIMENTATION_CAMPAIGN_GET_VARIATION,
  WEB_EXPERIMENTATION_CAMPAIGN_GLOBAL_CODE_OPEN_FILE,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_REFRESH,
  WEB_EXPERIMENTATION_TREE_CODE_OPEN_FILE,
} from '../../commands/const';
import {
  CIRCLE_FILLED,
  CIRCLE_OUTLINE,
  FILE_CODE,
  MILESTONE,
  MILESTONE_ACTIVE,
  MILESTONE_INTERRUPTED,
  MILESTONE_PAUSED,
  ROCKET,
} from '../../icons';
import { CampaignWE, ItemResource } from '../../model';
import { CampaignStore } from '../../store/webExperimentation/CampaignStore';
import { NO_GLOBAL_CODE_FOUND, NO_RESOURCE_FOUND } from '../../const';

export type Parent = {
  id: number;
  parent: Parent;
};

export type ResourceArgument = {
  variationId: string;
  campaignId: string;
  modificationId: string;
  filePath: string;
};

export class CampaignListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _tree: CampaignTreeItem[] = [];
  private campaignStore: CampaignStore;
  private currentAccountId: string | undefined;

  _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private context: vscode.ExtensionContext, campaignStore: CampaignStore, currentAccountId: string) {
    this.campaignStore = campaignStore;
    this.currentAccountId = currentAccountId;
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
      return [new CampaignTreeItem(NO_RESOURCE_FOUND)];
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

    const accountParent = { id: Number(this.currentAccountId) } as Parent;

    campaignList.map((c: CampaignWE) => {
      const campaignParent = { id: c.id, parent: accountParent } as Parent;
      let variations: VariationWEItem[] = [];
      const campaignData: CampaignTreeItem[] = [];
      let subTests: CampaignTreeItem[] = [];
      const campaignDetails = Object.entries(c)
        .filter(([key, value]) => key !== 'variations' && key !== 'global_code' && key !== 'source_code')
        .map(([key, value]) => {
          if (key === 'traffic') {
            const traffic = Object.entries(c.traffic).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, value, traffic, undefined);
          }
          if (key === 'created_at') {
            const traffic = Object.entries(c.created_at).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, value, traffic, undefined);
          }
          if (key === 'live_at') {
            const traffic = Object.entries(c.live_at).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, value, traffic, undefined);
          }
          if (key === 'last_pause') {
            const traffic = Object.entries(c.last_pause).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, value, traffic, undefined);
          }
          if (key === 'last_play') {
            const traffic = Object.entries(c.last_play).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, value, traffic, undefined);
          }
          if (key === 'start_on') {
            const traffic = Object.entries(c.start_on).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, value, traffic, undefined);
          }
          if (key === 'reset_at') {
            const traffic = Object.entries(c.reset_at).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, value, traffic, undefined);
          }
          return new SimpleItem(key, undefined, value, undefined, undefined);
        });

      if (c.variations) {
        variations = c.variations.map((v) => {
          const vData = Object.entries(v)
            .filter(([key, value]) => key !== 'components')
            .map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
          const variationParent = { id: v.id, parent: campaignParent } as Parent;
          const variationDetails = new CampaignTreeItem('Info/Details', undefined, [...vData]);
          const variationGlobalCode = new GlobalCodeVariation(
            'Variation Global Code',
            v.id,
            [new CampaignTreeItem(NO_GLOBAL_CODE_FOUND, 0, undefined)],
            variationParent,
          );
          return new VariationWEItem(v.name, v.id, [variationDetails, variationGlobalCode], campaignParent);
        });
      }

      if (c.sub_tests) {
        subTests = this.mappingTree(c.sub_tests);
      }

      if (campaignDetails.length !== 0) {
        campaignData.push(new CampaignTreeItem('Info/Details', undefined, campaignDetails));
      }

      if (variations.length !== 0) {
        campaignData.push(new CampaignTreeItem('Variations', undefined, variations));
      }

      if (subTests.length !== 0) {
        campaignData.push(new CampaignTreeItem('Sub Tests', undefined, subTests));
      }

      campaignData.push(
        new GlobalCodeCampaign(
          'Campaign Global Code',
          c.id,
          [new CampaignTreeItem(NO_GLOBAL_CODE_FOUND, 0, undefined)],
          campaignParent,
        ),
      );

      switch (c.type) {
        case 'ab':
          abCampaigns.push(
            new CampaignWEItem(
              c.name,
              c.id,
              c.type,
              c.state,
              c.variations.flatMap((v) => v.id),
              campaignData,
              accountParent,
            ),
          );
          break;
        case 'mastersegment':
          masterSegmentCampaigns.push(
            new CampaignWEItem(
              c.name,
              c.id,
              c.type,
              c.state,
              c.variations.flatMap((v) => v.id),
              campaignData,
              accountParent,
            ),
          );
          break;

        case 'subsegment':
          subSegmentCampaigns.push(
            new CampaignWEItem(
              c.name,
              c.id,
              c.type,
              c.state,
              c.variations.flatMap((v) => v.id),
              campaignData,
              accountParent,
            ),
          );
          break;

        case 'multipage':
          multiPageCampaigns.push(
            new CampaignWEItem(
              c.name,
              c.id,
              c.type,
              c.state,
              c.variations.flatMap((v) => v.id),
              campaignData,
              accountParent,
            ),
          );
          break;

        case 'multivariate':
          multiVariateCampaigns.push(
            new CampaignWEItem(
              c.name,
              c.id,
              c.type,
              c.state,
              c.variations.flatMap((v) => v.id),
              campaignData,
              accountParent,
            ),
          );
          break;
      }
      return;
    });

    if (abCampaigns.length !== 0) {
      campaignTreeList.push(
        new CampaignTreeItem(`AB Test - ${abCampaigns.length} campaign(s)`, undefined, abCampaigns),
      );
    }

    if (masterSegmentCampaigns.length !== 0) {
      campaignTreeList.push(
        new CampaignTreeItem(
          `Master Segment - ${masterSegmentCampaigns.length} campaign(s)`,
          undefined,
          masterSegmentCampaigns,
        ),
      );
    }

    if (subSegmentCampaigns.length !== 0) {
      campaignTreeList.push(
        new CampaignTreeItem(`Sub Segment - ${subSegmentCampaigns.length} campaign(s)`, undefined, subSegmentCampaigns),
      );
    }

    if (false && multiPageCampaigns.length !== 0) {
      campaignTreeList.push(
        new CampaignTreeItem(`Multi Page - ${multiPageCampaigns.length} campaign(s)`, undefined, multiPageCampaigns),
      );
    }

    if (false && multiVariateCampaigns.length !== 0) {
      campaignTreeList.push(
        new CampaignTreeItem(
          `Multi Variate - ${multiVariateCampaigns.length} campaign(s)`,
          undefined,
          multiVariateCampaigns,
        ),
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
  parent: any;
  resourceId: number | undefined;

  constructor(
    label?: string,
    resourceId?: number,
    children?: CampaignTreeItem[],
    parent?: any,
    iconPath?: vscode.ThemeIcon,
  ) {
    super(
      label!,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
    );
    this.children = children;
    this.parent = parent;
    this.iconPath = iconPath;
    this.resourceId = resourceId;
  }
}

export class CampaignWEItem extends CampaignTreeItem {
  constructor(
    public readonly name?: string,
    resourceId?: number,
    public readonly type?: string,
    public readonly state?: string,
    public readonly variationIds?: number[],
    children?: CampaignTreeItem[],
    parent?: any,
  ) {
    super(name!, resourceId!, children, parent);
    this.tooltip = `Type: ${this.resourceId}`;
    this.description = `- id: ${this.resourceId}`;

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
  constructor(public readonly name?: string, resourceId?: number, children?: CampaignTreeItem[], parent?: any) {
    super(name!, resourceId, children, parent);
    this.tooltip = `- id: ${this.resourceId}`;
    this.description = `- id: ${this.resourceId}`;
  }
  iconPath = CIRCLE_OUTLINE;

  contextValue = 'variationWEItem';
}

export class SimpleItem extends CampaignTreeItem {
  constructor(
    public readonly key?: string,
    resourceId?: number,
    public readonly value?: unknown,
    children?: CampaignTreeItem[],
    parent?: any,
  ) {
    super(key!, resourceId, children, parent);
    this.tooltip = JSON.stringify(value);
    this.description = JSON.stringify(value);
  }
  iconPath = CIRCLE_FILLED;

  contextValue = 'simpleItem';
}

export class ComponentWEItem extends CampaignTreeItem {
  constructor(public readonly name?: string, resourceId?: number, children?: CampaignTreeItem[], parent?: any) {
    super(name!, resourceId, children, parent);
    this.tooltip = `- id: ${this.resourceId}`;
    this.description = `- id: ${this.resourceId}`;
  }
  iconPath = CIRCLE_OUTLINE;

  contextValue = 'componentWEItem';
}

export class GlobalCodeCampaign extends vscode.TreeItem {
  children: CampaignTreeItem[] | undefined;
  parent: any;
  resourceId: number | undefined;

  constructor(
    label?: string,
    resourceId?: number,
    children?: CampaignTreeItem[],
    parent?: any,
    iconPath?: vscode.ThemeIcon,
  ) {
    super(
      label!,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
    );
    this.children = children;
    this.parent = parent;
    this.iconPath = iconPath;
    this.resourceId = resourceId;
  }
}

export class GlobalCodeCampaignItem extends CampaignTreeItem {
  filePath: string;
  type: string | undefined;
  campaignId: string | undefined;

  constructor(label: string, filePath: string, campaignId: string) {
    super(label);

    this.filePath = filePath;
    this.campaignId = campaignId;

    this.contextValue = 'globalCodeCampaignItem';
    this.command = {
      title: 'Open File',
      command: WEB_EXPERIMENTATION_CAMPAIGN_GLOBAL_CODE_OPEN_FILE,
      arguments: [{ campaignId: campaignId, filePath: filePath } as ResourceArgument],
    };

    this.iconPath = FILE_CODE;
  }
}

export class GlobalCodeVariation extends vscode.TreeItem {
  children: CampaignTreeItem[] | undefined;
  parent: any;
  resourceId: number | undefined;

  constructor(
    label?: string,
    resourceId?: number,
    children?: CampaignTreeItem[],
    parent?: any,
    iconPath?: vscode.ThemeIcon,
  ) {
    super(
      label!,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
    );
    this.children = children;
    this.parent = parent;
    this.iconPath = iconPath;
    this.resourceId = resourceId;
  }
}

export class GlobalCodeVariationJSItem extends CampaignTreeItem {
  filePath: string;
  type: string | undefined;
  variationId: string | undefined;
  campaignId: string | undefined;

  constructor(label: string, filePath: string, campaignId: string, variationId: string) {
    super(label);

    this.filePath = filePath;
    this.variationId = variationId;
    this.campaignId = campaignId;

    this.contextValue = 'globalCodeVariationJSItem';
    this.command = {
      title: 'Open File',
      command: WEB_EXPERIMENTATION_CAMPAIGN_GLOBAL_CODE_OPEN_FILE,
      arguments: [{ variationId: variationId, campaignId: campaignId, filePath } as ResourceArgument],
    };

    this.iconPath = FILE_CODE;
  }
}

export class GlobalCodeVariationCSSItem extends CampaignTreeItem {
  filePath: string;
  type: string | undefined;
  variationId: string | undefined;
  campaignId: string | undefined;

  constructor(label: string, filePath: string, campaignId: string, variationId: string) {
    super(label);

    this.filePath = filePath;
    this.variationId = variationId;
    this.campaignId = campaignId;

    this.contextValue = 'globalCodeVariationCSSItem';
    this.command = {
      title: 'Open File',
      command: WEB_EXPERIMENTATION_CAMPAIGN_GLOBAL_CODE_OPEN_FILE,
      arguments: [{ variationId: variationId, campaignId: campaignId, filePath } as ResourceArgument],
    };

    this.iconPath = FILE_CODE;
  }
}

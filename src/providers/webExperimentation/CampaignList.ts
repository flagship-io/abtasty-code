import * as vscode from 'vscode';
import {
  WEB_EXPERIMENTATION_CAMPAIGN_GET_VARIATION,
  WEB_EXPERIMENTATION_GLOBAL_CODE_OPEN_FILE,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_REFRESH,
} from '../../commands/const';
import {
  BEAKER,
  BEAKER_ACTIVE,
  BEAKER_INTERRUPTED,
  BEAKER_PAUSED,
  BREAKPOINTS_ACTIVATE,
  CIRCLE_FILLED,
  CIRCLE_OUTLINE,
  CODE,
  FILE_CODE,
  INFO,
  MILESTONE,
  MILESTONE_ACTIVE,
  MILESTONE_INTERRUPTED,
  MILESTONE_PAUSED,
  PENCIL,
  ROCKET,
  TARGET,
  TARGET_ACTIVE,
  TARGET_INTERRUPTED,
  TARGET_PAUSED,
} from '../../icons';
import { CampaignWE, ItemResource, ModificationWE } from '../../model';
import { CampaignStore } from '../../store/webExperimentation/CampaignStore';
import { NO_GLOBAL_CODE_FOUND, NO_RESOURCE_FOUND } from '../../const';
import { CampaignTreeView } from '../../../treeView/webExperimentation/campaignTreeView';
import { AccountWEStore } from '../../store/webExperimentation/AccountStore';

export type Parent = {
  id: number;
  parent: Parent;
};

export type ResourceArgument = {
  accountId: string;
  variationId: string;
  campaignId: string;
  modificationId: string;
  filePath: string;
};

export class CampaignListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _tree: CampaignTreeItem[] = [];
  private campaignStore: CampaignStore;
  private accountStore: AccountWEStore;
  public currentAccountId: string | undefined;

  _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(
    private context: vscode.ExtensionContext,
    campaignStore: CampaignStore,
    accountStore: AccountWEStore,
    currentAccountId: string,
  ) {
    this.campaignStore = campaignStore;
    this.accountStore = accountStore;
    this.currentAccountId = currentAccountId;
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_CAMPAIGN_LIST_REFRESH, async () => await this.refresh());
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD, () => this.load());
  }

  async refresh() {
    const account = await this.accountStore.currentAccount();
    this.currentAccountId = account.account_id;
    await this.getRefreshedCampaigns();
    this._onDidChangeTreeData.fire();
  }

  async load() {
    const account = await this.accountStore.currentAccount();
    this.currentAccountId = account.account_id;
    this.getLoadedCampaigns();
    this._onDidChangeTreeData.fire();
  }

  async fire() {
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getParent(element: GlobalCodeCampaign): vscode.TreeItem | null {
    return element.parent || null;
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

  private mappingCampaign(campaignList: CampaignWE[]): CampaignTreeItem[] {
    const campaignTreeList: CampaignTreeItem[] = [];

    const accountParent = { id: Number(this.currentAccountId) } as Parent;

    campaignList.map((c: CampaignWE) => {
      const campaignParent = { id: c.id, parent: accountParent } as Parent;
      let variations: VariationWEItem[] = [];
      const campaignData: CampaignTreeItem[] = [];
      let subTests: CampaignTreeItem[] = [];
      const campaignDetails = Object.entries(c)
        .filter(
          ([key, value]) =>
            key !== 'variations' &&
            key !== 'global_code' &&
            key !== 'source_code' &&
            key !== 'sub_tests' &&
            value !== null,
        )
        .map(([key, value]) => {
          if (key === 'traffic') {
            const traffic = Object.entries(c.traffic)
              .filter(([key, value]) => key === 'value')
              .map(([key, value]) => {
                return new SimpleItem(key, undefined, value, undefined, undefined);
              });
            return new SimpleItem(key, undefined, undefined, traffic, undefined);
          }
          if (key === 'created_at') {
            const createdAt = Object.entries(c.created_at).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, undefined, createdAt, undefined);
          }
          if (key === 'live_at') {
            const liveAt = Object.entries(c.live_at).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, undefined, liveAt, undefined);
          }
          if (key === 'last_pause') {
            const lastPause = Object.entries(c.last_pause).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, undefined, lastPause, undefined);
          }
          if (key === 'last_play') {
            const lastPlay = Object.entries(c.last_play).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, undefined, lastPlay, undefined);
          }
          if (key === 'start_on') {
            const startOn = Object.entries(c.start_on).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, undefined, startOn, undefined);
          }
          if (key === 'reset_at') {
            const resetAt = Object.entries(c.reset_at).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, undefined, resetAt, undefined);
          }
          return new SimpleItem(key, undefined, value, undefined, undefined);
        });

      const campaignWEItem = new CampaignWEItem(
        c.name,
        c.id,
        c.type,
        c.state,
        c.variations.flatMap((v) => v.id),
        campaignData,
        accountParent,
        [],
        !!c.master,
      );

      if (c.variations) {
        variations = c.variations.map((v) => {
          const vData = Object.entries(v)
            .filter(
              ([key, value]) =>
                key !== 'components' &&
                key !== 'description' &&
                key !== 'type' &&
                key !== 'visual_editor' &&
                key !== 'code_editor',
            )
            .map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
          const variationParent = { id: v.id, parent: campaignParent } as Parent;
          const variationDetails = new CampaignTreeItem('Info/Details', undefined, [...vData], undefined, INFO);
          const variationGlobalCode = new GlobalCodeVariation(
            'Variation Global Code',
            v.id,
            [new CampaignTreeItem(NO_RESOURCE_FOUND, 0, undefined)],
            variationParent,
            CODE,
          );
          return new VariationWEItem(
            v.name,
            v.id,
            [
              variationDetails,
              variationGlobalCode,
              new ModificationWETree(
                'Element JS',
                undefined,
                [new CampaignTreeItem(NO_RESOURCE_FOUND, 0, undefined)],
                variationParent,
              ),
            ],
            campaignParent,
            campaignWEItem.modifications,
          );
        });
      }

      if (c.sub_tests) {
        subTests = this.mappingCampaign(c.sub_tests);
      }

      if (campaignDetails.length !== 0) {
        campaignData.push(new CampaignTreeItem('Info/Details', undefined, campaignDetails, undefined, INFO));
      }

      if (variations.length !== 0 && subTests.length === 0) {
        campaignData.push(new CampaignTreeItem('Variations', undefined, variations, undefined, BREAKPOINTS_ACTIVATE));
      }

      if (subTests.length !== 0) {
        campaignData.push(new CampaignTreeItem('Sub Tests', undefined, subTests, undefined, BEAKER));
      }

      if (subTests.length === 0) {
        campaignData.push(
          new GlobalCodeCampaign(
            'Campaign Global Code',
            c.id,
            [new CampaignTreeItem(NO_RESOURCE_FOUND, 0, undefined)],
            campaignParent,
            CODE,
          ),
        );
      }

      campaignTreeList.push(campaignWEItem);
      return;
    });

    return campaignTreeList;
  }

  private mappingTree(campaignList: CampaignWE[]) {
    const campaignTreeList: CampaignTreeItem[] = [];
    const webExperimentationTreeList: CampaignTreeItem[] = [];
    const personalizationTreeList: CampaignTreeItem[] = [];
    const subSegmentCampaigns: CampaignTreeItem[] = [];

    const campaignWEItem = this.mappingCampaign(campaignList);
    campaignWEItem.map((c: CampaignTreeItem) => {
      if (c instanceof CampaignWEItem && !c.hasMaster) {
        switch (c.type) {
          case 'ab':
            webExperimentationTreeList.push(c);
            break;

          case 'mastersegment':
            personalizationTreeList.push(c);
            break;

          case 'subsegment':
            subSegmentCampaigns.push(c);
            break;

          case 'multipage':
            webExperimentationTreeList.push(c);
            break;

          case 'multivariate':
            webExperimentationTreeList.push(c);
            break;
        }
      }
    });

    if (webExperimentationTreeList.length !== 0) {
      campaignTreeList.push(
        new CampaignTreeItem(
          `Web experimentation - ${webExperimentationTreeList.length} campaign(s)`,
          undefined,
          webExperimentationTreeList,
          undefined,
          BEAKER,
        ),
      );
    }

    if (personalizationTreeList.length !== 0) {
      campaignTreeList.push(
        new CampaignTreeItem(
          `Personalization - ${personalizationTreeList.length} campaign(s)`,
          undefined,
          personalizationTreeList,
          undefined,
          TARGET,
        ),
      );
    }

    return campaignTreeList;
  }

  private async getRefreshedCampaigns() {
    const campaignList = await this.campaignStore.refreshCampaign();
    campaignList.sort((a, b) => b.id - a.id);
    this._tree = this.mappingTree(campaignList);
  }

  private getLoadedCampaigns() {
    const campaignList = this.campaignStore.loadCampaign();
    campaignList.sort((a, b) => b.id - a.id);
    this._tree = this.mappingTree(campaignList);
  }
}

export class CampaignTreeItem extends vscode.TreeItem {
  public children: CampaignTreeItem[] | undefined;
  public parent: any;
  public resourceId: number | undefined;

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
  public modifications: ModificationWE[] | undefined;
  public variationIds?: number[] | undefined;
  public children: CampaignTreeItem[] | undefined;
  public parent: any;
  public hasMaster: any;

  constructor(
    public readonly name?: string,
    resourceId?: number,
    public readonly type?: string,
    public readonly state?: string,
    variationIds?: number[],
    children?: CampaignTreeItem[],
    parent?: any,
    modifications?: ModificationWE[],
    hasMaster?: boolean,
  ) {
    super(name!, resourceId!, children, parent);
    this.tooltip = `Type: ${this.resourceId}`;
    this.description = `- id: ${this.resourceId}`;
    this.modifications = modifications;
    this.variationIds = variationIds;
    this.children = children;
    this.parent = parent;
    this.hasMaster = hasMaster;

    if (type === 'mastersegment') {
      switch (state) {
        case 'play':
          this.iconPath = TARGET_ACTIVE;
          break;
        case 'pause':
          this.iconPath = TARGET_PAUSED;
          break;
        case 'interrupt':
          this.iconPath = TARGET_INTERRUPTED;
          break;
        default:
          this.iconPath = TARGET;
          break;
      }
    } else {
      switch (state) {
        case 'play':
          this.iconPath = BEAKER_ACTIVE;
          break;
        case 'pause':
          this.iconPath = BEAKER_PAUSED;
          break;
        case 'interrupt':
          this.iconPath = BEAKER_INTERRUPTED;
          break;
        default:
          this.iconPath = BEAKER;
          break;
      }
    }
  }

  contextValue = 'campaignWEItem';
}

export class VariationWEItem extends CampaignTreeItem {
  public modifications: ModificationWE[] | undefined;
  constructor(
    public readonly name?: string,
    resourceId?: number,
    children?: CampaignTreeItem[],
    parent?: any,
    modifications?: ModificationWE[],
  ) {
    super(name!, resourceId, children, parent);
    this.tooltip = `- id: ${this.resourceId}`;
    this.description = `- id: ${this.resourceId}`;
    this.modifications = modifications;
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
  treeView?: CampaignTreeView;

  constructor(
    label?: string,
    resourceId?: number,
    children?: CampaignTreeItem[],
    parent?: any,
    iconPath?: vscode.ThemeIcon,
    treeView?: CampaignTreeView,
  ) {
    super(
      label!,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
    );
    this.children = children;
    this.parent = parent;
    this.iconPath = iconPath;
    this.resourceId = resourceId;
    this.contextValue = 'globalCodeCampaign';
    this.treeView = treeView;
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
      command: WEB_EXPERIMENTATION_GLOBAL_CODE_OPEN_FILE,
      arguments: [{ campaignId, filePath } as ResourceArgument],
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
    this.contextValue = 'globalCodeVariation';
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
      command: WEB_EXPERIMENTATION_GLOBAL_CODE_OPEN_FILE,
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
      command: WEB_EXPERIMENTATION_GLOBAL_CODE_OPEN_FILE,
      arguments: [{ variationId: variationId, campaignId: campaignId, filePath } as ResourceArgument],
    };

    this.iconPath = FILE_CODE;
  }
}

export class CodeModification extends vscode.TreeItem {
  children: CampaignTreeItem[] | undefined;
  resourceId: number | undefined;
  campaignId: number | undefined;
  variationId: number | undefined;
  accountId: number | undefined;
  parent: any;

  constructor(
    label?: string,
    resourceId?: number,
    children?: CampaignTreeItem[],
    campaignId?: number,
    variationId?: number,
    accountId?: number,
    parent?: any,
    iconPath?: vscode.ThemeIcon,
  ) {
    super(
      label!,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
    );
    this.children = children;
    this.campaignId = campaignId;
    this.variationId = variationId;
    this.accountId = accountId;
    this.iconPath = iconPath;
    this.resourceId = resourceId;
    this.contextValue = 'codeModification';
  }
}

export class CodeModificationItem extends CampaignTreeItem {
  filePath: string;
  type: string | undefined;
  variationId: string | undefined;
  campaignId: string | undefined;
  modificationId: string | undefined;

  constructor(label: string, filePath: string, campaignId: string, variationId: string, modificationId: string) {
    super(label);

    this.filePath = filePath;
    this.variationId = variationId;
    this.campaignId = campaignId;
    this.modificationId = modificationId;

    this.contextValue = 'codeModificationItem';
    this.command = {
      title: 'Open File',
      command: WEB_EXPERIMENTATION_GLOBAL_CODE_OPEN_FILE,
      arguments: [{ modificationId, variationId, campaignId, filePath } as ResourceArgument],
    };

    this.iconPath = FILE_CODE;
  }
}

export class ModificationWEItem extends CampaignTreeItem {
  modificationTree: ModificationWETree | undefined;
  constructor(
    public readonly name?: string,
    resourceId?: number,
    children?: CampaignTreeItem[],
    parent?: any,
    modificationTree?: ModificationWETree,
  ) {
    super(name!, resourceId, children, parent);
    this.tooltip = `- id: ${this.resourceId}`;
    this.description = `- id: ${this.resourceId}`;
    this.modificationTree = modificationTree;
    this.iconPath = PENCIL;
  }

  contextValue = 'modificationWEItem';
}

export class ModificationWETree extends CampaignTreeItem {
  constructor(public readonly name?: string, resourceId?: number, children?: CampaignTreeItem[], parent?: any) {
    super(name!, resourceId, children, parent);
    this.iconPath = PENCIL;
  }

  contextValue = 'modificationWE';
}

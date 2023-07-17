import * as vscode from 'vscode';
import { Cli } from './Cli';
import {
  BRACKET,
  CIRCLE_FILLED,
  CIRCLE_OUTLINE,
  FOLDER,
  FOLDER_ACTIVE,
  FOLDER_INTERRUPTED,
  GROUP_BY_REF_TYPE,
  LAYOUT,
  MILESTONE,
  MILESTONE_ACTIVE,
  MILESTONE_INTERRUPTED,
  MILESTONE_PAUSED,
  TARGET,
  TEST_VIEW_ICON,
  WATCH,
} from '../icons';
import { PROJECT_LIST_REFRESH } from '../commands/const';

export class ProjectListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _tree: ProjectTreeItem[] = [];
  private cli: Cli;

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private context: vscode.ExtensionContext, cli: Cli) {
    vscode.commands.registerCommand(PROJECT_LIST_REFRESH, async () => await this.refresh());
    this.cli = cli;
  }

  async refresh() {
    await this.getTree();
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: ProjectTreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    if (typeof element === 'undefined') {
      return this._tree;
    }

    if (element.children?.length === 0) {
      return [new ProjectTreeItem('No resource found')];
    }
    return element.children;
  }

  private async getTree() {
    const projectList = await this.cli.ListProject();
    const campaignList = await this.cli.ListCampaign();

    this._tree = projectList.map((p) => {
      let projectActive = false;
      const rightCampaigns = campaignList
        .filter((c) => c.project_id === p.id)
        .map((c) => {
          if (c.status === 'active') {
            projectActive = true;
          }
          const variationGroups = c.variation_groups.map((vg) => {
            const variations = vg.variations.map((v) => {
              let values = undefined;
              let modificationItem = undefined;
              if (v.modifications && v.modifications.type && v.modifications.value) {
                values = Object.entries(v.modifications.value).map(
                  ([key, value]) => new ValueItem(key, value, undefined, v.id),
                );
                modificationItem = new ModificationItem(v.modifications.type, values, v.id);
              }
              return new VariationItem(v.id, v.name, [modificationItem!], vg.id, c.id);
            });
            const variation = new ProjectTreeItem('Variations', [...variations], undefined, LAYOUT);
            const targetings = vg.targeting.targeting_groups.flatMap((tg) => {
              return tg.targetings.map((t) => {
                var targetingItem = Object.entries(t).map(([key, value]) => new ValueItem(key, value, undefined));
                return new TargetingItem(t.key, t, targetingItem);
              });
            });
            const targeting = new ProjectTreeItem('Targetings', targetings, undefined, TARGET);
            return new VariationGroupItem(vg.id, vg.name, [variation, targeting], c.id);
          });
          const schedulerItems = Object.entries(c.scheduler).map(
            ([key, value]) => new SimpleItem(key, value, undefined),
          );
          const scheduler = new SchedulerItem('Scheduler', c.scheduler, schedulerItems);
          const variationGroup = new ProjectTreeItem(
            'Variation Groups',
            [...variationGroups],
            undefined,
            GROUP_BY_REF_TYPE,
          );
          return new CampaignItem(c.id, c.name, c.status, [variationGroup, scheduler], p.id);
        });
      return new ProjectItem(p.id, p.name, rightCampaigns, projectActive);
    });
  }
}

class ProjectTreeItem extends vscode.TreeItem {
  children: ProjectTreeItem[] | undefined;
  parentID: string | undefined;

  constructor(label: string, children?: ProjectTreeItem[], parentID?: string, iconPath?: vscode.ThemeIcon) {
    super(
      label,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Expanded,
    );
    this.children = children;
    this.parentID = parentID;
    this.iconPath = iconPath;
  }
}

export class ProjectItem extends ProjectTreeItem {
  status: string | undefined;
  constructor(
    public readonly id?: string,
    public readonly name?: string,
    children?: ProjectTreeItem[],
    active?: boolean,
  ) {
    super(name!, children);
    this.tooltip = `Name: ${this.name}`;
    this.status = active ? 'active' : 'interrupted';
    if (active) {
      this.iconPath = FOLDER_ACTIVE;
    } else {
      this.iconPath = FOLDER_INTERRUPTED;
    }
  }

  contextValue = 'projectItem';
}

export class CampaignItem extends ProjectTreeItem {
  constructor(
    public readonly id?: string,
    public readonly name?: string,
    public readonly status?: string,
    children?: ProjectTreeItem[],
    parent?: any,
  ) {
    super(name!, children, parent);
    this.tooltip = `Name: ${this.name}`;
    switch (status) {
      case 'active':
        this.iconPath = MILESTONE_ACTIVE;
        break;
      case 'paused':
        this.iconPath = MILESTONE_PAUSED;
        break;
      case 'interrupted':
        this.iconPath = MILESTONE_INTERRUPTED;
        break;
      default:
        this.iconPath = MILESTONE;
        break;
    }
  }

  contextValue = 'campaignItem';
}

export class VariationGroupItem extends ProjectTreeItem {
  constructor(public readonly id?: string, public readonly name?: string, children?: ProjectTreeItem[], parent?: any) {
    super(name!, children, parent);
    this.tooltip = `Name: ${this.name}`;
  }
  iconPath = CIRCLE_OUTLINE;

  contextValue = 'variationGroupItem';
}

export class VariationItem extends ProjectTreeItem {
  campaignID: string | undefined;
  constructor(
    public readonly id?: string,
    public readonly name?: string,
    children?: ProjectTreeItem[],
    parent?: any,
    campaignID?: string,
  ) {
    super(name!, children, parent);
    this.tooltip = `Name: ${this.name}`;
    this.campaignID = campaignID;
  }
  iconPath = CIRCLE_OUTLINE;

  contextValue = 'variationItem';
}

export class ModificationItem extends ProjectTreeItem {
  constructor(public readonly type?: string, children?: ProjectTreeItem[], parent?: any) {
    super(type!, children, parent);
  }
  iconPath = TEST_VIEW_ICON;

  contextValue = 'modificationItem';
}

export class ValueItem extends ProjectTreeItem {
  constructor(
    public readonly key?: string,
    public readonly value?: unknown,
    children?: ProjectTreeItem[],
    parent?: any,
  ) {
    super(key!, children, parent);
    this.tooltip = JSON.stringify(value);
    this.description = JSON.stringify(value);
  }
  iconPath = BRACKET;

  contextValue = 'valueItem';
}

export class SimpleItem extends ProjectTreeItem {
  constructor(
    public readonly key?: string,
    public readonly value?: unknown,
    children?: ProjectTreeItem[],
    parent?: any,
  ) {
    super(key!, children, parent);
    this.tooltip = JSON.stringify(value);
    this.description = JSON.stringify(value);
  }
  iconPath = CIRCLE_OUTLINE;

  contextValue = 'simpleItem';
}

export class SchedulerItem extends ProjectTreeItem {
  constructor(
    public readonly key?: string,
    public readonly scheduler?: unknown,
    children?: ProjectTreeItem[],
    parent?: any,
  ) {
    super(key!, children, parent);
    this.tooltip = JSON.stringify(scheduler);
    this.description = JSON.stringify(scheduler);
  }
  iconPath = WATCH;

  contextValue = 'schedulerItem';
}

export class TargetingItem extends ProjectTreeItem {
  constructor(
    public readonly key?: string,
    public readonly targeting?: unknown,
    children?: ProjectTreeItem[],
    parent?: any,
  ) {
    super(key!, children, parent);
    this.tooltip = JSON.stringify(targeting);
    this.description = JSON.stringify(targeting);
  }
  iconPath = CIRCLE_OUTLINE;

  contextValue = 'schedulerItem';
}

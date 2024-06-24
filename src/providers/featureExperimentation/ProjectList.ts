import * as path from 'path';
import * as vscode from 'vscode';
import {
  FEATURE_EXPERIMENTATION_PROJECT_LIST_LOAD,
  FEATURE_EXPERIMENTATION_PROJECT_LIST_REFRESH,
} from '../../commands/const';
import {
  CIRCLE_FILLED,
  CIRCLE_OUTLINE,
  FOLDER_ACTIVE,
  FOLDER_INTERRUPTED,
  GROUP_BY_REF_TYPE,
  KEY,
  LAYOUT,
  MILESTONE,
  MILESTONE_ACTIVE,
  MILESTONE_INTERRUPTED,
  MILESTONE_PAUSED,
  TARGET,
  WATCH,
} from '../../icons';
import { PERMISSION_DENIED_PANEL } from '../../const';
import { Authentication, Configuration, Project } from '../../model';
import { ProjectStore } from '../../store/featureExperimentation/ProjectStore';

import { StateConfiguration } from '../../stateConfiguration';
import { GLOBAL_CURRENT_AUTHENTICATION_FE } from '../../services/featureExperimentation/const';

export class ProjectListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _tree: ProjectTreeItem[] = [];
  private projectStore: ProjectStore;
  private stateConfig: StateConfiguration;

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(
    private context: vscode.ExtensionContext,
    projectStore: ProjectStore,
    stateConfig: StateConfiguration,
  ) {
    this.projectStore = projectStore;
    this.stateConfig = stateConfig;

    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_PROJECT_LIST_LOAD, () => this.load());
    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_PROJECT_LIST_REFRESH, async () => await this.refresh());
  }

  async refresh() {
    const { scope } = (this.context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
    if (scope?.includes('project.list') && scope?.includes('campaign.list')) {
      await this.getRefreshedProjects();
    }
    this._onDidChangeTreeData.fire();
  }

  load() {
    const { scope } = (this.context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
    if (scope?.includes('project.list') && scope?.includes('campaign.list')) {
      this.getLoadedProjects();
    }
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: ProjectTreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    const { scope } = (this.context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
    if (typeof element === 'undefined') {
      if (!scope?.includes('project.list') || !scope?.includes('campaign.list')) {
        return [new ProjectTreeItem(PERMISSION_DENIED_PANEL)];
      }
      if (this._tree.length === 0) {
        return [new ProjectTreeItem('No Project found')];
      }
      return this._tree;
    }

    if (element.children?.length === 0) {
      return [new ProjectTreeItem('No resource found')];
    }
    return element.children;
  }

  private mappingTree(projectList: Project[]) {
    return projectList.map((p: Project) => {
      const campaignItems = [];
      let projectActive = false;
      if (p.campaigns) {
        const abCampaigns: ProjectTreeItem[] = [];
        const toggleCampaigns: ProjectTreeItem[] = [];
        const persoCampaigns: ProjectTreeItem[] = [];
        const deploymentCampaigns: ProjectTreeItem[] = [];
        const flagCampaigns: ProjectTreeItem[] = [];
        const customCampaigns: ProjectTreeItem[] = [];
        p.campaigns.forEach((c) => {
          if (c.status === 'active') {
            projectActive = true;
          }
          const variationGroups = c.variation_groups.map((vg) => {
            const variations = vg.variations.map((v) => {
              let values = undefined;
              if (v.modifications && v.modifications.type && v.modifications.value) {
                values = Object.entries(v.modifications.value).map(([key, valueItem]) => {
                  const val =
                    Object.entries(valueItem!).length !== 0 && v.modifications.type === 'FLAG'
                      ? Object.entries(valueItem!).map(([key, value]) => new SimpleItem(key, value, undefined))
                      : [new SimpleItem('value', valueItem, undefined)];
                  return new ValueItem(key, valueItem, val!, v.id);
                });
              }
              const variationInfo = Object.entries(v).map(([key, value]) => {
                if (key !== 'modifications') {
                  return `- ${key}: ${value}`;
                }
              });
              return new VariationItem(v.id, v.name, variationInfo.join('\n'), values!, vg.id, c.id);
            });
            const variation = new ProjectTreeItem('Variations', [...variations], undefined, LAYOUT);
            const targetings = vg.targeting.targeting_groups.flatMap((tg) => {
              return tg.targetings.map((t) => {
                var targetingItem = Object.entries(t).map(
                  ([key, value]) => new TargetingValueItem(key, value, undefined),
                );
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
          switch (c.type) {
            case 'ab':
              abCampaigns.push(new CampaignItem(c.id, c.name, c.type, c.status, [variationGroup, scheduler], p.id));
              break;
            case 'toggle':
              toggleCampaigns.push(new CampaignItem(c.id, c.name, c.type, c.status, [variationGroup, scheduler], p.id));
              break;
            case 'perso':
              persoCampaigns.push(new CampaignItem(c.id, c.name, c.type, c.status, [variationGroup, scheduler], p.id));
              break;
            case 'deployment':
              deploymentCampaigns.push(
                new CampaignItem(c.id, c.name, c.type, c.status, [variationGroup, scheduler], p.id),
              );
              break;
            case 'flag':
              flagCampaigns.push(new CampaignItem(c.id, c.name, c.type, c.status, [variationGroup, scheduler], p.id));
              break;
            case 'custom':
              customCampaigns.push(new CampaignItem(c.id, c.name, c.type, c.status, [variationGroup, scheduler], p.id));
              break;
          }
        });

        const abCampaign = new ProjectTreeItem(`AB Test - ${abCampaigns.length} campaign(s)`, abCampaigns);
        const toggleCampaign = new ProjectTreeItem(`Toggle - ${toggleCampaigns.length} campaign(s)`, toggleCampaigns);
        const persoCampaign = new ProjectTreeItem(
          `Personalization - ${persoCampaigns.length} campaign(s)`,
          persoCampaigns,
        );
        const deploymentCampaign = new ProjectTreeItem(
          `Deployment - ${deploymentCampaigns.length} campaign(s)`,
          deploymentCampaigns,
        );
        const flagCampaign = new ProjectTreeItem(`Flag - ${flagCampaigns.length} campaign(s)`, flagCampaigns);
        const customCampaign = new ProjectTreeItem(
          `Customization - ${customCampaigns.length} campaign(s)`,
          customCampaigns,
        );
        if (abCampaigns.length !== 0) {
          campaignItems.push(abCampaign);
        }
        if (toggleCampaigns.length !== 0) {
          campaignItems.push(toggleCampaign);
        }
        if (persoCampaigns.length !== 0) {
          campaignItems.push(persoCampaign);
        }
        if (deploymentCampaigns.length !== 0) {
          campaignItems.push(deploymentCampaign);
        }
        if (flagCampaigns.length !== 0) {
          campaignItems.push(flagCampaign);
        }
        if (customCampaigns.length !== 0) {
          campaignItems.push(customCampaign);
        }
      }
      return new ProjectItem(p.id, p.name, campaignItems, projectActive);
    });
  }

  private async getRefreshedProjects() {
    const projectList = await this.projectStore.refreshProject();

    this._tree = this.mappingTree(projectList);
  }

  private getLoadedProjects() {
    const projectList = this.projectStore.loadProject();

    this._tree = this.mappingTree(projectList);
  }
}

class ProjectTreeItem extends vscode.TreeItem {
  children: ProjectTreeItem[] | undefined;
  parentID: string | undefined;

  constructor(label?: string, children?: ProjectTreeItem[], parentID?: string, iconPath?: vscode.ThemeIcon) {
    super(
      label!,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
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
    this.tooltip = `- id: ${this.id}`;
    this.description = `- id: ${this.id}`;
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
    public readonly type?: string,
    public readonly status?: string,
    children?: ProjectTreeItem[],
    parent?: any,
  ) {
    super(name!, children, parent);
    this.tooltip = `- id: ${this.id}`;
    this.description = `- id: ${this.id}`;
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
    this.tooltip = `- id: ${this.id}`;
    this.description = `- id: ${this.id}`;
  }
  iconPath = CIRCLE_OUTLINE;

  contextValue = 'variationGroupItem';
}

export class VariationItem extends ProjectTreeItem {
  campaignID: string | undefined;
  constructor(
    public readonly id?: string,
    public readonly name?: string,
    public readonly description?: string,
    children?: ProjectTreeItem[],
    parent?: any,
    campaignID?: string,
  ) {
    super(name!, children, parent);
    this.tooltip = description;
    this.description = description;
    this.campaignID = campaignID;
  }
  iconPath = CIRCLE_OUTLINE;

  contextValue = 'variationItem';
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
  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'flag.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'flag.svg'),
  };

  contextValue = 'valueItem';
}

class TargetingValueItem extends ProjectTreeItem {
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
  iconPath = CIRCLE_FILLED;

  contextValue = 'targetingValueItem';
}

class SimpleItem extends ProjectTreeItem {
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
  iconPath = CIRCLE_FILLED;

  contextValue = 'simpleItem';
}

class SchedulerItem extends ProjectTreeItem {
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

class TargetingItem extends ProjectTreeItem {
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
  iconPath = KEY;

  contextValue = 'targetingItem';
}

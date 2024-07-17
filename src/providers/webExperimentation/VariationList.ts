import * as vscode from 'vscode';
import {
  WEB_EXPERIMENTATION_VARIATION_LIST_LOAD,
  WEB_EXPERIMENTATION_VARIATION_LIST_REFRESH,
} from '../../commands/const';
import { CIRCLE_FILLED, CIRCLE_OUTLINE, ROCKET } from '../../icons';
import { VariationWE } from '../../model';
import { CURRENT_SET_CAMPAIGN_ID, CURRENT_SET_VARIATIONS_ID } from '../../services/webExperimentation/const';
import { NO_RESOURCE_FOUND, SET_CAMPAIGN_ID_FOR_VARIATION } from '../../const';
import { VariationStore } from '../../store/webExperimentation/VariationStore';

export class VariationListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _variations: VariationTreeItem = {
    children: undefined,
    parentID: undefined,
  };
  private variationStore: VariationStore;

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private context: vscode.ExtensionContext, variationStore: VariationStore) {
    this.variationStore = variationStore;

    vscode.commands.registerCommand(WEB_EXPERIMENTATION_VARIATION_LIST_REFRESH, async () => await this.refresh());
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_VARIATION_LIST_LOAD, () => this.load());
  }

  async refresh() {
    this._variations = {
      children: undefined,
      parentID: undefined,
    };
    const campaignID = ((await this.context.globalState.get(CURRENT_SET_CAMPAIGN_ID)) as number) || 0;
    const variationIDs = ((await this.context.globalState.get(CURRENT_SET_VARIATIONS_ID)) as number[]) || [];
    if (campaignID && variationIDs) {
      await this.getRefreshedVariation(campaignID, variationIDs);
    }
    this._onDidChangeTreeData.fire();
  }

  async load() {
    this._variations = {
      children: undefined,
      parentID: undefined,
    };
    const campaignID = ((await this.context.globalState.get(CURRENT_SET_CAMPAIGN_ID)) as number) || 0;
    const variationIDs = ((await this.context.globalState.get(CURRENT_SET_VARIATIONS_ID)) as number[]) || [];
    if (campaignID && variationIDs) {
      this.getLoadedVariation(campaignID, variationIDs);
    }
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: VariationTreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    const campaignID = (this.context.globalState.get(CURRENT_SET_CAMPAIGN_ID) as number) || 0;
    if (typeof element === 'undefined') {
      if (!campaignID) {
        return [new VariationTreeItem(SET_CAMPAIGN_ID_FOR_VARIATION)];
      }

      return [this._variations];
    }

    if (element.children?.length === 0) {
      return [new VariationTreeItem(NO_RESOURCE_FOUND)];
    }
    return element.children;
  }

  private mappingTree(campaignID: number, variationList: VariationWE[]) {
    const variationsItem = variationList.map((v) => {
      const variationData: VariationTreeItem[] = [];
      let components: ComponentWEItem[] = [];
      if (v.components) {
        components = v.components.map((c) => {
          const componentItem = Object.entries(c).map(([key, value]) => {
            return new SimpleVariationItem(key, value, undefined, c.id);
          });
          return new ComponentWEItem(c.id, c.name, componentItem, v.id);
        });
      }

      const varItem = Object.entries(v)
        .filter(([key, value]) => key !== 'components')
        .map(([key, value]) => new SimpleVariationItem(key, value, undefined));

      if (varItem.length !== 0) {
        variationData.push(new VariationTreeItem('Info/Details', varItem));
      }

      if (components.length !== 0) {
        variationData.push(new VariationTreeItem('Components', components));
      }

      return new VariationItem(
        String(v.id),
        v.name,
        vscode.TreeItemCollapsibleState.Collapsed,
        campaignID,
        variationData,
      );
    });

    return new _CampaignItem(String(campaignID), String(campaignID), variationsItem);
  }

  private async getRefreshedVariation(campaignID: number, variationIds: number[]) {
    const variationList = await this.variationStore.refreshVariation(campaignID, variationIds);
    this._variations = this.mappingTree(campaignID, variationList);
  }

  private getLoadedVariation(campaignID: number, variationIds: number[]) {
    const variationList = this.variationStore.loadVariation();
    this._variations = this.mappingTree(campaignID, variationList);
  }
}

class VariationTreeItem extends vscode.TreeItem {
  children: VariationTreeItem[] | undefined;
  parentID: string | undefined;

  constructor(label?: string, children?: VariationTreeItem[], parentID?: string, iconPath?: vscode.ThemeIcon) {
    super(
      label!,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
    );
    this.children = children;
    this.parentID = parentID;
    this.iconPath = iconPath;
  }
}

export class VariationItem extends VariationTreeItem {
  constructor(
    public readonly id?: string,
    public readonly name?: string,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
    public readonly campaignId?: number,
    children?: VariationTreeItem[],
    parent?: any,
  ) {
    super(name!, children, parent);
    this.tooltip = `Name: ${this.name}`;
    this.description = name;
  }
  iconPath = ROCKET;

  contextValue = 'variationWEItem';
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class _CampaignItem extends VariationTreeItem {
  constructor(public readonly id?: string, public readonly name?: string, children?: VariationItem[], parent?: any) {
    super(name!, children, parent);
    this.tooltip = `- id: ${this.id}`;
    this.description = `- id: ${this.id}`;
  }
  iconPath = ROCKET;

  contextValue = '_campaignItem';
}

class SimpleVariationItem extends VariationTreeItem {
  constructor(
    public readonly key?: string,
    public readonly value?: unknown,
    children?: VariationTreeItem[],
    parent?: any,
  ) {
    super(key!, children, parent);
    this.tooltip = JSON.stringify(value);
    this.description = JSON.stringify(value);
  }
  iconPath = CIRCLE_FILLED;

  contextValue = 'simpleItem';
}

export class ComponentWEItem extends VariationTreeItem {
  constructor(
    public readonly id?: string,
    public readonly name?: string,
    children?: VariationTreeItem[],
    parent?: any,
  ) {
    super(name!, children, parent);
    this.tooltip = `- id: ${this.id}`;
    this.description = `- id: ${this.id}`;
  }
  iconPath = CIRCLE_OUTLINE;

  contextValue = 'componentWEItem';
}

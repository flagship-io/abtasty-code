import * as vscode from 'vscode';
import {
  WEB_EXPERIMENTATION_VARIATION_LIST_LOAD,
  WEB_EXPERIMENTATION_VARIATION_LIST_REFRESH,
} from '../../commands/const';
import { CIRCLE_OUTLINE, ROCKET } from '../../icons';

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

import * as vscode from 'vscode';
import {
  WEB_EXPERIMENTATION_MODIFICATION_LIST_LOAD,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_REFRESH,
} from '../../commands/const';
import { CIRCLE_FILLED, ROCKET } from '../../icons';

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

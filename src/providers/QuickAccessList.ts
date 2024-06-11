import * as vscode from 'vscode';
import { StateConfiguration } from '../stateConfiguration';
import { DOCUMENT_URI } from '../const';
import {
  FEATURE_EXPERIMENTATION_CREATE_FLAG,
  FEATURE_EXPERIMENTATION_CREATE_GOAL,
  FEATURE_EXPERIMENTATION_CREATE_PROJECT,
  FEATURE_EXPERIMENTATION_CREATE_TARGETING_KEY,
  FEATURE_EXPERIMENTATION_OPEN_BROWSER,
  FEATURE_EXPERIMENTATION_QUICK_ACCESS_REFRESH,
  FEATURE_EXPERIMENTATION_SET_CREDENTIALS,
} from '../commands/const';

const NON_COLLAPSED = vscode.TreeItemCollapsibleState.None;
export class QuickAccessListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly stateConfig: StateConfiguration;
  private items: LinkItem[] = [];

  constructor(stateConfig: StateConfiguration) {
    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_QUICK_ACCESS_REFRESH, async () => await this.refresh());
    this.stateConfig = stateConfig;
  }

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | null | void> =
    new vscode.EventEmitter<vscode.TreeItem | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | null | void> = this._onDidChangeTreeData.event;

  async refresh() {
    this.items = [];
    await this.getLinkItems();
    this._onDidChangeTreeData.fire(null);
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  async getChildren(element?: LinkItem): Promise<LinkItem[]> {
    return this.items;
  }

  private async getLinkItems() {
    this.items.push(
      new LinkItem(`Manage configurations`, NON_COLLAPSED, '', {
        title: 'Credentials',
        command: FEATURE_EXPERIMENTATION_SET_CREDENTIALS,
      }),
    );
    this.items.push(
      new LinkItem(`Create Feature Flag`, NON_COLLAPSED, '', {
        title: 'Create Boolean Feature Flag',
        command: FEATURE_EXPERIMENTATION_CREATE_FLAG,
      }),
    );
    this.items.push(
      new LinkItem(`Create Project`, NON_COLLAPSED, '', {
        title: 'Create Boolean Feature Flag',
        command: FEATURE_EXPERIMENTATION_CREATE_PROJECT,
      }),
    );
    this.items.push(
      new LinkItem(`Create Goal`, NON_COLLAPSED, '', {
        title: 'Create Boolean Feature Flag',
        command: FEATURE_EXPERIMENTATION_CREATE_GOAL,
      }),
    );
    this.items.push(
      new LinkItem(`Create Targeting key`, NON_COLLAPSED, '', {
        title: 'Create Boolean Feature Flag',
        command: FEATURE_EXPERIMENTATION_CREATE_TARGETING_KEY,
      }),
    );
    this.items.push(new LinkItem(`Documentation`, NON_COLLAPSED, DOCUMENT_URI));
  }
}

export class LinkItem extends vscode.TreeItem {
  uri: string;
  command?: vscode.Command;
  constructor(
    public readonly label: string,
    public collapsibleState: vscode.TreeItemCollapsibleState,
    uri: string,
    command?: vscode.Command,
  ) {
    super(label, collapsibleState);
    this.uri = uri;
    this.command = command
      ? command
      : {
          title: 'Open In Browser',
          command: FEATURE_EXPERIMENTATION_OPEN_BROWSER,
          arguments: [this.uri],
        };
  }
}

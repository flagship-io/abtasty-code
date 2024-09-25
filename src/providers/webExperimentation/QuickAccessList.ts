import * as vscode from 'vscode';
import { DOCUMENT_URI } from '../../const';
import {
  FEATURE_EXPERIMENTATION_OPEN_BROWSER,
  FEATURE_EXPERIMENTATION_SET_CREDENTIALS,
  WEB_EXPERIMENTATION_CREATE_MODIFICATION,
  WEB_EXPERIMENTATION_QUICK_ACCESS_REFRESH,
  WEB_EXPERIMENTATION_RESET_WORKING_DIR,
  WEB_EXPERIMENTATION_SET_CREDENTIALS,
} from '../../commands/const';

const NON_COLLAPSED = vscode.TreeItemCollapsibleState.None;
export class QuickAccessListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private items: LinkItem[] = [];

  constructor() {
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_QUICK_ACCESS_REFRESH, async () => await this.refresh());
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
      new LinkItem(`Switch to Feature experimentation`, NON_COLLAPSED, '', {
        title: 'Change product',
        command: FEATURE_EXPERIMENTATION_SET_CREDENTIALS,
      }),
    );
    this.items.push(
      new LinkItem(`Manage configurations`, NON_COLLAPSED, '', {
        title: 'Credentials',
        command: WEB_EXPERIMENTATION_SET_CREDENTIALS,
      }),
    );
    this.items.push(
      new LinkItem(`Set Working directory to workspace`, NON_COLLAPSED, '', {
        title: 'Set working dir',
        command: WEB_EXPERIMENTATION_RESET_WORKING_DIR,
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

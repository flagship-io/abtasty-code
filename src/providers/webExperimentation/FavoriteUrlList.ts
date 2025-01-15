import * as vscode from 'vscode';
import {
  WEB_EXPERIMENTATION_FAVORITE_URL_LIST_REFRESH,
  WEB_EXPERIMENTATION_FAVORITE_URL_LIST_LOAD,
} from '../../commands/const';
import { CIRCLE_FILLED, INFO, LINK, MOVE, SYMBOL_EVENT, TARGET } from '../../icons';
import { NO_RESOURCE_FOUND } from '../../const';
import { AccountWEStore } from '../../store/webExperimentation/AccountStore';
import { FavoriteUrlStore } from '../../store/webExperimentation/FavoriteUrlStore';
import { FavoriteUrl } from '../../model';

export type Parent = {
  id: string;
  parent: Parent;
};

export class FavoriteUrlListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _tree: FavoriteUrlTreeItem[] = [];
  private favoriteUrlStore: FavoriteUrlStore;
  private accountStore: AccountWEStore;
  public currentAccountId: string | undefined;

  _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(
    private context: vscode.ExtensionContext,
    accountStore: AccountWEStore,
    favoriteUrlStore: FavoriteUrlStore,
    currentAccountId: string,
  ) {
    this.favoriteUrlStore = favoriteUrlStore;
    this.accountStore = accountStore;
    this.currentAccountId = currentAccountId;
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_FAVORITE_URL_LIST_REFRESH, async () => await this.refresh());
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_FAVORITE_URL_LIST_LOAD, () => this.load());
  }

  async refresh() {
    const account = await this.accountStore.currentAccount();
    this.currentAccountId = account.account_id;
    await this.getRefreshedFavoriteUrls();
    this._onDidChangeTreeData.fire();
  }

  async load() {
    const account = await this.accountStore.currentAccount();
    this.currentAccountId = account.account_id;
    this.getLoadedFavoriteUrls();
    this._onDidChangeTreeData.fire();
  }

  async fire() {
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: FavoriteUrlTreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    if (typeof element === 'undefined') {
      if (this._tree.length === 0) {
        const noFavoriteUrl = new vscode.TreeItem('No Favorite URL found');
        return [noFavoriteUrl];
      }
      return this._tree;
    }

    if (element.children?.length === 0) {
      return [new FavoriteUrlTreeItem(NO_RESOURCE_FOUND)];
    }
    return element.children;
  }

  private mappingFavoriteUrl(favoriteUrlList: FavoriteUrl[]): FavoriteUrlTreeItem[] {
    const favoriteUrlTreeList: FavoriteUrlTreeItem[] = [];

    const accountParent = { id: this.currentAccountId } as Parent;

    favoriteUrlList.map((f: FavoriteUrl) => {
      const favoriteUrlParent = { id: f.id, parent: accountParent } as Parent;
      const favoriteUrlData: FavoriteUrlTreeItem[] = [];
      const favoriteUrlDetails = Object.entries(f)
        .filter(([key, value]) => key !== 'conditions' && value !== null)
        .map(([key, value]) => {
          if (key === 'created_at') {
            const createdAt = Object.entries(f.created_at).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, undefined, createdAt, undefined);
          }
          if (key === 'updated_at') {
            const updatedAt = Object.entries(f.updated_at).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, undefined, updatedAt, undefined);
          }

          return new SimpleItem(key, undefined, value, undefined, undefined);
        });

      const favoriteUrlWEItem = new FavoriteUrlWEItem(f.name, f.id, f, favoriteUrlData, accountParent);

      if (favoriteUrlDetails.length !== 0) {
        favoriteUrlData.push(new FavoriteUrlTreeItem('Info/Details', undefined, favoriteUrlDetails, undefined, INFO));
      }

      favoriteUrlTreeList.push(favoriteUrlWEItem);
      return;
    });

    return favoriteUrlTreeList;
  }

  private mappingTree(favoriteUrlList: FavoriteUrl[]) {
    const favoriteUrlTreeList: FavoriteUrlTreeItem[] = [];

    const favoriteUrlWEItem = this.mappingFavoriteUrl(favoriteUrlList);
    favoriteUrlWEItem.map((f: FavoriteUrlTreeItem) => {
      if (f instanceof FavoriteUrlWEItem) {
        favoriteUrlTreeList.push(f);
      }
    });

    return favoriteUrlTreeList;
  }

  private async getRefreshedFavoriteUrls() {
    const favoriteUrlList = await this.favoriteUrlStore.refreshFavoriteUrl();
    this._tree = this.mappingTree(favoriteUrlList);
  }

  private getLoadedFavoriteUrls() {
    const favoriteUrlList = this.favoriteUrlStore.loadFavoriteUrls();
    this._tree = this.mappingTree(favoriteUrlList);
  }
}

export class FavoriteUrlTreeItem extends vscode.TreeItem {
  public children: FavoriteUrlTreeItem[] | undefined;
  public parent: any;
  public resourceId: string | undefined;

  constructor(
    label?: string,
    resourceId?: string,
    children?: FavoriteUrlTreeItem[],
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

export class FavoriteUrlWEItem extends FavoriteUrlTreeItem {
  public children: FavoriteUrlTreeItem[] | undefined;
  public parent: any;
  public favoriteUrl?: FavoriteUrl;

  constructor(
    public readonly name?: string,
    resourceId?: string,
    favoriteUrl?: any,

    children?: FavoriteUrlTreeItem[],
    parent?: any,
  ) {
    super(name!, resourceId!, children, parent);
    this.tooltip = `Type: ${this.resourceId}`;
    this.description = `- id: ${this.resourceId}`;
    this.children = children;
    this.parent = parent;
    this.favoriteUrl = favoriteUrl;

    this.iconPath = LINK;
  }

  contextValue = 'favoriteUrlWEItem';
}

export class SimpleItem extends FavoriteUrlTreeItem {
  constructor(
    public readonly key?: string,
    resourceId?: string,
    public readonly value?: unknown,
    children?: FavoriteUrlTreeItem[],
    parent?: any,
  ) {
    super(key!, resourceId, children, parent);
    this.tooltip = JSON.stringify(value);
    this.description = JSON.stringify(value);
  }
  iconPath = CIRCLE_FILLED;

  contextValue = 'simpleItem';
}

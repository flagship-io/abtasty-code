import * as vscode from 'vscode';
import {
  WEB_EXPERIMENTATION_ACCOUNT_LIST_LOAD,
  WEB_EXPERIMENTATION_ACCOUNT_LIST_REFRESH,
  WEB_EXPERIMENTATION_GLOBAL_CODE_OPEN_FILE,
} from '../../commands/const';
import { ACCOUNT, CIRCLE_FILLED, CURRENT_ACCOUNT, FILE_CODE } from '../../icons';
import { AccountWE, ItemResource } from '../../model';
import { AccountWEStore } from '../../store/webExperimentation/AccountStore';
import { ResourceArgument } from './CampaignList';
import { NO_RESOURCE_FOUND } from '../../const';

export class AccountListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _accounts: AccountTreeItem[] = [];
  private accountStore: AccountWEStore;

  _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private context: vscode.ExtensionContext, accountStore: AccountWEStore) {
    this.accountStore = accountStore;

    vscode.commands.registerCommand(WEB_EXPERIMENTATION_ACCOUNT_LIST_REFRESH, async () => await this.refresh());
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_ACCOUNT_LIST_LOAD, () => this.load());
  }

  async refresh() {
    const currentAccountId = (await this.accountStore.currentAccount()).account_id;
    await this.getRefreshedAccounts(currentAccountId);
    this._onDidChangeTreeData.fire();
  }

  async load() {
    const currentAccountId = (await this.accountStore.currentAccount()).account_id;
    this.getLoadedAccounts(currentAccountId);
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getParent(element: GlobalCodeAccount): vscode.TreeItem | null {
    return element.parent || null;
  }

  getChildren(element?: AccountTreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    if (typeof element === 'undefined') {
      if (this._accounts.length === 0) {
        const noAccount = new vscode.TreeItem('No Account found');
        return [noAccount];
      }
      return this._accounts;
    }

    if (element.children?.length === 0) {
      return [new AccountTreeItem(NO_RESOURCE_FOUND)];
    }

    return element.children;
  }

  private async getRefreshedAccounts(currentAuth: string) {
    const accountList = await this.accountStore.refreshAccount();
    this._accounts = this.mappingTree(accountList, currentAuth);
  }

  private getLoadedAccounts(currentAuth: string) {
    const accountList = this.accountStore.loadAccount();
    this._accounts = this.mappingTree(accountList, currentAuth);
  }

  private mappingTree(accountList: AccountWE[], currentAuth: string) {
    const accountTreeList: AccountTreeItem[] = [];
    accountList.map((a: AccountWE) => {
      const accountData: AccountTreeItem[] = [];
      const accountDetails = Object.entries(a)
        .filter(
          ([k, v]) =>
            (k === 'id' || k === 'name' || k === 'identifier' || k === 'role' || k === 'pack') &&
            v !== undefined &&
            v !== '',
        )
        .map(([k, v]) => {
          return new SimpleItem(k, undefined, v, undefined, undefined);
        });

      if (accountDetails.length !== 0) {
        accountData.push(new AccountTreeItem('Info/Details', undefined, accountDetails));
      }

      accountData.push(
        new GlobalCodeAccount('Account Global Code', a.id, [new AccountTreeItem(NO_RESOURCE_FOUND, 0, undefined)]),
      );

      const account = new AccountItem(a.name, a.id, currentAuth, a.identifier, accountData, undefined);

      if (String(a.id) === currentAuth) {
        accountTreeList.unshift(account);
      } else {
        accountTreeList.push(account);
      }
    });

    return accountTreeList;
  }
}

class AccountTreeItem extends vscode.TreeItem {
  children: AccountTreeItem[] | undefined;
  parent: any;
  resourceId: number | undefined;

  constructor(
    label?: string,
    resourceId?: number,
    children?: AccountTreeItem[],
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

export class AccountItem extends AccountTreeItem {
  identifier: string | undefined;
  currentAccountId: string | undefined;

  constructor(
    public readonly name?: string,
    resourceId?: number,
    currentAccountId?: string,
    identifier?: string,
    children?: AccountTreeItem[],
    parent?: any,
  ) {
    super(name!, resourceId, children, parent);
    this.identifier = identifier;
    this.currentAccountId = currentAccountId;

    this.tooltip = `- id: ${this.resourceId}`;
    this.description = `- id: ${this.resourceId} identifier: ${this.identifier}`;

    if (String(this.resourceId) === this.currentAccountId) {
      this.iconPath = CURRENT_ACCOUNT;
    } else {
      this.iconPath = ACCOUNT;
    }
  }

  contextValue = 'accountWEItem';
}

export class SimpleItem extends AccountTreeItem {
  constructor(
    public readonly key?: string,
    resourceId?: number,
    public readonly value?: unknown,
    children?: AccountTreeItem[],
    parent?: any,
  ) {
    super(key!, resourceId, children, parent);
    this.tooltip = JSON.stringify(value);
    this.description = JSON.stringify(value);
  }
  iconPath = CIRCLE_FILLED;

  contextValue = 'simpleItem';
}

export class GlobalCodeAccount extends vscode.TreeItem {
  children: AccountTreeItem[] | undefined;
  parent: any;
  resourceId: number | undefined;

  constructor(
    label?: string,
    resourceId?: number,
    children?: AccountTreeItem[],
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
    this.contextValue = 'globalCodeAccount';
  }
}

export class GlobalCodeAccountItem extends AccountTreeItem {
  filePath: string;
  type: string | undefined;
  accountId: string | undefined;

  constructor(label: string, filePath: string, accountId: string) {
    super(label);

    this.filePath = filePath;
    this.accountId = accountId;

    this.contextValue = 'globalCodeAccountItem';
    this.command = {
      title: 'Open File',
      command: WEB_EXPERIMENTATION_GLOBAL_CODE_OPEN_FILE,
      arguments: [{ accountId: accountId, filePath: filePath } as ResourceArgument],
    };

    this.iconPath = FILE_CODE;
  }
}

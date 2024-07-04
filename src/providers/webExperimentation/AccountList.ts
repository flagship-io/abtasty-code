import * as vscode from 'vscode';
import { WEB_EXPERIMENTATION_ACCOUNT_LIST_LOAD, WEB_EXPERIMENTATION_ACCOUNT_LIST_REFRESH } from '../../commands/const';
import { ACCOUNT, CURRENT_ACCOUNT } from '../../icons';
import { ItemResource } from '../../model';
import { AccountWEStore } from '../../store/webExperimentation/AccountStore';

export class AccountListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _accounts: AccountItem[] = [];
  private accountStore: AccountWEStore;

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private context: vscode.ExtensionContext, accountStore: AccountWEStore) {
    this.accountStore = accountStore;

    vscode.commands.registerCommand(WEB_EXPERIMENTATION_ACCOUNT_LIST_REFRESH, async () => await this.refresh());
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_ACCOUNT_LIST_LOAD, () => this.load());
  }

  async refresh() {
    this._accounts = [];
    const currentAccountId = (await this.accountStore.currentAccount()).account_id;
    await this.getRefreshedAccounts(currentAccountId);
    this._onDidChangeTreeData.fire();
  }

  async load() {
    this._accounts = [];
    const currentAccountId = (await this.accountStore.currentAccount()).account_id;
    this.getLoadedAccounts(currentAccountId);
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    if (this._accounts.length === 0) {
      const noAccount = new vscode.TreeItem('No Account found');
      return [noAccount];
    }

    if (typeof element === 'undefined') {
      return this._accounts;
    }

    Object.entries(this._accounts.find((f) => f === element)!).forEach(([k, v]) => {
      if (k === 'id' || k === 'name' || k === 'identifier' || k === 'role' || k === 'pack') {
        if (v !== undefined && v !== '') {
          items.push(this.getAccountInfo(k, v));
        }
      }
    });

    return items;
  }

  private async getRefreshedAccounts(currentAuth: string) {
    const accountList = await this.accountStore.refreshAccount();
    accountList.map((a) => {
      const account = new AccountItem(
        String(a.id),
        a.name,
        a.identifier,
        a.role,
        a.pack,
        currentAuth,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      if (account.id === currentAuth) {
        this._accounts.unshift(account);
      } else {
        this._accounts.push(account);
      }
    });
  }

  private getLoadedAccounts(currentAuth: string) {
    const accountList = this.accountStore.loadAccount();
    accountList.map((a) => {
      const account = new AccountItem(
        String(a.id),
        a.name,
        a.identifier,
        a.role,
        a.pack,
        currentAuth,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      if (account.id === currentAuth) {
        this._accounts.unshift(account);
      } else {
        this._accounts.push(account);
      }
    });
  }

  private getAccountInfo(label: string, labelValue: string): vscode.TreeItem {
    return new ItemResource(label, labelValue);
  }
}

export class AccountItem extends vscode.TreeItem {
  constructor(
    public readonly id?: string,
    public readonly name?: string,
    public readonly identifier?: string,
    public readonly role?: string,
    public readonly pack?: string,
    public readonly currentAccountId?: string,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
  ) {
    super(name!, collapsibleState);
    this.tooltip = `- id: ${this.id}`;
    this.description = `- id: ${this.id} identifier: ${this.identifier}`;

    if (this.id === this.currentAccountId) {
      this.iconPath = CURRENT_ACCOUNT;
    } else {
      this.iconPath = ACCOUNT;
    }
  }

  contextValue = 'accountWEItem';
}

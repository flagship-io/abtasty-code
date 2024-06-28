import * as vscode from 'vscode';
import { GLOBAL_LIST_ACCOUNT_FE } from './const';
import { AccountFE } from '../../model';

export class AccountFEDataService {
  private context: vscode.ExtensionContext;
  private accountList: AccountFE[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.accountList = this.context.globalState.get(GLOBAL_LIST_ACCOUNT_FE) || [];
  }

  getState(): AccountFE[] {
    return this.accountList;
  }

  async loadState(state: AccountFE[]) {
    this.accountList = state;
    await this.context.globalState.update(GLOBAL_LIST_ACCOUNT_FE, this.accountList);
  }

  async saveAccount(account: AccountFE) {
    const newAccounts = [...this.accountList, account];
    await this.loadState(newAccounts);
  }

  async editAccount(accountId: string, newAccount: AccountFE) {
    const oldAccounts = this.accountList.filter((a) => accountId !== a.id);
    const newAccounts = [...oldAccounts, newAccount];
    await this.loadState(newAccounts);
  }

  async deleteAccount(accountId: string) {
    const newAccounts = this.accountList.filter((a) => accountId !== a.id);
    await this.loadState(newAccounts);
  }
}

import * as vscode from 'vscode';
import { GLOBAL_LIST_ACCOUNT_WE } from './const';
import { WebExpAccount } from '../../model';

export class AccountDataService {
  private context: vscode.ExtensionContext;
  private accountList: WebExpAccount[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.accountList = this.context.globalState.get(GLOBAL_LIST_ACCOUNT_WE) || [];
  }

  getState(): WebExpAccount[] {
    return this.accountList;
  }

  async loadState(state: WebExpAccount[]) {
    this.accountList = state;
    await this.context.globalState.update(GLOBAL_LIST_ACCOUNT_WE, this.accountList);
  }
}

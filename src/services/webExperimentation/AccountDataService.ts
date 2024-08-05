import * as vscode from 'vscode';
import { GLOBAL_LIST_ACCOUNT_WE } from './const';
import { AccountWE } from '../../model';

export class AccountWEDataService {
  private context: vscode.ExtensionContext;
  private accountList: AccountWE[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.accountList = this.context.globalState.get(GLOBAL_LIST_ACCOUNT_WE) || [];
  }

  getState(): AccountWE[] {
    return this.accountList;
  }

  async loadState(state: AccountWE[]) {
    this.accountList = state;
    await this.context.globalState.update(GLOBAL_LIST_ACCOUNT_WE, this.accountList);
  }
}

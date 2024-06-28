import * as vscode from 'vscode';
import { AccountFEDataService } from '../../services/featureExperimentation/AccountDataService';
import { AccountFE } from '../../model';

export class AccountFEStore {
  private accountService: AccountFEDataService;

  constructor(context: vscode.ExtensionContext) {
    this.accountService = new AccountFEDataService(context);
  }

  loadAccount(): AccountFE[] {
    return this.accountService.getState();
  }

  async saveAccount(account: AccountFE) {
    const saved = await this.accountService.saveAccount(account);
    vscode.window.showInformationMessage(`[AB Tasty] Account added successfully !`);
  }

  async editAccount(accountId: string, newAccount: AccountFE) {
    await this.accountService.editAccount(accountId, newAccount);
    vscode.window.showInformationMessage(`[AB Tasty] Account edited successfully`);
  }

  async deleteAccount(accountId: string) {
    await this.accountService.deleteAccount(accountId);
    vscode.window.showInformationMessage(`[AB Tasty] Account deleted successfully`);
  }
}

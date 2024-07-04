import * as vscode from 'vscode';
import { Cli } from '../../cli/cmd/webExperimentation/Cli';
import { AccountWEDataService } from '../../services/webExperimentation/AccountDataService';
import { AccountWE } from '../../model';

export class AccountWEStore {
  private cli: Cli;
  private accountService: AccountWEDataService;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.cli = cli;
    this.accountService = new AccountWEDataService(context);
  }

  loadAccount(): AccountWE[] {
    return this.accountService.getState();
  }

  async refreshAccount(): Promise<AccountWE[]> {
    const accounts = await this.cli.ListAccountWE();
    const accountOrdered = accounts.sort((a, b) => a.name.localeCompare(b.name));
    await this.accountService.loadState(accountOrdered);
    return accountOrdered;
  }

  async selectAccount(accountId: string) {
    await this.cli.UseAccount(accountId);
  }

  async currentAccount() {
    return await this.cli.CurrentAccountWE();
  }
}

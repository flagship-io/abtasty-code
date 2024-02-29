import * as vscode from 'vscode';
import { Flag } from '../model';
import { Cli } from '../providers/Cli';
import { FlagDataService } from '../services/FlagDataService';

export class FlagStore {
  private cli: Cli;
  private flagService;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.cli = cli;
    this.flagService = new FlagDataService(context);
  }

  loadFlag(): Flag[] {
    return this.flagService.getState();
  }

  async refreshFlag(): Promise<Flag[]> {
    const flags = await this.cli.ListFlag();
    await this.flagService.loadState(flags);
    return flags;
  }

  async saveFlag(flag: Flag): Promise<Flag> {
    const cliResponse = await this.cli.CreateFlag(flag);
    if (cliResponse.id) {
      await this.flagService.saveFlag(cliResponse);
      vscode.window.showInformationMessage(`[Flagship] Flag created successfully !`);
    }
    return cliResponse;
  }

  async editFlag(flagId: string, newFlag: Flag): Promise<Flag> {
    const cliResponse = flagId ? await this.cli.EditFlag(flagId, newFlag) : ({} as Flag);
    if (cliResponse.id) {
      await this.flagService.editFlag(flagId, cliResponse);
      vscode.window.showInformationMessage(`[Flagship] Flag edited successfully`);
    }
    return cliResponse;
  }

  async deleteFlag(flagId: string): Promise<boolean> {
    const cliResponse = flagId ? await this.cli.DeleteFlag(flagId) : false;
    if (cliResponse) {
      await this.flagService.deleteFlag(flagId);
      vscode.window.showInformationMessage(`[Flagship] Flag deleted successfully`);
    }
    return cliResponse;
  }
}

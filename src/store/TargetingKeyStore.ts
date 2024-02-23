import * as vscode from 'vscode';
import { TargetingKey } from '../model';
import { Cli } from '../providers/Cli';
import { TargetingKeyDataService } from '../services/TargetingKeyDataService';

export class TargetingKeyStore {
  private cli: Cli;
  private targetingKeyService;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.cli = cli;
    this.targetingKeyService = new TargetingKeyDataService(context);
  }

  loadTargetingKey(): TargetingKey[] {
    return this.targetingKeyService.getState();
  }

  async refreshTargetingKey(): Promise<TargetingKey[]> {
    const targetingKeys = await this.cli.ListTargetingKey();
    if (targetingKeys) {
      this.targetingKeyService.loadState(targetingKeys);
    }
    return targetingKeys;
  }

  async saveTargetingKey(targetingKey: TargetingKey): Promise<TargetingKey> {
    const cliResponse = await this.cli.CreateTargetingKey(targetingKey);
    if (cliResponse.id) {
      this.targetingKeyService.saveTargetingKey(cliResponse);
      vscode.window.showInformationMessage(`[Flagship] Targeting key created successfully !`);
    }
    return cliResponse;
  }

  async editTargetingKey(targetingKeyId: string, newTargetingKey: TargetingKey): Promise<TargetingKey> {
    const cliResponse = targetingKeyId
      ? await this.cli.EditTargetingKey(targetingKeyId, newTargetingKey)
      : ({} as TargetingKey);
    if (cliResponse.id) {
      this.targetingKeyService.editTargetingKey(targetingKeyId, cliResponse);
      vscode.window.showInformationMessage(`[Flagship] Targeting key edited successfully`);
    }
    return cliResponse;
  }

  async deleteTargetingKey(targetingKeyId: string): Promise<boolean> {
    const cliResponse = targetingKeyId ? await this.cli.DeleteTargetingKey(targetingKeyId) : false;
    if (cliResponse) {
      this.targetingKeyService.deleteTargetingKey(targetingKeyId);
      vscode.window.showInformationMessage(`[Flagship] Targeting key deleted successfully`);
    }
    return cliResponse;
  }
}

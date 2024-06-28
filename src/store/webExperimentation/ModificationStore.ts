import * as vscode from 'vscode';
import { Cli } from '../../cli/cmd/webExperimentation/Cli';
import { ModificationDataService } from '../../services/webExperimentation/ModificationDataService';
import { ModificationWE } from '../../model';

export class ModificationStore {
  private cli: Cli;
  private modificationService: ModificationDataService;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.cli = cli;
    this.modificationService = new ModificationDataService(context);
  }

  loadModification(campaignId: number): ModificationWE[] {
    return this.modificationService.getState();
  }

  async refreshModification(campaignId: number): Promise<ModificationWE[]> {
    const modifications = await this.cli.ListModificationWE('1161607');
    await this.modificationService.loadState(modifications);
    return modifications;
  }

  /*   async saveModification(modification: ModificationFE): Promise<ModificationFE> {
    const cliResponse = await this.cli.CreateModification(modification);
    if (cliResponse.id) {
      await this.modificationService.saveModification(cliResponse);
      vscode.window.showInformationMessage(`[AB Tasty] Modification created successfully !`);
    }
    return cliResponse;
  }
  */

  /*   async editModification(modificationId: number, newModification: ModificationFE): Promise<ModificationFE> {
    const cliResponse = modificationId
      ? await this.cli.EditModification(modificationId, newModification)
      : ({} as ModificationFE);
    if (cliResponse.id) {
      await this.modificationService.editModification(modificationId, cliResponse);
      vscode.window.showInformationMessage(`[AB Tasty] Modification edited successfully`);
    }
    return cliResponse;
  } */

  async deleteModification(modificationId: number): Promise<boolean> {
    const cliResponse = modificationId ? await this.cli.DeleteModification(String(modificationId)) : false;
    if (cliResponse) {
      await this.modificationService.deleteModification(modificationId);
      vscode.window.showInformationMessage(`[AB Tasty] Modification deleted successfully`);
    }
    return cliResponse;
  }
}

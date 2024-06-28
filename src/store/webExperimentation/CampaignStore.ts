import * as vscode from 'vscode';
import { Cli } from '../../cli/cmd/webExperimentation/Cli';
import { ModificationDataService } from '../../services/webExperimentation/ModificationDataService';
import { CampaignWE, ModificationWE } from '../../model';
import { CampaignDataService } from '../../services/webExperimentation/CampaignDataService';

export class CampaignStore {
  private cli: Cli;
  private campaignService: CampaignDataService;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.cli = cli;
    this.campaignService = new CampaignDataService(context);
  }

  loadCampaign(): CampaignWE[] {
    return this.campaignService.getState();
  }

  async refreshCampaign(): Promise<CampaignWE[]> {
    const campaigns = await this.cli.ListCampaignWE();
    await this.campaignService.loadState(campaigns);
    return campaigns;
  }

  /*   async saveCampaign(campaign: CampaignWE): Promise<CampaignWE> {
    const cliResponse = await this.cli.CreateModification(campaign);
    if (cliResponse.id) {
      await this.campaignService.saveModification(cliResponse);
      vscode.window.showInformationMessage(`[AB Tasty] Campaign created successfully !`);
    }
    return cliResponse;
  }

  async editModification(modificationId: number, newModification: CampaignWE): Promise<CampaignWE> {
    const cliResponse = modificationId
      ? await this.cli.EditModification(modificationId, newModification)
      : ({} as CampaignWE);
    if (cliResponse.id) {
      await this.campaignService.editModification(modificationId, cliResponse);
      vscode.window.showInformationMessage(`[AB Tasty] Campaign edited successfully`);
    }
    return cliResponse;
  } */

  async deleteCampaign(campaignId: number): Promise<boolean> {
    const cliResponse = campaignId ? await this.cli.DeleteCampaignWE(String(campaignId)) : false;
    if (cliResponse) {
      await this.campaignService.deleteCampaign(campaignId);
      vscode.window.showInformationMessage(`[AB Tasty] Campaign deleted successfully`);
    }
    return cliResponse;
  }
}

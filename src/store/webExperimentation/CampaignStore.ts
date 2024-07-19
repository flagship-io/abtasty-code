import * as vscode from 'vscode';
import { Cli } from '../../cli/cmd/webExperimentation/Cli';
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

  async pullCampaignGlobalCode(
    campaignId: string,
    createFile?: boolean,
    override?: boolean,
    subFiles?: boolean,
  ): Promise<any> {
    const cliResponse = campaignId
      ? await this.cli.PullCampaignGlobalCode(campaignId, createFile, override, subFiles)
      : false;
    if (cliResponse) {
      vscode.window.showInformationMessage(`[AB Tasty] Campaign global code pulled successfully`);
    }
    return cliResponse;
  }

  async pushCampaignGlobalCode(campaignId: string, filepath?: string, code?: string): Promise<any> {
    const cliResponse = campaignId ? await this.cli.PushCampaignGlobalCode(campaignId, filepath, code) : false;
    if (cliResponse) {
      vscode.window.showInformationMessage(`[AB Tasty] Campaign global code pushed successfully`);
    }
    return cliResponse;
  }

  async pullVariationGlobalCodeJS(
    variationId: string,
    campaignId: string,
    createFile?: boolean,
    override?: boolean,
    subFiles?: boolean,
  ): Promise<any> {
    const cliResponse =
      campaignId && variationId
        ? await this.cli.PullVariationGlobalCodeJS(variationId, campaignId, createFile, override, subFiles)
        : false;
    if (cliResponse) {
      vscode.window.showInformationMessage(`[AB Tasty] Variation global code JS pulled successfully`);
    }
    return cliResponse;
  }

  async pushVariationGlobalCodeJS(
    variationId: string,
    campaignId: string,
    filepath?: string,
    code?: string,
  ): Promise<any> {
    console.log(variationId);
    const cliResponse = campaignId
      ? await this.cli.PushVariationGlobalCodeJS(variationId, campaignId, filepath, code)
      : false;
    if (cliResponse) {
      vscode.window.showInformationMessage(`[AB Tasty] Variation global code JS pushed successfully`);
    }
    return cliResponse;
  }

  async pullVariationGlobalCodeCSS(
    variationId: string,
    campaignId: string,
    createFile?: boolean,
    override?: boolean,
    subFiles?: boolean,
  ): Promise<any> {
    const cliResponse =
      campaignId && variationId
        ? await this.cli.PullVariationGlobalCodeCSS(variationId, campaignId, createFile, override, subFiles)
        : false;
    if (cliResponse) {
      vscode.window.showInformationMessage(`[AB Tasty] Variation global code CSS pulled successfully`);
    }
    return cliResponse;
  }

  async pushVariationGlobalCodeCSS(
    variationId: string,
    campaignId: string,
    filepath?: string,
    code?: string,
  ): Promise<any> {
    const cliResponse = campaignId
      ? await this.cli.PushVariationGlobalCodeCSS(variationId, campaignId, filepath, code)
      : false;
    if (cliResponse) {
      vscode.window.showInformationMessage(`[AB Tasty] Variation global code CSS pushed successfully`);
    }
    return cliResponse;
  }
}

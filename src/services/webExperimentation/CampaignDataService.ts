import * as vscode from 'vscode';
import { GLOBAL_LIST_CAMPAIGN_WE } from './const';
import { CampaignWE } from '../../model';

export class CampaignDataService {
  private context: vscode.ExtensionContext;
  private campaignList: CampaignWE[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.campaignList = this.context.globalState.get(GLOBAL_LIST_CAMPAIGN_WE) || [];
  }

  getState(): CampaignWE[] {
    return this.campaignList;
  }

  async loadState(state: CampaignWE[]) {
    this.campaignList = state;
    await this.context.globalState.update(GLOBAL_LIST_CAMPAIGN_WE, this.campaignList);
  }

  async saveCampaign(campaign: CampaignWE) {
    const newCampaigns = [...this.campaignList, campaign];
    await this.loadState(newCampaigns);
  }

  async editCampaign(campaignId: number, newCampaign: CampaignWE) {
    const oldCampaigns = this.campaignList.filter((c) => campaignId !== c.id);
    const newCampaigns = [...oldCampaigns, newCampaign];
    await this.loadState(newCampaigns);
  }

  async deleteCampaign(campaignId: number) {
    const newCampaigns = this.campaignList.filter((m) => campaignId !== m.id);
    await this.loadState(newCampaigns);
  }
}

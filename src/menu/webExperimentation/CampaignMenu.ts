import * as vscode from 'vscode';
import { CampaignItem } from '../../providers/webExperimentation/CampaignList';
import { CampaignStore } from '../../store/webExperimentation/CampaignStore';

export async function deleteCampaignInputBox(campaign: CampaignItem, campaignStore: CampaignStore) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the campaign ${campaign.label}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    const campaignId = Number(campaign.id!);
    await campaignStore.deleteCampaign(campaignId);
    return;
  }
  return;
}

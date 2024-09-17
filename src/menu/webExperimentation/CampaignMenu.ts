import * as vscode from 'vscode';
import * as path from 'path';
import { CampaignWEItem } from '../../providers/webExperimentation/CampaignList';
import { CampaignStore } from '../../store/webExperimentation/CampaignStore';

export async function deleteCampaignInputBox(campaign: CampaignWEItem, campaignStore: CampaignStore) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the campaign ${campaign.label}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    const campaignId = campaign.resourceId!;
    await campaignStore.deleteCampaign(campaignId);
    return;
  }
  return;
}

export async function pullCampaignGlobalOperationInputBox(campaign: CampaignWEItem, campaignStore: CampaignStore) {
  const picked = await vscode.window.showQuickPick(
    [
      'Pull the code in a file',
      'Create a file containing the code in your workspace',
      'Create all sub files for modification code in your workspace',
    ],
    {
      title: `Choose pull operation for ${campaign.label}`,
      placeHolder: 'Choose pull operation',
      ignoreFocusOut: true,
    },
  );

  if (picked === 'Pull the code in a file') {
    const code = await campaignStore.pullCampaignGlobalCode(campaign.id!);
    const document = await vscode.workspace.openTextDocument({ content: code, language: 'javascript' });
    await vscode.window.showTextDocument(document);
    return;
  }

  if (picked === 'Create a file containing the code in your workspace') {
    const confirmationPick = await vscode.window.showQuickPick(['yes', 'no'], {
      title: `Override the existing campaign global code for ${campaign.label}`,
      placeHolder: 'Do you confirm ?',
      ignoreFocusOut: true,
    });
    if (confirmationPick === 'yes') {
      await campaignStore.pullCampaignGlobalCode(campaign.id!, true, true);
      vscode.window.showInformationMessage(`[AB Tasty] File created and override! Check your workspace`);
      return;
    }

    await campaignStore.pullCampaignGlobalCode(campaign.id!, true, false);
    vscode.window.showInformationMessage(`[AB Tasty] File created! Check your workspace`);
    return;
  }

  if (picked === 'Create all sub files for modification code in your workspace') {
    const confirmationPick = await vscode.window.showQuickPick(['yes', 'no'], {
      title: `Override the existing campaign global code for ${campaign.label}`,
      placeHolder: 'Do you confirm ?',
      ignoreFocusOut: true,
    });
    if (confirmationPick === 'yes') {
      await campaignStore.pullCampaignGlobalCode(campaign.id!, false, true, true);
      vscode.window.showInformationMessage(`[AB Tasty] File and sub files created and override! Check your workspace`);
      return;
    }

    await campaignStore.pullCampaignGlobalCode(campaign.id!, false, false, true);
    vscode.window.showInformationMessage(`[AB Tasty] File created! Check your workspace`);
    return;
  }

  return;
}

export async function pushCampaignGlobalCodeOperationInputBox(campaign: CampaignWEItem, campaignStore: CampaignStore) {
  const uriFile = await vscode.window.showOpenDialog({
    defaultUri: vscode.workspace.workspaceFolders?.[0].uri,
    title: 'Select Configuration file',
    filters: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Javascript: ['js'],
    },
    canSelectFolders: false,
    canSelectFiles: true,
    canSelectMany: false,
  });

  if (uriFile) {
    const uri = vscode.workspace.workspaceFolders?.[0].uri;
    const pathConfig =
      process.platform.toString() === 'win32'
        ? path.resolve(uri!.path, uriFile![0].path).replace(/\\/g, '/').replace('C:/', '')
        : uriFile![0].path;

    await campaignStore.pushCampaignGlobalCode(campaign.id!, pathConfig);
  }
  return;
}

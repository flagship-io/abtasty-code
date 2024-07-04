import * as vscode from 'vscode';
import { ModificationItem } from '../../providers/webExperimentation/ModificationList';
import { ModificationStore } from '../../store/webExperimentation/ModificationStore';

export async function deleteModificationInputBox(modification: ModificationItem, modificationStore: ModificationStore) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the modification ${modification.label}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    const modificationId = Number(modification.id!);
    const campaignId = Number(modification.campaignId!);
    await modificationStore.deleteModification(modificationId, campaignId);
    return;
  }
  return;
}

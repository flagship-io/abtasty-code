import * as vscode from 'vscode';
import { VariationStore } from '../../store/webExperimentation/VariationStore';
import { VariationItem } from '../../providers/webExperimentation/VariationList';

export async function deleteVariationInputBox(variation: VariationItem, variationStore: VariationStore) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the variation ${variation.label}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    const variationId = Number(variation.id!);
    const campaignId = Number(variation.campaignId!);
    await variationStore.deleteVariation(variationId, campaignId);
    return;
  }
  return;
}

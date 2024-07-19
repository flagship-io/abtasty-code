import * as vscode from 'vscode';
import { VariationItem } from '../../providers/webExperimentation/VariationList';
import { Cli } from '../../cli/cmd/webExperimentation/Cli';

export async function deleteVariationInputBox(variation: VariationItem, cli: Cli) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the variation ${variation.label}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    await cli.DeleteVariationWE(variation.id!, String(variation.campaignId!));
    return;
  }
  return;
}

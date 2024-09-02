import * as vscode from 'vscode';

import { Cli } from '../../cli/cmd/webExperimentation/Cli';
import { VariationWEItem } from '../../providers/webExperimentation/CampaignList';

export async function deleteVariationInputBox(variation: VariationWEItem, cli: Cli) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the variation ${variation.label}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    await cli.DeleteVariationWE(variation.id!, String(variation.parent.id!));
    return;
  }
  return;
}

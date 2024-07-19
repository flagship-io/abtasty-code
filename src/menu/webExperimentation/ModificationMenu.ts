import * as vscode from 'vscode';
import { ModificationItem } from '../../providers/webExperimentation/ModificationList';
import { Cli } from '../../cli/cmd/webExperimentation/Cli';

export async function deleteModificationInputBox(modification: ModificationItem, cli: Cli) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the modification ${modification.label}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    await cli.DeleteModification(modification.id!, String(modification.campaignId!));
    return;
  }
  return;
}

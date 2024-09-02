import * as vscode from 'vscode';
import { Cli } from '../../cli/cmd/webExperimentation/Cli';
import { ModificationWEItem, ModificationWETree } from '../../providers/webExperimentation/CampaignList';
import { WEB_EXPERIMENTATION_MODIFICATION_REFRESH_MODIFICATION } from '../../commands/const';
import { MultiStepInput } from '../../multipleStepInput';

export async function deleteModificationInputBox(modification: ModificationWEItem, cli: Cli) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the modification ${modification.label}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });

  if (picked === 'yes') {
    const deleted = await cli.DeleteModification(String(modification.resourceId!), String(modification.parent!));
    if (deleted) {
      vscode.window.showInformationMessage(`[AB Tasty] Modification deleted successfully`);
      await vscode.commands.executeCommand(
        WEB_EXPERIMENTATION_MODIFICATION_REFRESH_MODIFICATION,
        modification.modificationTree,
      );
    }

    return;
  }
  return;
}

export async function addModificationInputBox(resource: ModificationWETree, cli: Cli) {
  const modif = { name: '', selector: '' };
  await MultiStepInput.run((input) => inputModification(input, modif));

  if (modif.name && modif.selector) {
    const created = await cli.CreateModification(
      modif.name!,
      modif.selector!,
      resource.parent.parent.id,
      resource.parent.id,
    );
    if (created) {
      vscode.window.showInformationMessage(`[AB Tasty] Modification created successfully`);
      await vscode.commands.executeCommand(WEB_EXPERIMENTATION_MODIFICATION_REFRESH_MODIFICATION, resource);
    }
    return;
  }

  return;
}

async function inputModification(input: MultiStepInput, modif: any) {
  modif.name = 'Element JS';
  modif.selector = await input.showInputBox({
    title: 'Modification selector',
    placeholder: 'Modification selector',
    step: 1,
    totalSteps: 1,
    shouldResume,
    value: '',
    ignoreFocusOut: true,
    prompt: 'Enter your modification selector',
    validate: (value) => validateCredentials(value),
  });
}

function shouldResume() {
  return new Promise<boolean>(() => {});
}

async function validateCredentials(value: string) {
  if (value === '') {
    return 'Insert value';
  }
}

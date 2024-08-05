import * as vscode from 'vscode';
import { MultiStepInput } from '../../multipleStepInput';
import { TargetingKeyItem } from '../../providers/featureExperimentation/TargetingKeyList';
import { TargetingKeyStore } from '../../store/featureExperimentation/TargetingKeyStore';
import { TargetingKey } from '../../model';

interface TargetingKeySchema {
  name: string;
  type: vscode.QuickPickItem;
  description: string;
}

const targetingKeyTypes: vscode.QuickPickItem[] = ['string', 'boolean', 'number'].map((label) => ({
  label,
}));

export async function targetingKeyInputBox(targetingKey: TargetingKeyItem, targetingKeyStore: TargetingKeyStore) {
  const targetingKeyData = {} as Partial<TargetingKeySchema>;

  let title = 'Create Targeting key';

  if (targetingKey.id) {
    title = 'Edit Targeting key';
    targetingKeyData.name = targetingKey.name;
    targetingKeyData.description = targetingKey.targetingKeyDescription;
  }

  async function collectInputs() {
    await MultiStepInput.run((input) => targetingKeyName(input));
  }

  async function targetingKeyName(input: MultiStepInput) {
    targetingKeyData.name = await input.showInputBox({
      title,
      step: 1,
      totalSteps: 3,
      value: targetingKeyData.name!,
      ignoreFocusOut: true,
      prompt: 'Enter your targeting key name',
      placeholder: 'Targeting key name',
      validate: (value: string) => validateTargetingKeyName(value),
      shouldResume: shouldResume,
    });
    return (input: MultiStepInput) => targetingKeyType(input);
  }

  async function targetingKeyType(input: MultiStepInput) {
    targetingKeyData.type = await input.showQuickPick({
      title,
      step: 2,
      totalSteps: 3,
      placeholder: 'Choose a type',
      ignoreFocusOut: true,
      items: targetingKeyTypes,
      activeItem: targetingKeyTypes[0],
      shouldResume: shouldResume,
    });
    return (input: MultiStepInput) => targetingKeyDescription(input);
  }

  async function targetingKeyDescription(input: MultiStepInput) {
    targetingKeyData.description = await input.showInputBox({
      title,
      step: 3,
      totalSteps: 3,
      value: targetingKeyData.description!,
      ignoreFocusOut: true,
      placeholder: 'Targeting key description',
      prompt: 'Enter your targeting key description',
      validate: (value: string) => validateTargetingKey(value),
      shouldResume: shouldResume,
    });
  }

  function shouldResume() {
    return new Promise<boolean>(() => {});
  }

  async function validateTargetingKeyName(value: string) {
    if (value === '' || value.match(/[^\w\-]+/g)) {
      return 'Invalid name.';
    }
  }

  async function validateTargetingKey(value: string) {
    if (value === '' || value.match(/[\'\"]+/g)) {
      return 'Invalid information.';
    }
  }

  await collectInputs();

  const { name, type, description } = targetingKeyData;

  if (name && type && description) {
    if (targetingKey.id) {
      const targetingKeyEdited = await targetingKeyStore.editTargetingKey(targetingKey.id!, {
        name,
        type: type.label,
        description,
      } as TargetingKey);

      if (!targetingKeyEdited.id) {
        vscode.window.showErrorMessage(`[AB Tasty] Targeting Key not edited`);
        return;
      }
      return;
    }

    const targetingKeyCreated = await targetingKeyStore.saveTargetingKey({
      name,
      type: type.label,
      description,
    } as TargetingKey);

    if (!targetingKeyCreated.id) {
      vscode.window.showErrorMessage(`[AB Tasty] Targeting key not created`);
      return;
    }
    return;
  }
  vscode.window.showErrorMessage(`[AB Tasty] Targeting key not created`);
}

export async function deleteTargetingKeyInputBox(targetingKey: TargetingKeyItem, targetingKeyStore: TargetingKeyStore) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the targeting key ${targetingKey.name}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    await targetingKeyStore.deleteTargetingKey(targetingKey.id!);
    return;
  }
  return;
}

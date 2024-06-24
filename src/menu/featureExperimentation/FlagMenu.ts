/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { MultiStepInput } from '../../multipleStepInput';
import { FlagItem } from '../../providers/featureExperimentation/FlagList';
import { FlagStore } from '../../store/featureExperimentation/FlagStore';
import { Flag } from '../../model';

interface FlagSchema {
  name: string;
  type: vscode.QuickPickItem;
  description: string;
  defaultValue: any;
}

const flagTypes: vscode.QuickPickItem[] = ['string', 'boolean', 'number', 'array', 'object'].map((label) => ({
  label,
}));

export async function flagInputBox(flag: FlagItem, flagStore: FlagStore) {
  let flagData = {} as Partial<FlagSchema>;

  let title = 'Create Flag';

  if (flag.key && flag.key !== '[object Object]') {
    flagData.name = flag.key;
  }

  if (flag.id) {
    title = 'Edit Flag';
    flagData.name = flag.key;
    flagData.description = flag.flagDescription;
    flagData.defaultValue = flag.defaultValue;
  }

  async function collectInputs() {
    await MultiStepInput.run((input) => flagName(input));
  }

  async function flagName(input: MultiStepInput) {
    flagData.name = await input.showInputBox({
      title,
      step: 1,
      totalSteps: flag.id ? 3 : 4,
      value: flagData.name!,
      ignoreFocusOut: true,
      prompt: 'Enter your flag name',
      placeholder: 'Flag name',
      validate: (value: string) => validateFlagName(value),
      shouldResume: shouldResume,
    });
    if (flag.id) {
      return (input: MultiStepInput) => flagDescription(input);
    }
    return (input: MultiStepInput) => flagType(input);
  }

  async function flagType(input: MultiStepInput) {
    flagData.type = await input.showQuickPick({
      title,
      step: 2,
      totalSteps: 4,
      placeholder: 'Choose a type',
      items: flagTypes,
      ignoreFocusOut: true,
      activeItem: flagTypes[0],
      shouldResume: shouldResume,
    });
    return (input: MultiStepInput) => flagDescription(input);
  }

  async function flagDescription(input: MultiStepInput) {
    flagData.description = await input.showInputBox({
      title,
      step: flag.id || flag.type === 'boolean' ? 2 : 3,
      totalSteps: flagData.type?.label === 'boolean' || flag.id ? 3 : 4,
      value: flagData.description!,
      prompt: 'Enter your flag description',
      ignoreFocusOut: true,
      placeholder: 'Flag description',
      validate: (value: string) => validateFlagDescription(value),
      shouldResume: shouldResume,
    });
    if (flagData.type?.label === 'boolean' || flag?.type === 'boolean') {
      flagData.defaultValue = 'not used';
      return;
    }
    return (input: MultiStepInput) => flagDefaultValue(input);
  }

  async function flagDefaultValue(input: MultiStepInput) {
    const defaultValue = await input.showInputBox({
      title,
      step: flag.id ? 3 : 4,
      totalSteps: flag.id ? 3 : 4,
      value: flagData.defaultValue,
      prompt: 'Enter your flag default value',
      placeholder: 'Flag default value',
      ignoreFocusOut: true,
      validate: (value: any) => validateFlagDefaultValue(value, flagData.type?.label!),
      shouldResume: shouldResume,
    });

    switch (flagData.type?.label) {
      case 'number':
        flagData.defaultValue = defaultValue as unknown as number;
        break;
      case 'boolean':
        flagData.defaultValue = defaultValue as unknown as boolean;
        break;
      default:
        flagData.defaultValue = defaultValue;
        break;
    }
  }

  function shouldResume() {
    return new Promise<boolean>((resolve, reject) => {});
  }

  async function validateFlagName(value: string) {
    if (value === '' || value.match(/[^\w\-]+/g)) {
      return 'Invalid name.';
    }
  }

  async function validateFlagDescription(value: string) {
    if (value === '' || value.match(/[\'\"]+/g)) {
      return 'Invalid information.';
    }
  }

  async function validateFlagDefaultValue(defaultValue: string, type: string) {
    if (defaultValue === '' || defaultValue.match(/[\'\"]+/g)) {
      return 'Invalid information.';
    }
    switch (type) {
      case 'number':
        if (!defaultValue.match(/^\d+$/g)) {
          return `Invalid default value, flag is type: ${type}.`;
        }
        break;
    }
  }

  await collectInputs();

  const { name, type, defaultValue, description } = flagData;

  if (name && description && defaultValue) {
    if (flag.id) {
      const flagEdited = await flagStore.editFlag(flag.id!, {
        name,
        description,
        type: flag.type!,
        default_value: defaultValue,
      } as Flag);

      if (!flagEdited.id) {
        vscode.window.showErrorMessage(`[AB Tasty] Flag not edited`);
        return;
      }
      return;
    }

    const flagCreated = await flagStore.saveFlag({
      name,
      type: type!.label,
      description,
      default_value: defaultValue,
    } as Flag);

    if (!flagCreated.id) {
      vscode.window.showErrorMessage(`[AB Tasty] Flag not created`);
      return;
    }
    return;
  }
  vscode.window.showErrorMessage(`[AB Tasty] Flag not created`);
}

export async function deleteFlagInputBox(flag: FlagItem, flagStore: FlagStore) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the flag ${flag.key}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    await flagStore.deleteFlag(flag.id!);
    return;
  }
  return;
}

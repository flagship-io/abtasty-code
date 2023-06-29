import * as vscode from 'vscode';
import { MultiStepInput } from '../multipleStepInput';
import { Cli } from '../providers/Cli';
import { GoalItem } from '../providers/GoalList';

interface GoalSchema {
  label: string;
  type: vscode.QuickPickItem;
  operator: vscode.QuickPickItem;
  value: string;
}

const goalTypes: vscode.QuickPickItem[] = ['transaction', 'event', 'pageview', 'screenview'].map((label) => ({
  label,
}));

const goalOperators: vscode.QuickPickItem[] = ['contains', 'ignoringParameters', 'exact', 'regexp'].map((label) => ({
  label,
}));

export async function goalInputBox(context: vscode.ExtensionContext, goal: GoalItem, cli: Cli) {
  const goalData = {} as Partial<GoalSchema>;

  const title = 'Create Goal';

  if (goal.id) {
    goalData.label = goal.label;
  }

  async function collectInputs() {
    await MultiStepInput.run((input) => goalName(input));
  }

  async function goalName(input: MultiStepInput) {
    goalData.label = await input.showInputBox({
      title,
      step: 1,
      totalSteps: 2,
      value: goalData.label!,
      ignoreFocusOut: true,
      placeholder: 'Goal label',
      prompt: 'Enter your goal label',
      validate: (value: string) => validateGoalLabel(value),
      shouldResume: shouldResume,
    });
    if (goal.id && (goal.type === 'event' || goal.type === 'transaction')) {
      return;
    }
    if (goal.id) {
      return (input: MultiStepInput) => goalOperator(input);
    }

    return (input: MultiStepInput) => goalType(input);
  }

  async function goalType(input: MultiStepInput) {
    goalData.type = await input.showQuickPick({
      title,
      step: 2,
      totalSteps: 2,
      placeholder: 'Choose a type',
      ignoreFocusOut: true,
      items: goalTypes,
      activeItem: goalTypes[0],
      shouldResume: shouldResume,
    });
    if (goalData.type.label === 'transaction' || goalData.type.label === 'event') {
      return;
    }
    return (input: MultiStepInput) => goalOperator(input);
  }

  async function goalOperator(input: MultiStepInput) {
    goalData.operator = await input.showQuickPick({
      title,
      step: 3,
      totalSteps: 4,
      placeholder: 'Choose an operator',
      ignoreFocusOut: true,
      items: goalOperators,
      activeItem: goalOperators[0],
      shouldResume: shouldResume,
    });
    return (input: MultiStepInput) => goalValue(input);
  }

  async function goalValue(input: MultiStepInput) {
    goalData.value = await input.showInputBox({
      title,
      step: 4,
      totalSteps: 4,
      value: goalData.value!,
      ignoreFocusOut: true,
      placeholder: 'Goal value',
      prompt: 'Enter your goal value',
      validate: (value: string) => validateGoal(value),
      shouldResume: shouldResume,
    });
  }

  function shouldResume() {
    return new Promise<boolean>(() => {});
  }

  async function validateGoalLabel(value: string) {
    if (value === '' || value.match(/[^\w\-]+/g)) {
      return 'Invalid label.';
    }
  }

  async function validateGoal(value: string) {
    if (value === '' || value.match(/[\'\"]+/g)) {
      return 'Invalid information.';
    }
  }

  await collectInputs();

  const { label, type, operator, value } = goalData;

  if (label) {
    if (goal.id) {
      const goalEdited = await cli.EditGoal(goal.id, label, operator?.label, value);
      if (goalEdited.id) {
        vscode.window.showInformationMessage(`[Flagship] Goal edited successfully`);
        return;
      }
      vscode.window.showErrorMessage(`[Flagship] Goal not edited`);
      return;
    }
    const goalCreated = await cli.CreateGoal(label, type!.label, operator?.label, value);
    if (goalCreated.id) {
      vscode.window.showInformationMessage(`[Flagship] Goal created successfully`);
      return;
    }
    vscode.window.showErrorMessage(`[Flagship] Goal not created`);
    return;
  }
  vscode.window.showInformationMessage(`[Flagship] Goal not created`);
}

export async function deleteGoalBox(context: vscode.ExtensionContext, goal: GoalItem, cli: Cli) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the goal ${goal.label}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    await cli.DeleteGoal(goal.id!);
    vscode.window.showInformationMessage(`[Flagship] Goal ${goal.label} deleted successfully.`);
    return;
  }
  return;
}

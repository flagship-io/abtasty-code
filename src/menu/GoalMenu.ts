import * as vscode from 'vscode';
import { MultiStepInput } from '../multipleStepInput';
import { GoalItem } from '../providers/GoalList';
import { GoalStore } from '../store/GoalStore';
import { Goal } from '../model';

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

export async function goalInputBox(goal: GoalItem, goalStore: GoalStore) {
  const goalData = {} as Partial<GoalSchema>;

  let title = 'Create Goal';

  if (goal.id) {
    title = 'Edit Goal';
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
      const goalEdited = await goalStore.editGoal(goal.id!, { label, operator: operator?.label, value } as Goal);

      if (!goalEdited.id) {
        vscode.window.showErrorMessage(`[Flagship] Goal not edited`);
        return;
      }
      return;
    }

    const goalCreated = await goalStore.saveGoal({
      label,
      type: type!.label,
      operator: operator?.label,
      value,
    } as Goal);

    if (!goalCreated.id) {
      vscode.window.showErrorMessage(`[Flagship] Goal not created`);
      return;
    }
    return;
  }
  vscode.window.showInformationMessage(`[Flagship] Goal not created`);
}

export async function deleteGoalInputBox(goal: GoalItem, goalStore: GoalStore) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the goal ${goal.label}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    await goalStore.deleteGoal(goal.id!);
    return;
  }
  return;
}

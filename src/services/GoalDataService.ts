import * as vscode from 'vscode';
import { Goal } from '../model';
import { GLOBAL_LIST_GOAL } from './const';

export class GoalDataService {
  private context: vscode.ExtensionContext;
  private goalList: Goal[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.goalList = this.context.globalState.get(GLOBAL_LIST_GOAL)!;
  }

  getState(): Goal[] {
    return this.goalList;
  }

  loadState(state: Goal[]) {
    this.goalList = state;
    this.context.globalState.update(GLOBAL_LIST_GOAL, this.goalList);
  }

  saveGoal(goal: Goal) {
    const newGoals = [...this.goalList, goal];
    this.loadState(newGoals);
  }

  editGoal(goalId: string, newGoal: Goal) {
    const oldGoals = this.goalList.filter((g) => goalId !== g.id);
    const newGoals = [...oldGoals, newGoal];
    this.loadState(newGoals);
  }

  deleteGoal(goalId: string) {
    const newGoals = this.goalList.filter((g) => goalId !== g.id);
    this.loadState(newGoals);
  }
}

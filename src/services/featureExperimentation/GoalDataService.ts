import * as vscode from 'vscode';
import { GLOBAL_LIST_GOAL } from './const';
import { Goal } from '../../model';

export class GoalDataService {
  private context: vscode.ExtensionContext;
  private goalList: Goal[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.goalList = this.context.globalState.get(GLOBAL_LIST_GOAL) || [];
  }

  getState(): Goal[] {
    return this.goalList;
  }

  async loadState(state: Goal[]) {
    this.goalList = state;
    await this.context.globalState.update(GLOBAL_LIST_GOAL, this.goalList);
  }

  async saveGoal(goal: Goal) {
    const newGoals = [...this.goalList, goal];
    await this.loadState(newGoals);
  }

  async editGoal(goalId: string, newGoal: Goal) {
    const oldGoals = this.goalList.filter((g) => goalId !== g.id);
    const newGoals = [...oldGoals, newGoal];
    await this.loadState(newGoals);
  }

  async deleteGoal(goalId: string) {
    const newGoals = this.goalList.filter((g) => goalId !== g.id);
    await this.loadState(newGoals);
  }
}

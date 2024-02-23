import * as vscode from 'vscode';
import { Goal } from '../model';
import { Cli } from '../providers/Cli';
import { GoalDataService } from '../services/GoalDataService';

export class GoalStore {
  private cli: Cli;
  private goalService;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.cli = cli;
    this.goalService = new GoalDataService(context);
  }

  loadGoal(): Goal[] {
    return this.goalService.getState();
  }

  async refreshGoal(): Promise<Goal[]> {
    const goals = await this.cli.ListGoal();
    if (goals) {
      this.goalService.loadState(goals);
    }
    return goals;
  }

  async saveGoal(goal: Goal): Promise<Goal> {
    const cliResponse = await this.cli.CreateGoal(goal);
    if (cliResponse.id) {
      this.goalService.saveGoal(cliResponse);
      vscode.window.showInformationMessage(`[Flagship] Goal created successfully !`);
    }
    return cliResponse;
  }

  async editGoal(goalId: string, newGoal: Goal): Promise<Goal> {
    const cliResponse = goalId ? await this.cli.EditGoal(goalId, newGoal) : ({} as Goal);
    if (cliResponse.id) {
      this.goalService.editGoal(goalId, cliResponse);
      vscode.window.showInformationMessage(`[Flagship] Goal edited successfully`);
    }
    return cliResponse;
  }

  async deleteGoal(goalId: string): Promise<boolean> {
    const cliResponse = goalId ? await this.cli.DeleteGoal(goalId) : false;
    if (cliResponse) {
      this.goalService.deleteGoal(goalId);
      vscode.window.showInformationMessage(`[Flagship] Goal deleted successfully`);
    }
    return cliResponse;
  }
}

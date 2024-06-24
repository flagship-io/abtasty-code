import * as vscode from 'vscode';
import { Goal } from '../../model';
import { Cli } from '../../providers/Cli';
import { GoalDataService } from '../../services/featureExperimentation/GoalDataService';

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
    await this.goalService.loadState(goals);
    return goals;
  }

  async saveGoal(goal: Goal): Promise<Goal> {
    const cliResponse = await this.cli.CreateGoal(goal);
    if (cliResponse.id) {
      await this.goalService.saveGoal(cliResponse);
      vscode.window.showInformationMessage(`[AB Tasty] Goal created successfully !`);
    }
    return cliResponse;
  }

  async editGoal(goalId: string, newGoal: Goal): Promise<Goal> {
    const cliResponse = goalId ? await this.cli.EditGoal(goalId, newGoal) : ({} as Goal);
    if (cliResponse.id) {
      await this.goalService.editGoal(goalId, cliResponse);
      vscode.window.showInformationMessage(`[AB Tasty] Goal edited successfully`);
    }
    return cliResponse;
  }

  async deleteGoal(goalId: string): Promise<boolean> {
    const cliResponse = goalId ? await this.cli.DeleteGoal(goalId) : false;
    if (cliResponse) {
      await this.goalService.deleteGoal(goalId);
      vscode.window.showInformationMessage(`[AB Tasty] Goal deleted successfully`);
    }
    return cliResponse;
  }
}

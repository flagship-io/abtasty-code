import * as vscode from 'vscode';
import { GOAL_LIST_REFRESH } from '../commands/const';
import { CURRENT_CONFIGURATION, PERMISSION_DENIED_PANEL } from '../const';
import { ROCKET } from '../icons';
import { CredentialStore, ItemResource } from '../model';
import { Cli } from './Cli';

export class GoalListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _goals: GoalItem[] = [];
  private cli: Cli;

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private context: vscode.ExtensionContext, cli: Cli) {
    vscode.commands.registerCommand(GOAL_LIST_REFRESH, async () => await this.refresh());
    this.cli = cli;
  }

  async refresh() {
    this._goals = [];
    const { scope } = this.context.globalState.get(CURRENT_CONFIGURATION) as CredentialStore;
    if (scope?.includes('goal.list')) {
      await this.getGoals();
    }
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    const { scope } = this.context.globalState.get(CURRENT_CONFIGURATION) as CredentialStore;
    if (!scope?.includes('goal.list')) {
      return [new vscode.TreeItem(PERMISSION_DENIED_PANEL)];
    }

    if (this._goals.length === 0) {
      const noGoal = new vscode.TreeItem('No Goal found');
      return [noGoal];
    }

    if (typeof element === 'undefined') {
      return this._goals;
    }

    Object.entries(this._goals.find((f) => f === element)!).forEach(([k, v]) => {
      if (k === 'id' || k === 'label' || k === 'type' || k === 'operator' || k === 'value') {
        if (v !== undefined && v !== '') {
          items.push(this.getGoalInfo(k, v));
        }
      }
    });

    return items;
  }

  private async getGoals() {
    const goalList = await this.cli.ListGoal();
    goalList.map((g) => {
      const goal = new GoalItem(g.id, g.label, g.type, g.operator, g.value, vscode.TreeItemCollapsibleState.Collapsed);
      this._goals.push(goal);
    });
  }

  private getGoalInfo(label: string, labelValue: string): vscode.TreeItem {
    return new ItemResource(label, labelValue);
  }
}

export class GoalItem extends vscode.TreeItem {
  constructor(
    public readonly id?: string,
    public readonly label?: string,
    public readonly type?: string,
    public readonly operator?: string,
    public readonly value?: string,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
  ) {
    super(label!, collapsibleState);
    this.tooltip = `Type: ${this.type}`;
    this.description = type;
  }
  iconPath = ROCKET;

  contextValue = 'goalItem';
}

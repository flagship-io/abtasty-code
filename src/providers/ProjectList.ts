import * as vscode from 'vscode';
import * as path from 'path';
import { Cli } from './Cli';
import { ItemResource } from '../model';
import { FOLDER } from '../icons';
import { PROJECT_LIST_REFRESH } from '../commands/const';

export class ProjectListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _projects: ProjectItem[] = [];
  private cli: Cli;

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private context: vscode.ExtensionContext, cli: Cli) {
    vscode.commands.registerCommand(PROJECT_LIST_REFRESH, async () => await this.refresh());
    this.cli = cli;
  }

  async refresh() {
    this._projects = [];
    await this.getProjects();
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];

    if (this._projects.length === 0) {
      const noProject = new vscode.TreeItem('No Project found');
      return [noProject];
    }

    if (typeof element === 'undefined') {
      return this._projects;
    }

    Object.entries(this._projects.find((f) => f === element)!).forEach(([k, v]) => {
      if (k === 'id' || k === 'name') {
        items.push(this.getProjectInfo(k, v));
      }
    });

    return items;
  }

  private async getProjects() {
    const projectList = await this.cli.ListProject();
    projectList.map((p) => {
      const project = new ProjectItem(p.id, p.name, vscode.TreeItemCollapsibleState.Collapsed);
      this._projects.push(project);
    });
  }

  private getProjectInfo(label: string, labelValue: string): vscode.TreeItem {
    return new ItemResource(label, labelValue);
  }
}

export class ProjectItem extends vscode.TreeItem {
  constructor(
    public readonly id?: string,
    public readonly name?: string,
    public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
  ) {
    super(name!, collapsibleState);
    this.tooltip = `Name: ${this.name}`;
  }
  iconPath = FOLDER;

  contextValue = 'projectItem';
}

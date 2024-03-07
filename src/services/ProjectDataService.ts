import * as vscode from 'vscode';
import { Project } from '../model';
import { GLOBAL_LIST_PROJECT } from './const';

export class ProjectDataService {
  private context: vscode.ExtensionContext;
  private projectList: Project[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.projectList = this.context.globalState.get(GLOBAL_LIST_PROJECT)!;
  }

  getState(): Project[] {
    return this.projectList;
  }

  async loadState(state: Project[]) {
    this.projectList = state;
    await this.context.globalState.update(GLOBAL_LIST_PROJECT, this.projectList);
  }

  async saveProject(project: Project) {
    const newProjects = [...this.projectList, project];
    await this.loadState(newProjects);
  }

  async editProject(projectId: string, newProject: Project) {
    const project = this.projectList.find((p) => projectId === p.id);
    const oldProjects = this.projectList.filter((p) => projectId !== p.id);
    newProject.campaigns = project!.campaigns;
    const newProjects = [...oldProjects, newProject];
    await this.loadState(newProjects);
  }

  async deleteProject(projectId: string) {
    const newProjects = this.projectList.filter((p) => projectId !== p.id);
    await this.loadState(newProjects);
  }
}

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

  loadState(state: Project[]) {
    this.projectList = state;
    this.context.globalState.update(GLOBAL_LIST_PROJECT, this.projectList);
  }

  saveProject(project: Project) {
    const newProjects = [...this.projectList, project];
    this.loadState(newProjects);
  }

  editProject(projectId: string, newProject: Project) {
    const project = this.projectList.find((p) => projectId === p.id);
    const oldProjects = this.projectList.filter((p) => projectId !== p.id);
    newProject.campaigns = project!.campaigns;
    const newProjects = [...oldProjects, newProject];
    this.loadState(newProjects);
  }

  deleteProject(projectId: string) {
    const newProjects = this.projectList.filter((p) => projectId !== p.id);
    this.loadState(newProjects);
  }
}

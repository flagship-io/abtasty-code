import * as vscode from 'vscode';
import { Project } from '../../model';
import { Cli } from '../../cli/cmd/featureExperimentation/Cli';
import { ProjectDataService } from '../../services/featureExperimentation/ProjectDataService';

export class ProjectStore {
  private cli: Cli;
  private projectService;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.cli = cli;
    this.projectService = new ProjectDataService(context);
  }

  loadProject(): Project[] {
    return this.projectService.getState();
  }

  async refreshProject(): Promise<Project[]> {
    let projects = await this.cli.ListProject();
    const campaigns = await this.cli.ListCampaign();

    projects.forEach((p) => {
      p.campaigns = [...(p.campaigns || []), ...campaigns.filter((c) => c.project_id === p.id)];
    });

    await this.projectService.loadState(projects);
    return projects;
  }

  async saveProject(project: Project): Promise<Project> {
    const cliResponse = await this.cli.CreateProject(project);
    if (cliResponse.id) {
      await this.projectService.saveProject(cliResponse);
      vscode.window.showInformationMessage(`[AB Tasty] Project created successfully !`);
    }
    return cliResponse;
  }

  async editProject(projectId: string, newProject: Project): Promise<Project> {
    const cliResponse = projectId ? await this.cli.EditProject(projectId, newProject) : ({} as Project);
    if (cliResponse.id) {
      await this.projectService.editProject(projectId, cliResponse);
      vscode.window.showInformationMessage(`[AB Tasty] Project edited successfully`);
    }
    return cliResponse;
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const cliResponse = projectId ? await this.cli.DeleteProject(projectId) : false;
    if (cliResponse) {
      await this.projectService.deleteProject(projectId);
      vscode.window.showInformationMessage(`[AB Tasty] Project deleted successfully`);
    }
    return cliResponse;
  }
}

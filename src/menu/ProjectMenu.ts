import * as vscode from 'vscode';
import { Cli } from '../providers/Cli';
import { ProjectItem } from '../providers/ProjectList';

interface ProjectSchema {
  name: string;
}

export async function projectInputBox(context: vscode.ExtensionContext, project: ProjectItem, cli: Cli) {
  const projectData = {} as Partial<ProjectSchema>;

  const title = 'Create Project';

  if (project.id) {
    projectData.name = project.name;
  }

  projectData.name = await vscode.window.showInputBox({
    title,
    placeHolder: 'Project Name',
    value: projectData.name!,
    ignoreFocusOut: true,
    prompt: 'Enter your project name',
    validateInput: (value) => validateProject(value),
  });

  async function validateProject(value: string) {
    if (value === '' || value.match(/[\'\"]+/g)) {
      return 'Invalid information.';
    }
  }

  const { name } = projectData;

  if (name) {
    if (project.id) {
      const projectEdited = await cli.EditProject(project.id, name);
      if (projectEdited.id) {
        vscode.window.showInformationMessage(`[Flagship] Project edited successfully`);
        return;
      }
      vscode.window.showErrorMessage(`[Flagship] Project not edited`);
      return;
    }
    const projectCreated = await cli.CreateProject(name);
    if (projectCreated.id) {
      vscode.window.showInformationMessage(`[Flagship] Project created successfully`);
      return;
    }
    vscode.window.showErrorMessage(`[Flagship] Project not created`);
    return;
  }
  vscode.window.showInformationMessage(`[Flagship] Project not created`);
}

export async function deleteProjectBox(context: vscode.ExtensionContext, project: ProjectItem, cli: Cli) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the project ${project.name}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    await cli.DeleteProject(project.id!);
    vscode.window.showInformationMessage(`[Flagship] Project ${project.name} deleted successfully.`);
    return;
  }
  return;
}

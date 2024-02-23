import * as vscode from 'vscode';
import { Cli } from '../providers/Cli';
import { CampaignItem, ProjectItem, VariationGroupItem, VariationItem } from '../providers/ProjectList';
import { ProjectStore } from '../store/ProjectStore';
import { Campaign, Project } from '../model';

interface ProjectSchema {
  name: string;
}

export async function projectInputBox(project: ProjectItem, projectStore: ProjectStore) {
  const projectData = {} as Partial<ProjectSchema>;

  let title = 'Create Project';

  if (project.id) {
    title = 'Edit Project';
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
      const projectEdited = await projectStore.editProject(project.id, { name } as Project);

      if (!projectEdited.id) {
        vscode.window.showErrorMessage(`[Flagship] Project not edited`);
        return;
      }
      return;
    }
    const projectCreated = await projectStore.saveProject({ name, campaigns: [] as Campaign[] } as Project);

    if (!projectCreated.id) {
      vscode.window.showErrorMessage(`[Flagship] Project not created`);
      return;
    }
    return;
  }
  vscode.window.showErrorMessage(`[Flagship] Project not created`);
}

export async function deleteProjectInputBox(project: ProjectItem, projectStore: ProjectStore) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the project ${project.name}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    await projectStore.deleteProject(project.id!);
    return;
  }
  return;
}

export async function deleteCampaignBox(context: vscode.ExtensionContext, campaign: CampaignItem, cli: Cli) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the campaign ${campaign.name}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    await cli.DeleteCampaign(campaign.id!);
    vscode.window.showInformationMessage(`[Flagship] Campaign ${campaign.name} deleted successfully.`);
    return;
  }
  return;
}

export async function deleteVariationGroupBox(
  context: vscode.ExtensionContext,
  variationGroup: VariationGroupItem,
  cli: Cli,
) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the variation group ${variationGroup.name}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    await cli.DeleteVariationGroup(variationGroup.id!, variationGroup.parentID!);
    vscode.window.showInformationMessage(`[Flagship] Variation group ${variationGroup.name} deleted successfully.`);
    return;
  }
  return;
}

export async function deleteVariationBox(context: vscode.ExtensionContext, variation: VariationItem, cli: Cli) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Delete the variation ${variation.name}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    await cli.DeleteVariation(variation.id!, variation.campaignID!, variation.parentID!);
    vscode.window.showInformationMessage(`[Flagship] Variation ${variation.name} deleted successfully.`);
    return;
  }
  return;
}

export async function switchProjectBox(context: vscode.ExtensionContext, project: ProjectItem, cli: Cli) {
  const picked = await vscode.window.showQuickPick(['active', 'paused', 'interrupted'], {
    title: `Switch the project ${project.name} state`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'active') {
    await cli.switchProject(project.id!, picked);
    vscode.window.showInformationMessage(`[Flagship] Project ${project.name} set to ${picked} successfully.`);
    return;
  }
  if (picked === 'paused') {
    await cli.switchProject(project.id!, picked);
    vscode.window.showInformationMessage(`[Flagship] Project ${project.name} set to ${picked} successfully.`);
    return;
  }
  if (picked === 'interrupted') {
    await cli.switchProject(project.id!, picked);
    vscode.window.showInformationMessage(`[Flagship] Project ${project.name} set to ${picked} successfully.`);
    return;
  }
  return;
}

export async function switchCampaignBox(context: vscode.ExtensionContext, campaign: CampaignItem, cli: Cli) {
  const picked = await vscode.window.showQuickPick(['active', 'paused', 'interrupted'], {
    title: `Switch the campaign ${campaign.name} state`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'active') {
    await cli.switchCampaign(campaign.id!, picked);
    vscode.window.showInformationMessage(`[Flagship] Campaign ${campaign.name} set to ${picked} successfully.`);
    return;
  }
  if (picked === 'paused') {
    await cli.switchCampaign(campaign.id!, picked);
    vscode.window.showInformationMessage(`[Flagship] Campaign ${campaign.name} set to ${picked} successfully.`);
    return;
  }
  if (picked === 'interrupted') {
    await cli.switchCampaign(campaign.id!, picked);
    vscode.window.showInformationMessage(`[Flagship] Campaign ${campaign.name} set to ${picked} successfully.`);
    return;
  }
  return;
}

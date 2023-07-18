import * as vscode from 'vscode';
import { Cli } from '../providers/Cli';
import { CampaignItem, ProjectItem, VariationGroupItem, VariationItem } from '../providers/ProjectList';

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

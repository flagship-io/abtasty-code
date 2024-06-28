import * as vscode from 'vscode';
import {
  SET_CONTEXT,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_DELETE,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_DELETE,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_LOAD,
} from './commands/const';
import { deleteModificationInputBox } from './menu/webExperimentation/ModificationMenu';
import { Cli } from './cli/cmd/webExperimentation/Cli';
import { ModificationItem, ModificationListProvider } from './providers/webExperimentation/ModificationList';
import { QuickAccessListProvider } from './providers/webExperimentation/QuickAccessList';
import { WEB_EXPERIMENTATION_CONFIGURED } from './services/webExperimentation/const';
import { ModificationStore } from './store/webExperimentation/ModificationStore';
import { CampaignStore } from './store/webExperimentation/CampaignStore';
import { deleteCampaignInputBox } from './menu/webExperimentation/CampaignMenu';
import { CampaignListProvider } from './providers/webExperimentation/CampaignList';

export async function setupWebExpProviders(context: vscode.ExtensionContext, cli: Cli) {
  const configured = await context.globalState.get(WEB_EXPERIMENTATION_CONFIGURED);

  const modificationStore = new ModificationStore(context, cli);
  const campaignStore = new CampaignStore(context, cli);

  if (configured === true) {
    await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'webExperimentation');
  }

  const quickAccessView = new QuickAccessListProvider();
  const quickAccessProvider = vscode.window.registerTreeDataProvider('webExperimentation.quickAccess', quickAccessView);

  const modificationProvider = new ModificationListProvider(context, modificationStore);
  vscode.window.registerTreeDataProvider('webExperimentation.modificationList', modificationProvider);

  const campaignProvider = new CampaignListProvider(context, campaignStore);
  vscode.window.registerTreeDataProvider('webExperimentation.campaignList', campaignProvider);

  await Promise.all([quickAccessView.refresh(), modificationProvider.refresh(), campaignProvider.refresh()]);

  const modificationDisposables = [
    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_MODIFICATION_LIST_DELETE,
      async (modification: ModificationItem) => {
        await deleteModificationInputBox(modification, modificationStore);
        await vscode.commands.executeCommand(WEB_EXPERIMENTATION_MODIFICATION_LIST_LOAD);
        return;
      },
    ),
  ];

  const campaignDisposables = [
    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_CAMPAIGN_LIST_DELETE,
      async (modification: ModificationItem) => {
        await deleteCampaignInputBox(modification, campaignStore);
        await vscode.commands.executeCommand(WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD);
        return;
      },
    ),
  ];

  context.subscriptions.push(quickAccessProvider, ...modificationDisposables, ...campaignDisposables);
}

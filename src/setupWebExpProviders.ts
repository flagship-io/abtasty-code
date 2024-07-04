import * as vscode from 'vscode';
import { Cli } from './cli/cmd/webExperimentation/Cli';
import {
  SET_CONTEXT,
  WEB_EXPERIMENTATION_ACCOUNT_LIST_LOAD,
  WEB_EXPERIMENTATION_ACCOUNT_LIST_SELECT,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_DELETE,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD,
  WEB_EXPERIMENTATION_CAMPAIGN_SET_CAMPAIGN,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_DELETE,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_LOAD,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_REFRESH,
} from './commands/const';
import { selectAccountInputBox } from './menu/webExperimentation/AccountMenu';
import { deleteCampaignInputBox } from './menu/webExperimentation/CampaignMenu';
import { deleteModificationInputBox } from './menu/webExperimentation/ModificationMenu';
import { AccountItem, AccountListProvider } from './providers/webExperimentation/AccountList';
import { CampaignItem, CampaignListProvider } from './providers/webExperimentation/CampaignList';
import { ModificationItem, ModificationListProvider } from './providers/webExperimentation/ModificationList';
import { QuickAccessListProvider } from './providers/webExperimentation/QuickAccessList';
import { CURRENT_SET_CAMPAIGN_ID, WEB_EXPERIMENTATION_CONFIGURED } from './services/webExperimentation/const';
import { AccountWEStore } from './store/webExperimentation/AccountStore';
import { AuthenticationStore } from './store/webExperimentation/AuthenticationStore';
import { CampaignStore } from './store/webExperimentation/CampaignStore';
import { ModificationStore } from './store/webExperimentation/ModificationStore';

export const rootPath =
  vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;

export async function setupWebExpProviders(context: vscode.ExtensionContext, cli: Cli) {
  const configured = await context.globalState.get(WEB_EXPERIMENTATION_CONFIGURED);

  const modificationStore = new ModificationStore(context, cli);
  const campaignStore = new CampaignStore(context, cli);
  const accountStore = new AccountWEStore(context, cli);
  const authenticationStore = new AuthenticationStore(context, cli);
  if (configured === true) {
    await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'webExperimentation');
  }

  const quickAccessView = new QuickAccessListProvider();
  const quickAccessProvider = vscode.window.registerTreeDataProvider('webExperimentation.quickAccess', quickAccessView);

  const modificationProvider = new ModificationListProvider(context, modificationStore);
  vscode.window.registerTreeDataProvider('webExperimentation.modificationList', modificationProvider);

  const campaignProvider = new CampaignListProvider(context, campaignStore);
  vscode.window.registerTreeDataProvider('webExperimentation.campaignList', campaignProvider);

  const accountProvider = new AccountListProvider(context, accountStore);
  vscode.window.registerTreeDataProvider('webExperimentation.accountList', accountProvider);

  await Promise.all([
    quickAccessView.refresh(),
    accountProvider.refresh(),
    modificationProvider.refresh(),
    campaignProvider.refresh(),
  ]);

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
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_CAMPAIGN_LIST_DELETE, async (campaign: CampaignItem) => {
      await deleteCampaignInputBox(campaign, campaignStore);
      await vscode.commands.executeCommand(WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD);
      return;
    }),

    vscode.commands.registerCommand(WEB_EXPERIMENTATION_CAMPAIGN_SET_CAMPAIGN, async (campaign: CampaignItem) => {
      await context.globalState.update(CURRENT_SET_CAMPAIGN_ID, campaign.id);
      await vscode.commands.executeCommand(WEB_EXPERIMENTATION_MODIFICATION_LIST_REFRESH);
      return;
    }),
  ];

  const accountDisposables = [
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_ACCOUNT_LIST_SELECT, async (account: AccountItem) => {
      await selectAccountInputBox(account, authenticationStore);
      await context.globalState.update(CURRENT_SET_CAMPAIGN_ID, undefined);
      await Promise.all([quickAccessView.refresh(), modificationProvider.refresh(), campaignProvider.refresh()]);
      await vscode.commands.executeCommand(WEB_EXPERIMENTATION_ACCOUNT_LIST_LOAD);
      return;
    }),
  ];

  context.subscriptions.push(
    quickAccessProvider,
    ...modificationDisposables,
    ...campaignDisposables,
    ...accountDisposables,
  );
}

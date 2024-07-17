import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Cli } from './cli/cmd/webExperimentation/Cli';
import {
  SET_CONTEXT,
  WEB_EXPERIMENTATION_ACCOUNT_LIST_LOAD,
  WEB_EXPERIMENTATION_ACCOUNT_LIST_SELECT,
  WEB_EXPERIMENTATION_CAMPAIGN_GET_VARIATION,
  WEB_EXPERIMENTATION_CAMPAIGN_GLOBAL_CODE_OPEN_FILE,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_DELETE,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD,
  WEB_EXPERIMENTATION_CAMPAIGN_PULL_GLOBAL_CODE,
  WEB_EXPERIMENTATION_CAMPAIGN_PUSH_GLOBAL_CODE,
  WEB_EXPERIMENTATION_CAMPAIGN_SET_CAMPAIGN,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_DELETE,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_LOAD,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_REFRESH,
  WEB_EXPERIMENTATION_TREE_CODE_OPEN_FILE,
  WEB_EXPERIMENTATION_VARIATION_LIST_DELETE,
  WEB_EXPERIMENTATION_VARIATION_LIST_LOAD,
  WEB_EXPERIMENTATION_VARIATION_LIST_REFRESH,
  WEB_EXPERIMENTATION_VARIATION_PULL_GLOBAL_CODE_CSS,
  WEB_EXPERIMENTATION_VARIATION_PULL_GLOBAL_CODE_JS,
  WEB_EXPERIMENTATION_VARIATION_PUSH_GLOBAL_CODE_CSS,
  WEB_EXPERIMENTATION_VARIATION_PUSH_GLOBAL_CODE_JS,
} from './commands/const';
import { selectAccountInputBox } from './menu/webExperimentation/AccountMenu';
import {
  deleteCampaignInputBox,
  pullCampaignGlobalOperationInputBox,
  pushCampaignGlobalCodeOperationInputBox,
} from './menu/webExperimentation/CampaignMenu';
import { deleteModificationInputBox } from './menu/webExperimentation/ModificationMenu';
import { AccountItem, AccountListProvider } from './providers/webExperimentation/AccountList';
import {
  CampaignWEItem,
  CampaignListProvider,
  VariationWEItem,
  GlobalCodeCampaignItem,
  GlobalCodeVariationJSItem,
  GlobalCodeVariationCSSItem,
  ResourceArgument,
} from './providers/webExperimentation/CampaignList';
import { ModificationItem, ModificationListProvider } from './providers/webExperimentation/ModificationList';
import { QuickAccessListProvider } from './providers/webExperimentation/QuickAccessList';
import {
  CURRENT_SET_CAMPAIGN_ID,
  CURRENT_SET_VARIATIONS_ID,
  WEB_EXPERIMENTATION_CONFIGURED,
} from './services/webExperimentation/const';
import { AccountWEStore } from './store/webExperimentation/AccountStore';
import { AuthenticationStore } from './store/webExperimentation/AuthenticationStore';
import { CampaignStore } from './store/webExperimentation/CampaignStore';
import { ModificationStore } from './store/webExperimentation/ModificationStore';
import { VariationStore } from './store/webExperimentation/VariationStore';
import { deleteVariationInputBox } from './menu/webExperimentation/VariationMenu';
import { VariationItem, VariationListProvider } from './providers/webExperimentation/VariationList';
import { FileStat, TreeCodeProvider } from './providers/webExperimentation/TreeCode';
import { CampaignTreeView } from '../treeView/webExperimentation/campaignTreeView';

export const rootPath =
  vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;

export async function setupWebExpProviders(context: vscode.ExtensionContext, cli: Cli) {
  const configured = await context.globalState.get(WEB_EXPERIMENTATION_CONFIGURED);

  const modificationStore = new ModificationStore(context, cli);
  const variationStore = new VariationStore(context, cli);
  const campaignStore = new CampaignStore(context, cli);
  const accountStore = new AccountWEStore(context, cli);
  const authenticationStore = new AuthenticationStore(context, cli);

  if (configured === true) {
    await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'webExperimentation');
  }

  const currentAccountId = (await authenticationStore.getCurrentAuthentication()).account_id;

  const account = await accountStore.currentAccount();
  const fileExplorerProvider = new TreeCodeProvider(rootPath, campaignStore);
  vscode.window.registerTreeDataProvider('webExperimentation.treeCode', fileExplorerProvider);

  const quickAccessView = new QuickAccessListProvider();
  const quickAccessProvider = vscode.window.registerTreeDataProvider('webExperimentation.quickAccess', quickAccessView);

  const modificationProvider = new ModificationListProvider(context, modificationStore);
  vscode.window.registerTreeDataProvider('webExperimentation.modificationList', modificationProvider);

  const variationProvider = new VariationListProvider(context, variationStore);
  vscode.window.registerTreeDataProvider('webExperimentation.variationList', variationProvider);

  const campaignProvider = new CampaignListProvider(context, campaignStore, account.account_id);
  //vscode.window.registerTreeDataProvider('webExperimentation.campaignList', campaignProvider);

  const campaignTreeView = new CampaignTreeView(context, campaignProvider, cli, rootPath, account.account_id);

  const accountProvider = new AccountListProvider(context, accountStore);
  vscode.window.registerTreeDataProvider('webExperimentation.accountList', accountProvider);

  await Promise.all([
    quickAccessView.refresh(),
    accountProvider.refresh(),
    modificationProvider.refresh(),
    variationProvider.refresh(),
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

  const variationDisposables = [
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_VARIATION_LIST_DELETE, async (variation: VariationItem) => {
      await deleteVariationInputBox(variation, variationStore);
      await vscode.commands.executeCommand(WEB_EXPERIMENTATION_VARIATION_LIST_LOAD);
      return;
    }),
  ];

  const campaignDisposables = [
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_CAMPAIGN_LIST_DELETE, async (campaign: CampaignWEItem) => {
      await deleteCampaignInputBox(campaign, campaignStore);
      await vscode.commands.executeCommand(WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD);
      return;
    }),

    vscode.commands.registerCommand(WEB_EXPERIMENTATION_CAMPAIGN_SET_CAMPAIGN, async (campaign: CampaignWEItem) => {
      await context.globalState.update(CURRENT_SET_CAMPAIGN_ID, campaign.id);
      await context.globalState.update(CURRENT_SET_VARIATIONS_ID, campaign.variationIds);
      await Promise.all([
        vscode.commands.executeCommand(WEB_EXPERIMENTATION_MODIFICATION_LIST_REFRESH),
        vscode.commands.executeCommand(WEB_EXPERIMENTATION_VARIATION_LIST_REFRESH),
      ]);
      return;
    }),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_CAMPAIGN_PULL_GLOBAL_CODE,
      async (fileItem: ResourceArgument) => {
        await campaignStore.pullCampaignGlobalCode(fileItem.campaignId!, true, true, false);
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_CAMPAIGN_PUSH_GLOBAL_CODE,
      async (fileItem: ResourceArgument) => {
        await campaignStore.pushCampaignGlobalCode(fileItem.campaignId!, fileItem.filePath);
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_VARIATION_PULL_GLOBAL_CODE_JS,
      async (fileItem: ResourceArgument) => {
        await campaignStore.pullVariationGlobalCodeJS(fileItem.variationId, fileItem.campaignId, true, true, false);
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_VARIATION_PUSH_GLOBAL_CODE_JS,
      async (fileItem: ResourceArgument) => {
        await campaignStore.pushVariationGlobalCodeJS(fileItem.variationId, fileItem.campaignId, fileItem.filePath);
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_VARIATION_PULL_GLOBAL_CODE_CSS,
      async (fileItem: ResourceArgument) => {
        console.log(fileItem);
        await campaignStore.pullVariationGlobalCodeCSS(fileItem.variationId, fileItem.campaignId, true, true, false);
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_VARIATION_PUSH_GLOBAL_CODE_CSS,
      async (fileItem: ResourceArgument) => {
        await campaignStore.pushVariationGlobalCodeCSS(fileItem.variationId, fileItem.campaignId, fileItem.filePath);
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_CAMPAIGN_GLOBAL_CODE_OPEN_FILE,
      (fileItem: ResourceArgument) => {
        console.log(fileItem);
        vscode.workspace.openTextDocument(fileItem.filePath).then((doc) => {
          vscode.window.showTextDocument(doc);
        });
      },
    ),
  ];

  const accountDisposables = [
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_ACCOUNT_LIST_SELECT, async (account: AccountItem) => {
      await selectAccountInputBox(account, authenticationStore);
      await context.globalState.update(CURRENT_SET_CAMPAIGN_ID, undefined);
      await context.globalState.update(CURRENT_SET_VARIATIONS_ID, undefined);
      await Promise.all([
        quickAccessView.refresh(),
        modificationProvider.refresh(),
        campaignProvider.refresh(),
        variationProvider.refresh(),
      ]);
      await vscode.commands.executeCommand(WEB_EXPERIMENTATION_ACCOUNT_LIST_LOAD);
      return;
    }),
  ];

  context.subscriptions.push(
    quickAccessProvider,
    campaignTreeView,
    ...modificationDisposables,
    ...variationDisposables,
    ...campaignDisposables,
    ...accountDisposables,
  );
}

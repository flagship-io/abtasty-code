import * as vscode from 'vscode';
import * as fs from 'fs';
import { Cli } from './cli/cmd/webExperimentation/Cli';
import {
  SET_CONTEXT,
  WEB_EXPERIMENTATION_ACCOUNT_LIST_LOAD,
  WEB_EXPERIMENTATION_ACCOUNT_LIST_SELECT,
  WEB_EXPERIMENTATION_CAMPAIGN_ADD_GLOBAL_CODE,
  WEB_EXPERIMENTATION_CAMPAIGN_GLOBAL_CODE_OPEN_FILE,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_DELETE,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD,
  WEB_EXPERIMENTATION_CAMPAIGN_PULL_GLOBAL_CODE,
  WEB_EXPERIMENTATION_CAMPAIGN_PUSH_GLOBAL_CODE,
  WEB_EXPERIMENTATION_CAMPAIGN_SET_CAMPAIGN,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_DELETE,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_LOAD,
  WEB_EXPERIMENTATION_MODIFICATION_LIST_REFRESH,
  WEB_EXPERIMENTATION_VARIATION_LIST_DELETE,
  WEB_EXPERIMENTATION_VARIATION_LIST_LOAD,
  WEB_EXPERIMENTATION_VARIATION_LIST_REFRESH,
  WEB_EXPERIMENTATION_VARIATION_PULL_GLOBAL_CODE_CSS,
  WEB_EXPERIMENTATION_VARIATION_PULL_GLOBAL_CODE_JS,
  WEB_EXPERIMENTATION_VARIATION_PUSH_GLOBAL_CODE_CSS,
  WEB_EXPERIMENTATION_VARIATION_PUSH_GLOBAL_CODE_JS,
} from './commands/const';
import { selectAccountInputBox } from './menu/webExperimentation/AccountMenu';
import { deleteCampaignInputBox } from './menu/webExperimentation/CampaignMenu';
import { deleteModificationInputBox } from './menu/webExperimentation/ModificationMenu';
import { AccountItem, AccountListProvider } from './providers/webExperimentation/AccountList';
import {
  CampaignWEItem,
  CampaignListProvider,
  ResourceArgument,
  GlobalCodeCampaign,
} from './providers/webExperimentation/CampaignList';
import { QuickAccessListProvider } from './providers/webExperimentation/QuickAccessList';
import {
  CURRENT_SET_CAMPAIGN_ID,
  CURRENT_SET_VARIATIONS_ID,
  WEB_EXPERIMENTATION_CONFIGURED,
} from './services/webExperimentation/const';
import { AccountWEStore } from './store/webExperimentation/AccountStore';
import { AuthenticationStore } from './store/webExperimentation/AuthenticationStore';
import { CampaignStore } from './store/webExperimentation/CampaignStore';

import { CampaignTreeView } from '../treeView/webExperimentation/campaignTreeView';
import { showIndefiniteProgress } from './commands/configureWebExperimentation';

export const rootPath =
  vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;

export async function setupWebExpProviders(context: vscode.ExtensionContext, cli: Cli) {
  const configured = await context.globalState.get(WEB_EXPERIMENTATION_CONFIGURED);

  const campaignStore = new CampaignStore(context, cli);
  const accountStore = new AccountWEStore(context, cli);
  const authenticationStore = new AuthenticationStore(context, cli);

  if (configured === true) {
    await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'webExperimentation');
  }

  const account = await accountStore.currentAccount();

  const quickAccessView = new QuickAccessListProvider();
  const quickAccessProvider = vscode.window.registerTreeDataProvider('webExperimentation.quickAccess', quickAccessView);

  const campaignProvider = new CampaignListProvider(context, campaignStore, account.account_id);

  const campaignTreeView = new CampaignTreeView(context, campaignProvider, cli, rootPath, account.account_id);

  const accountProvider = new AccountListProvider(context, accountStore);
  vscode.window.registerTreeDataProvider('webExperimentation.accountList', accountProvider);

  const progressIndicator = showIndefiniteProgress('Fetching Resources');

  try {
    await Promise.all([quickAccessView.refresh(), accountProvider.refresh(), campaignProvider.refresh()]);
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to fetch accounts: ${error.message}`);
  } finally {
    progressIndicator.done(); // Stop the progress indicator
  }

  const campaignDisposables = [
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_CAMPAIGN_LIST_DELETE, async (campaign: CampaignWEItem) => {
      await deleteCampaignInputBox(campaign, campaignStore);
      await vscode.commands.executeCommand(WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD);
      return;
    }),

    vscode.commands.registerCommand(WEB_EXPERIMENTATION_CAMPAIGN_SET_CAMPAIGN, async (campaign: CampaignWEItem) => {
      await context.globalState.update(CURRENT_SET_CAMPAIGN_ID, campaign.id);
      await context.globalState.update(CURRENT_SET_VARIATIONS_ID, campaign.variationIds);
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
      WEB_EXPERIMENTATION_CAMPAIGN_ADD_GLOBAL_CODE,
      async (fileItem: GlobalCodeCampaign) => {
        console.log(fileItem);
        const campaignPath = `${rootPath}/.abtasty/${account.account_id}/${fileItem.resourceId}`;
        console.log(campaignPath);

        if (!fs.existsSync(campaignPath)) {
          fs.mkdirSync(campaignPath);
          const filePath = `${campaignPath}/campaignGlobalCode.js`;
          const createStream = fs.createWriteStream(filePath);
          createStream.end();
          vscode.window.showInformationMessage(`[AB Tasty] File created at ${campaignPath}`);
          vscode.workspace.openTextDocument(filePath).then((doc) => {
            vscode.window.showTextDocument(doc);
          });
          vscode.commands.executeCommand('list.collapseAllToFocus');
        }
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

      const progressIndicator = showIndefiniteProgress('Fetching Resources');
      try {
        await Promise.all([quickAccessView.refresh(), campaignProvider.refresh()]);
        await vscode.commands.executeCommand(WEB_EXPERIMENTATION_ACCOUNT_LIST_LOAD);
        return;
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to fetch accounts: ${error.message}`);
      } finally {
        progressIndicator.done();
      }
    }),
  ];

  context.subscriptions.push(quickAccessProvider, campaignTreeView, ...campaignDisposables, ...accountDisposables);
}

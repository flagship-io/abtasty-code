import * as vscode from 'vscode';
import * as fs from 'fs';
import { Cli } from './cli/cmd/webExperimentation/Cli';
import {
  SET_CONTEXT,
  WEB_EXPERIMENTATION_ACCOUNT_LIST_LOAD,
  WEB_EXPERIMENTATION_ACCOUNT_LIST_SELECT,
  WEB_EXPERIMENTATION_CAMPAIGN_ADD_GLOBAL_CODE,
  WEB_EXPERIMENTATION_GLOBAL_CODE_OPEN_FILE,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_DELETE,
  WEB_EXPERIMENTATION_CAMPAIGN_LIST_LOAD,
  WEB_EXPERIMENTATION_CAMPAIGN_PULL_GLOBAL_CODE,
  WEB_EXPERIMENTATION_CAMPAIGN_PUSH_GLOBAL_CODE,
  WEB_EXPERIMENTATION_VARIATION_PULL_GLOBAL_CODE_CSS,
  WEB_EXPERIMENTATION_VARIATION_PULL_GLOBAL_CODE_JS,
  WEB_EXPERIMENTATION_VARIATION_PUSH_GLOBAL_CODE_CSS,
  WEB_EXPERIMENTATION_VARIATION_PUSH_GLOBAL_CODE_JS,
  WEB_EXPERIMENTATION_ACCOUNT_ADD_GLOBAL_CODE,
  WEB_EXPERIMENTATION_ACCOUNT_PUSH_GLOBAL_CODE,
  WEB_EXPERIMENTATION_ACCOUNT_PULL_GLOBAL_CODE,
  WEB_EXPERIMENTATION_VARIATION_ADD_GLOBAL_CODE,
  WEB_EXPERIMENTATION_MODIFICATION_PULL_CODE,
  WEB_EXPERIMENTATION_MODIFICATION_PUSH_CODE,
  WEB_EXPERIMENTATION_MODIFICATION_ADD_MODIFICATION,
  WEB_EXPERIMENTATION_MODIFICATION_REFRESH_MODIFICATION,
  WEB_EXPERIMENTATION_MODIFICATION_DELETE_MODIFICATION,
} from './commands/const';
import { selectAccountInputBox } from './menu/webExperimentation/AccountMenu';
import { deleteCampaignInputBox } from './menu/webExperimentation/CampaignMenu';
import { addModificationInputBox, deleteModificationInputBox } from './menu/webExperimentation/ModificationMenu';
import { AccountItem, AccountListProvider, GlobalCodeAccount } from './providers/webExperimentation/AccountList';
import {
  CampaignWEItem,
  CampaignListProvider,
  ResourceArgument,
  GlobalCodeCampaign,
  GlobalCodeVariation,
  ModificationWETree,
  ModificationWEItem,
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
import { AccountTreeView } from '../treeView/webExperimentation/accountTreeView';

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

  const campaignProvider = new CampaignListProvider(context, campaignStore, accountStore, account.account_id);
  const campaignTreeView = new CampaignTreeView(context, campaignProvider, cli, rootPath);

  const accountProvider = new AccountListProvider(context, accountStore);
  const accountTreeView = new AccountTreeView(context, accountProvider, cli, rootPath, account.account_id);

  const progressIndicator = showIndefiniteProgress('Fetching Resources');

  try {
    await Promise.all([quickAccessView.refresh(), accountProvider.refresh(), campaignTreeView.refresh()]);
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

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_CAMPAIGN_PULL_GLOBAL_CODE,
      async (fileItem: ResourceArgument) => {
        const picked = await vscode.window.showQuickPick(['yes', 'no'], {
          title: `Pull campaign global code for the ID ${fileItem.campaignId}`,
          placeHolder: 'Do you confirm ?',
          ignoreFocusOut: true,
        });

        if (picked === 'yes') {
          await campaignStore.pullCampaignGlobalCode(fileItem.campaignId!, true, true, false);
        }
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_CAMPAIGN_PUSH_GLOBAL_CODE,
      async (fileItem: ResourceArgument) => {
        const picked = await vscode.window.showQuickPick(['yes', 'no'], {
          title: `Push campaign global code for the ID ${fileItem.campaignId}`,
          placeHolder: 'Do you confirm ?',
          ignoreFocusOut: true,
        });

        if (picked === 'yes') {
          await campaignStore.pushCampaignGlobalCode(fileItem.campaignId!, fileItem.filePath);
        }
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_CAMPAIGN_ADD_GLOBAL_CODE,
      async (fileItem: GlobalCodeCampaign) => {
        const account = await accountStore.currentAccount();
        const campaignPath = `${rootPath}/.abtasty/${account.account_id}/${fileItem.resourceId}`;
        const campaignFilePath = `${campaignPath}/campaignGlobalCode.js`;
        if (!fs.existsSync(campaignFilePath)) {
          fs.mkdirSync(campaignPath, { recursive: true });
          const createStream = fs.createWriteStream(campaignFilePath);
          createStream.end();
          vscode.window.showInformationMessage(`[AB Tasty] File created at ${campaignFilePath}`);
          vscode.workspace.openTextDocument(campaignFilePath).then((doc) => {
            vscode.window.showTextDocument(doc);
          });

          campaignTreeView.reveal(fileItem, { select: true, focus: true, expand: false });
          vscode.commands.executeCommand('list.collapseAllToFocus');
          campaignTreeView.reveal(fileItem, { select: true, focus: true, expand: true });
        }
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_VARIATION_PULL_GLOBAL_CODE_JS,
      async (fileItem: ResourceArgument) => {
        const picked = await vscode.window.showQuickPick(['yes', 'no'], {
          title: `Pull variation global code js for the ID ${fileItem.variationId}`,
          placeHolder: 'Do you confirm ?',
          ignoreFocusOut: true,
        });

        if (picked === 'yes') {
          await campaignStore.pullVariationGlobalCodeJS(fileItem.variationId, fileItem.campaignId, true, true);
        }
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_VARIATION_PUSH_GLOBAL_CODE_JS,
      async (fileItem: ResourceArgument) => {
        const picked = await vscode.window.showQuickPick(['yes', 'no'], {
          title: `Push variation global code js for the ID ${fileItem.variationId}`,
          placeHolder: 'Do you confirm ?',
          ignoreFocusOut: true,
        });

        if (picked === 'yes') {
          await campaignStore.pushVariationGlobalCodeJS(fileItem.variationId, fileItem.campaignId, fileItem.filePath);
        }
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_VARIATION_PULL_GLOBAL_CODE_CSS,
      async (fileItem: ResourceArgument) => {
        const picked = await vscode.window.showQuickPick(['yes', 'no'], {
          title: `Pull variation global code css for the ID ${fileItem.variationId}`,
          placeHolder: 'Do you confirm ?',
          ignoreFocusOut: true,
        });

        if (picked === 'yes') {
          await campaignStore.pullVariationGlobalCodeCSS(fileItem.variationId, fileItem.campaignId, true, true);
        }
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_VARIATION_PUSH_GLOBAL_CODE_CSS,
      async (fileItem: ResourceArgument) => {
        const picked = await vscode.window.showQuickPick(['yes', 'no'], {
          title: `Push variation global code css for the ID ${fileItem.variationId}`,
          placeHolder: 'Do you confirm ?',
          ignoreFocusOut: true,
        });

        if (picked === 'yes') {
          await campaignStore.pushVariationGlobalCodeCSS(fileItem.variationId, fileItem.campaignId, fileItem.filePath);
        }
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_VARIATION_ADD_GLOBAL_CODE,
      async (fileItem: GlobalCodeVariation) => {
        const account = await accountStore.currentAccount();
        const variationGlobalCodeJSPath = `${rootPath}/.abtasty/${account.account_id}/${fileItem.parent.parent.id}/${fileItem.parent.id}`;
        const variationGlobalCodeCSSPath = `${rootPath}/.abtasty/${account.account_id}/${fileItem.parent.parent.id}/${fileItem.parent.id}`;

        const variationGlobalCodeJSFilePath = `${variationGlobalCodeJSPath}/variationGlobalCode.js`;
        const variationGlobalCodeCSSFilePath = `${variationGlobalCodeCSSPath}/variationGlobalCode.css`;

        if (!fs.existsSync(variationGlobalCodeJSFilePath)) {
          fs.mkdirSync(variationGlobalCodeJSPath, { recursive: true });

          const createStream = fs.createWriteStream(variationGlobalCodeJSFilePath);
          createStream.end();
          vscode.window.showInformationMessage(`[AB Tasty] File created at ${variationGlobalCodeJSFilePath}`);
          vscode.workspace.openTextDocument(variationGlobalCodeJSFilePath).then((doc) => {
            vscode.window.showTextDocument(doc);
          });

          campaignTreeView.reveal(fileItem, { select: true, focus: true, expand: false });
          vscode.commands.executeCommand('list.collapseAllToFocus');
          campaignTreeView.reveal(fileItem, { select: true, focus: true, expand: true });
        }

        if (!fs.existsSync(variationGlobalCodeCSSFilePath)) {
          fs.mkdirSync(variationGlobalCodeCSSPath, { recursive: true });

          const createStream = fs.createWriteStream(variationGlobalCodeCSSFilePath);
          createStream.end();
          vscode.window.showInformationMessage(`[AB Tasty] File created at ${variationGlobalCodeCSSFilePath}`);
          vscode.workspace.openTextDocument(variationGlobalCodeCSSFilePath).then((doc) => {
            vscode.window.showTextDocument(doc);
          });

          campaignTreeView.reveal(fileItem, { select: true, focus: true, expand: false });
          vscode.commands.executeCommand('list.collapseAllToFocus');
          campaignTreeView.reveal(fileItem, { select: true, focus: true, expand: true });
        }
        return;
      },
    ),

    vscode.commands.registerCommand(WEB_EXPERIMENTATION_GLOBAL_CODE_OPEN_FILE, (fileItem: ResourceArgument) => {
      vscode.workspace.openTextDocument(fileItem.filePath).then((doc) => {
        vscode.window.showTextDocument(doc);
      });
    }),

    vscode.commands.registerCommand(WEB_EXPERIMENTATION_MODIFICATION_PULL_CODE, async (fileItem: ResourceArgument) => {
      const picked = await vscode.window.showQuickPick(['yes', 'no'], {
        title: `Pull modification code for the ID ${fileItem.modificationId}`,
        placeHolder: 'Do you confirm ?',
        ignoreFocusOut: true,
      });

      if (picked === 'yes') {
        await campaignStore.pullModificationCode(fileItem.modificationId, fileItem.campaignId, true, true);
      }
      return;
    }),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_MODIFICATION_REFRESH_MODIFICATION,
      async (resource: ModificationWETree) => {
        resource.children?.splice(0);
        campaignTreeView._modificationByCampaigns = campaignTreeView._modificationByCampaigns.filter(
          (m) => m.campaignId === resource.parent.parent.id,
        );

        campaignTreeView.reveal(resource, { select: true, focus: true, expand: false });
        await vscode.commands.executeCommand('list.collapseAllToFocus');
        campaignTreeView.reveal(resource, { select: true, focus: true, expand: true });
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_MODIFICATION_ADD_MODIFICATION,
      async (resource: ModificationWETree) => {
        await addModificationInputBox(resource, cli);
        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_MODIFICATION_DELETE_MODIFICATION,
      async (resource: ModificationWEItem) => {
        await deleteModificationInputBox(resource, cli);
        await vscode.commands.executeCommand(
          WEB_EXPERIMENTATION_MODIFICATION_REFRESH_MODIFICATION,
          resource.modificationTree!,
        );
      },
    ),

    vscode.commands.registerCommand(WEB_EXPERIMENTATION_MODIFICATION_PUSH_CODE, async (fileItem: ResourceArgument) => {
      const picked = await vscode.window.showQuickPick(['yes', 'no'], {
        title: `Push modification code for the ID ${fileItem.modificationId}`,
        placeHolder: 'Do you confirm ?',
        ignoreFocusOut: true,
      });

      if (picked === 'yes') {
        await campaignStore.pushModificationCode(
          fileItem.modificationId,
          fileItem.variationId,
          fileItem.campaignId,
          fileItem.filePath,
        );
      }
      return;
    }),
  ];

  const accountDisposables = [
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_ACCOUNT_LIST_SELECT, async (account: AccountItem) => {
      await selectAccountInputBox(account, authenticationStore);

      const progressIndicator = showIndefiniteProgress('Fetching Resources');
      try {
        await Promise.all([
          quickAccessView.refresh(),
          campaignTreeView.refresh(),
          vscode.commands.executeCommand(WEB_EXPERIMENTATION_ACCOUNT_LIST_LOAD),
        ]);
        return;
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to fetch accounts: ${error.message}`);
      } finally {
        progressIndicator.done();
      }
    }),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_ACCOUNT_PULL_GLOBAL_CODE,
      async (fileItem: ResourceArgument) => {
        const picked = await vscode.window.showQuickPick(['yes', 'no'], {
          title: `Pull account global code for the ID ${fileItem.accountId!}`,
          placeHolder: 'Do you confirm ?',
          ignoreFocusOut: true,
        });

        if (picked === 'yes') {
          await accountStore.pullAccountGlobalCode(fileItem.accountId!, true, true);
        }

        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_ACCOUNT_PUSH_GLOBAL_CODE,
      async (fileItem: ResourceArgument) => {
        const picked = await vscode.window.showQuickPick(['yes', 'no'], {
          title: `Push account global code for the ID ${fileItem.accountId!}`,
          placeHolder: 'Do you confirm ?',
          ignoreFocusOut: true,
        });

        if (picked === 'yes') {
          await accountStore.pushAccountGlobalCode(fileItem.accountId!, fileItem.filePath);
        }

        return;
      },
    ),

    vscode.commands.registerCommand(
      WEB_EXPERIMENTATION_ACCOUNT_ADD_GLOBAL_CODE,
      async (fileItem: GlobalCodeAccount) => {
        const accountPath = `${rootPath}/.abtasty/${fileItem.resourceId}`;
        const accountFilePath = `${rootPath}/.abtasty/${fileItem.resourceId}/accountGlobalCode.js`;

        if (!fs.existsSync(accountFilePath)) {
          fs.mkdirSync(accountPath, { recursive: true });
          const createStream = fs.createWriteStream(accountFilePath);
          createStream.end();
          vscode.window.showInformationMessage(`[AB Tasty] File created at ${accountPath}`);
          vscode.workspace.openTextDocument(accountFilePath).then((doc) => {
            vscode.window.showTextDocument(doc);
          });

          campaignTreeView.reveal(fileItem, { select: true, focus: true, expand: false });
          vscode.commands.executeCommand('list.collapseAllToFocus');
          campaignTreeView.reveal(fileItem, { select: true, focus: true, expand: true });
        }
        return;
      },
    ),
  ];

  context.subscriptions.push(
    quickAccessProvider,
    campaignTreeView,
    accountTreeView,
    ...campaignDisposables,
    ...accountDisposables,
  );
}

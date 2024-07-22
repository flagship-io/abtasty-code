import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  CampaignListProvider,
  CampaignWEItem,
  GlobalCodeCampaign,
  GlobalCodeCampaignItem,
  GlobalCodeVariation,
  GlobalCodeVariationCSSItem,
  GlobalCodeVariationJSItem,
  Parent,
  SimpleItem,
  VariationWEItem,
} from '../../src/providers/webExperimentation/CampaignList';
import { Cli } from '../../src/cli/cmd/webExperimentation/Cli';
import { NO_GLOBAL_CODE_FOUND, NO_RESOURCE_FOUND } from '../../src/const';
import {
  AccountListProvider,
  GlobalCodeAccount,
  GlobalCodeAccountItem,
} from '../../src/providers/webExperimentation/AccountList';

export class AccountTreeView {
  private treeView: vscode.TreeView<vscode.TreeItem>;
  private disposables: vscode.Disposable[] = [];
  workspaceABTasty: any;

  constructor(
    private context: vscode.ExtensionContext,
    private accountListProvider: AccountListProvider,
    cli: Cli,
    workspaceABTasty: any,
    currentAccountId: string,
  ) {
    this.treeView = vscode.window.createTreeView('webExperimentation.accountList', {
      treeDataProvider: this.accountListProvider,
    });

    this.workspaceABTasty = workspaceABTasty;

    this.treeView.onDidExpandElement(async ({ element }) => {
      if (element instanceof GlobalCodeAccount) {
        console.log(element);
        const accountId = String(element.resourceId);
        const accountGlobalCodePath = `${workspaceABTasty}/.abtasty/${accountId}/accountGlobalCode.js`;
        if (element.children?.length === 0 || element.children![0].label === NO_RESOURCE_FOUND) {
          await cli.PullAccountGlobalCode(accountId, true, true, false);
        }

        element.children?.splice(0, 1)!;

        if (fs.existsSync(accountGlobalCodePath)) {
          element.children?.push(new GlobalCodeAccountItem('accountGlobalCode.js', accountGlobalCodePath, accountId));
        }

        this.accountListProvider._onDidChangeTreeData.fire();
      }
    });
  }

  async refresh(): Promise<void> {
    if (!this.workspaceABTasty) {
      vscode.window.showErrorMessage('No folder or workspace opened');
    }
    this.accountListProvider.refresh();
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}

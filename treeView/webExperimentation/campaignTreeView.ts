import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  CampaignListProvider,
  CampaignTreeItem,
  CampaignWEItem,
  CodeModification,
  CodeModificationItem,
  GlobalCodeCampaign,
  GlobalCodeCampaignItem,
  GlobalCodeVariation,
  GlobalCodeVariationCSSItem,
  GlobalCodeVariationJSItem,
  ModificationWEItem,
  ModificationWETree,
  Parent,
  SimpleItem,
  VariationWEItem,
} from '../../src/providers/webExperimentation/CampaignList';
import { Cli } from '../../src/cli/cmd/webExperimentation/Cli';
import { NO_GLOBAL_CODE_FOUND, NO_RESOURCE_FOUND } from '../../src/const';
import { ModificationWE } from '../../src/model';

export function findAbtastyFolder(rootPath: string) {
  const dirs = fs.readdirSync(rootPath).filter((file) => fs.statSync(path.join(rootPath, file)).isDirectory());
  const abtastyDir = dirs.find((dir) => dir.toLowerCase() === 'abtasty');
  return abtastyDir ? path.join(rootPath, abtastyDir) : null;
}

export class CampaignTreeView {
  private treeView: vscode.TreeView<vscode.TreeItem>;
  private disposables: vscode.Disposable[] = [];
  workspaceABTasty: any;
  currentAccountId: string;

  constructor(
    private context: vscode.ExtensionContext,
    private campaignListProvider: CampaignListProvider,
    cli: Cli,
    workspaceABTasty: any,
    currentAccountId: string,
  ) {
    this.treeView = vscode.window.createTreeView('webExperimentation.campaignList', {
      treeDataProvider: this.campaignListProvider,
    });

    this.currentAccountId = currentAccountId;
    this.workspaceABTasty = workspaceABTasty;

    this.treeView.onDidExpandElement(async ({ element }) => {
      if (element instanceof ModificationWETree) {
        const campaignId = String((element.parent as Parent).id);
        let modifications: ModificationWE[] = [];
        if (element.children?.length === 0 || element.children![0].label === NO_RESOURCE_FOUND) {
          modifications = await cli.ListModificationWE(campaignId);
          element.children?.splice(0, 1)!;
        }

        if (modifications.length !== 0) {
          modifications
            .filter((m) => m.selector !== '' && m.selector !== null)
            .map((m) => {
              const modificationDetails = Object.entries(m).map(
                ([key, value]) => new SimpleItem(key, undefined, value, undefined, undefined),
              );
              const modificationItem = new ModificationWEItem(
                m.name,
                m.id,
                [
                  new CampaignTreeItem('Info/Details', undefined, modificationDetails, campaignId),
                  new CodeModification(
                    'Modification code',
                    m.id,
                    [new CampaignTreeItem(NO_RESOURCE_FOUND, 0, undefined)],
                    (element.parent as Parent).id,
                    m.variation_id,
                  ),
                ],
                campaignId,
              );

              element.children?.push(modificationItem);
            });
        }

        this.campaignListProvider._onDidChangeTreeData.fire();
      }

      if (element instanceof CodeModification) {
        const campaignId = String(element.campaignId);
        const variationId = String(element.variationId);
        const modificationId = String(element.resourceId);
        const modificationCodePath = `${workspaceABTasty}/.abtasty/${currentAccountId}/${campaignId}/${variationId}/${element.resourceId}/element.js`;
        if (element.children?.length === 0 || element.children![0].label === NO_RESOURCE_FOUND) {
          await cli.PullModificationCode(modificationId, campaignId, true, true);
        }

        element.children?.splice(0, 1)!;

        if (fs.existsSync(modificationCodePath)) {
          element.children?.push(
            new CodeModificationItem('element.js', modificationCodePath, campaignId!, variationId, modificationId),
          );
        }

        this.campaignListProvider._onDidChangeTreeData.fire();
        console.log(element);
      }

      if (element instanceof CampaignWEItem) {
        const campaignId = String(element.resourceId);
        if (element.modifications?.length === 0 || element.modifications === undefined) {
          const modifications = await cli.ListModificationWE(campaignId);
          if (modifications.length !== 0) {
            modifications.map((m) => {
              element.modifications?.push(m);
            });
          }
        }

        this.campaignListProvider._onDidChangeTreeData.fire();
      }

      if (element instanceof GlobalCodeCampaign) {
        const campaignId = String((element.parent as Parent).id);
        const campaignGlobalCodePath = `${workspaceABTasty}/.abtasty/${currentAccountId}/${campaignId}/campaignGlobalCode.js`;
        if (element.children?.length === 0 || element.children![0].label === NO_RESOURCE_FOUND) {
          await cli.PullCampaignGlobalCode(campaignId, true, true, false);
        }

        element.children?.splice(0, 1)!;

        if (fs.existsSync(campaignGlobalCodePath)) {
          element.children?.push(
            new GlobalCodeCampaignItem('campaignGlobalCode.js', campaignGlobalCodePath, campaignId),
          );
        }

        this.campaignListProvider._onDidChangeTreeData.fire();
      }

      if (element instanceof GlobalCodeVariation) {
        const variationId = String((element.parent as Parent).id);
        const campaignId = String(((element.parent as Parent).parent as Parent).id);
        const variationGlobalCodeJSPath = `${workspaceABTasty}/.abtasty/${currentAccountId}/${campaignId}/${variationId}/variationGlobalCode.js`;
        const variationGlobalCodeCSSPath = `${workspaceABTasty}/.abtasty/${currentAccountId}/${campaignId}/${variationId}/variationGlobalCode.css`;
        if (
          element.children?.length === 0 ||
          element.children![0].label === NO_RESOURCE_FOUND ||
          element.children![0].label === NO_GLOBAL_CODE_FOUND
        ) {
          await cli.PullVariationGlobalCodeJS(variationId, campaignId, true, true);
          await cli.PullVariationGlobalCodeCSS(variationId, campaignId, true, true);
        }

        element.children?.splice(0, 2)!;

        if (fs.existsSync(variationGlobalCodeJSPath)) {
          element.children?.push(
            new GlobalCodeVariationJSItem('variationGlobalCode.js', variationGlobalCodeJSPath, campaignId, variationId),
          );
        }

        if (fs.existsSync(variationGlobalCodeCSSPath)) {
          element.children?.push(
            new GlobalCodeVariationCSSItem(
              'variationGlobalCode.css',
              variationGlobalCodeCSSPath,
              campaignId,
              variationId,
            ),
          );
        }

        this.campaignListProvider._onDidChangeTreeData.fire();
      }
    });
  }

  async refresh(): Promise<void> {
    if (!this.workspaceABTasty) {
      vscode.window.showErrorMessage('No folder or workspace opened');
    }
    this.campaignListProvider.refresh();
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}

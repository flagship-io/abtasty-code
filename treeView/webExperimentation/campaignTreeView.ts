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

type ModificationByCampaigns = {
  campaignId: string;
  modifications: ModificationWE[];
};

export class CampaignTreeView {
  private treeView: vscode.TreeView<vscode.TreeItem>;
  private disposables: vscode.Disposable[] = [];
  workspaceABTasty: any;
  public _modificationByCampaigns: ModificationByCampaigns[] = [];

  constructor(
    private context: vscode.ExtensionContext,
    private campaignListProvider: CampaignListProvider,
    cli: Cli,
    workspaceABTasty: any,
  ) {
    this.treeView = vscode.window.createTreeView('webExperimentation.campaignList', {
      treeDataProvider: this.campaignListProvider,
    });
    this.workspaceABTasty = workspaceABTasty;

    this.treeView.onDidExpandElement(async ({ element }) => {
      if (element instanceof ModificationWETree) {
        const campaignId = String((element.parent as Parent).parent.id);
        const variationId = String((element.parent as Parent).id);
        let _modifications: ModificationWE[] = [];
        if (element.children?.length === 0 || element.children![0].label === NO_RESOURCE_FOUND) {
          if (!this._modificationByCampaigns.find((m) => m.campaignId === campaignId)) {
            const modifications = await cli.ListModificationWE(campaignId);
            if (modifications.length !== 0) {
              this._modificationByCampaigns.push({ campaignId, modifications });
            }
          }

          const modifications = this._modificationByCampaigns.find((m) => m.campaignId === campaignId)?.modifications;
          if (modifications?.filter((m) => String(m.variation_id) === variationId)) {
            _modifications = modifications;
            element.children?.splice(0, 1)!;
          }
        }

        if (_modifications.length !== 0) {
          _modifications
            .filter(
              (m) =>
                m.selector !== '' &&
                m.selector !== null &&
                String(m.variation_id) === variationId &&
                m.type === 'customScriptNew',
            )
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
                    (element.parent as Parent).parent.id,
                    m.variation_id,
                    (element.parent as Parent).parent.parent.id,
                  ),
                ],
                campaignId,
                element,
              );

              element.children?.push(modificationItem);
            });
        }

        this.campaignListProvider._onDidChangeTreeData.fire();
      }

      if (element instanceof CodeModification) {
        const accountId = String(element.accountId);
        const campaignId = String(element.campaignId);
        const variationId = String(element.variationId);
        const modificationId = String(element.resourceId);
        const modificationCodePath = `${workspaceABTasty}/.abtasty/${accountId}/${campaignId}/${variationId}/${element.resourceId}/element.js`;
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
      }

      if (element instanceof CampaignWEItem) {
        const campaignId = String(element.resourceId);
        if (element.modifications?.length === 0 || element.modifications === undefined) {
          const modifications = await cli.ListModificationWE(campaignId);
          if (modifications.length !== 0) {
            element.modifications = modifications;
            this._modificationByCampaigns.push({ campaignId, modifications });
          }
        }

        this.campaignListProvider._onDidChangeTreeData.fire();
      }

      if (element instanceof VariationWEItem) {
        const campaignId = String(element.parent.parent.id);
        const variationId = String(element.resourceId);
        if (element.modifications?.length === 0 || element.modifications === undefined) {
          if (this._modificationByCampaigns.length !== 0) {
            const modifications = this._modificationByCampaigns.find((m) => m.campaignId === campaignId)?.modifications;
            if (modifications) {
              const modificationForVariation = modifications.filter((m) => String(m.variation_id) === variationId);
              if (modificationForVariation) {
                element.modifications = modificationForVariation;
              }
            }
          }
        }

        this.campaignListProvider._onDidChangeTreeData.fire();
      }

      if (element instanceof GlobalCodeCampaign) {
        const accountId = String((element.parent as Parent).parent.id);
        const campaignId = String((element.parent as Parent).id);
        const campaignGlobalCodePath = `${workspaceABTasty}/.abtasty/${accountId}/${campaignId}/campaignGlobalCode.js`;
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
        const accountId = String(((element.parent as Parent).parent as Parent).parent.id);
        const variationGlobalCodeJSPath = `${workspaceABTasty}/.abtasty/${accountId}/${campaignId}/${variationId}/variationGlobalCode.js`;
        const variationGlobalCodeCSSPath = `${workspaceABTasty}/.abtasty/${accountId}/${campaignId}/${variationId}/variationGlobalCode.css`;
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
    this._modificationByCampaigns = [];
    await this.campaignListProvider.refresh();
  }

  async fire(): Promise<void> {
    this._modificationByCampaigns = [];
    await this.campaignListProvider.fire();
  }

  async load(): Promise<void> {
    this._modificationByCampaigns = [];
    await this.campaignListProvider.load();
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }

  reveal(
    element: vscode.TreeItem,
    options?: {
      select?: boolean;
      focus?: boolean;
      expand?: boolean | number;
    },
  ) {
    this.treeView.reveal(element, options);
  }
}

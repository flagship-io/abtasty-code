import * as vscode from 'vscode';
import { Cli } from '../../cli/cmd/webExperimentation/Cli';
import { VariationWE } from '../../model';
import { VariationDataService } from '../../services/webExperimentation/VariationDataService';

export class VariationStore {
  private cli: Cli;
  private variationService: VariationDataService;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.cli = cli;
    this.variationService = new VariationDataService(context);
  }

  loadVariation(): VariationWE[] {
    return this.variationService.getState();
  }

  async refreshVariation(campaignId: number, variationIds: number[]): Promise<VariationWE[]> {
    const variations = await Promise.all(
      variationIds.map(async (id) => {
        return this.cli.ListVariationWE(campaignId, id);
      }),
    );
    await this.variationService.loadState(variations);
    return variations;
  }

  async deleteVariation(variationId: number, campaignId: number): Promise<boolean> {
    const cliResponse = variationId ? await this.cli.DeleteVariationWE(String(variationId), String(campaignId)) : false;
    if (cliResponse) {
      await this.variationService.deleteVariation(variationId);
      vscode.window.showInformationMessage(`[AB Tasty] Variation deleted successfully`);
    }
    return cliResponse;
  }
}

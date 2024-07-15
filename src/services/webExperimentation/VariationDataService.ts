import * as vscode from 'vscode';
import { GLOBAL_LIST_VARIATION_WE } from './const';
import { VariationWE } from '../../model';

export class VariationDataService {
  private context: vscode.ExtensionContext;
  private variationList: VariationWE[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.variationList = this.context.globalState.get(GLOBAL_LIST_VARIATION_WE) || [];
  }

  getState(): VariationWE[] {
    return this.variationList;
  }

  async loadState(state: VariationWE[]) {
    this.variationList = state;
    await this.context.globalState.update(GLOBAL_LIST_VARIATION_WE, this.variationList);
  }

  async saveVariation(variation: VariationWE) {
    const newVariations = [...this.variationList, variation];
    await this.loadState(newVariations);
  }

  async editVariation(variationId: number, newVariation: VariationWE) {
    const oldVariations = this.variationList.filter((m) => variationId !== m.id);
    const newVariations = [...oldVariations, newVariation];
    await this.loadState(newVariations);
  }

  async deleteVariation(variationId: number) {
    const newVariations = this.variationList.filter((m) => variationId !== m.id);
    await this.loadState(newVariations);
  }
}

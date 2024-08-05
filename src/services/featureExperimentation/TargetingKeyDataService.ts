import * as vscode from 'vscode';
import { TargetingKey } from '../../model';
import { GLOBAL_LIST_TARGETING_KEY } from './const';

export class TargetingKeyDataService {
  private context: vscode.ExtensionContext;
  private targetingKeyList: TargetingKey[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.targetingKeyList = this.context.globalState.get(GLOBAL_LIST_TARGETING_KEY) || [];
  }

  getState(): TargetingKey[] {
    return this.targetingKeyList;
  }

  async loadState(state: TargetingKey[]) {
    this.targetingKeyList = state;
    await this.context.globalState.update(GLOBAL_LIST_TARGETING_KEY, this.targetingKeyList);
  }

  async saveTargetingKey(targetingKey: TargetingKey) {
    const newTargetingKeys = [...this.targetingKeyList, targetingKey];
    await this.loadState(newTargetingKeys);
  }

  async editTargetingKey(targetingKeyId: string, newTargetingKey: TargetingKey) {
    const oldTargetingKeys = this.targetingKeyList.filter((t) => targetingKeyId !== t.id);
    const newTargetingKeys = [...oldTargetingKeys, newTargetingKey];
    await this.loadState(newTargetingKeys);
  }

  async deleteTargetingKey(targetingKeyId: string) {
    const newTargetingKeys = this.targetingKeyList.filter((t) => targetingKeyId !== t.id);
    await this.loadState(newTargetingKeys);
  }
}

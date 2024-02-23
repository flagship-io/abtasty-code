import * as vscode from 'vscode';
import { TargetingKey } from '../model';
import { GLOBAL_LIST_TARGETING_KEY } from './const';

export class TargetingKeyDataService {
  private context: vscode.ExtensionContext;
  private targetingKeyList: TargetingKey[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.targetingKeyList = this.context.globalState.get(GLOBAL_LIST_TARGETING_KEY)!;
  }

  getState(): TargetingKey[] {
    return this.targetingKeyList;
  }

  loadState(state: TargetingKey[]) {
    this.targetingKeyList = state;
    this.context.globalState.update(GLOBAL_LIST_TARGETING_KEY, this.targetingKeyList);
  }

  saveTargetingKey(targetingKey: TargetingKey) {
    const newTargetingKeys = [...this.targetingKeyList, targetingKey];
    this.loadState(newTargetingKeys);
  }

  editTargetingKey(targetingKeyId: string, newTargetingKey: TargetingKey) {
    const oldTargetingKeys = this.targetingKeyList.filter((t) => targetingKeyId !== t.id);
    const newTargetingKeys = [...oldTargetingKeys, newTargetingKey];
    this.loadState(newTargetingKeys);
  }

  deleteTargetingKey(targetingKeyId: string) {
    const newTargetingKeys = this.targetingKeyList.filter((t) => targetingKeyId !== t.id);
    this.loadState(newTargetingKeys);
  }
}

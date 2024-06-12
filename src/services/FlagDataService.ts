import * as vscode from 'vscode';
import { Flag } from '../model';
import { FEATURE_EXPERIMENTATION_LIST_FLAG_IN_WORKSPACE } from '../commands/const';
import { GLOBAL_LIST_FLAG } from './const';

export class FlagDataService {
  private context: vscode.ExtensionContext;
  private flagList: Flag[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.flagList = this.context.globalState.get(GLOBAL_LIST_FLAG) || [];
  }

  getState(): Flag[] {
    return this.flagList;
  }

  async loadState(state: Flag[]) {
    this.flagList = state;
    await this.context.globalState.update(GLOBAL_LIST_FLAG, state);
  }

  async saveFlag(flag: Flag) {
    const newFlags = [...this.flagList, flag];
    await this.loadState(newFlags);
  }

  async editFlag(flagId: string, newFlag: Flag) {
    const oldFlags = this.flagList.filter((f) => flagId !== f.id);
    const newFlags = [...oldFlags, newFlag];
    await this.loadState(newFlags);
  }

  async deleteFlag(flagId: string) {
    const newFlags = this.flagList.filter((f) => flagId !== f.id);
    await this.loadState(newFlags);
  }
}

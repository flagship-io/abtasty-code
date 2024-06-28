import * as vscode from 'vscode';
import { GLOBAL_LIST_MODIFICATION_WE } from './const';
import { ModificationWE } from '../../model';

export class ModificationDataService {
  private context: vscode.ExtensionContext;
  private modificationList: ModificationWE[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.modificationList = this.context.globalState.get(GLOBAL_LIST_MODIFICATION_WE) || [];
  }

  getState(): ModificationWE[] {
    return this.modificationList;
  }

  async loadState(state: ModificationWE[]) {
    this.modificationList = state;
    await this.context.globalState.update(GLOBAL_LIST_MODIFICATION_WE, this.modificationList);
  }

  async saveModification(modification: ModificationWE) {
    const newModifications = [...this.modificationList, modification];
    await this.loadState(newModifications);
  }

  async editModification(modificationId: number, newModification: ModificationWE) {
    const oldModifications = this.modificationList.filter((m) => modificationId !== m.id);
    const newModifications = [...oldModifications, newModification];
    await this.loadState(newModifications);
  }

  async deleteModification(modificationId: number) {
    const newModifications = this.modificationList.filter((m) => modificationId !== m.id);
    await this.loadState(newModifications);
  }
}

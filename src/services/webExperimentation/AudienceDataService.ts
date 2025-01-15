import * as vscode from 'vscode';
import { GLOBAL_LIST_AUDIENCE_WE } from './const';
import { Audience } from '../../model';

export class AudienceDataService {
  private context: vscode.ExtensionContext;
  private audienceList: Audience[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.audienceList = this.context.globalState.get(GLOBAL_LIST_AUDIENCE_WE) || [];
  }

  getState(): Audience[] {
    return this.audienceList;
  }

  async loadState(state: Audience[]) {
    this.audienceList = state;
    await this.context.globalState.update(GLOBAL_LIST_AUDIENCE_WE, this.audienceList);
  }

  async saveAudience(audience: Audience) {
    const newAudiences = [...this.audienceList, audience];
    await this.loadState(newAudiences);
  }

  async editAudience(audienceId: string, newAudience: Audience) {
    const oldAudiences = this.audienceList.filter((a) => audienceId !== a.id);
    const newAudiences = [...oldAudiences, newAudience];
    await this.loadState(newAudiences);
    return newAudiences;
  }

  async deleteAudience(audienceId: string) {
    const newAudiences = this.audienceList.filter((a) => audienceId !== a.id);
    await this.loadState(newAudiences);
  }
}

/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

import { CredentialStore } from './model';
import { CONFIGURATION_LIST, CURRENT_CONFIGURATION } from './const';
import { GLOBAL_LIST_FLAG, GLOBAL_LIST_GOAL, GLOBAL_LIST_PROJECT, GLOBAL_LIST_TARGETING_KEY } from './services/const';

export class Configuration {
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async updateGlobalState(key: string, value: string | CredentialStore[] | CredentialStore): Promise<void> {
    await this.context.globalState.update(key, value);
    (<any>this)[key] = value as string;
    return;
  }

  async getGlobalState(key: string): Promise<CredentialStore[] | CredentialStore | unknown> {
    const currValue = await this.context.globalState.get(key);
    if (typeof currValue !== 'undefined') {
      return currValue;
    }
  }

  async clearGlobalConfig(): Promise<void> {
    await this.context.globalState.update(CONFIGURATION_LIST, undefined);
    await this.context.globalState.update(CURRENT_CONFIGURATION, undefined);
    await this.context.globalState.update(GLOBAL_LIST_FLAG, undefined);
    await this.context.globalState.update(GLOBAL_LIST_TARGETING_KEY, undefined);
    await this.context.globalState.update(GLOBAL_LIST_PROJECT, undefined);
    await this.context.globalState.update(GLOBAL_LIST_GOAL, undefined);
  }

  async hasGlobalConfigured(): Promise<boolean> {
    return !!(await this.context.globalState.get(CONFIGURATION_LIST));
  }

  async isGlobalConfigured(): Promise<boolean> {
    return (
      !!(await this.context.globalState.get(CURRENT_CONFIGURATION)) &&
      !!(await this.context.globalState.get('FSConfigured'))
    );
  }
}

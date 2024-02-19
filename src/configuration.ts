/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

import { CredentialStore } from './model';
import { CONFIGURATION_LIST, CURRENT_CONFIGURATION } from './const';

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

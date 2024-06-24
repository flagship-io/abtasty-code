/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import {
  FEATURE_EXPERIMENTATION_CONFIGURED,
  GLOBAL_CURRENT_AUTHENTICATION_FE,
  GLOBAL_LIST_FLAG,
  GLOBAL_LIST_GOAL,
  GLOBAL_LIST_PROJECT,
  GLOBAL_LIST_TARGETING_KEY,
} from './services/featureExperimentation/const';
import { GLOBAL_CURRENT_AUTHENTICATION_WE, WEB_EXPERIMENTATION_CONFIGURED } from './services/webExperimentation/const';

export class StateConfiguration {
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async updateGlobalState(key: string, value: unknown): Promise<void> {
    await this.context.globalState.update(key, value);
    (<any>this)[key] = value as string;
    return;
  }

  getGlobalState(key: string): unknown {
    const currValue = this.context.globalState.get(key);
    if (typeof currValue !== 'undefined') {
      return currValue;
    }
    return {};
  }

  async clearGlobalConfigFeatExp(): Promise<void> {
    await this.context.globalState.update(GLOBAL_CURRENT_AUTHENTICATION_FE, undefined);
    await this.context.globalState.update(GLOBAL_LIST_FLAG, undefined);
    await this.context.globalState.update(GLOBAL_LIST_TARGETING_KEY, undefined);
    await this.context.globalState.update(GLOBAL_LIST_PROJECT, undefined);
    await this.context.globalState.update(GLOBAL_LIST_GOAL, undefined);
  }

  async isGlobalConfiguredFeatExp(): Promise<boolean> {
    return (
      !!(await this.context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE)) &&
      !!(await this.context.globalState.get(FEATURE_EXPERIMENTATION_CONFIGURED))
    );
  }

  async clearGlobalConfigWebExp(): Promise<void> {
    await this.context.globalState.update(GLOBAL_CURRENT_AUTHENTICATION_WE, undefined);
    // TODO
    await this.context.globalState.update(GLOBAL_LIST_FLAG, undefined);
  }

  async isGlobalConfiguredWebExp(): Promise<boolean> {
    return (
      !!(await this.context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_WE)) &&
      !!(await this.context.globalState.get(WEB_EXPERIMENTATION_CONFIGURED))
    );
  }
}

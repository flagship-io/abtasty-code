import * as vscode from 'vscode';
import { Configuration, Flag } from '../model';

import { GLOBAL_CURRENT_CONFIGURATION, GLOBAL_LIST_CONFIGURATION } from './const';

export class ConfigurationDataService {
  private context: vscode.ExtensionContext;
  private configurationList: Configuration[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.configurationList = this.context.globalState.get(GLOBAL_LIST_CONFIGURATION) || [];
  }

  getState(): Configuration[] {
    return this.configurationList;
  }

  async loadState(state: Configuration[]) {
    this.configurationList = state;
    await this.context.globalState.update(GLOBAL_LIST_CONFIGURATION, this.configurationList);
  }

  async saveConfiguration(configuration: Configuration) {
    const newConfigurations = [...this.configurationList, configuration];
    await this.loadState(newConfigurations);
  }

  async editConfiguration(configurationName: string, newConfiguration: Configuration) {
    const oldConfigurations = this.configurationList.filter((c) => c.name !== configurationName);
    const newConfigurations = [...oldConfigurations, newConfiguration];
    await this.loadState(newConfigurations);
  }

  async deleteConfiguration(configurationName: string) {
    const newConfigurations = this.configurationList.filter((c) => configurationName !== c.name);
    await this.loadState(newConfigurations);
  }

  async setCurrentConfiguration(configuration: Configuration) {
    await this.context.globalState.update(GLOBAL_CURRENT_CONFIGURATION, configuration);
  }

  getCurrentConfiguration(): Configuration {
    return this.context.globalState.get(GLOBAL_CURRENT_CONFIGURATION) as Configuration;
  }
}

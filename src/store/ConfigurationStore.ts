import * as vscode from 'vscode';
import { Configuration, TokenInfo } from '../model';
import { Cli } from '../providers/Cli';
import { ConfigurationDataService } from '../services/ConfigurationDataService';

export class ConfigurationStore {
  private cli: Cli;
  private configurationService;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.cli = cli;
    this.configurationService = new ConfigurationDataService(context);
  }

  loadConfiguration(): Configuration[] {
    return this.configurationService.getState();
  }

  async refreshConfiguration(): Promise<Configuration[]> {
    const configurations = await this.cli.ListConfiguration();
    if (configurations) {
      await this.configurationService.loadState(configurations);
    }
    return configurations;
  }

  async saveConfiguration(configuration: Configuration): Promise<Configuration> {
    const cliResponse = await this.cli.CreateConfiguration(configuration);
    if (cliResponse) {
      await this.configurationService.saveConfiguration(configuration);
      vscode.window.showInformationMessage(`[Flagship] Configuration created successfully !`);
    }
    return configuration;
  }

  async editConfiguration(configurationName: string, newConfiguration: Configuration): Promise<Configuration> {
    const cliResponse = configurationName
      ? await this.cli.EditConfiguration(configurationName, newConfiguration)
      : ({} as Configuration);
    if (cliResponse) {
      await this.configurationService.editConfiguration(configurationName, newConfiguration);
      vscode.window.showInformationMessage(`[Flagship] Configuration edited successfully`);
    }
    return newConfiguration;
  }

  async deleteConfiguration(configurationName: string): Promise<boolean> {
    const cliResponse = configurationName ? await this.cli.DeleteConfiguration(configurationName) : false;
    if (cliResponse) {
      await this.configurationService.deleteConfiguration(configurationName);
      vscode.window.showInformationMessage(`[Flagship] Configuration deleted successfully`);
    }
    return cliResponse;
  }

  async useConfiguration(configuration: Configuration) {
    const cliResponse = await this.cli.UseConfiguration(configuration.name);
    const tokenScope = await this.cli.GetTokenInfo();
    if (cliResponse) {
      configuration.scope = tokenScope.scope;
      await this.configurationService.setCurrentConfiguration(configuration);
      vscode.window.showInformationMessage(`[Flagship] Configuration ${configuration.name} selected successfully`);
    }
  }

  /*   async getCurrentConfiguration() {
    const cliResponse = await this.cli.CurrentConfiguration();
    if (cliResponse) {
      this.configurationService.setCurrentConfiguration(cliResponse);
      vscode.window.showInformationMessage(`[Flagship] Configuration ${cliResponse.name} is used`);
    }
    return cliResponse;
  } */

  async getCurrentConfiguration() {
    return this.configurationService.getCurrentConfiguration();
  }

  async getTokenInfo(): Promise<TokenInfo> {
    return await this.cli.GetTokenInfo();
  }
}

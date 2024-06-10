import * as vscode from 'vscode';
import { Configuration, TokenInfo } from '../model';
import { Cli } from '../providers/Cli';
import { ConfigurationDataService } from '../services/ConfigurationDataService';

export class AuthenticationStore {
  private cli: Cli;
  private authenticationService;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.cli = cli;
    this.authenticationService = new ConfigurationDataService(context);
  }

  loadConfiguration(): Configuration[] {
    return this.authenticationService.getState();
  }

  async refreshConfiguration(): Promise<Configuration[]> {
    const configurations = await this.cli.ListConfiguration();
    if (configurations) {
      await this.authenticationService.loadState(configurations);
    }
    return configurations;
  }

  async saveConfiguration(configuration: Configuration): Promise<Configuration> {
    const cliResponse = await this.cli.CreateConfiguration(configuration);
    if (cliResponse) {
      await this.authenticationService.saveConfiguration(configuration);
      vscode.window.showInformationMessage(`[Flagship] Configuration created successfully !`);
    }
    return configuration;
  }

  async editConfiguration(configurationName: string, newConfiguration: Configuration): Promise<Configuration> {
    const cliResponse = configurationName
      ? await this.cli.EditConfiguration(configurationName, newConfiguration)
      : ({} as Configuration);
    if (cliResponse) {
      await this.authenticationService.editConfiguration(configurationName, newConfiguration);
      vscode.window.showInformationMessage(`[Flagship] Configuration edited successfully`);
    }
    return newConfiguration;
  }

  async deleteConfiguration(configurationName: string): Promise<boolean> {
    const cliResponse = configurationName ? await this.cli.DeleteConfiguration(configurationName) : false;
    if (cliResponse) {
      await this.authenticationService.deleteConfiguration(configurationName);
      vscode.window.showInformationMessage(`[Flagship] Configuration deleted successfully`);
    }
    return cliResponse;
  }

  async useConfiguration(configuration: Configuration) {
    const cliResponse = await this.cli.UseConfiguration(configuration.name);
    const tokenScope = await this.cli.GetTokenInfo();
    if (cliResponse) {
      configuration.scope = tokenScope.scope;
      await this.authenticationService.setCurrentConfiguration(configuration);
      vscode.window.showInformationMessage(`[Flagship] Configuration ${configuration.name} selected successfully`);
    }
  }

  async getCurrentConfiguration() {
    const cliResponse = await this.cli.CurrentConfiguration();
    const tokenScope = await this.cli.GetTokenInfo();
    if (cliResponse.name) {
      cliResponse.scope = tokenScope.scope;
      this.authenticationService.setCurrentConfiguration(cliResponse);
    }
    return cliResponse;
  }

  async getTokenInfo(): Promise<TokenInfo> {
    return await this.cli.GetTokenInfo();
  }
}

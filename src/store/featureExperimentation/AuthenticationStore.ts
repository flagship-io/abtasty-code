import * as vscode from 'vscode';
import { Authentication, TokenInfo } from '../../model';
import { Cli } from '../../cli/cmd/featureExperimentation/Cli';
import { AuthenticationDataService } from '../../services/featureExperimentation/AuthenticationDataService';

export class AuthenticationStore {
  private cli: Cli;
  private authenticationService;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.cli = cli;
    this.authenticationService = new AuthenticationDataService(context);
  }

  loadAuthentication(): Authentication[] {
    return this.authenticationService.getState();
  }

  async refreshAuthentication(): Promise<Authentication[]> {
    const authentications = await this.cli.ListAuthentication();
    if (authentications) {
      await this.authenticationService.loadState(authentications);
    }

    return authentications;
  }

  async selectEnvironment(authentication: Authentication) {
    const accEnvSet = await this.cli.UseAccountEnvironment(authentication);
    if (accEnvSet) {
      vscode.window.showInformationMessage(`[AB Tasty] Account Environment selected successfully !`);
      return;
    }

    vscode.window.showErrorMessage(`[AB Tasty] Error while selecting account environment !`);
  }

  async createOrSetAuthentication(authentication: Authentication): Promise<Authentication> {
    const cliResponse = await this.cli.LoginAuthentication(authentication);
    if (cliResponse) {
      await this.authenticationService.saveAuthentication(authentication);
      vscode.window.showInformationMessage(`[AB Tasty] Authentication set successfully !`);
      return authentication;
    }

    vscode.window.showErrorMessage(`[AB Tasty] Error while creating Authentication !`);
    return {} as Authentication;
  }

  async deleteAuthentication(authenticationUsername: string): Promise<boolean> {
    const cliResponse = authenticationUsername ? await this.cli.DeleteAuthentication(authenticationUsername) : false;
    if (cliResponse) {
      await this.authenticationService.deleteAuthentication(authenticationUsername);
      vscode.window.showInformationMessage(`[AB Tasty] Authentication deleted successfully`);
    }

    return cliResponse;
  }

  async getCurrentAuthentication() {
    const currAuth = await this.cli.CurrentAuthentication();
    const tokenScope = await this.cli.GetTokenInfo();
    const cliResponse = await this.cli.GetAuthentication(currAuth.current_used_credential);
    if (cliResponse.username) {
      cliResponse.scope = tokenScope.scope;
      this.authenticationService.setCurrentAuthentication(cliResponse);
    }

    return cliResponse;
  }

  async getAccountEnvironmentList() {
    const cliResponse = await this.cli.ListAccountEnvironment();
    return cliResponse;
  }

  async getTokenInfo(): Promise<TokenInfo> {
    return await this.cli.GetTokenInfo();
  }
}

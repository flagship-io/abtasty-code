import * as vscode from 'vscode';
import { Authentication, TokenInfo } from '../model';
import { Cli } from '../providers/Cli';
import { AuthenticationDataService } from '../services/AuthenticationDataService';

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

  async saveAuthentication(authentication: Authentication): Promise<Authentication> {
    const cliResponse = await this.cli.LoginAuthentication(authentication);
    if (cliResponse) {
      await this.authenticationService.saveAuthentication(authentication);
      vscode.window.showInformationMessage(`[AB Tasty] Authentication created successfully !`);
    }
    return authentication;
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
    const cliResponse = await this.cli.CurrentAuthentication();
    const tokenScope = await this.cli.GetTokenInfo();
    if (cliResponse.username) {
      cliResponse.scope = tokenScope.scope;
      this.authenticationService.setCurrentAuthentication(cliResponse);
    }
    return cliResponse;
  }

  async getTokenInfo(): Promise<TokenInfo> {
    return await this.cli.GetTokenInfo();
  }
}

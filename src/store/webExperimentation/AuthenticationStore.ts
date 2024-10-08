import * as vscode from 'vscode';
import { Authentication } from '../../model';
import { Cli } from '../../cli/cmd/webExperimentation/Cli';
import { AuthenticationDataService } from '../../services/webExperimentation/AuthenticationDataService';

export class AuthenticationStore {
  private cli: Cli;
  private authenticationService: AuthenticationDataService;

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

  async selectAccount(accountId: string) {
    const accSet = await this.cli.UseAccount(accountId);
    if (accSet) {
      vscode.window.showInformationMessage(`[AB Tasty] Account selected successfully !`);
      return;
    }

    vscode.window.showErrorMessage(`[AB Tasty] Error while selecting account !`);
  }

  async selectDefaultWorkingDir(workingDir: string) {
    const accSet = await this.cli.UseWorkingDir(workingDir);
    if (accSet) {
      vscode.window.showInformationMessage(`[AB Tasty] Working directory set successfully !`);
      return;
    }

    vscode.window.showErrorMessage(`[AB Tasty] Error while setting working directory !`);
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
    const cliResponse = await this.cli.GetAuthentication(currAuth.current_used_credential!);
    if (cliResponse.username) {
      this.authenticationService.setCurrentAuthentication(cliResponse);
    }
    return cliResponse;
  }

  async getAccountList() {
    const cliResponse = await this.cli.ListAccountWE();
    return cliResponse;
  }
}

import * as vscode from 'vscode';
import { Authentication } from '../model';

import { GLOBAL_CURRENT_AUTHENTICATION, GLOBAL_LIST_AUTHENTICATION } from './const';

export class AuthenticationDataService {
  private context: vscode.ExtensionContext;
  private authenticationList: Authentication[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.authenticationList = this.context.globalState.get(GLOBAL_LIST_AUTHENTICATION) || [];
  }

  getState(): Authentication[] {
    return this.authenticationList;
  }

  async loadState(state: Authentication[]) {
    this.authenticationList = state;
    await this.context.globalState.update(GLOBAL_CURRENT_AUTHENTICATION, this.authenticationList);
  }

  async saveAuthentication(authentication: Authentication) {
    const newAuthentications = [...this.authenticationList, authentication];
    await this.loadState(newAuthentications);
  }

  async deleteAuthentication(authenticationUsername: string) {
    const newAuthentications = this.authenticationList.filter((c) => authenticationUsername !== c.username);
    await this.loadState(newAuthentications);
  }

  async setCurrentAuthentication(authentication: Authentication) {
    await this.context.globalState.update(GLOBAL_CURRENT_AUTHENTICATION, authentication);
  }

  getCurrentAuthentication(): Authentication {
    return this.context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION) as Authentication;
  }
}

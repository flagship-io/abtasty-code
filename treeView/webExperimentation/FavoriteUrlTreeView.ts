import * as vscode from 'vscode';
import { Cli } from '../../src/cli/cmd/webExperimentation/Cli';
import { FavoriteUrlListProvider } from '../../src/providers/webExperimentation/FavoriteUrlList';

export class FavoriteUrlTreeView {
  private treeView: vscode.TreeView<vscode.TreeItem>;
  private disposables: vscode.Disposable[] = [];
  workspaceABTasty: any;

  constructor(
    private context: vscode.ExtensionContext,
    private favoriteUrlListProvider: FavoriteUrlListProvider,
    cli: Cli,
    workspaceABTasty: any,
    currentAccountId: string,
  ) {
    this.treeView = vscode.window.createTreeView('webExperimentation.favoriteUrlList', {
      treeDataProvider: this.favoriteUrlListProvider,
    });

    this.workspaceABTasty = workspaceABTasty;

    this.treeView.onDidExpandElement(async ({ element }) => {});
  }

  async refresh(): Promise<void> {
    if (!this.workspaceABTasty) {
      vscode.window.showErrorMessage('No folder or workspace opened');
    }
    this.favoriteUrlListProvider.refresh();
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}

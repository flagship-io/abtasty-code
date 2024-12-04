import * as vscode from 'vscode';
import { Cli } from '../../src/cli/cmd/webExperimentation/Cli';
import { AudienceListProvider } from '../../src/providers/webExperimentation/AudienceList';

export class AudienceTreeView {
  private treeView: vscode.TreeView<vscode.TreeItem>;
  private disposables: vscode.Disposable[] = [];
  workspaceABTasty: any;

  constructor(
    private context: vscode.ExtensionContext,
    private audienceListProvider: AudienceListProvider,
    cli: Cli,
    workspaceABTasty: any,
    currentAccountId: string,
  ) {
    this.treeView = vscode.window.createTreeView('webExperimentation.audienceList', {
      treeDataProvider: this.audienceListProvider,
    });

    this.workspaceABTasty = workspaceABTasty;

    this.treeView.onDidExpandElement(async ({ element }) => {});
  }

  async refresh(): Promise<void> {
    if (!this.workspaceABTasty) {
      vscode.window.showErrorMessage('No folder or workspace opened');
    }
    this.audienceListProvider.refresh();
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}

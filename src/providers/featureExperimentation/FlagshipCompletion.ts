import * as vscode from 'vscode';

import { Flag } from '../../model';
import { isGetFlagFunction } from '../../setupFeatExpProviders';
import { FEATURE_EXPERIMENTATION_TRIGGER_FLAG_COMPLETION } from '../../commands/const';
import { FlagItem } from './FlagList';
import { Cli } from '../../cli/cmd/featureExperimentation/Cli';

var triggerFlagCompletion = false;

export default class FlagshipCompletionProvider implements vscode.CompletionItemProvider {
  private readonly context: vscode.ExtensionContext;
  private readonly cli: Cli;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.context = context;
    this.cli = cli;

    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_TRIGGER_FLAG_COMPLETION, async () => {
      triggerFlagCompletion = true;
      vscode.commands.executeCommand('editor.action.triggerSuggest');
    });
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.CompletionItem[] | undefined> {
    const linePrefix = document.lineAt(position).text.substring(0, position.character);
    if (isGetFlagFunction(linePrefix) || triggerFlagCompletion) {
      triggerFlagCompletion = false;
      const flagItems = transformFlagToItem(await this.cli.ListFlag());

      return flagItems.map((flag: FlagItem) => {
        const flagCompletion = new vscode.CompletionItem(flag.key!, vscode.CompletionItemKind.Field);
        const mark = new vscode.MarkdownString();
        mark.isTrusted = true;
        mark.supportHtml = true;
        mark.value = `Flag: ${flag.key}`;
        flagCompletion.detail = flag.type ? `[AB Tasty] Type: ${flag.type}` : '';
        mark.appendMarkdown(`<p>Description: ${flag.description}</p>`);
        mark.appendMarkdown(`<p>Default value: ${flag.defaultValue}</p>`);

        flagCompletion.documentation = mark;
        return flagCompletion;
      });
    }
  }
}

const transformFlagToItem = (flagList: Flag[]) => {
  const flagItems: FlagItem[] = [];
  flagList.map((f) => {
    const flag = new FlagItem(
      f.id,
      f.name,
      f.type,
      f.description,
      f.default_value,
      vscode.TreeItemCollapsibleState.Collapsed,
    );
    flagItems.push(flag);
  });
  return flagItems;
};

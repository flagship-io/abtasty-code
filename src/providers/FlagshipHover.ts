import * as vscode from 'vscode';
import { Cli } from './Cli';
import { CredentialStore, Flag } from '../model';
import { Configuration } from '../configuration';
import { CURRENT_CONFIGURATION, DEFAULT_BASE_URI } from '../const';
import { FLAGSHIP_CREATE_FLAG, FLAGSHIP_OPEN_BROWSER } from '../commands/const';
import { isGetFlagFunction } from '../setupProviders';

export const CANDIDATE_REGEX = /[\w\d][.\w\d\_\-]*/;

export default class FlagshipHoverProvider implements vscode.HoverProvider {
  private readonly context: vscode.ExtensionContext;
  private readonly cli: Cli;
  private readonly config: Configuration;

  constructor(context: vscode.ExtensionContext, cli: Cli, config: Configuration) {
    this.context = context;
    this.cli = cli;
    this.config = config;
  }

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Hover | undefined> {
    const baseUrl = `${DEFAULT_BASE_URI}/env`;
    const { accountEnvId } = (await this.config.getWorkspaceState(CURRENT_CONFIGURATION)) as CredentialStore;
    const flagList: Flag[] = await this.cli.ListFlag();
    const candidate = document.getText(document.getWordRangeAtPosition(position, CANDIDATE_REGEX));
    const linePrefix = document.lineAt(position).text.substring(0, position.character);
    if (typeof candidate === 'undefined') {
      return;
    }
    const mark = new vscode.MarkdownString();
    mark.isTrusted = true;
    mark.supportHtml = true;
    mark.supportThemeIcons = true;
    const flag = flagList.find((f) => f.name === candidate);
    if (isGetFlagFunction(linePrefix)) {
      if (flag) {
        switch (flag.type) {
          case 'string':
            mark.value = `$(symbol-string) Flag: ${flag.name}\n<hr>`;
            break;
          case 'number':
            mark.value = `$(symbol-number) Flag: ${flag.name}\n<hr>`;
            break;
          case 'boolean':
            mark.value = `$(symbol-boolean) Flag: ${flag.name}\n<hr>`;
            break;
          default:
            mark.value = `$(symbol-object) Flag: ${flag.name}\n<hr>`;
            break;
        }

        mark.appendMarkdown(`<p>Type: ${flag.type}</p>`);
        mark.appendMarkdown(`<p>Description: ${flag.description}</p>`);
        mark.appendMarkdown(`<p>Default value: ${flag.default_value}</p>\n`);
        mark.appendMarkdown(`\n`);
        const openPlatformCommandUri = vscode.Uri.parse(
          `command:${FLAGSHIP_OPEN_BROWSER}?${encodeURIComponent(
            JSON.stringify(`${baseUrl}/${accountEnvId}/flags-list`),
          )}`,
        );
        mark.appendMarkdown(`[Open in the platform $(link-external)](${openPlatformCommandUri})`);
        return new vscode.Hover(mark);
      }
      mark.value = `Flag ${candidate} not found\n`;
      mark.appendMarkdown('\n');
      const createFlagCommandUri = vscode.Uri.parse(
        `command:${FLAGSHIP_CREATE_FLAG}?${encodeURIComponent(JSON.stringify(candidate))}`,
      );
      mark.appendMarkdown(`[Create this flag: ${candidate}](${createFlagCommandUri})`);
      return new vscode.Hover(mark);
    }
    return;
  }
}

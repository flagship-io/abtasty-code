import * as vscode from 'vscode';
import { Authentication, Configuration, Flag } from '../../model';
import { StateConfiguration } from '../../stateConfiguration';
import { DEFAULT_BASE_URI } from '../../const';
import { FEATURE_EXPERIMENTATION_CREATE_FLAG, FEATURE_EXPERIMENTATION_OPEN_BROWSER } from '../../commands/const';
import { isGetFlagFunction } from '../../setupFeatExpProviders';
import { GLOBAL_CURRENT_AUTHENTICATION_FE } from '../../services/featureExperimentation/const';
import { Cli } from '../../cli/cmd/featureExperimentation/Cli';

export const CANDIDATE_REGEX = /[\w\d][.\w\d\_\-]*/;

export default class FlagshipHoverProvider implements vscode.HoverProvider {
  private readonly context: vscode.ExtensionContext;
  private readonly cli: Cli;
  private readonly stateConfig: StateConfiguration;

  constructor(context: vscode.ExtensionContext, cli: Cli, stateConfig: StateConfiguration) {
    this.context = context;
    this.cli = cli;
    this.stateConfig = stateConfig;
  }

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Hover | undefined> {
    const baseUrl = `${DEFAULT_BASE_URI}/env`;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { account_environment_id } = (await this.stateConfig.getGlobalState(
      GLOBAL_CURRENT_AUTHENTICATION_FE,
    )) as Authentication;
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
          `command:${FEATURE_EXPERIMENTATION_OPEN_BROWSER}?${encodeURIComponent(
            JSON.stringify(`${baseUrl}/${account_environment_id}/flags-list`),
          )}`,
        );
        mark.appendMarkdown(`[Open in the platform $(link-external)](${openPlatformCommandUri})`);
        return new vscode.Hover(mark);
      }
      mark.value = `Flag ${candidate} not found\n`;
      mark.appendMarkdown('\n');
      const createFlagCommandUri = vscode.Uri.parse(
        `command:${FEATURE_EXPERIMENTATION_CREATE_FLAG}?${encodeURIComponent(JSON.stringify(candidate))}`,
      );
      mark.appendMarkdown(`[Create this flag: ${candidate}](${createFlagCommandUri})`);
      return new vscode.Hover(mark);
    }
    return;
  }
}

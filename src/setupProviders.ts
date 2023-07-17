import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { Cli } from './providers/Cli';
import { QuickAccessListProvider } from './providers/QuickAccessList';
import { deleteFlagBox, flagInputBox } from './menu/FlagMenu';
import { FlagItem, FlagListProvider } from './providers/FlagList';
import {
  deleteCampaignBox,
  deleteProjectBox,
  deleteVariationBox,
  deleteVariationGroupBox,
  projectInputBox,
  switchCampaignBox,
  switchProjectBox,
} from './menu/ProjectMenu';
import {
  CampaignItem,
  ProjectItem,
  ProjectListProvider,
  VariationGroupItem,
  VariationItem,
} from './providers/ProjectList';
import { FileAnalyzedProvider, FlagAnalyzed } from './providers/FlagAnalyzeList';
import { deleteTargetingKeyBox, targetingKeyInputBox } from './menu/TargetingKeyMenu';
import { TargetingKeyItem, TargetingKeyListProvider } from './providers/TargetingKeyList';
import { deleteGoalBox, goalInputBox } from './menu/GoalMenu';
import { GoalItem, GoalListProvider } from './providers/GoalList';
import FlagshipCompletionProvider from './providers/FlagshipCompletion';
import FlagshipHoverProvider from './providers/FlagshipHover';
import {
  ADD_FLAG,
  CAMPAIGN_LIST_COPY_CAMPAIGN,
  CAMPAIGN_LIST_DELETE_CAMPAIGN,
  CAMPAIGN_LIST_SWITCH_CAMPAIGN,
  FIND_IN_FILE,
  FLAGSHIP_CREATE_FLAG,
  FLAGSHIP_CREATE_GOAL,
  FLAGSHIP_CREATE_PROJECT,
  FLAGSHIP_CREATE_TARGETING_KEY,
  FLAGSHIP_OPEN_BROWSER,
  FLAG_IN_FILE_REFRESH,
  FLAG_LIST_COPY,
  FLAG_LIST_DELETE,
  FLAG_LIST_EDIT,
  FLAG_LIST_REFRESH,
  GOAL_LIST_DELETE,
  GOAL_LIST_EDIT,
  GOAL_LIST_REFRESH,
  LIST_FLAG_IN_WORKSPACE,
  PROJECT_LIST_DELETE,
  PROJECT_LIST_EDIT,
  PROJECT_LIST_REFRESH,
  PROJECT_LIST_SWITCH,
  SET_CONTEXT,
  TARGETING_KEY_LIST_DELETE,
  TARGETING_KEY_LIST_EDIT,
  TARGETING_KEY_LIST_REFRESH,
  VARIATION_GROUP_LIST_COPY_VARIATION_GROUP,
  VARIATION_GROUP_LIST_DELETE_VARIATION_GROUP,
  VARIATION_LIST_COPY_VARIATION,
  VARIATION_LIST_DELETE_VARIATION,
} from './commands/const';

const documentSelector: vscode.DocumentSelector = [
  {
    scheme: 'file',
    language: 'typescript',
  },
  {
    scheme: 'file',
    language: 'javascript',
  },
  {
    scheme: 'file',
    language: 'typescriptreact',
  },
  {
    scheme: 'file',
    language: 'java',
  },
  {
    scheme: 'file',
    language: 'javascriptreact',
  },
  {
    scheme: 'file',
    language: 'go',
  },
  {
    scheme: 'file',
    language: 'objective-c',
  },
  {
    scheme: 'file',
    language: 'php',
  },
  {
    scheme: 'file',
    language: 'python',
  },
  {
    scheme: 'file',
    language: 'vb',
  },
  {
    scheme: 'file',
    language: 'csharp',
  },
  {
    scheme: 'file',
    language: 'fsharp',
  },
  {
    scheme: 'file',
    language: 'swift',
  },
  {
    scheme: 'file',
    language: 'dart',
  },
  {
    scheme: 'file',
    language: 'kotlin',
  },
];

export const isGetFlagFunction = (linePrefix: string): boolean =>
  (!!linePrefix.match(/getFlag\(\s*["'][\w\-\_]*/g) && !linePrefix.match(/getFlag\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/getModification\(\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/getModification\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/get_modification\(\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/get_modification\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/GetModification(String|Number|Bool|Object|Array)\(\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/GetModification(String|Number|Bool|Object|Array)\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/GetModification\(\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/GetModification\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/GetFlag\(\s*["'][\w\-\_]*/g) && !linePrefix.match(/GetFlag\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/useFsFlag\(\s*["'][\w\-\_]*/g) && !linePrefix.match(/useFsFlag\(\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/getModification:\s*@\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/getModification:\s*@\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/getFlagWithKey:\s*@\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/getFlagWithKey:\s*@\s*["'][\w\-\_]*["']/g)) ||
  (!!linePrefix.match(/getFlag\(\s*key\s*:\s*["'][\w\-\_]*/g) &&
    !linePrefix.match(/getFlag\(\s*key\s*:\s*["'][\w\-\_]*["']/g));

export const rootPath =
  vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;

export async function setupProviders(context: vscode.ExtensionContext, config: Configuration, cli: Cli) {
  const configured = await context.workspaceState.get('FSConfigured');

  if (configured === true) {
    await vscode.commands.executeCommand(SET_CONTEXT, 'flagship:enableFlagshipExplorer', true);
  }

  const quickAccessView = new QuickAccessListProvider(config);
  const quickAccessProvider = vscode.window.registerTreeDataProvider('quickAccess', quickAccessView);

  const fileAnalyzedProvider = new FileAnalyzedProvider(context, rootPath, cli);
  const flagFileProvider = vscode.window.registerTreeDataProvider('flagsInFile', fileAnalyzedProvider);

  const projectProvider = new ProjectListProvider(context, cli);
  vscode.window.registerTreeDataProvider('projectList', projectProvider);

  const flagListProvider = new FlagListProvider(context, cli);
  vscode.window.registerTreeDataProvider('flagList', flagListProvider);

  const targetingKeyProvider = new TargetingKeyListProvider(context, cli);
  vscode.window.registerTreeDataProvider('targetingKeyList', targetingKeyProvider);

  const goalProvider = new GoalListProvider(context, cli);
  vscode.window.registerTreeDataProvider('goalList', goalProvider);

  await Promise.all([
    quickAccessView.refresh(),
    fileAnalyzedProvider.refresh(),
    projectProvider.refresh(),
    flagListProvider.refresh(),
    targetingKeyProvider.refresh(),
    goalProvider.refresh(),
  ]);

  vscode.commands.registerCommand(FLAGSHIP_OPEN_BROWSER, (link: string) => {
    vscode.env.openExternal(vscode.Uri.parse(link));
  });

  const createProject = vscode.commands.registerCommand(FLAGSHIP_CREATE_PROJECT, async () => {
    const project = new ProjectItem();
    await projectInputBox(context, project, cli);
    await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
  });

  /*   const createCampaign = vscode.commands.registerCommand(CAMPAIGN_LIST_ADD_CAMPAIGN, async (project: ProjectItem) => {
    await cli.CreateCampaign(project.id!);
    await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
  }); */

  const createFlag = vscode.commands.registerCommand(FLAGSHIP_CREATE_FLAG, async (flagKey: string | undefined) => {
    const flag = new FlagItem();
    if (flagKey) {
      flag.key = flagKey;
    }
    await flagInputBox(context, flag, cli);
    await vscode.commands.executeCommand(FLAG_LIST_REFRESH);
  });

  const createTargetingKey = vscode.commands.registerCommand(FLAGSHIP_CREATE_TARGETING_KEY, async () => {
    const targetingKey = new TargetingKeyItem();
    await targetingKeyInputBox(context, targetingKey, cli);
    await vscode.commands.executeCommand(TARGETING_KEY_LIST_REFRESH);
  });

  const createGoal = vscode.commands.registerCommand(FLAGSHIP_CREATE_GOAL, async () => {
    const goal = new GoalItem();
    await goalInputBox(context, goal, cli);
    await vscode.commands.executeCommand(GOAL_LIST_REFRESH);
  });

  const projectDisposables = [
    vscode.commands.registerCommand(PROJECT_LIST_EDIT, async (project: ProjectItem) => {
      await projectInputBox(context, project, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
    }),

    vscode.commands.registerCommand(PROJECT_LIST_DELETE, async (project: ProjectItem) => {
      await deleteProjectBox(context, project, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
    }),

    vscode.commands.registerCommand(PROJECT_LIST_SWITCH, async (project: ProjectItem) => {
      await switchProjectBox(context, project, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
    }),
  ];

  const campaignDisposables = [
    vscode.commands.registerCommand(CAMPAIGN_LIST_COPY_CAMPAIGN, async (campaign: CampaignItem) => {
      vscode.env.clipboard.writeText(campaign.id!);
      vscode.window.showInformationMessage(`[Flagship] Campaign: ${campaign.name}'s ID copied to your clipboard.`);
    }),

    vscode.commands.registerCommand(CAMPAIGN_LIST_DELETE_CAMPAIGN, async (campaign: CampaignItem) => {
      await deleteCampaignBox(context, campaign, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
    }),

    vscode.commands.registerCommand(CAMPAIGN_LIST_SWITCH_CAMPAIGN, async (campaign: CampaignItem) => {
      await switchCampaignBox(context, campaign, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
    }),
  ];

  const variationGroupDisposables = [
    vscode.commands.registerCommand(
      VARIATION_GROUP_LIST_COPY_VARIATION_GROUP,
      async (variationGroup: VariationGroupItem) => {
        vscode.env.clipboard.writeText(variationGroup.id!);
        vscode.window.showInformationMessage(
          `[Flagship] Variation group: ${variationGroup.name}'s ID copied to your clipboard.`,
        );
      },
    ),

    vscode.commands.registerCommand(
      VARIATION_GROUP_LIST_DELETE_VARIATION_GROUP,
      async (variationGroup: VariationGroupItem) => {
        await deleteVariationGroupBox(context, variationGroup, cli);
        await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
      },
    ),
  ];

  const variationDisposables = [
    vscode.commands.registerCommand(VARIATION_LIST_COPY_VARIATION, async (variation: VariationItem) => {
      vscode.env.clipboard.writeText(variation.id!);
      vscode.window.showInformationMessage(`[Flagship] Variation: ${variation.name}'s ID copied to your clipboard.`);
    }),

    vscode.commands.registerCommand(VARIATION_LIST_DELETE_VARIATION, async (variation: VariationItem) => {
      await deleteVariationBox(context, variation, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
    }),
  ];

  const flagDisposables = [
    vscode.commands.registerCommand(FLAG_LIST_COPY, async (flag: FlagItem) => {
      vscode.env.clipboard.writeText(flag.key!);
      vscode.window.showInformationMessage(`[Flagship] Flag: ${flag.key} copied to your clipboard.`);
    }),
    vscode.commands.registerCommand(FLAG_LIST_EDIT, async (flag: FlagItem) => {
      await flagInputBox(context, flag, cli);
      await vscode.commands.executeCommand(FLAG_LIST_REFRESH);
    }),
    vscode.commands.registerCommand(FLAG_LIST_DELETE, async (flag: FlagItem) => {
      await deleteFlagBox(context, flag, cli);
      await vscode.commands.executeCommand(FLAG_LIST_REFRESH);
    }),
    vscode.commands.registerCommand(FIND_IN_FILE, async (flagInFile: FlagAnalyzed) => {
      vscode.workspace
        .openTextDocument(flagInFile.file)
        .then((document) => vscode.window.showTextDocument(document))
        .then(() => {
          const activeEditor = vscode.window.activeTextEditor;
          const range = activeEditor!.document.lineAt(flagInFile.lineNumber - 1).range;
          activeEditor!.selection = new vscode.Selection(range.start, range.end);
          activeEditor!.revealRange(range);
        });
    }),
    vscode.commands.registerCommand(ADD_FLAG, async (flagInFile: FlagAnalyzed) => {
      const flag = new FlagItem();
      flag.key = flagInFile.flagKey;
      await flagInputBox(context, flag, cli);
      await vscode.commands.executeCommand(FLAG_LIST_REFRESH);
    }),
    vscode.commands.registerCommand(LIST_FLAG_IN_WORKSPACE, async () => {
      await vscode.commands.executeCommand(FLAG_IN_FILE_REFRESH, rootPath, true);
    }),
  ];

  const targetingKeyDisposables = [
    vscode.commands.registerCommand(TARGETING_KEY_LIST_EDIT, async (targetingKey: TargetingKeyItem) => {
      await targetingKeyInputBox(context, targetingKey, cli);
      await vscode.commands.executeCommand(TARGETING_KEY_LIST_REFRESH);
    }),
    vscode.commands.registerCommand(TARGETING_KEY_LIST_DELETE, async (targetingKey: TargetingKeyItem) => {
      await deleteTargetingKeyBox(context, targetingKey, cli);
      await vscode.commands.executeCommand(TARGETING_KEY_LIST_REFRESH);
    }),
  ];

  const goalDispoables = [
    vscode.commands.registerCommand(GOAL_LIST_EDIT, async (goal: GoalItem) => {
      await goalInputBox(context, goal, cli);
      await vscode.commands.executeCommand(GOAL_LIST_REFRESH);
    }),

    vscode.commands.registerCommand(GOAL_LIST_DELETE, async (goal: GoalItem) => {
      await deleteGoalBox(context, goal, cli);
      await vscode.commands.executeCommand(GOAL_LIST_REFRESH);
    }),
  ];

  vscode.languages.registerCompletionItemProvider(
    documentSelector,
    new FlagshipCompletionProvider(context, cli),
    "'",
    '"',
  );
  vscode.languages.registerHoverProvider(documentSelector, new FlagshipHoverProvider(context, cli, config));

  /* const codelensProvider = new CodelensProvider();

  languages.registerCodeLensProvider('*', codelensProvider); */

  context.subscriptions.push(
    flagFileProvider,
    createProject,
    createGoal,
    createTargetingKey,
    createFlag,
    quickAccessProvider,
    ...projectDisposables,
    ...campaignDisposables,
    ...variationGroupDisposables,
    ...variationDisposables,
    ...flagDisposables,
    ...targetingKeyDisposables,
    ...goalDispoables,
  );
}

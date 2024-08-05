import * as vscode from 'vscode';
import { StateConfiguration } from './stateConfiguration';
import { Cli } from './cli/cmd/featureExperimentation/Cli';
import { QuickAccessListProvider } from './providers/featureExperimentation/QuickAccessList';
import { deleteFlagInputBox, flagInputBox } from './menu/featureExperimentation/FlagMenu';
import { FlagItem, FlagListProvider } from './providers/featureExperimentation/FlagList';
import {
  deleteCampaignBox,
  deleteProjectInputBox,
  deleteVariationBox,
  deleteVariationGroupBox,
  projectInputBox,
} from './menu/featureExperimentation/ProjectMenu';
import {
  CampaignItem,
  ProjectItem,
  ProjectListProvider,
  VariationGroupItem,
  VariationItem,
} from './providers/featureExperimentation/ProjectList';
import { FileAnalyzedProvider, FlagAnalyzed } from './providers/featureExperimentation/FlagAnalyzeList';
import { deleteTargetingKeyInputBox, targetingKeyInputBox } from './menu/featureExperimentation/TargetingKeyMenu';
import { TargetingKeyItem, TargetingKeyListProvider } from './providers/featureExperimentation/TargetingKeyList';
import { deleteGoalInputBox, goalInputBox } from './menu/featureExperimentation/GoalMenu';
import { GoalItem, GoalListProvider } from './providers/featureExperimentation/GoalList';
import FlagshipCompletionProvider from './providers/featureExperimentation/FlagshipCompletion';
import FlagshipHoverProvider from './providers/featureExperimentation/FlagshipHover';
import {
  FEATURE_EXPERIMENTATION_ADD_FLAG,
  FEATURE_EXPERIMENTATION_CAMPAIGN_LIST_COPY,
  FEATURE_EXPERIMENTATION_CAMPAIGN_LIST_DELETE,
  FEATURE_EXPERIMENTATION_CAMPAIGN_LIST_OPEN_IN_BROWSER,
  FEATURE_EXPERIMENTATION_FIND_IN_FILE,
  FEATURE_EXPERIMENTATION_CREATE_FLAG,
  FEATURE_EXPERIMENTATION_CREATE_GOAL,
  FEATURE_EXPERIMENTATION_CREATE_PROJECT,
  FEATURE_EXPERIMENTATION_CREATE_TARGETING_KEY,
  FEATURE_EXPERIMENTATION_GET_TOKEN_SCOPE,
  FEATURE_EXPERIMENTATION_OPEN_BROWSER,
  FEATURE_EXPERIMENTATION_FLAG_IN_FILE_REFRESH,
  FEATURE_EXPERIMENTATION_FLAG_LIST_COPY,
  FEATURE_EXPERIMENTATION_FLAG_LIST_DELETE,
  FEATURE_EXPERIMENTATION_FLAG_LIST_EDIT,
  FEATURE_EXPERIMENTATION_FLAG_LIST_LOAD,
  FEATURE_EXPERIMENTATION_GOAL_LIST_DELETE,
  FEATURE_EXPERIMENTATION_GOAL_LIST_EDIT,
  FEATURE_EXPERIMENTATION_GOAL_LIST_LOAD,
  FEATURE_EXPERIMENTATION_LIST_FLAG_IN_WORKSPACE,
  FEATURE_EXPERIMENTATION_PROJECT_LIST_COPY,
  FEATURE_EXPERIMENTATION_PROJECT_LIST_DELETE,
  FEATURE_EXPERIMENTATION_PROJECT_LIST_EDIT,
  FEATURE_EXPERIMENTATION_PROJECT_LIST_LOAD,
  SET_CONTEXT,
  FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_DELETE,
  FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_EDIT,
  FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_LOAD,
  FEATURE_EXPERIMENTATION_VARIATION_GROUP_LIST_COPY,
  FEATURE_EXPERIMENTATION_VARIATION_GROUP_LIST_DELETE,
  FEATURE_EXPERIMENTATION_VARIATION_LIST_COPY,
  FEATURE_EXPERIMENTATION_VARIATION_LIST_DELETE,
} from './commands/const';
import { DEFAULT_BASE_URI, PERMISSION_DENIED } from './const';
import { Authentication, Configuration, Scope } from './model';
import { FlagStore } from './store/featureExperimentation/FlagStore';
import { ProjectStore } from './store/featureExperimentation/ProjectStore';
import { TargetingKeyStore } from './store/featureExperimentation/TargetingKeyStore';
import { GoalStore } from './store/featureExperimentation/GoalStore';
import {
  FEATURE_EXPERIMENTATION_CONFIGURED,
  GLOBAL_CURRENT_AUTHENTICATION_FE,
} from './services/featureExperimentation/const';

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

export async function setupFeatExpProviders(
  context: vscode.ExtensionContext,
  stateConfig: StateConfiguration,
  cli: Cli,
) {
  const configured = await context.globalState.get(FEATURE_EXPERIMENTATION_CONFIGURED);

  const flagStore = new FlagStore(context, cli);
  const projectStore = new ProjectStore(context, cli);
  const targetingKeyStore = new TargetingKeyStore(context, cli);
  const goalStore = new GoalStore(context, cli);

  if (configured === true) {
    await vscode.commands.executeCommand(SET_CONTEXT, 'abtasty:explorer', 'featureExperimentation');
  }

  const quickAccessView = new QuickAccessListProvider(stateConfig);
  const quickAccessProvider = vscode.window.registerTreeDataProvider(
    'featureExperimentation.quickAccess',
    quickAccessView,
  );

  const fileAnalyzedProvider = new FileAnalyzedProvider(context, rootPath, cli);
  const flagFileProvider = vscode.window.registerTreeDataProvider(
    'featureExperimentation.flagsInFile',
    fileAnalyzedProvider,
  );

  const projectProvider = new ProjectListProvider(context, projectStore, stateConfig);
  vscode.window.registerTreeDataProvider('featureExperimentation.projectList', projectProvider);

  const flagListProvider = new FlagListProvider(context, flagStore);
  vscode.window.registerTreeDataProvider('featureExperimentation.flagList', flagListProvider);

  const targetingKeyProvider = new TargetingKeyListProvider(context, targetingKeyStore);
  vscode.window.registerTreeDataProvider('featureExperimentation.targetingKeyList', targetingKeyProvider);

  const goalProvider = new GoalListProvider(context, goalStore);
  vscode.window.registerTreeDataProvider('featureExperimentation.goalList', goalProvider);

  await Promise.all([
    quickAccessView.refresh(),
    fileAnalyzedProvider.refresh(),
    projectProvider.refresh(),
    flagListProvider.refresh(),
    targetingKeyProvider.refresh(),
    goalProvider.refresh(),
  ]);

  vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_OPEN_BROWSER, (link: string) => {
    vscode.env.openExternal(vscode.Uri.parse(link));
  });

  const getTokenInfo = vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_GET_TOKEN_SCOPE, async () => {
    const tokenInfo = await cli.GetTokenInfo();
    const scopes: any = {};
    tokenInfo.scope.split(' ').map((s: any) => {
      if (s.includes('.')) {
        const key = s.split('.');
        scopes[key[0]] = [...(scopes[key[0]] || []), key[1]];
        return;
      }
      const key = s.split(':');
      scopes[key[0]] = [...(scopes[key[0]] || []), key[1]];
    });
    const sc: Scope = JSON.parse(JSON.stringify(scopes));
    vscode.window.showInformationMessage(JSON.stringify(sc, null, 2), { modal: true });
  });

  const createProject = vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_CREATE_PROJECT, async () => {
    const { scope } = (context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
    if (scope?.includes('project.create')) {
      const project = new ProjectItem();
      await projectInputBox(project, projectStore);
      await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_PROJECT_LIST_LOAD);
      return;
    }
    vscode.window.showWarningMessage(PERMISSION_DENIED);
    return;
  });

  /*   const createCampaign = vscode.commands.registerCommand(CAMPAIGN_LIST_ADD_CAMPAIGN, async (project: ProjectItem) => {
    await cli.CreateCampaign(project.id!);
    await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
  }); 
  */

  const createFlag = vscode.commands.registerCommand(
    FEATURE_EXPERIMENTATION_CREATE_FLAG,
    async (flagKey: string | undefined) => {
      const { scope } = (context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};

      if (scope?.includes('flag.create')) {
        const flag = new FlagItem();
        if (flagKey) {
          flag.key = flagKey;
        }
        await flagInputBox(flag, flagStore);
        await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_FLAG_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    },
  );

  const createTargetingKey = vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_CREATE_TARGETING_KEY, async () => {
    const { scope } = (context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
    if (scope?.includes('targeting_key.create')) {
      const targetingKey = new TargetingKeyItem();
      await targetingKeyInputBox(targetingKey, targetingKeyStore);
      await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_LOAD);
      return;
    }
    vscode.window.showWarningMessage(PERMISSION_DENIED);
    return;
  });

  const createGoal = vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_CREATE_GOAL, async () => {
    const { scope } = (context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
    if (scope?.includes('goal.create')) {
      const goal = new GoalItem();
      await goalInputBox(goal, goalStore);
      await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_GOAL_LIST_LOAD);
      return;
    }
    vscode.window.showWarningMessage(PERMISSION_DENIED);
    return;
  });

  const projectDisposables = [
    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_PROJECT_LIST_COPY, async (project: ProjectItem) => {
      vscode.env.clipboard.writeText(project.id!);
      vscode.window.showInformationMessage(`[AB Tasty] Project: ${project.name}'s ID copied to your clipboard.`);
    }),

    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_PROJECT_LIST_EDIT, async (project: ProjectItem) => {
      const { scope } = (context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
      if (scope?.includes('project.update')) {
        await projectInputBox(project, projectStore);
        await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_PROJECT_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),

    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_PROJECT_LIST_DELETE, async (project: ProjectItem) => {
      const { scope } = (context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
      if (scope?.includes('project.delete')) {
        await deleteProjectInputBox(project, projectStore);
        await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_PROJECT_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),
  ];

  const campaignDisposables = [
    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_CAMPAIGN_LIST_COPY, async (campaign: CampaignItem) => {
      vscode.env.clipboard.writeText(campaign.id!);
      vscode.window.showInformationMessage(`[AB Tasty] Campaign: ${campaign.name}'s ID copied to your clipboard.`);
    }),

    vscode.commands.registerCommand(
      FEATURE_EXPERIMENTATION_CAMPAIGN_LIST_OPEN_IN_BROWSER,
      async (campaign: CampaignItem) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { account_environment_id } =
          ((await context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE)) as Authentication) || {};
        await vscode.env.openExternal(
          vscode.Uri.parse(
            `${DEFAULT_BASE_URI}/env/${account_environment_id}/report/${campaign.type}/${campaign.id}/details`,
          ),
        );
      },
    ),

    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_CAMPAIGN_LIST_DELETE, async (campaign: CampaignItem) => {
      await deleteCampaignBox(context, campaign, cli);
      await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_PROJECT_LIST_LOAD);
    }),
  ];

  const variationGroupDisposables = [
    vscode.commands.registerCommand(
      FEATURE_EXPERIMENTATION_VARIATION_GROUP_LIST_COPY,
      async (variationGroup: VariationGroupItem) => {
        vscode.env.clipboard.writeText(variationGroup.id!);
        vscode.window.showInformationMessage(
          `[AB Tasty] Variation group: ${variationGroup.name}'s ID copied to your clipboard.`,
        );
      },
    ),

    vscode.commands.registerCommand(
      FEATURE_EXPERIMENTATION_VARIATION_GROUP_LIST_DELETE,
      async (variationGroup: VariationGroupItem) => {
        await deleteVariationGroupBox(context, variationGroup, cli);
        await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_PROJECT_LIST_LOAD);
      },
    ),
  ];

  const variationDisposables = [
    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_VARIATION_LIST_COPY, async (variation: VariationItem) => {
      vscode.env.clipboard.writeText(variation.id!);
      vscode.window.showInformationMessage(`[AB Tasty] Variation: ${variation.name}'s ID copied to your clipboard.`);
    }),

    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_VARIATION_LIST_DELETE, async (variation: VariationItem) => {
      await deleteVariationBox(context, variation, cli);
      await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_PROJECT_LIST_LOAD);
    }),
  ];

  const flagDisposables = [
    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_FLAG_LIST_COPY, async (flag: FlagItem) => {
      vscode.env.clipboard.writeText(flag.key!);
      vscode.window.showInformationMessage(`[AB Tasty] Flag: ${flag.key} copied to your clipboard.`);
    }),

    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_FLAG_LIST_EDIT, async (flag: FlagItem) => {
      const { scope } = (context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
      if (scope?.includes('flag.update')) {
        await flagInputBox(flag, flagStore);
        await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_FLAG_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),

    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_FLAG_LIST_DELETE, async (flag: FlagItem) => {
      const { scope } = (context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
      if (scope?.includes('flag.delete')) {
        await deleteFlagInputBox(flag, flagStore);
        await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_FLAG_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),

    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_FIND_IN_FILE, async (flagInFile: FlagAnalyzed) => {
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

    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_ADD_FLAG, async (flagInFile: FlagAnalyzed) => {
      const { scope } = (context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
      if (scope?.includes('flag.create')) {
        const flag = new FlagItem();
        flag.key = flagInFile.flagKey;
        await flagInputBox(flag, flagStore);
        await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_FLAG_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),

    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_LIST_FLAG_IN_WORKSPACE, async () => {
      await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_FLAG_IN_FILE_REFRESH, rootPath, true);
    }),
  ];

  const targetingKeyDisposables = [
    vscode.commands.registerCommand(
      FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_EDIT,
      async (targetingKey: TargetingKeyItem) => {
        const { scope } = (context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
        if (scope?.includes('targeting_key.update')) {
          await targetingKeyInputBox(targetingKey, targetingKeyStore);
          await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_LOAD);
          return;
        }
        vscode.window.showWarningMessage(PERMISSION_DENIED);
        return;
      },
    ),

    vscode.commands.registerCommand(
      FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_DELETE,
      async (targetingKey: TargetingKeyItem) => {
        const { scope } = (context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
        if (scope?.includes('targeting_key.delete')) {
          await deleteTargetingKeyInputBox(targetingKey, targetingKeyStore);
          await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_TARGETING_KEY_LIST_LOAD);
          return;
        }
        vscode.window.showWarningMessage(PERMISSION_DENIED);
        return;
      },
    ),
  ];

  const goalDisposables = [
    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_GOAL_LIST_EDIT, async (goal: GoalItem) => {
      const { scope } = (context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
      if (scope?.includes('goal.update')) {
        await goalInputBox(goal, goalStore);
        await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_GOAL_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),

    vscode.commands.registerCommand(FEATURE_EXPERIMENTATION_GOAL_LIST_DELETE, async (goal: GoalItem) => {
      const { scope } = (context.globalState.get(GLOBAL_CURRENT_AUTHENTICATION_FE) as Authentication) || {};
      if (scope?.includes('goal.delete')) {
        await deleteGoalInputBox(goal, goalStore);
        await vscode.commands.executeCommand(FEATURE_EXPERIMENTATION_GOAL_LIST_LOAD);
        return;
      }
      vscode.window.showWarningMessage(PERMISSION_DENIED);
      return;
    }),
  ];

  vscode.languages.registerCompletionItemProvider(
    documentSelector,
    new FlagshipCompletionProvider(context, cli),
    "'",
    '"',
  );
  vscode.languages.registerHoverProvider(documentSelector, new FlagshipHoverProvider(context, cli, stateConfig));

  /* const codelensProvider = new CodelensProvider();

  languages.registerCodeLensProvider('*', codelensProvider); */

  context.subscriptions.push(
    flagFileProvider,
    getTokenInfo,
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
    ...goalDisposables,
  );
}

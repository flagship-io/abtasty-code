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
  CAMPAIGN_LIST_COPY,
  CAMPAIGN_LIST_DELETE,
  CAMPAIGN_LIST_OPEN_IN_BROWSER,
  CAMPAIGN_LIST_SWITCH,
  FIND_IN_FILE,
  FLAGSHIP_CREATE_FLAG,
  FLAGSHIP_CREATE_GOAL,
  FLAGSHIP_CREATE_PROJECT,
  FLAGSHIP_CREATE_TARGETING_KEY,
  FLAGSHIP_GET_TOKEN_SCOPE,
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
  PROJECT_LIST_COPY,
  PROJECT_LIST_DELETE,
  PROJECT_LIST_EDIT,
  PROJECT_LIST_REFRESH,
  PROJECT_LIST_SWITCH,
  SET_CONTEXT,
  TARGETING_KEY_LIST_DELETE,
  TARGETING_KEY_LIST_EDIT,
  TARGETING_KEY_LIST_REFRESH,
  VARIATION_GROUP_LIST_COPY,
  VARIATION_GROUP_LIST_DELETE,
  VARIATION_LIST_COPY,
  VARIATION_LIST_DELETE,
} from './commands/const';
import { CURRENT_CONFIGURATION, DEFAULT_BASE_URI } from './const';
import { CredentialStore, Scope } from './model';

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

  const getTokenInfo = vscode.commands.registerCommand(FLAGSHIP_GET_TOKEN_SCOPE, async () => {
    const tokenInfo = await cli.GetTokenInfo();
    const scopes: any = {};
    tokenInfo.scope.split(' ').map((s) => {
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

  const createProject = vscode.commands.registerCommand(FLAGSHIP_CREATE_PROJECT, async () => {
    const { scope } = context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
    if (scope?.includes('project.create')) {
      const project = new ProjectItem();
      await projectInputBox(context, project, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
      return;
    }
    vscode.window.showInformationMessage(
      'You dont have the permission to use this feature. Contact your admin to enable the required scopes.',
    );
    return;
  });

  /*   const createCampaign = vscode.commands.registerCommand(CAMPAIGN_LIST_ADD_CAMPAIGN, async (project: ProjectItem) => {
    await cli.CreateCampaign(project.id!);
    await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
  }); */

  const createFlag = vscode.commands.registerCommand(FLAGSHIP_CREATE_FLAG, async (flagKey: string | undefined) => {
    const { scope } = context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;

    if (scope?.includes('flag.create')) {
      const flag = new FlagItem();
      if (flagKey) {
        flag.key = flagKey;
      }
      await flagInputBox(context, flag, cli);
      await vscode.commands.executeCommand(FLAG_LIST_REFRESH);
      return;
    }
    console.log('here-cancel');
    vscode.window.showInformationMessage(
      'You dont have the permission to use this feature. Contact your admin to enable the required scopes.',
    );
    return;
  });

  const createTargetingKey = vscode.commands.registerCommand(FLAGSHIP_CREATE_TARGETING_KEY, async () => {
    const { scope } = context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
    if (scope?.includes('targeting_key.create')) {
      const targetingKey = new TargetingKeyItem();
      await targetingKeyInputBox(context, targetingKey, cli);
      await vscode.commands.executeCommand(TARGETING_KEY_LIST_REFRESH);
      return;
    }
    vscode.window.showInformationMessage(
      'You dont have the permission to use this feature. Contact your admin to enable the required scopes.',
    );
    return;
  });

  const createGoal = vscode.commands.registerCommand(FLAGSHIP_CREATE_GOAL, async () => {
    const { scope } = context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
    if (scope?.includes('goal.create')) {
      const goal = new GoalItem();
      await goalInputBox(context, goal, cli);
      await vscode.commands.executeCommand(GOAL_LIST_REFRESH);
      return;
    }
    vscode.window.showInformationMessage(
      'You dont have the permission to use this feature. Contact your admin to enable the required scopes.',
    );
    return;
  });

  const projectDisposables = [
    vscode.commands.registerCommand(PROJECT_LIST_COPY, async (project: ProjectItem) => {
      vscode.env.clipboard.writeText(project.id!);
      vscode.window.showInformationMessage(`[Flagship] Project: ${project.name}'s ID copied to your clipboard.`);
    }),
    vscode.commands.registerCommand(PROJECT_LIST_EDIT, async (project: ProjectItem) => {
      const { scope } = context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
      if (scope?.includes('project.update')) {
        await projectInputBox(context, project, cli);
        await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
        return;
      }
      vscode.window.showInformationMessage(
        'You dont have the permission to use this feature. Contact your admin to enable the required scopes.',
      );
      return;
    }),

    vscode.commands.registerCommand(PROJECT_LIST_DELETE, async (project: ProjectItem) => {
      const { scope } = context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
      if (scope?.includes('project.delete')) {
        await deleteProjectBox(context, project, cli);
        await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
        return;
      }
      vscode.window.showInformationMessage(
        'You dont have the permission to use this feature. Contact your admin to enable the required scopes.',
      );
      return;
    }),

    vscode.commands.registerCommand(PROJECT_LIST_SWITCH, async (project: ProjectItem) => {
      await switchProjectBox(context, project, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
    }),
  ];

  const campaignDisposables = [
    vscode.commands.registerCommand(CAMPAIGN_LIST_COPY, async (campaign: CampaignItem) => {
      vscode.env.clipboard.writeText(campaign.id!);
      vscode.window.showInformationMessage(`[Flagship] Campaign: ${campaign.name}'s ID copied to your clipboard.`);
    }),

    vscode.commands.registerCommand(CAMPAIGN_LIST_OPEN_IN_BROWSER, async (campaign: CampaignItem) => {
      const { accountEnvId } = (await context.workspaceState.get(CURRENT_CONFIGURATION)) as CredentialStore;
      await vscode.env.openExternal(
        vscode.Uri.parse(`${DEFAULT_BASE_URI}/env/${accountEnvId}/report/${campaign.type}/${campaign.id}/details`),
      );
    }),

    vscode.commands.registerCommand(CAMPAIGN_LIST_DELETE, async (campaign: CampaignItem) => {
      await deleteCampaignBox(context, campaign, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
    }),

    vscode.commands.registerCommand(CAMPAIGN_LIST_SWITCH, async (campaign: CampaignItem) => {
      await switchCampaignBox(context, campaign, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
    }),
  ];

  const variationGroupDisposables = [
    vscode.commands.registerCommand(VARIATION_GROUP_LIST_COPY, async (variationGroup: VariationGroupItem) => {
      vscode.env.clipboard.writeText(variationGroup.id!);
      vscode.window.showInformationMessage(
        `[Flagship] Variation group: ${variationGroup.name}'s ID copied to your clipboard.`,
      );
    }),

    vscode.commands.registerCommand(VARIATION_GROUP_LIST_DELETE, async (variationGroup: VariationGroupItem) => {
      await deleteVariationGroupBox(context, variationGroup, cli);
      await vscode.commands.executeCommand(PROJECT_LIST_REFRESH);
    }),
  ];

  const variationDisposables = [
    vscode.commands.registerCommand(VARIATION_LIST_COPY, async (variation: VariationItem) => {
      vscode.env.clipboard.writeText(variation.id!);
      vscode.window.showInformationMessage(`[Flagship] Variation: ${variation.name}'s ID copied to your clipboard.`);
    }),

    vscode.commands.registerCommand(VARIATION_LIST_DELETE, async (variation: VariationItem) => {
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
      const { scope } = context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
      if (scope?.includes('flag.update')) {
        await flagInputBox(context, flag, cli);
        await vscode.commands.executeCommand(FLAG_LIST_REFRESH);
        return;
      }
      vscode.window.showInformationMessage(
        'You dont have the permission to use this feature. Contact your admin to enable the required scopes.',
      );
      return;
    }),
    vscode.commands.registerCommand(FLAG_LIST_DELETE, async (flag: FlagItem) => {
      const { scope } = context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
      if (scope?.includes('flag.delete')) {
        await deleteFlagBox(context, flag, cli);
        await vscode.commands.executeCommand(FLAG_LIST_REFRESH);
        return;
      }
      vscode.window.showInformationMessage(
        'You dont have the permission to use this feature. Contact your admin to enable the required scopes.',
      );
      return;
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
      const { scope } = context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
      if (scope?.includes('flag.create')) {
        const flag = new FlagItem();
        flag.key = flagInFile.flagKey;
        await flagInputBox(context, flag, cli);
        await vscode.commands.executeCommand(FLAG_LIST_REFRESH);
        return;
      }
      vscode.window.showInformationMessage(
        'You dont have the permission to use this feature. Contact your admin to enable the required scopes.',
      );
      return;
    }),
    vscode.commands.registerCommand(LIST_FLAG_IN_WORKSPACE, async () => {
      await vscode.commands.executeCommand(FLAG_IN_FILE_REFRESH, rootPath, true);
    }),
  ];

  const targetingKeyDisposables = [
    vscode.commands.registerCommand(TARGETING_KEY_LIST_EDIT, async (targetingKey: TargetingKeyItem) => {
      const { scope } = context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
      if (scope?.includes('targetong_key.update')) {
        await targetingKeyInputBox(context, targetingKey, cli);
        await vscode.commands.executeCommand(TARGETING_KEY_LIST_REFRESH);
        return;
      }
      vscode.window.showInformationMessage(
        'You dont have the permission to use this feature. Contact your admin to enable the required scopes.',
      );
      return;
    }),
    vscode.commands.registerCommand(TARGETING_KEY_LIST_DELETE, async (targetingKey: TargetingKeyItem) => {
      const { scope } = context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
      if (scope?.includes('targeting_key.delete')) {
        await deleteTargetingKeyBox(context, targetingKey, cli);
        await vscode.commands.executeCommand(TARGETING_KEY_LIST_REFRESH);
        return;
      }
      vscode.window.showInformationMessage(
        'You dont have the permission to use this feature. Contact your admin to enable the required scopes.',
      );
      return;
    }),
  ];

  const goalDispoables = [
    vscode.commands.registerCommand(GOAL_LIST_EDIT, async (goal: GoalItem) => {
      const { scope } = context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
      if (scope?.includes('goal.update')) {
        await goalInputBox(context, goal, cli);
        await vscode.commands.executeCommand(GOAL_LIST_REFRESH);
        return;
      }
      vscode.window.showInformationMessage(
        'You dont have the permission to use this feature. Contact your admin to enable the required scopes.',
      );
      return;
    }),

    vscode.commands.registerCommand(GOAL_LIST_DELETE, async (goal: GoalItem) => {
      const { scope } = context.workspaceState.get(CURRENT_CONFIGURATION) as CredentialStore;
      if (scope?.includes('goal.delete')) {
        await deleteGoalBox(context, goal, cli);
        await vscode.commands.executeCommand(GOAL_LIST_REFRESH);
        return;
      }
      vscode.window.showInformationMessage(
        'You dont have the permission to use this feature. Contact your admin to enable the required scopes.',
      );
      return;
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
    ...goalDispoables,
  );
}

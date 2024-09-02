import * as vscode from 'vscode';
import { StateConfiguration } from './stateConfiguration';
import configureFeatureExperimentationCmd from './commands/configureFeatureExperimentation';
import clearConfigCmd from './commands/clearConfig';
import checkCliVersionCmd from './commands/checkCliVersion';
import { Cli as FEATURE_EXPERIMENTATION_CLI } from './cli/cmd/featureExperimentation/Cli';
import { Cli as WEB_EXPERIMENTATION_CLI } from './cli/cmd/webExperimentation/Cli';
import { FEATURE_EXPERIMENTATION } from './services/featureExperimentation/const';
import configureWebExperimentationCmd from './commands/configureWebExperimentation';
import { featureExpExtensionReload } from './featureExpExtensionReload';
import { WEB_EXPERIMENTATION } from './services/webExperimentation/const';
import { webExpExtensionReload } from './webExpExtensionReload';
import { WebviewViewProvider } from './providers/welcomeWebview';

export async function register(context: vscode.ExtensionContext, stateConfig: StateConfiguration): Promise<void> {
  const outputChannel = vscode.window.createOutputChannel('AB Tasty', { log: true });
  const webViewProvider = new WebviewViewProvider(context);

  const cliFE = new FEATURE_EXPERIMENTATION_CLI(context);
  const cliWE = new WEB_EXPERIMENTATION_CLI(context, outputChannel);
  outputChannel.show(true);

  context.subscriptions.push(outputChannel);

  await Promise.all([clearConfigCmd(context, stateConfig), checkCliVersionCmd(context, cliFE)]);

  await Promise.all([
    configureFeatureExperimentationCmd(context, cliFE),
    featureExpExtensionReload(context, stateConfig, cliFE),
  ]);

  await Promise.all([
    configureWebExperimentationCmd(context, cliWE),
    webExpExtensionReload(context, stateConfig, cliWE),
  ]);

  context.subscriptions.push(vscode.window.registerWebviewViewProvider('configWelcome', webViewProvider));
}

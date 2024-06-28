import * as vscode from 'vscode';
import { StateConfiguration } from './stateConfiguration';
import configureFeatureExperimentationCmd from './commands/configureFeatureExperimentation';
import clearConfigCmd from './commands/clearConfig';
import checkCliVersionCmd from './commands/checkCliVersion';
import { Cli } from './cli/cmd/featureExperimentation/Cli';
import { FEATURE_EXPERIMENTATION } from './services/featureExperimentation/const';
import configureWebExperimentationCmd from './commands/configureWebExperimentation';
import { featureExpExtensionReload } from './featureExpExtensionReload';
import { WEB_EXPERIMENTATION } from './services/webExperimentation/const';
import { webExpExtensionReload } from './webExpExtensionReload';

export async function register(context: vscode.ExtensionContext, stateConfig: StateConfiguration): Promise<void> {
  const cliFE = new Cli(context, FEATURE_EXPERIMENTATION);
  const cliWE = new Cli(context, WEB_EXPERIMENTATION);

  await Promise.all([clearConfigCmd(context, stateConfig), checkCliVersionCmd(context, cliFE)]);

  await Promise.all([
    configureFeatureExperimentationCmd(context, cliFE),
    featureExpExtensionReload(context, stateConfig, cliFE),
  ]);

  await Promise.all([
    configureWebExperimentationCmd(context, cliWE),
    webExpExtensionReload(context, stateConfig, cliWE),
  ]);
}

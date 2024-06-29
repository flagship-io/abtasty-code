/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
import { exec, ExecOptions } from 'child_process';
import * as fs from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';
import {
  AccountEnvironmentFE,
  Authentication,
  CampaignFE,
  CurrentAuthentication,
  FileAnalyzedType,
  Flag,
  Goal,
  Project,
  TargetingKey,
  TokenInfo,
} from '../../../model';
import { CliVersion } from '../../cliDownloader';
export class Cli {
  private context: vscode.ExtensionContext;
  private extensionVersion: string;

  constructor(context: vscode.ExtensionContext) {
    this.extensionVersion = vscode.extensions.getExtension('ABTasty.abtasty-code')?.packageJSON.version;
    this.context = context;
  }

  exec(command: string, options: ExecOptions): Promise<{ stdout: string; stderr: string }> {
    return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      exec(command + ' --user-agent=abtasty-ext-vscode/v' + this.extensionVersion, options, (error, stdout, stderr) => {
        if (error) {
          reject({ error, stdout, stderr });
        }
        resolve({ stdout, stderr });
      });
    });
  }

  async CliBin(): Promise<string> {
    try {
      if (process.platform.toString() === 'win32') {
        return `${this.context.asAbsolutePath('abtasty-cli')}\\${CliVersion}\\abtasty-cli.exe`;
      }
      if (process.platform.toString() === 'darwin') {
        return `${this.context.asAbsolutePath('abtasty-cli')}/${CliVersion}/abtasty-cli`;
      }
      await fs.promises.access(join(this.context.asAbsolutePath('abtasty-cli'), `${CliVersion}/abtasty-cli`));
      return `${this.context.asAbsolutePath('abtasty-cli')}/${CliVersion}/abtasty-cli`;
    } catch (err: any) {
      console.error(err);
      return err.error;
    }
  }

  async Version(): Promise<string> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return '';
      }
      const command = `${cliBin} version`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return '';
      }
      return output.stdout;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return '';
    }
  }

  async LoginAuthentication(authentication: Authentication): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }
      if (authentication.username) {
        const command = `${cliBin} feature-experimentation auth login -u ${authentication.username} -i ${
          authentication.client_id
        } -s ${authentication.client_secret} ${
          authentication.account_id ? `-a ${authentication.account_id}` : ``
        } --output-format json`;

        console.log(command);
        const output = await this.exec(command, {});
        console.log(output);

        if (output.stderr) {
          vscode.window.showErrorMessage(output.stderr);
          return false;
        }

        return true;
      }
      return false;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async UseAccount(authentication: Authentication): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }
      const command = `${cliBin} feature-experimentation account use -i  ${authentication.account_id} --output-format json`;
      console.log(command);
      const output = await this.exec(command, {});
      console.log(output);

      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return false;
      }

      return true;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async UseAccountEnvironment(authentication: Authentication): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }
      const command = `${cliBin} feature-experimentation account-environment use -i ${authentication.account_environment_id} --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);

      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return false;
      }

      return true;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async ListAccountEnvironment(): Promise<AccountEnvironmentFE[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }

      const command = `${cliBin} feature-experimentation account-environment list --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return [];
      }

      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return [];
    }
  }

  async DeleteAuthentication(username: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }

      let command = `${cliBin} feature-experimentation auth delete -u ${username}`;
      const output = await this.exec(command, {});
      console.log(output);
      return true;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async ListAuthentication(): Promise<Authentication[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} feature-experimentation authentication list --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return [];
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return [];
    }
  }

  // DEFINED TO BE CHANGED BASED ON CLI
  async GetAuthentication(username: string): Promise<Authentication> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as Authentication;
      }

      const command = `${cliBin} feature-experimentation authentication get -u ${username} --output-format json`;
      console.log(command);
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return {} as Authentication;
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as Authentication;
    }
  }

  async CurrentAuthentication(): Promise<CurrentAuthentication> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as CurrentAuthentication;
      }

      const command = `${cliBin} feature-experimentation authentication current --output-format json`;
      console.log(command);
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return {} as CurrentAuthentication;
      }

      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as CurrentAuthentication;
    }
  }

  async CreateProject(project: Project): Promise<Project> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as Project;
      }
      const command = `${cliBin} feature-experimentation project create -n "${project.name}"`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return {} as Project;
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as Project;
    }
  }

  async EditProject(id: string, project: Project): Promise<Project> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as Project;
      }
      const command = `${cliBin} feature-experimentation project edit -i ${id} -n "${project.name}"`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return {} as Project;
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as Project;
    }
  }

  async DeleteProject(id: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }
      const command = `${cliBin} feature-experimentation project delete -i ${id}`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      if (output.stdout.includes('deleted')) {
        return true;
      }
      return false;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async ListProject(): Promise<Project[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} feature-experimentation project list --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return [];
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return [];
    }
  }

  async SwitchProject(id: string, status: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }
      const command = `${cliBin} feature-experimentation project switch -i ${id} -s ${status}`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      return true;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async CreateGoal(goal: Goal): Promise<Goal> {
    try {
      let command: string;
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as Goal;
      }
      if (process.platform.toString() === 'win32') {
        if (goal.operator && goal.value) {
          command = `${cliBin} feature-experimentation goal create -d {\\"label\\":\\"${goal.label}\\",\\"type\\":\\"${goal.type}\\",\\"operator\\":\\"${goal.operator}\\",\\"value\\":\\"${goal.value}\\"}`;
        } else {
          command = `${cliBin} feature-experimentation goal create -d {\\"label\\":\\"${goal.label}\\",\\"type\\":\\"${goal.type}\\"}`;
        }
      } else {
        if (goal.operator && goal.value) {
          command = `${cliBin} feature-experimentation goal create -d '{"label":"${goal.label}","type":"${goal.type}","operator":"${goal.operator}","value":"${goal.value}"}'`;
        } else {
          command = `${cliBin} feature-experimentation goal create -d '{"label":"${goal.label}","type":"${goal.type}"}'`;
        }
      }
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return {} as Goal;
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as Goal;
    }
  }

  async EditGoal(id: string, goal: Goal): Promise<Goal> {
    try {
      let command: string;
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as Goal;
      }
      if (process.platform.toString() === 'win32') {
        if (goal.operator && goal.value) {
          command = `${cliBin} feature-experimentation goal edit -i ${id} -d {\\"label\\":\\"${goal.label}\\",\\"operator\\":\\"${goal.operator}\\",\\"value\\":\\"${goal.value}\\"}`;
        } else {
          command = `${cliBin} feature-experimentation goal edit -i ${id} -d {\\"label\\":\\"${goal.label}\\"}`;
        }
      } else {
        if (goal.operator && goal.value) {
          command = `${cliBin} feature-experimentation goal edit -i ${id} -d '{"label":"${goal.label}","operator":"${goal.operator}","value":"${goal.value}"}'`;
        } else {
          command = `${cliBin} feature-experimentation goal edit -i ${id} -d '{"label":"${goal.label}"}'`;
        }
      }
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return {} as Goal;
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as Goal;
    }
  }

  async DeleteGoal(id: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }
      const command = `${cliBin} feature-experimentation goal delete -i ${id}`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      if (output.stdout.includes('deleted')) {
        return true;
      }
      return false;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async ListGoal(): Promise<Goal[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} feature-experimentation goal list --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return [];
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return [];
    }
  }

  async CreateTargetingKey(targetingKey: TargetingKey): Promise<TargetingKey> {
    try {
      let command: string;
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as TargetingKey;
      }
      if (process.platform.toString() === 'win32') {
        command = `${cliBin} feature-experimentation targeting-key create -d {\\"name\\":\\"${targetingKey.name}\\",\\"type\\":\\"${targetingKey.type}\\",\\"description\\":\\"${targetingKey.description}\\"}`;
      } else {
        command = `${cliBin} feature-experimentation targeting-key create -d '{"name":"${targetingKey.name}","type":"${targetingKey.type}","description":"${targetingKey.description}"}'`;
      }
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return {} as TargetingKey;
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as TargetingKey;
    }
  }

  async EditTargetingKey(id: string, targetingKey: TargetingKey): Promise<TargetingKey> {
    try {
      let command: string;
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as TargetingKey;
      }
      if (process.platform.toString() === 'win32') {
        command = `${cliBin} feature-experimentation targeting-key edit -i ${id} -d {\\"name\\":\\"${targetingKey.name}\\",\\"type\\":\\"${targetingKey.type}\\",\\"description\\":\\"${targetingKey.description}\\"}`;
      } else {
        command = `${cliBin} feature-experimentation targeting-key edit -i ${id} -d '{"name":"${targetingKey.name}","type":"${targetingKey.type}","description":"${targetingKey.description}"}'`;
      }
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return {} as TargetingKey;
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as TargetingKey;
    }
  }

  async DeleteTargetingKey(id: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }
      const command = `${cliBin} feature-experimentation targeting-key delete -i ${id}`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      if (output.stdout.includes('deleted')) {
        return true;
      }
      return false;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async ListTargetingKey(): Promise<TargetingKey[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} feature-experimentation targeting-key list --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return [];
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return [];
    }
  }

  async CreateFlag(flag: Flag): Promise<Flag> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return {} as Flag;
      }
      if (flag.type === 'boolean') {
        if (process.platform.toString() === 'win32') {
          command = `${cliBin} feature-experimentation flag create -d {\\"name\\":\\"${flag.name}\\",\\"type\\":\\"${flag.type}\\",\\"source\\":\\"cli\\",\\"description\\":\\"${flag.description}\\"}`;
        } else {
          command = `${cliBin} feature-experimentation flag create -d '{"name":"${flag.name}","type":"${flag.type}","source":"cli","description":"${flag.description}"}'`;
        }
      } else {
        if (process.platform.toString() === 'win32') {
          command = `${cliBin} feature-experimentation flag create -d {\\"name\\":\\"${flag.name}\\",\\"type\\":\\"${flag.type}\\",\\"source\\":\\"cli\\",\\"description\\":\\"${flag.description}\\",\\"default_value\\":\\"${flag.default_value}\\"}`;
        } else {
          command = `${cliBin} feature-experimentation flag create -d '{"name":"${flag.name}","type":"${flag.type}","source":"cli","description":"${flag.description}","default_value":"${flag.default_value}"}'`;
        }
      }

      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return {} as Flag;
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as Flag;
    }
  }

  async EditFlag(id: string, flag: Flag): Promise<Flag> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return {} as Flag;
      }
      if (flag.type === 'boolean') {
        if (process.platform.toString() === 'win32') {
          command = `${cliBin} feature-experimentation flag edit -i ${id} -d {\\"name\\":\\"${flag.name}\\",\\"type\\":\\"${flag.type}\\",\\"source\\":\\"cli\\",\\"description\\":\\"${flag.description}\\"}`;
        } else {
          command = `${cliBin} feature-experimentation flag edit -i ${id} -d '{"name":"${flag.name}","type":"${flag.type}","source":"cli","description":"${flag.description}"}'`;
        }
      } else {
        if (process.platform.toString() === 'win32') {
          command = `${cliBin} feature-experimentation flag edit -i ${id} -d {\\"name\\":\\"${flag.name}\\",\\"type\\":\\"${flag.type}\\",\\"source\\":\\"cli\\",\\"description\\":\\"${flag.description}\\",\\"default_value\\":\\"${flag.default_value}\\"}`;
        } else {
          command = `${cliBin} feature-experimentation flag edit -i ${id} -d '{"name":"${flag.name}","type":"${flag.type}","source":"cli","description":"${flag.description}","default_value":"${flag.default_value}"}'`;
        }
      }

      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return {} as Flag;
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as Flag;
    }
  }

  async DeleteFlag(id: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }

      command = `${cliBin} feature-experimentation flag delete -i ${id}`;

      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      if (output.stdout.includes('deleted')) {
        return true;
      }
      return false;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async ListFlag(): Promise<Flag[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} feature-experimentation flag list --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return [];
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return [];
    }
  }

  async ListAnalyzedFlag(path: string): Promise<FileAnalyzedType[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }

      if (process.platform.toString() === 'win32') {
        path = path.replaceAll('/', '\\');
      }
      const command = `${cliBin} feature-experimentation analyze flag list --output-format json --directory ${path}`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return [];
      }
      let obj: FileAnalyzedType[] = JSON.parse(output.stdout);
      return obj;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return [];
    }
  }

  async CreateCampaign(projectID: string): Promise<CampaignFE> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return {} as CampaignFE;
      }
      command = `${cliBin} feature-experimentation campaign create -d '{"project_id":"${projectID}","name":"test_campaign","description":"DESCRIPTION","type":"ab","variation_groups":[{"variations":[{"name":"VARIATION_NAME","allocation":50,"reference":true}]}]}'`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return {} as CampaignFE;
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as CampaignFE;
    }
  }

  async DeleteCampaign(id: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }

      command = `${cliBin} feature-experimentation campaign delete -i ${id}`;

      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      return true;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async ListCampaign(): Promise<CampaignFE[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} feature-experimentation campaign list --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return [];
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return [];
    }
  }

  async SwitchCampaign(id: string, status: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }
      const command = `${cliBin} feature-experimentation campaign switch -i ${id} -s ${status}`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      return true;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async DeleteVariationGroup(id: string, campaignID: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }

      command = `${cliBin} feature-experimentation variation-group delete --campaign-id ${campaignID} -i ${id}`;

      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      return true;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async DeleteVariation(id: string, campaignID: string, variationGroupID: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }

      command = `${cliBin} feature-experimentation variation delete --campaign-id ${campaignID} --variation-group-id ${variationGroupID} -i ${id}`;

      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      return true;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async GetTokenInfo(): Promise<TokenInfo> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as TokenInfo;
      }
      const command = `${cliBin} feature-experimentation token info --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return {} as TokenInfo;
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as TokenInfo;
    }
  }
}

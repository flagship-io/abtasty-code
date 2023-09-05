/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
import * as vscode from 'vscode';
import { exec, ExecOptions } from 'child_process';
import { join } from 'path';
import { Campaign, FileAnalyzedType, Flag, Goal, Project, TargetingKey, TokenInfo } from '../model';
import { CliVersion } from '../cli/cliDownloader';
import * as fs from 'fs';
export class Cli {
  private context: vscode.ExtensionContext;
  private extensionVersion: string;

  constructor(context: vscode.ExtensionContext) {
    this.extensionVersion = vscode.extensions.getExtension('ABTasty.flagship-code')?.packageJSON.version;
    this.context = context;
  }

  exec(command: string, options: ExecOptions): Promise<{ stdout: string; stderr: string }> {
    return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      exec(command + ' --user-agent=flagship-code/v' + this.extensionVersion, options, (error, stdout, stderr) => {
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
        return `${this.context.asAbsolutePath('flagship')}\\${CliVersion}\\flagship.exe`;
      }
      if (process.platform.toString() === 'darwin') {
        return `${this.context.asAbsolutePath('flagship')}/${CliVersion}/flagship`;
      }
      await fs.promises.access(join(this.context.asAbsolutePath('flagship'), `${CliVersion}/flagship`));
      return `${this.context.asAbsolutePath('flagship')}/${CliVersion}/flagship`;
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

  async Credentials(
    clientId: string | undefined,
    clientSecret: string | undefined,
    accountId: string | undefined,
    accountEnvironmentId: string | undefined,
  ): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }
      if (clientId || clientSecret || accountEnvironmentId || accountId) {
        let command = `${cliBin} configure`;
        if (clientId) {
          command += `\u0020-i ${clientId}`;
        }
        if (clientSecret) {
          command += `\u0020-s ${clientSecret}`;
        }
        if (accountId) {
          command += `\u0020-a ${accountId}`;
        }
        if (accountEnvironmentId) {
          command += `\u0020-e ${accountEnvironmentId}`;
        }
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

  async Authenticate(): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }

      let command = `${cliBin} authenticate`;
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

  async CreateProject(name: string): Promise<Project> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as Project;
      }
      const command = `${cliBin} project create -n "${name}"`;
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
      return {} as Flag;
    }
  }

  async EditProject(id: string, name: string): Promise<Project> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as Project;
      }
      const command = `${cliBin} project edit -i ${id} -n "${name}"`;
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
      const command = `${cliBin} project delete -i ${id}`;
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

  async ListProject(): Promise<Project[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} project list --output-format json`;
      const output = await this.exec(command, {});
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

  async switchProject(id: string, status: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }
      const command = `${cliBin} project switch -i ${id} -s ${status}`;
      const output = await this.exec(command, {});
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

  async CreateGoal(label: string, type: string, operator?: string, value?: string): Promise<Goal> {
    try {
      let command: string;
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as Goal;
      }
      if (process.platform.toString() === 'win32') {
        if (operator && value) {
          command = `${cliBin} goal create -d {\\"label\\":\\"${label}\\",\\"type\\":\\"${type}\\",\\"operator\\":\\"${operator}\\",\\"value\\":\\"${value}\\"}`;
        } else {
          command = `${cliBin} goal create -d {\\"label\\":\\"${label}\\",\\"type\\":\\"${type}\\"}`;
        }
      } else {
        if (operator && value) {
          command = `${cliBin} goal create -d '{"label":"${label}","type":"${type}","operator":"${operator}","value":"${value}"}'`;
        } else {
          command = `${cliBin} goal create -d '{"label":"${label}","type":"${type}"}'`;
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

  async EditGoal(id: string, label: string, operator?: string, value?: string): Promise<Goal> {
    try {
      let command: string;
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as Goal;
      }
      if (process.platform.toString() === 'win32') {
        if (operator && value) {
          command = `${cliBin} goal edit -i ${id} -d {\\"label\\":\\"${label}\\",\\"operator\\":\\"${operator}\\",\\"value\\":\\"${value}\\"}`;
        } else {
          command = `${cliBin} goal edit -i ${id} -d {\\"label\\":\\"${label}\\"}`;
        }
      } else {
        if (operator && value) {
          command = `${cliBin} goal edit -i ${id} -d '{"label":"${label}","operator":"${operator}","value":"${value}"}'`;
        } else {
          command = `${cliBin} goal edit -i ${id} -d '{"label":"${label}"}'`;
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
      const command = `${cliBin} goal delete -i ${id}`;
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

  async ListGoal(): Promise<Goal[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} goal list --output-format json`;
      const output = await this.exec(command, {});
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

  async CreateTargetingKey(name: string, type: string, description: string): Promise<TargetingKey> {
    try {
      let command: string;
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as TargetingKey;
      }
      if (process.platform.toString() === 'win32') {
        command = `${cliBin} targeting-key create -d {\\"name\\":\\"${name}\\",\\"type\\":\\"${type}\\",\\"description\\":\\"${description}\\"}`;
      } else {
        command = `${cliBin} targeting-key create -d '{"name":"${name}","type":"${type}","description":"${description}"}'`;
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

  async EditTargetingKey(id: string, name: string, type: string, description: string): Promise<TargetingKey> {
    try {
      let command: string;
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as TargetingKey;
      }
      if (process.platform.toString() === 'win32') {
        command = `${cliBin} targeting-key edit -i ${id} -d {\\"name\\":\\"${name}\\",\\"type\\":\\"${type}\\",\\"description\\":\\"${description}\\"}`;
      } else {
        command = `${cliBin} targeting-key edit -i ${id} -d '{"name":"${name}","type":"${type}","description":"${description}"}'`;
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
      const command = `${cliBin} targeting-key delete -i ${id}`;
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

  async ListTargetingKey(): Promise<TargetingKey[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} targeting-key list --output-format json`;
      const output = await this.exec(command, {});
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

  async CreateFlag(name: string, type: string, description: string, default_value: string): Promise<Flag> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return {} as Flag;
      }
      if (type === 'boolean') {
        if (process.platform.toString() === 'win32') {
          command = `${cliBin} flag create -d {\\"name\\":\\"${name}\\",\\"type\\":\\"${type}\\",\\"source\\":\\"cli\\",\\"description\\":\\"${description}\\"}`;
        } else {
          command = `${cliBin} flag create -d '{"name":"${name}","type":"${type}","source":"cli","description":"${description}"}'`;
        }
      } else {
        if (process.platform.toString() === 'win32') {
          command = `${cliBin} flag create -d {\\"name\\":\\"${name}\\",\\"type\\":\\"${type}\\",\\"source\\":\\"cli\\",\\"description\\":\\"${description}\\",\\"default_value\\":\\"${default_value}\\"}`;
        } else {
          command = `${cliBin} flag create -d '{"name":"${name}","type":"${type}","source":"cli","description":"${description}","default_value":"${default_value}"}'`;
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

  async EditFlag(id: string, name: string, type: string, description: string, default_value: string): Promise<Flag> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return {} as Flag;
      }
      if (type === 'boolean') {
        if (process.platform.toString() === 'win32') {
          command = `${cliBin} flag edit -i ${id} -d {\\"name\\":\\"${name}\\",\\"type\\":\\"${type}\\",\\"source\\":\\"cli\\",\\"description\\":\\"${description}\\"}`;
        } else {
          command = `${cliBin} flag edit -i ${id} -d '{"name":"${name}","type":"${type}","source":"cli","description":"${description}"}'`;
        }
      } else {
        if (process.platform.toString() === 'win32') {
          command = `${cliBin} flag edit -i ${id} -d {\\"name\\":\\"${name}\\",\\"type\\":\\"${type}\\",\\"source\\":\\"cli\\",\\"description\\":\\"${description}\\",\\"default_value\\":\\"${default_value}\\"}`;
        } else {
          command = `${cliBin} flag edit -i ${id} -d '{"name":"${name}","type":"${type}","source":"cli","description":"${description}","default_value":"${default_value}"}'`;
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

      command = `${cliBin} flag delete -i ${id}`;

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

  async ListFlag(): Promise<Flag[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} flag list --output-format json`;
      const output = await this.exec(command, {});
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
      const command = `${cliBin} analyze flag list --output-format json --directory ${path}`;
      const output = await this.exec(command, {});
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

  async CreateCampaign(projectID: string): Promise<Campaign> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return {} as Campaign;
      }
      command = `${cliBin} campaign create -d '{"project_id":"${projectID}","name":"test_campaign","description":"DESCRIPTION","type":"ab","variation_groups":[{"variations":[{"name":"VARIATION_NAME","allocation":50,"reference":true}]}]}'`;
      const output = await this.exec(command, {});
      console.log(output);
      if (output.stderr) {
        vscode.window.showErrorMessage(output.stderr);
        return {} as Campaign;
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as Campaign;
    }
  }

  async DeleteCampaign(id: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }

      command = `${cliBin} campaign delete -i ${id}`;

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

  async ListCampaign(): Promise<Campaign[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} campaign list --output-format json`;
      const output = await this.exec(command, {});
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

  async switchCampaign(id: string, status: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }
      const command = `${cliBin} campaign switch -i ${id} -s ${status}`;
      const output = await this.exec(command, {});
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

      command = `${cliBin} variation-group delete --campaign-id ${campaignID} -i ${id}`;

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

      command = `${cliBin} variation delete --campaign-id ${campaignID} --variation-group-id ${variationGroupID} -i ${id}`;

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
      const command = `${cliBin} token info --output-format json`;
      const output = await this.exec(command, {});
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

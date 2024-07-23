/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
import { exec, ExecOptions } from 'child_process';
import * as fs from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';
import {
  AccountWE,
  Authentication,
  CampaignWE,
  CurrentAuthentication,
  ModificationWE,
  VariationWE,
} from '../../../model';
import { CliVersion } from '../../cliDownloader';

const MAX_LINE_LENGTH = 1000; // Set to a safe value below the maxTokenizationLineLength

function logMessage(outputChannel: vscode.LogOutputChannel, message: string) {
  let chunk = message.substring(0, MAX_LINE_LENGTH);
  outputChannel.trace(chunk);
}

export class Cli {
  private context: vscode.ExtensionContext;
  private extensionVersion: string;
  private outputChannel: vscode.LogOutputChannel;

  constructor(context: vscode.ExtensionContext, outputChannel: vscode.LogOutputChannel) {
    this.extensionVersion = vscode.extensions.getExtension('ABTasty.abtasty-code')?.packageJSON.version;
    this.context = context;
    this.outputChannel = outputChannel;
  }

  exec(command: string, options: ExecOptions): Promise<{ stdout: string; stderr: string }> {
    return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      exec(
        command + ' --user-agent=abtasty-ext-vscode/v' + this.extensionVersion,
        { maxBuffer: 1024 * 1024 * 50 },
        (error, stdout, stderr) => {
          if (error) {
            reject({ error, stdout, stderr });
          }
          resolve({ stdout, stderr });
        },
      );
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
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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
        const command = `${cliBin} web-experimentation auth login -u ${authentication.username} -i ${
          authentication.client_id
        } -s ${authentication.client_secret} ${
          authentication.account_id ? `-a ${authentication.account_id}` : ``
        } --output-format json`;

        const output = await this.exec(command, {});
        console.log(output);
        this.outputChannel.trace(command);
        logMessage(this.outputChannel, output.stdout);
        if (output.stderr) {
          this.outputChannel.error(output.stderr);
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

  async UseAccount(accountId: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }
      const command = `${cliBin} web-experimentation account use -i  ${accountId} --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async UseWorkingDir(authentication: Authentication): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }
      const command = `${cliBin} web-experimentation working-directory set --path  ${authentication.working_dir} --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async DeleteAuthentication(username: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return false;
      }

      let command = `${cliBin} web-experimentation auth delete -u ${username}`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
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
      const command = `${cliBin} web-experimentation authentication list --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

      const command = `${cliBin} web-experimentation authentication get -u ${username} --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

      const command = `${cliBin} web-experimentation authentication current --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async ListAccountWE(): Promise<AccountWE[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} web-experimentation account list --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async CurrentAccountWE(): Promise<CurrentAuthentication> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as CurrentAuthentication;
      }
      const command = `${cliBin} web-experimentation account current --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async ListModificationWE(campaignId: string): Promise<ModificationWE[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} web-experimentation modification list --campaign-id ${campaignId} --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async GetVariationWE(campaignId: number, variationId: number): Promise<VariationWE> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return {} as VariationWE;
      }
      const command = `${cliBin} web-experimentation variation get --campaign-id ${campaignId} -i ${variationId} --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
        vscode.window.showErrorMessage(output.stderr);
        return {} as VariationWE;
      }
      return JSON.parse(output.stdout);
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return {} as VariationWE;
    }
  }

  async DeleteModification(id: string, campaignId: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }

      command = `${cliBin} web-experimentation modification delete -i ${id} --campaign-id ${campaignId}`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async DeleteVariationWE(id: string, campaignId: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }

      command = `${cliBin} web-experimentation variation delete -i ${id} --campaign-id ${campaignId}`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async ListCampaignWE(): Promise<CampaignWE[]> {
    try {
      const cliBin = await this.CliBin();
      if (!cliBin) {
        return [];
      }
      const command = `${cliBin} web-experimentation campaign list --output-format json`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async DeleteCampaignWE(id: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }
      command = `${cliBin} web-experimentation campaign delete -i ${id}`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async PullAccountGlobalCode(id: string, createFile?: boolean, override?: boolean, subFiles?: boolean): Promise<any> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }
      command = `${cliBin} web-experimentation account-global-code get -i ${id} ${createFile ? `--create-file` : ``} ${
        subFiles ? `--create-subfiles` : ``
      } ${override ? `--override` : ``}`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
        vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      return output.stdout;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async PushAccountGlobalCode(id: string, filepath?: string, code?: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }
      command = `${cliBin} web-experimentation account-global-code push -i ${id} ${code ? `--code ${code}` : ``} ${
        filepath ? `--file ${filepath}` : ``
      }`;

      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async PullCampaignGlobalCode(id: string, createFile?: boolean, override?: boolean, subFiles?: boolean): Promise<any> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }
      command = `${cliBin} web-experimentation campaign-global-code get -i ${id} ${createFile ? `--create-file` : ``} ${
        subFiles ? `--create-subfiles` : ``
      } ${override ? `--override` : ``}`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
        vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      return output.stdout;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async PushCampaignGlobalCode(id: string, filepath?: string, code?: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }
      command = `${cliBin} web-experimentation campaign-global-code push -i ${id} ${code ? `--code ${code}` : ``} ${
        filepath ? `--file ${filepath}` : ``
      }`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async PullVariationGlobalCodeJS(
    id: string,
    campaignId: string,
    createFile?: boolean,
    override?: boolean,
  ): Promise<any> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }
      command = `${cliBin} web-experimentation variation-global-code get-js -i ${id} --campaign-id ${campaignId} ${
        createFile ? `--create-file` : ``
      } ${override ? `--override` : ``}`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr); //vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      return output.stdout;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async PushVariationGlobalCodeJS(id: string, campaignId: string, filepath?: string, code?: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }
      command = `${cliBin} web-experimentation variation-global-code push-js -i ${id} --campaign-id ${campaignId} ${
        code ? `--code ${code}` : ``
      } ${filepath ? `--file ${filepath}` : ``}`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async PullVariationGlobalCodeCSS(
    id: string,
    campaignId: string,
    createFile?: boolean,
    override?: boolean,
  ): Promise<any> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }
      command = `${cliBin} web-experimentation variation-global-code get-css -i ${id} --campaign-id ${campaignId} ${
        createFile ? `--create-file` : ``
      } ${override ? `--override` : ``}`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr); //vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      return output.stdout;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async PushVariationGlobalCodeCSS(id: string, campaignId: string, filepath?: string, code?: string): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }
      command = `${cliBin} web-experimentation variation-global-code push-css -i ${id} --campaign-id ${campaignId} ${
        code ? `--code ${code}` : ``
      } ${filepath ? `--file ${filepath}` : ``}`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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

  async PullModificationCode(id: string, campaignId: string, createFile?: boolean, override?: boolean): Promise<any> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }
      command = `${cliBin} web-experimentation modification-code get -i ${id} --campaign-id ${campaignId} ${
        createFile ? `--create-file` : ``
      } ${override ? `--override` : ``}`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr); //vscode.window.showErrorMessage(output.stderr);
        return false;
      }
      return output.stdout;
    } catch (err: any) {
      vscode.window.showErrorMessage(err.error);
      console.error(err);
      return false;
    }
  }

  async PushModificationCode(
    id: string,
    campaignId: string,
    variationId: string,
    filepath?: string,
    code?: string,
  ): Promise<boolean> {
    try {
      const cliBin = await this.CliBin();
      let command: string;
      if (!cliBin) {
        return false;
      }
      command = `${cliBin} web-experimentation modification-code push -i ${id} --campaign-id ${campaignId} --variation-id ${variationId} ${
        code ? `--code ${code}` : ``
      } ${filepath ? `--file ${filepath}` : ``}`;
      const output = await this.exec(command, {});
      console.log(output);
      this.outputChannel.trace(command);
      logMessage(this.outputChannel, output.stdout);
      if (output.stderr) {
        this.outputChannel.error(output.stderr);
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
}

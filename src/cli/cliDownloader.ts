/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-var-requires */

import * as fs from 'fs';
import * as vscode from 'vscode';
import * as tar from 'tar-fs';
import axios from 'axios';
import { rimraf } from 'rimraf';
import { createGunzip } from 'zlib';

export const CliVersion = '1.0.8';

export async function CliDownloader(context: vscode.ExtensionContext, binaryDir: string) {
  const abtastyDir = context.asAbsolutePath('abtasty-cli');
  const cliTar = context.asAbsolutePath(`abtasty-cli/abtasty-cli-${CliVersion}.tar.gz`);

  async function installDir(): Promise<void> {
    let platform = process.platform.toString();
    let cliUrl: string;
    let arch: string;
    const file = fs.createWriteStream(cliTar);
    const unzip = createGunzip();

    if (!fs.existsSync(abtastyDir)) {
      fs.mkdirSync(abtastyDir);
    }
    if (!fs.existsSync(binaryDir)) {
      fs.mkdirSync(binaryDir);
    }

    if (platform === 'win32') {
      platform = 'windows';
    }

    switch (process.arch) {
      case 'x64':
        arch = 'amd64';
        break;
      case 'ia32':
        arch = '386';
        break;
      default:
        arch = process.arch;
    }

    if (platform === 'darwin') {
      cliUrl = `https://github.com/flagship-io/abtasty-cli/releases/download/v${CliVersion}/abtasty-cli_${CliVersion}_darwin_all.tar.gz`;
    } else {
      cliUrl = `https://github.com/flagship-io/abtasty-cli/releases/download/v${CliVersion}/abtasty-cli_${CliVersion}_${platform}_${arch}.tar.gz`;
    }

    try {
      const archivedCLI = await axios.get(cliUrl, {
        responseType: 'arraybuffer',
        method: 'GET',
        headers: {
          'Content-Type': 'application/gzip',
        },
      });
      file.write(archivedCLI.data);
      file.end();
    } catch (err) {
      console.error(err);
    }
    try {
      file.on('finish', () => {
        fs.createReadStream(cliTar).pipe(unzip).pipe(tar.extract(binaryDir));
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function download(): Promise<void> {
    try {
      await rimraf(`${abtastyDir}/*`);
    } catch (err) {
      console.error(err);
    }
    await installDir();
  }

  await download();
}

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { WEB_EXPERIMENTATION_TREE_CODE_OPEN_FILE, WEB_EXPERIMENTATION_TREE_CODE_REFRESH } from '../../commands/const';
import { CampaignStore } from '../../store/webExperimentation/CampaignStore';

function findAbtastyFolder(rootPath: string) {
  const dirs = fs.readdirSync(rootPath).filter((file) => fs.statSync(path.join(rootPath, file)).isDirectory());
  const abtastyDir = dirs.find((dir) => dir.toLowerCase() === 'abtasty');
  return abtastyDir ? path.join(rootPath, abtastyDir) : null;
}

/* export class TreeCodeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private workspaceABTasty: any;
  private campaignStore: CampaignStore;
  constructor(workspaceRoot: any, campaignStore: CampaignStore) {
    this.workspaceABTasty = workspaceRoot;
    this.campaignStore = campaignStore;

    vscode.commands.registerCommand(WEB_EXPERIMENTATION_TREE_CODE_REFRESH, async () => await this.refresh());
  }

  getTreeItem(element: any) {
    return element;
  }

  getChildren(element: any) {
    if (!this.workspaceABTasty) {
      return Promise.resolve([new FileStat('No folder or workspace opened', false, null)]);
    }

    const abtastyPath = findAbtastyFolder(this.workspaceABTasty);
    if (!abtastyPath) {
      return Promise.resolve([new FileStat('not found', false, null)]);
    }

    const directoryPath = element ? element.path : abtastyPath;
    return Promise.resolve(this.getFiles(directoryPath));
  }

  async getFiles(directoryPath: any) {
    const campaignList = await this.campaignStore.refreshCampaign();
    const files = fs.readdirSync(directoryPath);
    return files.map((file: any) => {
      const filePath = path.join(directoryPath, file);
      const stat = fs.statSync(filePath);
      return new FileStat(filePath, stat.isDirectory(), path.basename(filePath));
    });
  }
}

class FileItem extends vscode.TreeItem {
  parentID: string | undefined;

  constructor(label: string, isDirectory: any, parentID?: string, iconPath?: vscode.ThemeIcon) {
    super(label!, isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

    this.parentID = parentID;
    this.iconPath = iconPath;
  }
}

class FileStat extends FileItem {
  path: any;
  constructor(filePath: any, isDirectory: any, parent: any, command?: vscode.Command) {
    super(
      path.basename(filePath),
      isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
      parent,
    );

    this.path = filePath;

    if (!isDirectory) {
      this.command = {
        title: 'Open File',
        command: WEB_EXPERIMENTATION_TREE_CODE_OPEN_FILE,
        arguments: [filePath],
      };
    }
    this.contextValue = isDirectory ? 'folderWEItem' : 'fileWEItem';
  }
} */

const NON_COLLAPSED = vscode.TreeItemCollapsibleState.None;

export class TreeCodeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _items: FileItem[] = [];
  workspaceABTasty: any;
  lookup: any;

  constructor(workspaceRoot: any, campaignStore: CampaignStore) {
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_TREE_CODE_REFRESH, async () => await this.refresh());
    this.workspaceABTasty = workspaceRoot;
    this.lookup = buildLookup(jsonData);
  }

  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | null | void> =
    new vscode.EventEmitter<vscode.TreeItem | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | null | void> = this._onDidChangeTreeData.event;

  async refresh() {
    this._items = [];
    if (!this.workspaceABTasty) {
      return Promise.resolve([new FileStat('No folder or workspace opened', '', false)]);
    }

    const abtastyPath = findAbtastyFolder(this.workspaceABTasty);
    if (!abtastyPath) {
      return Promise.resolve([new FileStat('Not found', '', false)]);
    }

    this._items = await this.getFileItems(abtastyPath);
    this._onDidChangeTreeData.fire(null);
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getParent(element: FileStat) {
    if (!element || !element.parentPath) {
      return null;
    }

    const stat = fs.statSync(element.parentPath);
    return new FileStat(element.parentPath, element.parentPath, stat.isDirectory());
  }

  async getChildren(element?: FileStat) {
    if (!this.workspaceABTasty) {
      return Promise.resolve([new FileStat('No folder or workspace opened', '', false)]);
    }

    const abtastyPath = findAbtastyFolder(this.workspaceABTasty);
    if (!abtastyPath) {
      return Promise.resolve([new FileStat('not found', '', false)]);
    }

    const directoryPath = element ? element.path : abtastyPath;
    return Promise.resolve(this.getFileItems(directoryPath));
  }

  private async getFileItems(directoryPath: any) {
    //console.log(directoryPath);
    const files = fs.readdirSync(directoryPath);
    return files.map((file: any) => {
      const filePath = path.join(directoryPath, file);
      const stat = fs.statSync(filePath);
      const id = path.basename(filePath);
      // Lookup the name using the ID from the file/directory name
      let label = id;
      if (this.lookup.campaigns[id]) {
        label = `${this.lookup.campaigns[id].name} (${id})`;
      } else if (this.lookup.variations[id]) {
        label = `${this.lookup.variations[id].name} (${id})`;
      } else if (this.lookup.modifications[id]) {
        label = `${this.lookup.modifications[id].name} (${id})`;
      }
      return new FileStat(label, filePath, stat.isDirectory());
    });
  }
}

class FileItem extends vscode.TreeItem {
  parentID: string | undefined;

  constructor(label: string, isDirectory: any, parentID?: string, iconPath?: vscode.ThemeIcon) {
    super(label!, isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

    this.parentID = parentID;
    this.iconPath = iconPath;
  }
}

export class FileStat extends FileItem {
  path: string;
  parentPath: string;
  type: string | undefined;

  constructor(label: string, filePath: string, isDirectory: boolean) {
    super(
      label,
      isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
      path.dirname(filePath),
    );

    this.path = filePath;
    this.parentPath = path.dirname(filePath);

    this.contextValue = isDirectory ? 'folderWEItem' : 'fileWEItem';

    switch (this.label) {
      case 'campaignGlobalCode.js':
        this.type = 'campaign';
        this.contextValue = isDirectory ? 'campaignFolderWEItem' : 'campaignFileWEItem';
        break;

      case 'element.js':
        this.type = 'modification';
        this.contextValue = isDirectory ? 'modificationFolderWEItem' : 'modificationFileWEItem';
        break;

      case 'accountGlobalCode.js':
        this.type = 'account';
        this.contextValue = isDirectory ? 'accountFolderWEItem' : 'accountFileWEItem';

        break;

      case 'variationGlobalCode.js':
        this.type = 'variationJS';
        break;

      case 'variationGlobalCode.css':
        this.type = 'variationCSS';
        break;
    }

    if (!isDirectory) {
      this.command = {
        title: 'Open File',
        command: WEB_EXPERIMENTATION_TREE_CODE_OPEN_FILE,
        arguments: [this],
      };
    }
  }
}

function buildLookup(data: any) {
  const lookup = {
    accounts: {},
    campaigns: {},
    variations: {},
    modifications: {},
  } as any;

  // Assuming the structure is exactly as you've given in the JSON sample
  lookup.accounts[data.account.id] = data.account.name;
  data.account.campaigns.forEach((campaign: any) => {
    lookup.campaigns[campaign.id] = { name: campaign.name, accountId: data.account.id };
    campaign.variations.forEach((variation: any) => {
      lookup.variations[variation.id] = { name: variation.name, campaignId: campaign.id };
      variation.modifications.forEach((modification: any) => {
        lookup.modifications[modification.id] = { name: modification.name, variationId: variation.id };
      });
    });
  });

  return lookup;
}

// Example data structure initialization
const jsonData = {
  account: {
    id: '53651',
    name: 'vscode',
    campaigns: [
      {
        id: '1161606',
        name: 'hello',
        variations: [
          {
            id: '1440570',
            name: 'var1',
            modifications: [
              {
                id: '5025336',
                name: 'modif1',
              },
            ],
          },
        ],
      },
    ],
  },
};

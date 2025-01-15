import * as vscode from 'vscode';
import {
  WEB_EXPERIMENTATION_AUDIENCE_LIST_REFRESH,
  WEB_EXPERIMENTATION_AUDIENCE_LIST_LOAD,
} from '../../commands/const';
import { CIRCLE_FILLED, INFO, MOVE, SYMBOL_EVENT, TARGET } from '../../icons';
import { Audience } from '../../model';
import { NO_RESOURCE_FOUND } from '../../const';
import { AccountWEStore } from '../../store/webExperimentation/AccountStore';
import { AudienceStore } from '../../store/webExperimentation/AudienceStore';

export type Parent = {
  id: string;
  parent: Parent;
};

export class AudienceListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _tree: AudienceTreeItem[] = [];
  private audienceStore: AudienceStore;
  private accountStore: AccountWEStore;
  public currentAccountId: string | undefined;

  _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<
    vscode.TreeItem | undefined | void
  >();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(
    private context: vscode.ExtensionContext,
    accountStore: AccountWEStore,
    audienceStore: AudienceStore,
    currentAccountId: string,
  ) {
    this.audienceStore = audienceStore;
    this.accountStore = accountStore;
    this.currentAccountId = currentAccountId;
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_AUDIENCE_LIST_REFRESH, async () => await this.refresh());
    vscode.commands.registerCommand(WEB_EXPERIMENTATION_AUDIENCE_LIST_LOAD, () => this.load());
  }

  async refresh() {
    const account = await this.accountStore.currentAccount();
    this.currentAccountId = account.account_id;
    await this.getRefreshedAudiences();
    this._onDidChangeTreeData.fire();
  }

  async load() {
    const account = await this.accountStore.currentAccount();
    this.currentAccountId = account.account_id;
    this.getLoadedAudiences();
    this._onDidChangeTreeData.fire();
  }

  async fire() {
    this._onDidChangeTreeData.fire();
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: AudienceTreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    if (typeof element === 'undefined') {
      if (this._tree.length === 0) {
        const noAudience = new vscode.TreeItem('No Audience found');
        return [noAudience];
      }
      return this._tree;
    }

    if (element.children?.length === 0) {
      return [new AudienceTreeItem(NO_RESOURCE_FOUND)];
    }
    return element.children;
  }

  private mappingAudience(audienceList: Audience[]): AudienceTreeItem[] {
    const audienceTreeList: AudienceTreeItem[] = [];

    const accountParent = { id: this.currentAccountId } as Parent;

    audienceList.map((a: Audience) => {
      const audienceParent = { id: a.id, parent: accountParent } as Parent;
      const audienceData: AudienceTreeItem[] = [];
      const audienceDetails = Object.entries(a)
        .filter(([key, value]) => key !== 'groups' && key !== 'live_tests_source' && value !== null)
        .map(([key, value]) => {
          if (key === 'created_at') {
            const createdAt = Object.entries(a.created_at).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, undefined, createdAt, undefined);
          }
          if (key === 'updated_at') {
            const updatedAt = Object.entries(a.updated_at).map(([key, value]) => {
              return new SimpleItem(key, undefined, value, undefined, undefined);
            });
            return new SimpleItem(key, undefined, undefined, updatedAt, undefined);
          }
          if (key === 'groups') {
            return new AudienceGroupItem(key, undefined, value, undefined, undefined);
          }

          return new SimpleItem(key, undefined, value, undefined, undefined);
        });

      const audienceWEItem = new AudienceWEItem(a.name, a.id, a.is_segment, a, audienceData, accountParent);

      if (audienceDetails.length !== 0) {
        audienceData.push(new AudienceTreeItem('Info/Details', undefined, audienceDetails, undefined, INFO));
      }

      audienceTreeList.push(audienceWEItem);
      return;
    });

    return audienceTreeList;
  }

  private mappingTree(audienceList: Audience[]) {
    const audienceTreeList: AudienceTreeItem[] = [];
    const triggerTreeList: AudienceTreeItem[] = [];
    const segmentTreeList: AudienceTreeItem[] = [];

    const audienceWEItem = this.mappingAudience(audienceList);
    audienceWEItem.map((a: AudienceTreeItem) => {
      if (a instanceof AudienceWEItem) {
        if (a.isSegment) {
          segmentTreeList.push(a);
        } else {
          triggerTreeList.push(a);
        }
      }
    });

    if (triggerTreeList.length !== 0) {
      audienceTreeList.push(
        new AudienceTreeItem(
          `Trigger - ${triggerTreeList.length} audience(s)`,
          undefined,
          triggerTreeList,
          undefined,
          SYMBOL_EVENT,
        ),
      );
    }

    if (segmentTreeList.length !== 0) {
      audienceTreeList.push(
        new AudienceTreeItem(
          `Segment - ${segmentTreeList.length} audience(s)`,
          undefined,
          segmentTreeList,
          undefined,
          MOVE,
        ),
      );
    }

    return audienceTreeList;
  }

  private async getRefreshedAudiences() {
    const audienceList = await this.audienceStore.refreshAudience();
    this._tree = this.mappingTree(audienceList);
  }

  private getLoadedAudiences() {
    const audienceList = this.audienceStore.loadAudiences();
    this._tree = this.mappingTree(audienceList);
  }
}

export class AudienceTreeItem extends vscode.TreeItem {
  public children: AudienceTreeItem[] | undefined;
  public parent: any;
  public resourceId: string | undefined;

  constructor(
    label?: string,
    resourceId?: string,
    children?: AudienceTreeItem[],
    parent?: any,
    iconPath?: vscode.ThemeIcon,
  ) {
    super(
      label!,
      children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
    );
    this.children = children;
    this.parent = parent;
    this.iconPath = iconPath;
    this.resourceId = resourceId;
  }
}

export class AudienceWEItem extends AudienceTreeItem {
  public children: AudienceTreeItem[] | undefined;
  public parent: any;
  public isSegment?: boolean;
  public audience?: Audience;

  constructor(
    public readonly name?: string,
    resourceId?: string,
    isSegment?: boolean,
    audience?: any,

    children?: AudienceTreeItem[],
    parent?: any,
  ) {
    super(name!, resourceId!, children, parent);
    this.tooltip = `Type: ${this.resourceId}`;
    this.description = `- id: ${this.resourceId}`;
    this.isSegment = isSegment;
    this.children = children;
    this.parent = parent;
    this.audience = audience;

    if (isSegment) {
      this.iconPath = MOVE;
    } else {
      this.iconPath = SYMBOL_EVENT;
    }
  }

  contextValue = 'audienceWEItem';
}

export class SimpleItem extends AudienceTreeItem {
  constructor(
    public readonly key?: string,
    resourceId?: string,
    public readonly value?: unknown,
    children?: AudienceTreeItem[],
    parent?: any,
  ) {
    super(key!, resourceId, children, parent);
    this.tooltip = JSON.stringify(value);
    this.description = JSON.stringify(value);
  }
  iconPath = CIRCLE_FILLED;

  contextValue = 'simpleItem';
}

export class AudienceGroupItem extends AudienceTreeItem {
  constructor(
    public readonly key?: string,
    resourceId?: string,
    public readonly value?: unknown,
    children?: AudienceTreeItem[],
    parent?: any,
  ) {
    super(key!, resourceId, children, parent);
    this.tooltip = JSON.stringify(value);
    this.description = JSON.stringify(value);
  }
  iconPath = CIRCLE_FILLED;

  contextValue = 'audienceGroupItem';
}

/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { CIRCLE_FILLED } from './icons';

export type Project = {
  id: string;
  name: string;
};

export type Campaign = {
  id: string;
  name: string;
  type: string;
  description: string;
  project_id: string;
  status: string;
  variation_groups: VariationGroup[];
  scheduler: Scheduler;
};

export type Scheduler = {
  start_date: string;
  stop_date: string;
  timezone: string;
};

export type VariationGroup = {
  id: string;
  name: string;
  variations: Variation[];
  targeting: Targeting;
};

export type Targeting = {
  targeting_groups: TargetingGroup[];
};

export type TargetingGroup = {
  targetings: Targetings[];
};

export type Targetings = {
  key: string;
  operator: string;
  value: string;
};

export type Variation = {
  id: string;
  name: string;
  reference: boolean;
  allocation: number;
  modifications: Modification;
};

export type Modification = {
  type: string;
  value: any;
};

export type Flag = {
  id: string;
  name: string;
  type: string;
  description: string;
  source: string;
  default_value: string;
  predefined_values: string[];
};

export type Goal = {
  id: string;
  label: string;
  type: string;
  operator?: string;
  value?: string;
};

export type TargetingKey = {
  id?: string;
  name: string;
  type: string;
  description: string;
};

export type FlagAnalyzedType = {
  LineNumber: number;
  CodeLines: string;
  CodeLineHighlight: number;
  CodeLineURL: string;
  FlagKey: string;
  FlagDefaultValue: string;
  FlagType: string;
};

export interface Credential {
  account_environment_id: string;
  account_id: string;
  client_id: string;
  client_secret: string;
  expiration: number;
  token: string;
}

export type FileAnalyzedType = {
  File: string;
  FileURL: string;
  Error: string;
  Results: FlagAnalyzedType[];
};

export type SecretCredentials = {
  client_id: string;
  client_secret: string;
};

export interface CredentialStore {
  name: string;
  clientId: string;
  clientSecret: string;
  accountId: string;
  accountEnvId: string;
  path: string;
}

export class ItemResource extends vscode.TreeItem {
  public readonly label!: string;
  constructor(label: string, labelValue: string) {
    super(`${capitalizeFirstLetter(label)}: ${labelValue}`, vscode.TreeItemCollapsibleState.None);
  }
  iconPath = CIRCLE_FILLED;
}

function capitalizeFirstLetter(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

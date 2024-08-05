/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { CIRCLE_FILLED } from './icons';

export type Configuration = {
  name: string;
  client_id: string;
  client_secret: string;
  account_id: string;
  account_environment_id: string;
  path: string;
  scope?: string;
};

export type Authentication = {
  username: string;
  client_id: string;
  client_secret: string;
  account_id: string;
  account_environment_id: string;
  account_environment_list: AccountEnvironmentFE[];
  path: string;
  scope?: string;
  working_dir: string;
};

export type AccountEnvironmentFE = {
  id: string;
  environment: string;
  is_main: boolean;
  panic: boolean;
  single_assignment: boolean;
};

export type AccountWE = {
  id: number;
  name: string;
  identifier: string;
  role: string;
  pack: string;
};

export type CurrentAuthentication = {
  current_used_credential: string;
  account_id: string;
  account_environment_id: string;
};

export type Project = {
  id: string;
  name: string;
  campaigns?: CampaignFE[];
};

export type CampaignFE = {
  id: string;
  name: string;
  type: string;
  description: string;
  project_id: string;
  status: string;
  variation_groups: VariationGroup[];
  scheduler: Scheduler;
  labels: string[];
};

export type CampaignWE = {
  id: number;
  name: string;
  type: string;
  sub_type: string;
  description: string;
  url: string;
  state: string;
  global_code: string;
  source_code: string;
  sub_tests: CampaignWE[];
  labels: string[];
  variations: VariationWE[];
  traffic: Traffic;
  created_at: DateWE;
  live_at: DateWE;
  last_pause: DateWE;
  last_play: DateWE;
  start_on: DateWE;
  stop_on: DateWE;
  reset_at: DateWE;
};

export type Traffic = {
  value: number;
  last_increased_traffic: string;
  visitors: number;
  original_visitors: number;
  visitor_limit: number;
};

export type DateWE = {
  readable_date: string;
  timestamp: number;
  pattern: string;
  timezone: string;
};

export type VariationWE = {
  id: number;
  name: string;
  type: string;
  description: string;
  traffic: number;
  visual_editor: boolean;
  code_editor: boolean;
  components: ComponentWE[];
};

export type ComponentWE = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  js: string;
  css: string;
  html: string;
  form: string;
  options: string;
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
  modifications: ModificationFE;
};

export type ModificationFE = {
  type: string;
  value: any;
};

export type ModificationWE = {
  id: number;
  name: string;
  type: string;
  value: string;
  variation_id: number;
  selector: string;
  engine: string;
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

export type AccountFE = {
  id: string;
  name: string;
  associatedUsername: string;
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
  scope?: string;
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

export type TokenInfo = {
  client_id: string;
  account: string;
  expires_in: number;
  scope: string;
};

export type Scope = {
  campaign?: string[];
  environment?: string[];
  flag?: string[];
  flag_analytics?: string[];
  goal?: string[];
  project?: string[];
  targeting_key?: string[];
};

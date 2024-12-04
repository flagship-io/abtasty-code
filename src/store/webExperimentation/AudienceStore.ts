import * as vscode from 'vscode';
import { Cli } from '../../cli/cmd/webExperimentation/Cli';
import { Audience } from '../../model';
import { AudienceDataService } from '../../services/webExperimentation/AudienceDataService';

export class AudienceStore {
  private cli: Cli;
  private audienceService: AudienceDataService;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.cli = cli;
    this.audienceService = new AudienceDataService(context);
  }

  loadAudiences(): Audience[] {
    return this.audienceService.getState();
  }

  async refreshAudience(): Promise<Audience[]> {
    const audiences = await this.cli.ListAudience();
    await this.audienceService.loadState(audiences);
    return audiences;
  }
}

import * as vscode from 'vscode';
import { Cli } from '../../cli/cmd/webExperimentation/Cli';
import { FavoriteUrl } from '../../model';
import { FavoriteUrlDataService } from '../../services/webExperimentation/FavoriteUrlDataService';

export class FavoriteUrlStore {
  private cli: Cli;
  private favoriteUrlService: FavoriteUrlDataService;

  constructor(context: vscode.ExtensionContext, cli: Cli) {
    this.cli = cli;
    this.favoriteUrlService = new FavoriteUrlDataService(context);
  }

  loadFavoriteUrls(): FavoriteUrl[] {
    return this.favoriteUrlService.getState();
  }

  async refreshFavoriteUrl(): Promise<FavoriteUrl[]> {
    const favoriteUrls = await this.cli.ListFavoriteUrl();
    await this.favoriteUrlService.loadState(favoriteUrls);
    return favoriteUrls;
  }
}

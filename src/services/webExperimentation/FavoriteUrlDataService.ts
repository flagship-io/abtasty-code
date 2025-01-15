import * as vscode from 'vscode';
import { GLOBAL_LIST_FAVORITE_URL_WE } from './const';
import { FavoriteUrl } from '../../model';

export class FavoriteUrlDataService {
  private context: vscode.ExtensionContext;
  private favoriteUrlList: FavoriteUrl[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.favoriteUrlList = this.context.globalState.get(GLOBAL_LIST_FAVORITE_URL_WE) || [];
  }

  getState(): FavoriteUrl[] {
    return this.favoriteUrlList;
  }

  async loadState(state: FavoriteUrl[]) {
    this.favoriteUrlList = state;
    await this.context.globalState.update(GLOBAL_LIST_FAVORITE_URL_WE, this.favoriteUrlList);
  }

  async saveFavoriteUrl(favoriteUrl: FavoriteUrl) {
    const newFavoriteUrls = [...this.favoriteUrlList, favoriteUrl];
    await this.loadState(newFavoriteUrls);
  }

  async editFavoriteUrl(favoriteUrlId: string, newFavoriteUrl: FavoriteUrl) {
    const oldFavoriteUrls = this.favoriteUrlList.filter((f) => favoriteUrlId !== f.id);
    const newFavoriteUrls = [...oldFavoriteUrls, newFavoriteUrl];
    await this.loadState(newFavoriteUrls);
    return newFavoriteUrls;
  }

  async deleteFavoriteUrl(favoriteUrlId: string) {
    const newFavoriteUrls = this.favoriteUrlList.filter((f) => favoriteUrlId !== f.id);
    await this.loadState(newFavoriteUrls);
  }
}

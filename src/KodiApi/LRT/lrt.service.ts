import { Injectable } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { LrtApiClient } from './LrtApiClient/lrt-api.client';
import { RecentSearchesService } from '../RecentSearches/recent-searches.service';

@Injectable()
export class LrtService {
  constructor(
    private readonly kodiApiResponseFactory: KodiApiResponseFactory,
    private readonly lrtApiClient: LrtApiClient,
    private readonly recentSearchesService: RecentSearchesService,
  ) {}

  getMainMenu(): Promise<ApiResponse> {
    const apiResponse = this.kodiApiResponseFactory.createApiResponse();
    apiResponse.setNoSort().setTitle('LRT.lt');

    return this.createMainMenu(apiResponse);
  }

  private async createMainMenu(apiResponse: ApiResponse): Promise<ApiResponse> {
    apiResponse.addNavigationItems(
      [
        ['paieška', 'search', ''],
        ['neseniai ieskoti', 'recent'],
        ['viskas', 'tema/viskas'],
      ],
      'lrt/',
    );

    const recentCategories = await this.lrtApiClient.getRecentCategories(7);
    for (const category of recentCategories) {
      apiResponse
        .createItem()
        .setPath('/lrt/cat/' + category.categoryId)
        .setThumb(category.thumb)
        .setLabel(category.title)
        .setToFolder();
    }

    return apiResponse;
  }

  async searchCategories(query: string): Promise<ApiResponse> {
    const searchResponseDto = await this.lrtApiClient.searchCategories(query);
    const apiResponse = this.kodiApiResponseFactory.createApiResponse();

    apiResponse.setTitle('LRT ' + query);
    for (const itemDto of searchResponseDto.items) {
      apiResponse
        .createItem()
        .setLabel(itemDto.label)
        .setThumb(itemDto.thumb)
        .setPath('lrt/cat/' + itemDto.categoryId)
        .setToFolder();
    }

    return apiResponse;
  }

  async getCategory(catId: string): Promise<ApiResponse> {
    const searchResponseDto = await this.lrtApiClient.getCategory(catId);
    const apiResponse = this.kodiApiResponseFactory.createApiResponse();
    apiResponse.setTitle('LRT.lt');

    for (const itemDto of searchResponseDto.items) {
      apiResponse
        .createItem()
        .setLabel(itemDto.label + ' ' + itemDto.date)
        .setDate(itemDto.date)
        .setThumb(itemDto.thumb)
        .setPath('lrt/play' + itemDto.url)
        .setToPlayable(true)
        .setPlot(itemDto.date);
    }

    return apiResponse;
  }

  async getPlayableItem(mediaUrl: string): Promise<ApiResponse> {
    const playableUrl = await this.lrtApiClient.getPlaylist(mediaUrl);
    const apiResponse = this.kodiApiResponseFactory.createApiResponse();
    apiResponse.setTitle('LRT.lt');
    apiResponse.setToPlayable(playableUrl);

    return apiResponse;
  }

  async getRecentSearches(): Promise<ApiResponse> {
    return this.recentSearchesService.getRecentSearches('lrt', 'lrt/search');
  }
}

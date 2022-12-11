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

  getMainMenu(): ApiResponse {
    const apiResponse = this.kodiApiResponseFactory.createApiResponse();
    apiResponse.setNoSort().setTitle('LRT.lt');
    this.createMainMenu(apiResponse);

    return apiResponse;
  }

  private createMainMenu(apiResponse: ApiResponse): void {
    //todo - refactor to 5 most recent searches + viskas?
    const items = {
      'lrt/recent': 'neseniai ieskoti',
      'lrt/tema/vaikams': 'vaikams',
      'lrt/tema/sportas': 'sportas',
      'lrt/tema/kultura': 'kultura',
      'lrt/tema/muzika': 'muzika',
      'lrt/tema/viskas': 'viskas',
      'lrt/tema/tv-laidos': 'tv-laidos',
    };
    apiResponse
      .createItem()
      .setPath('lrt/search')
      .setActionSearch()
      .setLabel('paieška');

    for (const [path, label] of Object.entries(items)) {
      apiResponse.createItem().setLabel(label).setToFolder().setPath(path);
    }
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

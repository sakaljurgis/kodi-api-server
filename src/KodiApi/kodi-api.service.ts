import { Injectable } from '@nestjs/common';
import ApiResponse from './Dto/api-response.dto';
import { KodiApiResponseFactory } from './kodi-api-response.factory';

@Injectable()
export class KodiApiService {
  constructor(
    private readonly kodiApiResponseFactory: KodiApiResponseFactory,
  ) {}

  getMainMenu(): ApiResponse {
    return this.kodiApiResponseFactory
      .createApiResponse()
      .setTitle('Menu')
      .addNavigationItems([
        ['All Files', 'all'],
        ['Torr', 'torr'],
        ['LRT.lt', 'lrt'],
        //['Test', 'test'],
      ]);
  }

  getCurrentTest() {
    return this.kodiApiResponseFactory
      .createApiResponse()
      .setTitle('Menu')
      .addNavigationItems([
        ['select 1', 'all'],
        ['select 2', 'lrt'],
        ['select 3', 'torr'],
        ['select 4 search', 'test', ''],
      ])
      .setShowAsSelectList();
  }
}

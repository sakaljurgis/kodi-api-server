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
        ['Continue watching', 'all/continue'],
        // the "All Files" menu, inlined
        ['Movies', 'all/movie'],
        ['Shows', 'all/show'],
        ['Scan for new Files', 'all/scan'],
        ['Re-Scan Files', 'all/scan-all'],
        // not used at the moment, still reachable by path
        //['Torr', 'torr'],
        //['LRT.lt', 'lrt'],
        //['Test', 'test'],
      ])
      .setNoSort();
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

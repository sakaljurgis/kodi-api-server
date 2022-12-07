import { Injectable } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';

@Injectable()
export class LrtService {
  constructor(
    private readonly kodiApiResponseFactory: KodiApiResponseFactory,
  ) {}
  getMainMenu(): ApiResponse {
    const apiResponse = this.kodiApiResponseFactory.createApiResponse();
    apiResponse.setNoSort().setTitle('LRT.lt');
    this.createMainMenu(apiResponse);

    return apiResponse;
  }

  private createMainMenu(apiResponse: ApiResponse): void {
    const items = {
      'lrt/recent': 'neseniai ieškoti',
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
}

import { Injectable } from '@nestjs/common';
import ApiResponse from './Dto/api-response.dto';
import { KodiApiResponseFactory } from './kodi-api-response.factory';

@Injectable()
export class KodiApiService {
  constructor(
    private readonly kodiApiResponseFactory: KodiApiResponseFactory,
  ) {}

  getMainMenu(): ApiResponse {
    const apiResponse = this.kodiApiResponseFactory.createApiResponse();

    apiResponse.setTitle('Menu');
    this.createMainMenu(apiResponse);

    return apiResponse;
  }

  private createMainMenu(apiResponse: ApiResponse): void {
    const items = {
      all: 'All files',
      torr: 'Torr',
      lrt: 'LRT.lt',
    };

    for (const [path, label] of Object.entries(items)) {
      apiResponse.createItem().setLabel(label).setToFolder().setPath(path);
    }
  }
}

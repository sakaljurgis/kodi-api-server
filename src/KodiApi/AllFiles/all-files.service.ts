import { Injectable } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';

@Injectable()
export class AllFilesService {
  constructor(private readonly koiApiResponseFactory: KodiApiResponseFactory) {}

  getMenu(): ApiResponse {
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse
      .createItem()
      .setLabel('Movies')
      .setPath('all/movie')
      .setToFolder();
    apiResponse
      .createItem()
      .setLabel('Shows')
      .setPath('all/show')
      .setToFolder();

    return apiResponse;
  }
}

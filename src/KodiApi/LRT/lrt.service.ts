import { Injectable } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';

@Injectable()
export class LrtService {
  constructor(
    private readonly kodiApiResponseFactory: KodiApiResponseFactory,
  ) {}
  getMainMenu(): ApiResponse {
    return this.kodiApiResponseFactory.createApiResponse();
  }
}

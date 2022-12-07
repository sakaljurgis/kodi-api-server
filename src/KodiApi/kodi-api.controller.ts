import { Controller, Get } from '@nestjs/common';
import { KodiApiService } from './kodi-api.service';

@Controller('api')
export class KodiApiController {
  constructor(private readonly kodiApiService: KodiApiService) {}
  @Get()
  getMainMenu() {
    return this.kodiApiService.getMainMenu();
  }
}

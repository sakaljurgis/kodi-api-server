import { Module } from '@nestjs/common';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { RecentSearchesService } from './recent-searches.service';

@Module({
  imports: [],
  controllers: [],
  providers: [RecentSearchesService, KodiApiResponseFactory],
  exports: [RecentSearchesService],
})
export class RecentSearchesModule {}

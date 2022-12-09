import { Module } from '@nestjs/common';
import { LrtController } from './lrt.controller';
import { LrtService } from './lrt.service';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { LrtApiClientModule } from './LrtApiClient/lrt-api-client.module';
import { RecentSearchesService } from '../RecentSearches/recent-searches.service';

@Module({
  imports: [LrtApiClientModule],
  controllers: [LrtController],
  providers: [KodiApiResponseFactory, LrtService, RecentSearchesService],
})
export class LrtModule {}

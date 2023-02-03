import { Module } from '@nestjs/common';
import { LrtController } from './lrt.controller';
import { LrtService } from './lrt.service';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { LrtApiClientModule } from './LrtApiClient/lrt-api-client.module';
import { RecentSearchesModule } from '../RecentSearches/recent-searches.module';

@Module({
  imports: [LrtApiClientModule, RecentSearchesModule],
  controllers: [LrtController],
  providers: [KodiApiResponseFactory, LrtService],
})
export class LrtModule {}

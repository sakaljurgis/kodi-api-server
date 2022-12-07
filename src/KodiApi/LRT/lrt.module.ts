import { Module } from '@nestjs/common';
import { LrtController } from './lrt.controller';
import { LrtService } from './lrt.service';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { HttpModule } from '@nestjs/axios';
import { LrtApiClient } from './lrt-api.client';

@Module({
  imports: [
    HttpModule.register({
      withCredentials: true,
    }),
  ],
  controllers: [LrtController],
  providers: [KodiApiResponseFactory, LrtService, LrtApiClient],
})
export class LrtModule {}

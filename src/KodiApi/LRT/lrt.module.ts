import { Module } from '@nestjs/common';
import { LrtController } from './lrt.controller';
import { LrtService } from './lrt.service';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';

@Module({
  controllers: [LrtController],
  providers: [KodiApiResponseFactory, LrtService],
})
export class LrtModule {}

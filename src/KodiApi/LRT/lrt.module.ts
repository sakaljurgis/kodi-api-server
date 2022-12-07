import { Module } from '@nestjs/common';
import { LrtController } from './lrt.controller';
import { LrtService } from './lrt.service';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [LrtController],
  providers: [KodiApiResponseFactory, LrtService],
})
export class LrtModule {}

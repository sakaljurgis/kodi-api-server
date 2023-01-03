import { Module } from '@nestjs/common';
import { AllFilesController } from './all-files.controller';
import { AllFilesService } from './all-files.service';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { StreamerModule } from '../../Streamer/streamer.module';
import { VideoFilesModule } from '../../VideoFiles/video-files.module';

@Module({
  imports: [StreamerModule, VideoFilesModule],
  controllers: [AllFilesController],
  providers: [AllFilesService, KodiApiResponseFactory],
})
export class AllFilesModule {}

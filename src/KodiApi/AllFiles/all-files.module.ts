import { Module } from '@nestjs/common';
import { AllFilesController } from './all-files.controller';
import { AllFilesService } from './all-files.service';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';

@Module({
  imports: [],
  controllers: [AllFilesController],
  providers: [AllFilesService, KodiApiResponseFactory],
})
export class AllFilesModule {}

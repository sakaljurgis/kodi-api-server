import { Module } from '@nestjs/common';
import { AllFilesController } from './all-files.controller';
import { AllFilesService } from './all-files.service';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TitleEntity } from './Entity/title.entity';
import { FileEntity } from './Entity/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TitleEntity, FileEntity])],
  controllers: [AllFilesController],
  providers: [AllFilesService, KodiApiResponseFactory],
})
export class AllFilesModule {}

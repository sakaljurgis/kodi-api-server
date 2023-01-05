import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TitleEntity } from './Entity/title.entity';
import { FileEntity } from './Entity/file.entity';
import { VideoFilesProvider } from './video-files.provider';
import { VideoFilesUpdateService } from './FileDbUpdater/video-files-update.service';
import { VideoFilesScannerService } from './FileDbUpdater/video-files-scanner.service';
import { VideoFilesUpdateRepository } from './FileDbUpdater/video-files-update.repository';
import { VideoFilesSavingService } from './FileDbUpdater/video-files-saving.service';
import { VideoFileTitleService } from './FileDbUpdater/video-file-title.service';

@Module({
  imports: [TypeOrmModule.forFeature([TitleEntity, FileEntity])],
  controllers: [],
  providers: [
    VideoFilesProvider,
    VideoFilesUpdateService,
    VideoFilesScannerService,
    VideoFilesUpdateRepository,
    VideoFilesSavingService,
    VideoFileTitleService,
  ],
  exports: [VideoFilesProvider, VideoFilesUpdateService],
})
export class VideoFilesModule {}

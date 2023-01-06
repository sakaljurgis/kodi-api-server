import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TitleEntity } from './Entity/title.entity';
import { FileEntity } from './Entity/file.entity';
import { VideoFilesFacade } from './video-files.facade';
import { VideoFilesUpdateModule } from './Update/video-files-update.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TitleEntity, FileEntity]),
    VideoFilesUpdateModule,
  ],
  controllers: [],
  providers: [VideoFilesFacade],
  exports: [VideoFilesFacade],
})
export class VideoFilesModule {}

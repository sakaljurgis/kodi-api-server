import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TitleEntity } from './Entity/title.entity';
import { FileEntity } from './Entity/file.entity';
import { VideoFilesProvider } from './video-files.provider';

@Module({
  imports: [TypeOrmModule.forFeature([TitleEntity, FileEntity])],
  controllers: [],
  providers: [VideoFilesProvider],
  exports: [VideoFilesProvider],
})
export class VideoFilesModule {}

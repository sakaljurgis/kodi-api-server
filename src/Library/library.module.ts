import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../Shared/Entity/file.entity';
import { TitleEntity } from '../Shared/Entity/title.entity';
import { TitleRulesModule } from '../VideoFiles/TitleRules/title-rules.module';
import { VideoFilesModule } from '../VideoFiles/video-files.module';
import {
  AliasesRedirectController,
  LibraryController,
} from './library.controller';
import { LibraryService } from './library.service';

/** /library: fix titles (rename, movie/show, merge, per folder) with title rules */
@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity, TitleEntity]),
    TitleRulesModule,
    VideoFilesModule,
  ],
  controllers: [LibraryController, AliasesRedirectController],
  providers: [LibraryService],
})
export class LibraryModule {}

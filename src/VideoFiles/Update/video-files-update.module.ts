import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TitleEntity } from '../../Shared/Entity/title.entity';
import { FileEntity } from '../../Shared/Entity/file.entity';
import {
  FileEntityExpander,
  FileEntityExpanders,
} from './Expander/file-entity.expander';
import { FileEntityTitleInfoExpander } from './Expander/file-entity-title-info.expander';
import { VideoFilesUpdateService } from './video-files-update.service';
import { VideoFilesScannerService } from './Scanner/video-files-scanner.service';
import { VideoFilesUpdateRepository } from './video-files-update.repository';
import { FileEntitySizeExpander } from './Expander/file-entity-size.expander';
import { FileEntityDefaultsExpander } from './Expander/file-entity-defaults.expander';
import { FileEntityDurationExpander } from './Expander/file-entity-duration.expander';
import { FileEntityTransmissionExpander } from './Expander/file-entity-transmission.expander';
import { TorrentSeedClientModule } from '../../Torrent/SeedClient/torrent-seed-client.module';

const fileEntityExpanders: Provider<any>[] = [
  FileEntityExpander,
  FileEntityDefaultsExpander,
  FileEntitySizeExpander,
  FileEntityTitleInfoExpander,
  FileEntityDurationExpander,
  FileEntityTransmissionExpander,
  {
    provide: FileEntityExpanders,
    useFactory: (...expanders) => expanders,
    inject: [
      //expanders run in parallel, make sure they don't rely on each other's result
      FileEntityDefaultsExpander,
      FileEntitySizeExpander,
      FileEntityTitleInfoExpander,
      FileEntityDurationExpander,
      FileEntityTransmissionExpander,
    ],
  },
];

@Module({
  imports: [
    TypeOrmModule.forFeature([TitleEntity, FileEntity]),
    TorrentSeedClientModule,
  ],
  controllers: [],
  providers: [
    VideoFilesUpdateService,
    VideoFilesScannerService,
    VideoFilesUpdateRepository,
    ...fileEntityExpanders,
  ],
  exports: [VideoFilesUpdateService],
})
export class VideoFilesUpdateModule {}

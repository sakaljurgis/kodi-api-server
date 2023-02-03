import { Module } from '@nestjs/common';
import { TorrentDownloadClient } from './torrent-download.client';
import { VideoFilesModule } from '../../VideoFiles/video-files.module';
import { WebtorrentClient } from './WebtorrentClient/webtorrent.client';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TorrentEntity } from '../../Shared/Entity/torrent.entity';
import { FileEntity } from '../../Shared/Entity/file.entity';
import { TorrentSeedClientModule } from '../SeedClient/torrent-seed-client.module';

@Module({
  imports: [
    VideoFilesModule,
    TypeOrmModule.forFeature([TorrentEntity, FileEntity]),
    TorrentSeedClientModule,
  ],
  providers: [WebtorrentClient, TorrentDownloadClient],
  exports: [TorrentDownloadClient],
})
export class TorrentDownloadClientModule {}

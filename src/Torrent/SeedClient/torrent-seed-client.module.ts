import { Module } from '@nestjs/common';
import { TorrentSeedClient } from './torrent-seed.client';
import { TransmissionClient } from './Transmission/transmission.client';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TorrentEntity } from '../../Shared/Entity/torrent.entity';
import { FileEntity } from '../../Shared/Entity/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TorrentEntity, FileEntity])],
  providers: [TorrentSeedClient, TransmissionClient],
  exports: [TorrentSeedClient],
})
export class TorrentSeedClientModule {}

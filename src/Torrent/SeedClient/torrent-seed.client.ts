import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TorrentEntity } from '../../Shared/Entity/torrent.entity';
import { Repository } from 'typeorm';
import { TransmissionClient } from './Transmission/transmission.client';
import { TorrentInfo } from './Dto/torrent-info.dto';
import { FileEntity } from '../../Shared/Entity/file.entity';

@Injectable()
export class TorrentSeedClient {
  constructor(
    private readonly transmissionClient: TransmissionClient,
    @InjectRepository(TorrentEntity)
    private readonly torrentRepository: Repository<TorrentEntity>,
    @InjectRepository(FileEntity)
    private readonly filesRepository: Repository<FileEntity>,
  ) {}

  addTorrent(torrentEntity: TorrentEntity): Promise<TorrentInfo> {
    return this.transmissionClient.addTorrent(torrentEntity);
  }

  async addTorrentById(torrId: number): Promise<TorrentInfo> {
    const torrentEntity = await this.torrentRepository.findOne({
      where: { id: torrId },
    });

    if (!torrentEntity) {
      return Promise.reject('torrent not found');
    }

    const torrInfo = await this.addTorrent(torrentEntity).catch(() => null);

    if (torrInfo) {
      await this.torrentRepository.update(
        { id: torrentEntity.id },
        { transmissionId: torrInfo.id, linkomanija: torrInfo.linkomanija },
      );
      await this.filesRepository.update(
        { torrentId: torrentEntity.id },
        { transmissionId: torrInfo.id, linkomanija: torrInfo.linkomanija },
      );
    }

    return torrInfo;
  }

  findTorrentInfoByFile(fileEntity: FileEntity): Promise<TorrentInfo | null> {
    return this.transmissionClient.findTorrentInfoByFile(fileEntity);
  }

  async removeTorrent(torrId: number, removeData = false) {
    const torrentEntity = await this.torrentRepository.findOne({
      where: { id: torrId },
    });

    if (!torrentEntity) {
      return Promise.reject('torrent not found');
    }

    const result = await this.transmissionClient
      .removeTorrent(torrentEntity, removeData)
      .catch(() => null);

    if (result && !removeData) {
      await this.torrentRepository.update(
        { id: torrentEntity.id },
        { transmissionId: null },
      );
      await this.filesRepository.update(
        { torrentId: torrentEntity.id },
        { transmissionId: null },
      );
    }

    if (result && removeData) {
      await this.torrentRepository.delete({
        id: torrentEntity.id,
      });
      await this.filesRepository.update(
        { torrentId: torrentEntity.id },
        { transmissionId: null, torrentId: null, deleted: true },
      );
    }

    return result;
  }
}

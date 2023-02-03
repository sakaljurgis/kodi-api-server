import { Injectable } from '@nestjs/common';
import { WebtorrentClient } from './WebtorrentClient/webtorrent.client';
import { FileEntity } from '../../Shared/Entity/file.entity';
import { TorrentFile } from 'webtorrent';
import { InjectRepository } from '@nestjs/typeorm';
import { TorrentEntity } from '../../Shared/Entity/torrent.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TorrentDownloadClient {
  constructor(
    private readonly webtorrentClient: WebtorrentClient,
    @InjectRepository(TorrentEntity)
    private readonly torrentRepository: Repository<TorrentEntity>,
  ) {}

  addTorrent(magnet: string): Promise<FileEntity[]> {
    return this.webtorrentClient.addTorrent(magnet);
  }

  async getTorrentFile(fileEntity: FileEntity): Promise<TorrentFile | null> {
    const torrentInfoHash = fileEntity.torrent.infoHash;
    let torrent = this.webtorrentClient.getTorrentByInfoHash(torrentInfoHash);
    if (!torrent) {
      await this.webtorrentClient.addTorrent(fileEntity.torrent.magnet);
    }

    torrent = this.webtorrentClient.getTorrentByInfoHash(torrentInfoHash);
    if (!torrent) {
      return null;
    }

    for (const file of torrent.files) {
      if (file.path === fileEntity.relativePath) {
        return file;
      }
    }
  }

  getTorrents(): Promise<TorrentEntity[]> {
    return this.torrentRepository.find({
      relations: { files: { torrent: true } },
    });
  }

  getTorrentById(id: number): Promise<TorrentEntity> {
    return this.torrentRepository.findOne({
      where: { id: id },
      relations: { files: { torrent: true } },
    });
  }

  stopTorrent(torrentId: number): Promise<void> {
    return this.webtorrentClient.stopTorrent(torrentId);
  }

  async resumeTorrent(torrentId: number): Promise<FileEntity[]>  {
    const torrentEntity = await this.torrentRepository.findOne({
      where: { id: torrentId },
    });

    if (!torrentEntity || !torrentEntity.magnet) {
      return Promise.reject('torrent not found');
    }

    return this.addTorrent(torrentEntity.magnet);
  }
}

import { Injectable } from '@nestjs/common';
import { FileEntityExpanderInterface } from './file-entity-expander.interface';
import { FileEntity } from '../../../Shared/Entity/file.entity';
import { TorrentSeedClient } from '../../../Torrent/SeedClient/torrent-seed.client';

@Injectable()
export class FileEntityTransmissionExpander
  implements FileEntityExpanderInterface
{
  constructor(private readonly torrentSeedClient: TorrentSeedClient) {}

  async expand(fileEntity: FileEntity): Promise<FileEntity> {
    const torrentInfo = await this.torrentSeedClient
      .findTorrentInfoByFile(fileEntity)
      .catch(() => null);

    if (torrentInfo === null) {
      return Promise.resolve(fileEntity);
    }

    fileEntity.transmissionId = torrentInfo.id;
    fileEntity.linkomanija = torrentInfo.linkomanija;

    return fileEntity;
  }
}

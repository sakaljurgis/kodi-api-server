import { FileEntity } from '../../../Shared/Entity/file.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { MimeService } from '../../Mime/mime.service';
import { ReadStreamCreatableProviderInterface } from '../read-stream-creatable-provider.interface';
import { TorrentDownloadClient } from '../../../Torrent/DownloadClient/torrent-download.client';
import { StreamProviderEnum } from '../../../Shared/Enum/stream-provider.enum';
import { ReadStreamCreatable } from '../../Interface/read-stream-creatable.interface';
import { ReadStreamCreatableTorrentFile } from './read-stream-creatable-torrent-file.dto';

@Injectable()
export class WtReadStreamCreatableProvider
  implements ReadStreamCreatableProviderInterface
{
  constructor(
    private readonly mimeService: MimeService,
    private readonly torrDlClient: TorrentDownloadClient,
  ) {}

  supports(fileEntity: FileEntity): boolean {
    return fileEntity.streamProvider === StreamProviderEnum.wt;
  }

  async getReadStreamCreatable(
    fileEntity: FileEntity,
  ): Promise<ReadStreamCreatable> {
    if (!fileEntity.torrent) {
      throw new NotFoundException('torrent not found');
    }
    const torrentFile = await this.torrDlClient.getTorrentFile(fileEntity);
    if (torrentFile === null) {
      //todo - rescan files, probably moved to fs provider. Events?
      throw new NotFoundException('torrent file not found');
    }
    const mimeType = this.mimeService.getMime(fileEntity.relativePath);

    return new ReadStreamCreatableTorrentFile(
      torrentFile,
      torrentFile.length,
      mimeType,
    );
  }
}

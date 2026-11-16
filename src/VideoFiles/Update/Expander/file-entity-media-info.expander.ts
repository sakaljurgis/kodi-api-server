import { FileEntityExpanderInterface } from './file-entity-expander.interface';
import { FileEntity } from '../../../Shared/Entity/file.entity';
import { Injectable } from '@nestjs/common';
import { StreamProviderEnum } from '../../../Shared/Enum/stream-provider.enum';
import { probeMedia } from '../media-probe';

/** duration and chapters (one ffprobe); files on disk only, unreadable ones stay as they were */
@Injectable()
export class FileEntityMediaInfoExpander
  implements FileEntityExpanderInterface
{
  async expand(fileEntity: FileEntity): Promise<FileEntity> {
    if (fileEntity.streamProvider !== StreamProviderEnum.fs) {
      return fileEntity;
    }
    const info = await probeMedia(fileEntity.path);
    if (info) {
      fileEntity.duration = info.duration ?? fileEntity.duration;
      fileEntity.chapters = JSON.stringify(info.chapters);
    }

    return fileEntity;
  }
}

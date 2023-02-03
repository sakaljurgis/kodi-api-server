import { FileEntity } from '../../../Shared/Entity/file.entity';
import { ReadStreamCreatable } from '../../Interface/read-stream-creatable.interface';
import { MimeService } from '../../Mime/mime.service';
import { Stats } from 'fs';
import { stat } from 'fs/promises';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ReadStreamCreatableFile } from './read-stream-creatable-file.dto';
import { ReadStreamCreatableProviderInterface } from '../read-stream-creatable-provider.interface';
import { StreamProviderEnum } from '../../../Shared/Enum/stream-provider.enum';
import { VideoFilesFacade } from '../../../VideoFiles/video-files.facade';

@Injectable()
export class FsReadStreamCreatableProvider
  implements ReadStreamCreatableProviderInterface
{
  constructor(
    private readonly mimeService: MimeService,
    private readonly videoFilesService: VideoFilesFacade,
  ) {}

  supports(fileEntity: FileEntity): boolean {
    return fileEntity.streamProvider === StreamProviderEnum.fs;
  }

  async getReadStreamCreatable(
    fileEntity: FileEntity,
  ): Promise<ReadStreamCreatable> {
    const filePath = fileEntity.path;
    const stats: Stats | false = await stat(filePath).catch(() => false);
    if (stats === false) {
      this.videoFilesService.updateFsVideoFiles();
      throw new NotFoundException('file not found');
    }
    const mimeType = this.mimeService.getMime(filePath);

    return new ReadStreamCreatableFile(filePath, stats.size, mimeType);
  }
}

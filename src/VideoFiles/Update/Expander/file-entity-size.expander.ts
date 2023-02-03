import { FileEntityExpanderInterface } from './file-entity-expander.interface';
import { FileEntity } from '../../../Shared/Entity/file.entity';
import { Stats } from 'fs';
import { stat } from 'fs/promises';
import { Injectable } from '@nestjs/common';
import { StreamProviderEnum } from '../../../Shared/Enum/stream-provider.enum';

@Injectable()
export class FileEntitySizeExpander implements FileEntityExpanderInterface {
  async expand(fileEntity: FileEntity): Promise<FileEntity> {
    if (fileEntity.streamProvider !== StreamProviderEnum.fs) {
      return Promise.resolve(fileEntity);
    }
    const stats: Stats | false = await stat(fileEntity.path).catch(() => false);

    if (stats !== false) {
      fileEntity.size = stats.size;
    }

    return fileEntity;
  }
}

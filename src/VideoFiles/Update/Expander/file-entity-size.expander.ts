import { FileEntityExpanderInterface } from './file-entity-expander.interface';
import { FileEntity } from '../../Entity/file.entity';
import { Stats } from 'fs';
import { stat } from 'fs/promises';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileEntitySizeExpander implements FileEntityExpanderInterface {
  async expand(fileEntity: FileEntity): Promise<FileEntity> {
    const stats: Stats | false = await stat(fileEntity.path).catch(() => false);

    if (stats !== false) {
      fileEntity.size = stats.size;
    }

    return fileEntity;
  }
}

import { FileEntityExpanderInterface } from './file-entity-expander.interface';
import { FileEntity } from '../../Entity/file.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileEntityDefaultsExpander implements FileEntityExpanderInterface {
  expand(fileEntity: FileEntity): Promise<FileEntity> {
    fileEntity.deleted = false;
    fileEntity.fileName = fileEntity.path.split('/').pop();

    return Promise.resolve(fileEntity);
  }
}

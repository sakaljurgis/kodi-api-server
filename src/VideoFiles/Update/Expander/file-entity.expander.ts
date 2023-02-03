import { FileEntityExpanderInterface } from './file-entity-expander.interface';
import { Inject, Injectable } from '@nestjs/common';
import { FileEntity } from '../../../Shared/Entity/file.entity';

export const FileEntityExpanders = 'FileEntityExpanders';

@Injectable()
export class FileEntityExpander implements FileEntityExpanderInterface {
  constructor(
    @Inject(FileEntityExpanders)
    private expanders: FileEntityExpanderInterface[],
  ) {}

  async expand(fileEntity: FileEntity): Promise<FileEntity> {
    //fileEntity (object) passed byRef, expanders can run in parallel, make sure expanders don't rely on each other's result
    const expanderPromises = [];
    for (const expander of this.expanders) {
      const expanderPromise = expander.expand(fileEntity);
      expanderPromises.push(expanderPromise);
    }
    await Promise.all(expanderPromises);

    return fileEntity;
  }
}

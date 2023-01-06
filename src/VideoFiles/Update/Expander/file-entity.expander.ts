import { FileEntityExpanderInterface } from './file-entity-expander.interface';
import { Inject, Injectable } from '@nestjs/common';
import { FileEntity } from '../../Entity/file.entity';

export const FileEntityExpanders = 'FileEntityExpanders';

@Injectable()
export class FileEntityExpander implements FileEntityExpanderInterface {
  constructor(
    @Inject(FileEntityExpanders)
    private expanders: Array<FileEntityExpanderInterface>,
  ) {}

  async expand(fileEntity: FileEntity): Promise<FileEntity> {
    //fileEntity (object) passed byRef, expanders can run in parallel, make sure expanders don't rely on each other's result
    const expanderPromises = [];
    for (const expander of this.expanders) {
      const expanderPromise = expander.expand(fileEntity);
      expanderPromises.push(expanderPromise);
    }

    return new Promise((resolve) => {
      Promise.all(expanderPromises).then(() => {
        resolve(fileEntity);
      });
    });
  }
}

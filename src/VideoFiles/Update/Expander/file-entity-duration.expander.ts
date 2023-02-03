import { FileEntityExpanderInterface } from './file-entity-expander.interface';
import { FileEntity } from '../../../Shared/Entity/file.entity';
import * as ffmpeg from 'fluent-ffmpeg';
import { Injectable } from '@nestjs/common';
import { StreamProviderEnum } from '../../../Shared/Enum/stream-provider.enum';

@Injectable()
export class FileEntityDurationExpander implements FileEntityExpanderInterface {
  expand(fileEntity: FileEntity): Promise<FileEntity> {
    return new Promise((resolve) => {
      if (fileEntity.streamProvider !== StreamProviderEnum.fs) {
        return resolve(fileEntity);
      }
      ffmpeg.ffprobe(fileEntity.path, (err, data) => {
        if (!err) {
          //no error handling!
          fileEntity.duration = data.format.duration;
        }
        resolve(fileEntity);
      });
    });
  }
}

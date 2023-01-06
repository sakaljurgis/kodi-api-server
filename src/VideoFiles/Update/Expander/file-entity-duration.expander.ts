import { FileEntityExpanderInterface } from './file-entity-expander.interface';
import { FileEntity } from '../../Entity/file.entity';
import * as ffmpeg from 'fluent-ffmpeg';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileEntityDurationExpander implements FileEntityExpanderInterface {
  expand(fileEntity: FileEntity): Promise<FileEntity> {
    return new Promise((resolve) => {
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

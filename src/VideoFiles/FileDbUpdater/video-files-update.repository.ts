import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from '../Entity/file.entity';
import { In, Not, Repository, UpdateResult } from 'typeorm';
import { StreamProviderEnum } from '../../Streamer/ReadStreamProvider/stream-provider.enum';

@Injectable()
export class VideoFilesUpdateRepository {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {}

  markRemovedFilesAsDeleted(filePaths: string[]): Promise<UpdateResult> {
    return this.fileRepository
      .createQueryBuilder()
      .update('files')
      .set({ deleted: true })
      .where({
        path: Not(In(filePaths)),
        deleted: false,
        streamProvider: StreamProviderEnum.fs,
      })
      .execute();
  }

  getMatchingPaths(filePaths: string[]): Promise<string[]> {
    return new Promise((resolve) => {
      this.fileRepository
        .find({
          select: ['path'],
          where: {
            path: In(filePaths),
            deleted: false,
            streamProvider: StreamProviderEnum.fs,
          },
        })
        .then((fileEntitiesInDb) => {
          resolve(fileEntitiesInDb.map((obj) => obj.path));
        })
        .catch(() => {
          resolve([]);
        });
    });
  }
}

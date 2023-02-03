import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from '../../Shared/Entity/file.entity';
import { In, Not, Repository, UpdateResult } from 'typeorm';
import { StreamProviderEnum } from '../../Shared/Enum/stream-provider.enum';
import { TitleEntity } from '../../Shared/Entity/title.entity';
import { TitleTypeEnum } from '../../Shared/Enum/title-type.enum';

@Injectable()
export class VideoFilesUpdateRepository {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(TitleEntity)
    private readonly titleRepository: Repository<TitleEntity>,
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

  public async findOrCreateTitle(
    title: string,
    type: TitleTypeEnum,
    saveIfCreated = true,
  ): Promise<TitleEntity> {
    let titleEntity = await this.titleRepository.findOne({
      where: { title: title, type: type },
    });

    if (titleEntity === null) {
      titleEntity = new TitleEntity();
      titleEntity.title = title;
      titleEntity.type = type;
      if (saveIfCreated) {
        await this.titleRepository.save(titleEntity);
        titleEntity = await this.titleRepository.findOne({
          where: { title: title, type: type },
        });
      }
    }

    return titleEntity;
  }

  public async findOrCreateFile(
    path: string,
    saveIfCreated = true,
  ): Promise<FileEntity> {
    let fileEntity = await this.fileRepository.findOne({
      where: { path: path },
      relations: { torrent: true },
    });

    if (fileEntity === null) {
      fileEntity = new FileEntity();
      fileEntity.path = path;
      if (saveIfCreated) {
        await this.fileRepository.save(fileEntity);
        fileEntity = await this.fileRepository.findOne({
          where: { path: path },
          relations: { torrent: true },
        });
      }
    }

    return fileEntity;
  }

  public saveFiles(fileEntities: FileEntity[]) {
    return this.fileRepository.save(fileEntities);
  }

  public findFilesByPaths(paths: string[]): Promise<FileEntity[]> {
    return this.fileRepository.find({
      where: { path: In(paths) },
      relations: { torrent: true },
    });
  }
}

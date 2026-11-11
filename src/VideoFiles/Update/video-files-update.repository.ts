import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from '../../Shared/Entity/file.entity';
import { In, IsNull, Not, Repository, UpdateResult } from 'typeorm';
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

  /**
   * The same title in another case is the same title (the oldest one), unless
   * the case matters (the name was set by a title rule).
   */
  public async findOrCreateTitle(
    title: string,
    type: TitleTypeEnum,
    exactCase = false,
  ): Promise<TitleEntity> {
    const existing = exactCase
      ? await this.titleRepository.findOne({ where: { title, type } })
      : await this.titleRepository
          .createQueryBuilder('title')
          .where('LOWER(title.title) = LOWER(:title)', { title })
          .andWhere('title.type = :type', { type })
          .orderBy('title.id', 'ASC')
          .getOne();
    if (existing) {
      return existing;
    }

    const titleEntity = new TitleEntity();
    titleEntity.title = title;
    titleEntity.type = type;
    await this.titleRepository.save(titleEntity);

    return this.titleRepository.findOne({ where: { title, type } });
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
      fileEntity.addedAt = Date.now();
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

  /** not deleted, with their titles */
  public findActiveFiles(): Promise<FileEntity[]> {
    return this.fileRepository.find({
      where: { deleted: false, relativePath: Not(IsNull()) },
      relations: { title: true },
    });
  }

  /** a file of the release that isn't a sample, lowest season first */
  public findReleaseFile(releaseFolder: string): Promise<FileEntity | null> {
    const prefix = releaseFolder + '/';
    return this.fileRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.title', 'title')
      .where('substr(file.relative_path, 1, :length) = :prefix', {
        length: prefix.length,
        prefix,
      })
      .andWhere('file.deleted = :deleted', { deleted: false })
      .andWhere('file.title_id IS NOT NULL')
      .andWhere("LOWER(file.file_name) NOT LIKE '%sample%'")
      .orderBy('file.season', 'ASC')
      .addOrderBy('file.id', 'ASC')
      .getOne();
  }

  /** only what the title info expander sets */
  public async saveTitleInfo(fileEntities: FileEntity[]): Promise<void> {
    await this.fileRepository.manager.transaction(async (manager) => {
      for (const fileEntity of fileEntities) {
        await manager.update(FileEntity, fileEntity.id, {
          titleId: fileEntity.title.id,
          season: fileEntity.season ?? null,
          info: fileEntity.info,
          infos: fileEntity.infos,
        });
      }
    });
  }
}

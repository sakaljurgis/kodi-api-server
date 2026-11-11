import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TitleEntity } from '../Shared/Entity/title.entity';
import { TitleTypeEnum } from '../Shared/Enum/title-type.enum';
import { FileEntity } from '../Shared/Entity/file.entity';
import { VideoFilesUpdateService } from './Update/video-files-update.service';
import NotificationResponse from '../KodiApi/Dto/notification-response.dto';
import { Stats } from 'fs';
import { stat, unlink } from 'fs/promises';

@Injectable()
export class VideoFilesFacade {
  constructor(
    @InjectRepository(TitleEntity)
    private readonly titleRepository: Repository<TitleEntity>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly videoFilesUpdateService: VideoFilesUpdateService,
  ) {}

  /** with their listed files (not deleted, not hidden); titles without any are left out */
  async getListOfTitles(type: TitleTypeEnum): Promise<TitleEntity[]> {
    return this.titleRepository
      .createQueryBuilder()
      .setFindOptions({ relations: { files: true } })
      .where('type = :type', { type: type })
      .andWhere('deleted = :deleted', { deleted: false })
      .andWhere('hidden = :hidden', { hidden: false })
      .getMany();
  }

  /** with its listed files (not deleted, not hidden); null if it has none */
  async getTitleWithFiles(titleId: number): Promise<TitleEntity | null> {
    return this.titleRepository
      .findOne({
        relations: { files: { torrent: true } },
        where: { id: titleId, files: { deleted: false, hidden: false } },
      })
      .catch(() => null);
  }

  /** all listed files (not deleted, not hidden), with their titles */
  getLiveFiles(): Promise<FileEntity[]> {
    return this.fileRepository.find({
      where: { deleted: false, hidden: false },
      relations: { title: true },
    });
  }

  /** hides files from the lists or shows them again; how many changed */
  async setHidden(fileIds: number[], hidden: boolean): Promise<number> {
    if (!fileIds.length) {
      return 0;
    }
    const result = await this.fileRepository.update(
      { id: In(fileIds), hidden: !hidden },
      { hidden },
    );

    return result.affected ?? 0;
  }

  async getFile(fileId: number): Promise<FileEntity | null> {
    return this.fileRepository
      .findOne({ where: { id: fileId }, relations: { torrent: true } })
      .catch(() => null);
  }

  /**
   * Scan for new files and remove deleted.
   * Once all hooks are working correctly, this one shouldn't be needed anymore
   */
  updateFsVideoFiles(refresh = false): void {
    this.videoFilesUpdateService.updateFsVideoFiles(refresh).then();
  }

  /** title and season of every file again; how many files changed */
  reparseTitles(): Promise<number> {
    return this.videoFilesUpdateService.reparseTitles();
  }

  addVideoFiles(
    partialFileEntities: Partial<FileEntity>[],
  ): Promise<FileEntity[]> {
    return this.videoFilesUpdateService.buildAndSaveEntitiesFromPartial(
      partialFileEntities,
    );
  }

  /**
   * if entity with provided path exists and fully downloaded, it will
   *  - update entity properties, like size, duration, etc.
   *  - move to fs provider
   * @param filePaths
   */
  updateEntitiesByPath(filePaths: string[]) {
    return this.videoFilesUpdateService.updateEntitiesByPath(filePaths);
  }

  async deleteFile(fileId: number): Promise<boolean> {
    const fileEntity = await this.fileRepository.findOne({
      where: { id: fileId },
    });

    if (!fileEntity) {
      return false;
    }

    fileEntity.deleted = true;
    await this.fileRepository.save(fileEntity);

    const stats: Stats | false = await stat(fileEntity.path).catch(() => false);

    if (stats === false) {
      //file already deleted
      return true;
    }

    return unlink(fileEntity.path)
      .then(() => true)
      .catch(() => false);
  }
}

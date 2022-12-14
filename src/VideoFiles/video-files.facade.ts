import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TitleEntity } from './Entity/title.entity';
import { TitleTypeEnum } from './Enum/title-type.enum';
import { FileEntity } from './Entity/file.entity';
import { VideoFilesUpdateService } from './Update/video-files-update.service';

//todo - refactor provider as facade
@Injectable()
export class VideoFilesFacade {
  constructor(
    @InjectRepository(TitleEntity)
    private readonly titleRepository: Repository<TitleEntity>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly videoFilesUpdateService: VideoFilesUpdateService,
  ) {}

  async getListOfTitles(type: TitleTypeEnum): Promise<TitleEntity[]> {
    return this.titleRepository
      .createQueryBuilder()
      .setFindOptions({ relations: { files: true } })
      .where('type = :type', { type: type })
      .andWhere('deleted = :deleted', { deleted: false })
      .getMany();
  }

  async getTitleWithFiles(titleId: number): Promise<TitleEntity | null> {
    return this.titleRepository
      .findOne({
        relations: { files: true },
        where: { id: titleId, files: { deleted: false } },
      })
      .catch(() => null);
  }

  async getFile(fileId: number): Promise<FileEntity | null> {
    return this.fileRepository
      .findOne({ where: { id: fileId } })
      .catch(() => null);
  }

  updateFsVideoFiles(): void {
    this.videoFilesUpdateService.updateFsVideoFiles().then();
  }
}

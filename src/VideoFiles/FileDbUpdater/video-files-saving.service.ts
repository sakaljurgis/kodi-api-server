import { Injectable } from '@nestjs/common';
import { VideoFilePathDto } from '../Dto/video-file-path.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from '../Entity/file.entity';
import { Repository } from 'typeorm';
import { Stats } from 'fs';
import { stat } from 'fs/promises';
import { StreamProviderEnum } from '../../Streamer/ReadStreamProvider/stream-provider.enum';
import { VideoFileTitleService } from './video-file-title.service';
import { TitleEntity } from '../Entity/title.entity';
import { TitleTypeEnum } from '../Enum/title-type.enum';

@Injectable()
export class VideoFilesSavingService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(TitleEntity)
    private readonly titleRepository: Repository<TitleEntity>,
    private readonly titleService: VideoFileTitleService,
  ) {}

  async saveFiles(filePaths: VideoFilePathDto[]): Promise<void> {
    for (const filePath of filePaths) {
      await this.saveFile(filePath);
    }
  }

  async saveFile(filePath: VideoFilePathDto): Promise<void> {
    const stats: Stats | false = await stat(filePath.path).catch(() => false);

    if (stats === false) {
      return;
    }

    const fileEntity = await this.fileRepository
      .findOneByOrFail({ path: filePath.path })
      .catch(() => new FileEntity());

    //todo - move to info/mapper service?
    fileEntity.path = filePath.path;
    fileEntity.deleted = false;
    fileEntity.fileName = filePath.path.split('/').pop();
    fileEntity.streamProvider = StreamProviderEnum.fs;
    fileEntity.size = stats.size;

    const titleInfo = this.titleService.extractTitleInfo(filePath);

    fileEntity.info = JSON.stringify(titleInfo.info);
    fileEntity.infos = JSON.stringify(titleInfo.infos);
    fileEntity.season = titleInfo.info.season;
    fileEntity.title = await this.findOrCreateTitle(titleInfo);
    //todo - ffmpeg duration and other metadata

    await this.fileRepository.save(fileEntity);
  }

  //todo - move to repository
  private async findOrCreateTitle(
    titleInfo: Record<string, Record<string, string>>,
  ): Promise<TitleEntity> {
    let titleEntity = await this.titleRepository.findOne({
      where: { title: titleInfo.info.title }, //todo - what about titles with same name but can be as show or movie
    });

    if (titleEntity === null) {
      titleEntity = new TitleEntity();
      titleEntity.title = titleInfo.info.title;
      titleEntity.type = titleInfo.info.season
        ? TitleTypeEnum.show
        : TitleTypeEnum.movie;
      await this.titleRepository.save(titleEntity);
      titleEntity = await this.titleRepository.findOne({
        where: { title: titleInfo.info.title },
      });
    }

    return titleEntity;
  }
}

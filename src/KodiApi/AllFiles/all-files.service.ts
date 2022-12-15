import { Injectable, NotFoundException } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TitleEntity } from './Entity/title.entity';
import { FileEntity } from './Entity/file.entity';
import { TitleTypeEnum } from './Enum/title-type.enum';
import { StreamerFacade } from '../../Streamer/streamer.facade';
import { Request, Response } from 'express';

@Injectable()
export class AllFilesService {
  constructor(
    private readonly koiApiResponseFactory: KodiApiResponseFactory,
    @InjectRepository(TitleEntity)
    private titleRepository: Repository<TitleEntity>,
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
    private readonly streamerFacade: StreamerFacade,
  ) {}

  getMenu(): ApiResponse {
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse
      .createItem()
      .setLabel('Movies')
      .setPath('all/movie')
      .setToFolder();
    apiResponse
      .createItem()
      .setLabel('Shows')
      .setPath('all/show')
      .setToFolder();

    return apiResponse;
  }

  async getListOfTitles(type: TitleTypeEnum): Promise<ApiResponse> {
    const entities = await this.titleRepository
      .createQueryBuilder()
      .setFindOptions({ relations: { files: true } })
      .where('type = :type', { type: type })
      .andWhere('deleted = :deleted', { deleted: false })
      .getMany();

    const response = this.koiApiResponseFactory.createApiResponse();
    response.setTitle('All ' + type + 's');
    entities.forEach((entity) => {
      response
        .createItem()
        .setLabel(entity.title)
        .setToFolder()
        .setPlot(entity.files.length + ' files')
        .setPath('all/' + entity.id);
    });

    return response;
  }

  async loadTitle(titleId: number, seasonId: number): Promise<ApiResponse> {
    const titleEntity = await this.titleRepository.findOne({
      relations: { files: true },
      where: { id: titleId },
    });

    if (titleEntity === null) {
      return this.koiApiResponseFactory
        .createApiResponse()
        .setTitle('Not found ' + titleId);
    }

    if (titleEntity.type === TitleTypeEnum.movie) {
      return this.buildFilesResponse(titleEntity.title, titleEntity.files);
    }

    if (seasonId) {
      return this.buildFilesResponse(
        titleEntity.title,
        titleEntity.files.filter(
          (fileEntity) => fileEntity.season === seasonId,
        ),
      );
    }

    return this.buildSeasonsResponse(titleEntity);
  }

  private buildFilesResponse(
    title: string,
    fileEntities: Array<FileEntity>,
  ): ApiResponse {
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse.setTitle(title);
    for (const fileEntity of fileEntities) {
      apiResponse
        .createItem()
        .setLabel(fileEntity.fileName)
        .setPath('/api?path=all/play/' + fileEntity.id)
        .setToPlayable()
        .setPlot('Size ' + fileEntity.size)
        .setSize(fileEntity.size)
        .setDuration(fileEntity.duration);
    }

    return apiResponse;
  }

  private buildSeasonsResponse(titleEntity: TitleEntity): ApiResponse {
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse.setTitle(titleEntity.title);

    //todo - add num files count
    const seasons = [];
    for (const fileEntity of titleEntity.files) {
      if (seasons.indexOf(fileEntity.season) === -1) {
        seasons.push(fileEntity.season);
      }
    }

    for (const season of seasons) {
      apiResponse
        .createItem()
        .setLabel(season + ' Sezonas')
        .setToFolder()
        .setPath(`all/${titleEntity.id}/${season}`);
    }

    return apiResponse;
  }

  async play(
    fileId: string,
    request: Request,
    response: Response,
  ): Promise<void> {
    const id = parseInt(fileId);
    if (isNaN(id)) {
      throw new NotFoundException(`id #${fileId} not correct`);
    }

    const entity = await this.fileRepository.findOne({ where: { id: id } });

    if (entity === null) {
      throw new NotFoundException(`id #${fileId} not found`);
    }

    return this.streamerFacade.streamFile(request, response, entity.path);
  }
}

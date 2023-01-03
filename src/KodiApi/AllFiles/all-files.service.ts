import { Injectable, NotFoundException } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { StreamerFacade } from '../../Streamer/streamer.facade';
import { Request, Response } from 'express';
import { VideoFilesProvider } from '../../VideoFiles/video-files.provider';
import { TitleTypeEnum } from '../../VideoFiles/Enum/title-type.enum';
import { FileEntity } from '../../VideoFiles/Entity/file.entity';
import { TitleEntity } from '../../VideoFiles/Entity/title.entity';

@Injectable()
export class AllFilesService {
  constructor(
    private readonly koiApiResponseFactory: KodiApiResponseFactory,
    private readonly streamerFacade: StreamerFacade,
    private readonly videoTitlesProvider: VideoFilesProvider,
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
    const entities = await this.videoTitlesProvider.getListOfTitles(type);
    const response = this.koiApiResponseFactory.createApiResponse();
    response.setTitle('All ' + type + 's');
    entities.forEach((entity) => {
      response
        .createItem()
        .setLabel(entity.title)
        .setToFolder()
        .setPlot(
          entity.files.length + (entity.files.length > 1 ? ' files' : ' file'),
        )
        .setPath('all/' + entity.id);
    });

    return response;
  }

  async loadTitle(titleId: number, seasonId: number): Promise<ApiResponse> {
    const titleEntity = titleId
      ? await this.videoTitlesProvider.getTitleWithFiles(titleId)
      : null;

    if (titleEntity === null) {
      //todo - alert instead of full api response
      return this.koiApiResponseFactory
        .createApiResponse()
        .setTitle('Not found' + (titleId ? ' ' + titleId : ''));
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
    const filesCount = {};
    for (const fileEntity of titleEntity.files) {
      if (seasons.indexOf(fileEntity.season) === -1) {
        seasons.push(fileEntity.season);
        filesCount[fileEntity.season] = 0;
      }
      filesCount[fileEntity.season]++;
    }

    for (const season of seasons) {
      apiResponse
        .createItem()
        .setLabel(season + ' Sezonas')
        .setToFolder()
        .setPlot(
          filesCount[season] + (filesCount[season] > 1 ? ' files' : ' file'),
        )
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
    const filePath = await this.videoTitlesProvider.getFilePath(id);

    if (filePath === null) {
      throw new NotFoundException(`id #${fileId} not found`);
    }

    return this.streamerFacade.streamFile(request, response, filePath);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { StreamerFacade } from '../../Streamer/streamer.facade';
import { Request, Response } from 'express';
import { VideoFilesFacade } from '../../VideoFiles/video-files.facade';
import { TitleTypeEnum } from '../../Shared/Enum/title-type.enum';
import { FileEntity } from '../../Shared/Entity/file.entity';
import { TitleEntity } from '../../Shared/Entity/title.entity';
import { KodiApiResponse } from '../Dto/kodi-api-response.type';
import NotificationResponse from '../Dto/notification-response.dto';

@Injectable()
export class AllFilesService {
  constructor(
    private readonly koiApiResponseFactory: KodiApiResponseFactory,
    private readonly streamerFacade: StreamerFacade,
    private readonly videoFilesFacade: VideoFilesFacade,
  ) {}

  getMenu(): ApiResponse {
    return this.koiApiResponseFactory
      .createApiResponse()
      .addNavigationItems(
        [
          ['Movies', 'movie'],
          ['Shows', 'show'],
          ['Scan for new Files', 'scan'],
        ],
        'all/',
      )
      .setNoSort();
  }

  async getListOfTitles(type: TitleTypeEnum): Promise<ApiResponse> {
    const entities = await this.videoFilesFacade.getListOfTitles(type);
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

  async loadTitle(titleId: number, seasonId: number): Promise<KodiApiResponse> {
    const titleEntity = titleId
      ? await this.videoFilesFacade.getTitleWithFiles(titleId)
      : null;

    if (titleEntity === null) {
      return this.koiApiResponseFactory.createNotificationResponse(
        'Not found' + (titleId ? ' ' + titleId : ''),
        false,
      );
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

  buildFilesResponse(
    title: string,
    fileEntities: Array<FileEntity>,
    torrentContext = false,
  ): ApiResponse {
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse.setTitle(title);
    for (const fileEntity of fileEntities) {
      const item = apiResponse
        .createItem()
        .setLabel(fileEntity.fileName)
        .setPath('/api?path=all/play/' + fileEntity.id)
        .setToPlayable()
        .setPlot(this.buildPlot(fileEntity))
        .setSize(fileEntity.size)
        .setDuration(fileEntity.duration);

      if (!torrentContext) {
        if (fileEntity.torrentId) {
          item.addContextMenu(
            'Show torrent',
            'torr/torrent-context/' + fileEntity.torrentId,
          );
        } else {
          item.addContextMenu('Delete file', 'all/delete/' + fileEntity.id);
        }
      }
    }

    return apiResponse;
  }

  private buildSeasonsResponse(titleEntity: TitleEntity): ApiResponse {
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse.setTitle(titleEntity.title);

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
    const fileEntity = await this.videoFilesFacade.getFile(id);

    if (fileEntity === null) {
      throw new NotFoundException(`id #${fileId} not found`);
    }

    return this.streamerFacade.streamVideoFile(request, response, fileEntity);
  }

  getHRFileSize(size: number) {
    // convert to human readable format.
    const i: number = Math.floor(Math.log(size) / Math.log(1024));
    const iPow: number = Math.pow(1024, i);
    const sizePow: number = size / iPow;

    return sizePow.toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
  }

  buildPlot(fileEntity: FileEntity): string {
    const plot: string[] = [];
    if (fileEntity.size) {
      plot.push('Size ' + this.getHRFileSize(fileEntity.size));
    }

    const arrTorrProps: string[] = [];
    if (fileEntity.linkomanija) {
      arrTorrProps.push('LM');
    }
    if (fileEntity.transmissionId) {
      arrTorrProps.push('transm');
    }
    if (fileEntity.torrentId) {
      arrTorrProps.push('wt');
    }
    const torrProps = arrTorrProps.join(' + ');
    if (torrProps) {
      plot.push(torrProps);
    }

    if (fileEntity.progress) {
      const progress = Math.round(fileEntity.progress * 1000) / 10;
      const stopped = fileEntity.torrent.stopped ? ' Stopped' : '';
      plot.push(`${progress}%${stopped}`);
    }

    return plot.join('\n');
  }

  public scanNewFiles(): NotificationResponse {
    this.videoFilesFacade.updateFsVideoFiles();
    return this.koiApiResponseFactory.createNotificationResponse(
      'Scanning for new files and deleting old.',
      false,
    );
  }

  async deleteFile(fileId: string) {
    const id = parseInt(fileId);
    const result = await this.videoFilesFacade.deleteFile(id);
    return new NotificationResponse(
      result ? 'successfully deleted' : 'delete failed',
      result,
    );
  }
}

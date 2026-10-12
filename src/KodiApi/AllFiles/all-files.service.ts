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
import ResponseItem from '../Dto/response-item.dto';
import { WatchStateEntity } from '../../Shared/Entity/watch-state.entity';
import {
  WatchStates,
  WatchStateService,
} from '../../WatchState/watch-state.service';
import { compareFiles } from '../../Shared/Util/file-order';

@Injectable()
export class AllFilesService {
  constructor(
    private readonly koiApiResponseFactory: KodiApiResponseFactory,
    private readonly streamerFacade: StreamerFacade,
    private readonly videoFilesFacade: VideoFilesFacade,
    private readonly watchStateService: WatchStateService,
  ) {}

  getMenu(): ApiResponse {
    return this.koiApiResponseFactory
      .createApiResponse()
      .addNavigationItems(
        [
          ['Movies', 'movie'],
          ['Shows', 'show'],
          ['Scan for new Files', 'scan'],
          ['Re-Scan Files', 'scan-all'],
        ],
        'all/',
      )
      .setNoSort();
  }

  async getListOfTitles(type: TitleTypeEnum): Promise<ApiResponse> {
    const entities = await this.videoFilesFacade.getListOfTitles(type);
    const states = await this.watchStateService.getAll();
    const response = this.koiApiResponseFactory.createApiResponse();
    response.setTitle('All ' + type + 's');
    entities.forEach((entity) => {
      const item = response
        .createItem()
        .setLabel(entity.title)
        .setToFolder()
        .setPlot(
          entity.files.length + (entity.files.length > 1 ? ' files' : ' file'),
        )
        .setPath('all/' + entity.id);
      this.addFolderWatchState(item, entity.files, states, '' + entity.id);
    });

    return response;
  }

  /**
   * In-progress files and next episodes, one per movie/show, each with the
   * folder it's in so players can continue with the rest of it.
   */
  async getContinueWatching(): Promise<ApiResponse> {
    const states = await this.watchStateService.getAll();
    const fileEntities = await this.watchStateService.getContinueWatching(
      states,
    );
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse.setTitle('Continue watching').setNoSort();

    for (const fileEntity of fileEntities) {
      const titleEntity = fileEntity.title;
      const folder =
        titleEntity.type === TitleTypeEnum.show
          ? `all/${titleEntity.id}/${fileEntity.season}`
          : `all/${titleEntity.id}`;
      const item = this.addFileItem(
        apiResponse,
        fileEntity,
        states.get(fileEntity.id),
      )
        .setPlot(titleEntity.title + '\n' + this.buildPlot(fileEntity))
        .setFolder(folder, titleEntity.title)
        .addContextMenu(
          'Hide from Continue watching',
          'all/hide/' + fileEntity.id,
        );
      this.addWatchedMenus(item, fileEntity, states.get(fileEntity.id));
    }

    return apiResponse;
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

    const states = await this.watchStateService.getAll();

    if (titleEntity.type === TitleTypeEnum.movie) {
      return this.buildFilesResponse(
        titleEntity.title,
        titleEntity.files,
        false,
        states,
      );
    }

    if (seasonId) {
      return this.buildFilesResponse(
        titleEntity.title,
        titleEntity.files.filter(
          (fileEntity) => fileEntity.season === seasonId,
        ),
        false,
        states,
      );
    }

    return this.buildSeasonsResponse(titleEntity, states);
  }

  /** in episode order */
  buildFilesResponse(
    title: string,
    fileEntities: Array<FileEntity>,
    torrentContext = false,
    states: WatchStates = new Map(),
  ): ApiResponse {
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse.setTitle(title).setNoSort();
    for (const fileEntity of [...fileEntities].sort(compareFiles)) {
      const state = states.get(fileEntity.id);
      const item = this.addFileItem(apiResponse, fileEntity, state);

      if (!torrentContext) {
        this.addWatchedMenus(item, fileEntity, state);
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

  private addFileItem(
    apiResponse: ApiResponse,
    fileEntity: FileEntity,
    state: WatchStateEntity | undefined,
  ): ResponseItem {
    return apiResponse
      .createItem()
      .setLabel(fileEntity.fileName)
      .setPath('/api?path=all/play/' + fileEntity.id)
      .setToPlayable()
      .setPlot(this.buildPlot(fileEntity))
      .setSize(fileEntity.size)
      .setDuration(fileEntity.duration)
      .setWatchState(state);
  }

  /** "Mark unwatched" also clears a resume point */
  private addWatchedMenus(
    item: ResponseItem,
    fileEntity: FileEntity,
    state: WatchStateEntity | undefined,
  ) {
    if (!state?.watched) {
      item.addContextMenu('Mark watched', 'all/watched/' + fileEntity.id);
    }
    if (state?.watched || state?.position > 0) {
      item.addContextMenu('Mark unwatched', 'all/unwatched/' + fileEntity.id);
    }
  }

  /** watched count + menus marking all of it; titlePath is `<titleId>[/<season>]` */
  private addFolderWatchState(
    item: ResponseItem,
    fileEntities: FileEntity[],
    states: WatchStates,
    titlePath: string,
  ) {
    const { watched, total } = this.watchStateService.countWatched(
      fileEntities,
      states,
    );
    item.setWatchedCount(watched, total);
    if (watched < total) {
      item.addContextMenu('Mark all watched', 'all/watched-title/' + titlePath);
    }
    if (watched > 0) {
      item.addContextMenu(
        'Mark all unwatched',
        'all/unwatched-title/' + titlePath,
      );
    }
  }

  private buildSeasonsResponse(
    titleEntity: TitleEntity,
    states: WatchStates,
  ): ApiResponse {
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse.setTitle(titleEntity.title).setNoSort();

    const filesBySeason = new Map<number, FileEntity[]>();
    for (const fileEntity of titleEntity.files) {
      const seasonFiles = filesBySeason.get(fileEntity.season) ?? [];
      seasonFiles.push(fileEntity);
      filesBySeason.set(fileEntity.season, seasonFiles);
    }

    const seasons = [...filesBySeason.keys()].sort((a, b) => a - b);
    for (const season of seasons) {
      const seasonFiles = filesBySeason.get(season);
      const item = apiResponse
        .createItem()
        .setLabel(season + ' Sezonas')
        .setToFolder()
        .setPlot(
          seasonFiles.length + (seasonFiles.length > 1 ? ' files' : ' file'),
        )
        .setPath(`all/${titleEntity.id}/${season}`);
      this.addFolderWatchState(
        item,
        seasonFiles,
        states,
        `${titleEntity.id}/${season}`,
      );
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

  public scanAllFiles(): NotificationResponse {
    this.videoFilesFacade.updateFsVideoFiles(true);
    return this.koiApiResponseFactory.createNotificationResponse(
      'Scanning for all files.',
      false,
    );
  }

  async setWatched(
    fileId: string,
    watched: boolean,
  ): Promise<NotificationResponse> {
    await this.watchStateService.setWatched(
      [await this.getFileId(fileId)],
      watched,
    );
    return this.koiApiResponseFactory.createNotificationResponse(
      watched ? 'Marked as watched' : 'Marked as unwatched',
    );
  }

  /** a whole movie/show, or one season of a show */
  async setTitleWatched(
    titleId: number,
    seasonId: number,
    watched: boolean,
  ): Promise<NotificationResponse> {
    const titleEntity = titleId
      ? await this.videoFilesFacade.getTitleWithFiles(titleId)
      : null;
    if (titleEntity === null) {
      throw new NotFoundException(`title #${titleId} not found`);
    }

    const fileEntities = seasonId
      ? titleEntity.files.filter((fileEntity) => fileEntity.season === seasonId)
      : titleEntity.files;
    await this.watchStateService.setWatched(
      fileEntities.map((fileEntity) => fileEntity.id),
      watched,
    );
    return this.koiApiResponseFactory.createNotificationResponse(
      watched ? 'Marked as watched' : 'Marked as unwatched',
    );
  }

  async hideFromContinueWatching(
    fileId: string,
  ): Promise<NotificationResponse> {
    await this.watchStateService.hide(await this.getFileId(fileId));
    return this.koiApiResponseFactory.createNotificationResponse(
      'Hidden from Continue watching',
    );
  }

  private async getFileId(fileId: string): Promise<number> {
    const id = parseInt(fileId);
    if (isNaN(id) || (await this.videoFilesFacade.getFile(id)) === null) {
      throw new NotFoundException(`id #${fileId} not found`);
    }

    return id;
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

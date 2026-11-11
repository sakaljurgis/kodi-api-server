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
import {
  compareFiles,
  getEpisodeKey,
  isSample,
} from '../../Shared/Util/file-order';
import { SeasonVersions, splitVersions } from '../../Shared/Util/file-versions';
import { getRecentAdditions, RecentAddition } from './recent-additions';

const RECENTLY_ADDED_LIMIT = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

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
      const files = entity.files.filter((fileEntity) => !isSample(fileEntity));
      if (!files.length) {
        return;
      }
      const item = response
        .createItem()
        .setLabel(entity.title)
        .setToFolder()
        .setPlot(plural(files.length, 'file'))
        .setPath('all/' + entity.id);
      this.addFolderWatchState(
        item,
        withoutSpecials(files),
        states,
        '' + entity.id,
      );
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
      const folder = 'all/' + this.getFolderPath(titleEntity, fileEntity);
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

  /**
   * A movie's files, a show's seasons, or a season's episodes. A season with
   * the same episodes in several releases lists the releases (versions) as
   * folders first; versionId (any file of one) opens that one.
   */
  async loadTitle(
    titleId: number,
    seasonId: number,
    versionId?: number,
  ): Promise<KodiApiResponse> {
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
    const files = titleEntity.files.filter(
      (fileEntity) => !isSample(fileEntity),
    );

    if (titleEntity.type === TitleTypeEnum.movie) {
      return this.buildFilesResponse(titleEntity.title, files, false, states);
    }

    if (!isSeason(seasonId)) {
      return this.buildSeasonsResponse(titleEntity, files, states);
    }

    const seasonFiles = getSeasonFiles(files, seasonId);
    const split = splitVersions(seasonFiles);
    // (a version that's gone, e.g. after a delete, shows the season)
    const version = findVersion(split, versionId);
    if (version) {
      return this.buildFilesResponse(
        titleEntity.title,
        version.files,
        false,
        states,
      );
    }
    if (split) {
      return this.buildVersionsResponse(titleEntity, seasonId, split, states);
    }

    return this.buildFilesResponse(
      titleEntity.title,
      seasonFiles,
      false,
      states,
    );
  }

  /**
   * Movies and shows that got files, newest first, one entry per title for
   * what was added to it last: a new movie or show opens the title, new
   * episodes or a new season open the season, several seasons the show.
   */
  async getRecentlyAdded(): Promise<ApiResponse> {
    const [files, states] = await Promise.all([
      this.videoFilesFacade.getLiveFiles(),
      this.watchStateService.getAll(),
    ]);
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse.setTitle('Recently added').setNoSort();

    for (const addition of getRecentAdditions(files, RECENTLY_ADDED_LIMIT)) {
      const {
        label,
        path,
        files: folderFiles,
        plot,
      } = this.describeAddition(addition);
      if (addition.addedAt) {
        plot.push('Added ' + formatAddedAgo(addition.addedAt));
      }
      const item = apiResponse
        .createItem()
        .setLabel(label)
        .setToFolder()
        .setPlot(plot.join('\n'))
        .setPath('all/' + path);
      if (addition.addedAt) {
        item.setDate(formatKodiDate(addition.addedAt));
      }
      this.addFolderWatchState(item, folderFiles, states, path);
    }

    return apiResponse;
  }

  /** label, path (`<titleId>[/<season>]`) and files of the folder an addition opens */
  private describeAddition(addition: RecentAddition): {
    label: string;
    path: string;
    files: FileEntity[];
    plot: string[];
  } {
    const { title, titleFiles, added, seasons, newSeasons, newEpisodes } =
      addition;
    const whole = {
      label: title.title,
      path: '' + title.id,
      files: withoutSpecials(titleFiles),
    };

    if (title.type === TitleTypeEnum.movie) {
      return {
        ...whole,
        plot: [
          addition.isNewTitle
            ? 'New movie'
            : added.length === 1
            ? 'New file: ' + added[0].fileName
            : plural(added.length, 'new file'),
        ],
      };
    }

    const addedEpisodes = plural(countEpisodes(added), 'episode');
    const regularSeasons = seasons.filter((season) => season !== 0);
    if (addition.isNewTitle) {
      return {
        ...whole,
        plot: [
          `New show · ${plural(
            regularSeasons.length,
            'season',
          )} · ${addedEpisodes}`,
        ],
      };
    }

    const changes =
      seasons.length === 1 && seasons[0] === 0
        ? plural(countEpisodes(added), 'new special')
        : newSeasons.length === seasons.length
        ? seasons.length === 1
          ? `New season · ${addedEpisodes}`
          : `${seasons.length} new seasons · ${addedEpisodes}`
        : newEpisodes
        ? plural(newEpisodes, 'new episode')
        : `New version · ${addedEpisodes}`;

    if (seasons.length === 1) {
      return {
        label: `${title.title} · ${
          seasons[0] === 0 ? 'Specials' : 'Season ' + seasons[0]
        }`,
        path: `${title.id}/${seasons[0]}`,
        files: getSeasonFiles(titleFiles, seasons[0]),
        plot: [changes],
      };
    }

    const specials = regularSeasons.length < seasons.length;
    return {
      ...whole,
      label:
        `${title.title} · ` +
        (regularSeasons.length === 1
          ? `Season ${regularSeasons[0]}`
          : `Seasons ${formatSeasons(regularSeasons)}`) +
        (specials ? ' + Specials' : ''),
      plot: [changes],
    };
  }

  /** the folder a file is listed in: `<titleId>[/<season>[/<versionId>]]`; the title comes with its files */
  private getFolderPath(titleEntity: TitleEntity, fileEntity: FileEntity) {
    if (titleEntity.type !== TitleTypeEnum.show) {
      return '' + titleEntity.id;
    }

    const seasonPath = `${titleEntity.id}/${fileEntity.season}`;
    const split = splitVersions(
      getSeasonFiles(titleEntity.files ?? [], fileEntity.season),
    );
    const version = findVersion(split, fileEntity.id);

    return version ? `${seasonPath}/${version.id}` : seasonPath;
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
      if (torrentContext) {
        this.addFileItem(apiResponse, fileEntity, states.get(fileEntity.id));
      } else {
        this.addLibraryFileItem(apiResponse, fileEntity, states);
      }
    }

    return apiResponse;
  }

  /** the versions as folders, then the season's other files */
  private buildVersionsResponse(
    titleEntity: TitleEntity,
    season: number,
    { versions, others }: SeasonVersions,
    states: WatchStates,
  ): ApiResponse {
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse.setTitle(titleEntity.title).setNoSort();

    for (const version of versions) {
      const path = `${titleEntity.id}/${season}/${version.id}`;
      const size = version.files.reduce((sum, file) => sum + file.size, 0);
      const item = apiResponse
        .createItem()
        .setLabel(version.label)
        .setToFolder()
        .setPlot(
          [plural(countEpisodes(version.files), 'episode')]
            .concat(size > 0 ? [this.getHRFileSize(size)] : [])
            .join(' · ') +
            '\n' +
            version.releaseFolder,
        )
        .setPath('all/' + path);
      this.addFolderWatchState(item, version.files, states, path);
      item.addContextMenu('Hide this version', 'all/hide-version/' + path);
    }

    for (const fileEntity of others) {
      this.addLibraryFileItem(apiResponse, fileEntity, states);
    }

    return apiResponse;
  }

  /** a file with the watched/hide/delete/torrent menus */
  private addLibraryFileItem(
    apiResponse: ApiResponse,
    fileEntity: FileEntity,
    states: WatchStates,
  ): ResponseItem {
    const state = states.get(fileEntity.id);
    const item = this.addFileItem(apiResponse, fileEntity, state);
    this.addWatchedMenus(item, fileEntity, state);
    item.addContextMenu('Hide from library', 'all/hide-file/' + fileEntity.id);
    if (fileEntity.torrentId) {
      item.addContextMenu(
        'Show torrent',
        'torr/torrent-context/' + fileEntity.torrentId,
      );
    } else {
      item.addContextMenu('Delete file', 'all/delete/' + fileEntity.id);
    }

    return item;
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

  /** watched count + menus marking all of it; titlePath is `<titleId>[/<season>[/<versionId>]]` */
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
    files: FileEntity[],
    states: WatchStates,
  ): ApiResponse {
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse.setTitle(titleEntity.title).setNoSort();

    const filesBySeason = new Map<number, FileEntity[]>();
    for (const fileEntity of files) {
      const seasonFiles = filesBySeason.get(fileEntity.season) ?? [];
      seasonFiles.push(fileEntity);
      filesBySeason.set(fileEntity.season, seasonFiles);
    }

    // specials (season 0) last
    const seasons = [...filesBySeason.keys()].sort(
      (a, b) => (a || Infinity) - (b || Infinity),
    );
    for (const season of seasons) {
      const seasonFiles = filesBySeason.get(season);
      const item = apiResponse
        .createItem()
        .setLabel(season === 0 ? 'Specials' : season + ' Sezonas')
        .setToFolder()
        .setPlot(plural(seasonFiles.length, 'file'))
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

  /** a whole movie/show, one season of a show, or one version of a season */
  async setTitleWatched(
    titleId: number,
    seasonId: number,
    versionId: number,
    watched: boolean,
  ): Promise<NotificationResponse> {
    const titleEntity = titleId
      ? await this.videoFilesFacade.getTitleWithFiles(titleId)
      : null;
    if (titleEntity === null) {
      throw new NotFoundException(`title #${titleId} not found`);
    }

    const seasonFiles = isSeason(seasonId)
      ? titleEntity.files.filter((fileEntity) => fileEntity.season === seasonId)
      : titleEntity.files;
    const version = versionId
      ? findVersion(
          splitVersions(seasonFiles.filter((file) => !isSample(file))),
          versionId,
        )
      : undefined;
    if (versionId && !version) {
      throw new NotFoundException(`version #${versionId} not found`);
    }
    const fileEntities = version?.files ?? seasonFiles;
    await this.watchStateService.setWatched(
      fileEntities.map((fileEntity) => fileEntity.id),
      watched,
    );
    return this.koiApiResponseFactory.createNotificationResponse(
      watched ? 'Marked as watched' : 'Marked as unwatched',
    );
  }

  /** out of every list (kept on disk, still playable); shown again on /library */
  async hideFromLibrary(fileId: string): Promise<NotificationResponse> {
    await this.videoFilesFacade.setHidden([await this.getFileId(fileId)], true);
    return this.koiApiResponseFactory.createNotificationResponse(
      'Hidden from the library (undo on /library)',
    );
  }

  /** all files of a version of a season, see loadTitle */
  async hideVersionFromLibrary(
    titleId: number,
    seasonId: number,
    versionId: number,
  ): Promise<NotificationResponse> {
    const titleEntity = titleId
      ? await this.videoFilesFacade.getTitleWithFiles(titleId)
      : null;
    const version = titleEntity
      ? findVersion(
          splitVersions(getSeasonFiles(titleEntity.files, seasonId)),
          versionId,
        )
      : undefined;
    if (!version) {
      throw new NotFoundException(`version #${versionId} not found`);
    }

    const hidden = await this.videoFilesFacade.setHidden(
      version.files.map((fileEntity) => fileEntity.id),
      true,
    );
    return this.koiApiResponseFactory.createNotificationResponse(
      `Hidden ${plural(hidden, 'file')} from the library (undo on /library)`,
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

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** releases of the same episode count once */
function countEpisodes(files: FileEntity[]): number {
  return new Set(files.map(getEpisodeKey)).size;
}

/** a season from a path (0 = specials), not NaN from a missing one */
function isSeason(seasonId: number): boolean {
  return Number.isInteger(seasonId);
}

/** a show's watched count leaves out its specials (season 0) */
function withoutSpecials(files: FileEntity[]): FileEntity[] {
  return files.filter((fileEntity) => fileEntity.season !== 0);
}

function getSeasonFiles(files: FileEntity[], season: number): FileEntity[] {
  return files.filter(
    (fileEntity) => fileEntity.season === season && !isSample(fileEntity),
  );
}

/** the version a file is in */
function findVersion(split: SeasonVersions | null, fileId: number) {
  return fileId
    ? split?.versions.find((version) =>
        version.files.some((fileEntity) => fileEntity.id === fileId),
      )
    : undefined;
}

/** 3–5, or 2, 5, 7 */
function formatSeasons(seasons: number[]): string {
  const isRange = seasons.every(
    (season, i) => i === 0 || season === seasons[i - 1] + 1,
  );

  return isRange
    ? `${seasons[0]}–${seasons[seasons.length - 1]}`
    : seasons.join(', ');
}

/** today, yesterday, 3 days ago, 2 weeks ago, else the date */
function formatAddedAgo(addedAt: number, now = Date.now()): string {
  const day = (time: number) =>
    Math.floor(
      (time - new Date(time).getTimezoneOffset() * 60 * 1000) / DAY_MS,
    );
  const days = day(now) - day(addedAt);
  if (days <= 0) {
    return 'today';
  }
  if (days === 1) {
    return 'yesterday';
  }
  if (days < 14) {
    return `${days} days ago`;
  }
  if (days < 60) {
    return `${Math.floor(days / 7)} weeks ago`;
  }

  return new Date(addedAt).toISOString().slice(0, 10);
}

/** what Kodi's date expects: 01.12.2026 */
function formatKodiDate(time: number): string {
  const date = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${pad(date.getDate())}.${pad(
    date.getMonth() + 1,
  )}.${date.getFullYear()}`;
}

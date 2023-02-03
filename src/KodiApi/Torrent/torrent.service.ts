import { Injectable, NotFoundException } from '@nestjs/common';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import ApiResponse from '../Dto/api-response.dto';
import { SearchClientFacade } from '../../Torrent/SearchClient/search-client.facade';
import { TorrentSearchResult } from '../../Torrent/Dto/torrent-search-result.class';
import { RecentSearchesService } from '../RecentSearches/recent-searches.service';
import { TorrentSearchClientResponse } from '../../Torrent/Dto/torrent-search-client-response.dto';
import { TorrentDownloadClient } from '../../Torrent/DownloadClient/torrent-download.client';
import { AllFilesService } from '../AllFiles/all-files.service';
import NotificationResponse from '../Dto/notification-response.dto';
import { TorrentEntity } from '../../Shared/Entity/torrent.entity';
import { TorrentSeedClient } from '../../Torrent/SeedClient/torrent-seed.client';

@Injectable()
export class TorrentService {
  private torrentsCache: Record<string, TorrentSearchResult> = {}; //no need for all that info, magnet is enough

  constructor(
    private readonly koiApiResponseFactory: KodiApiResponseFactory,
    private readonly torrSearchClient: SearchClientFacade,
    private readonly recentSearchesService: RecentSearchesService,
    private readonly torrDownloadClient: TorrentDownloadClient,
    private readonly torrSeedClient: TorrentSeedClient,
    private readonly allFilesService: AllFilesService,
  ) {}

  async getMenu(): Promise<ApiResponse> {
    const apiResponse = this.koiApiResponseFactory
      .createApiResponse()
      .setNoSort();
    const searchClientNames = this.torrSearchClient.getSearchClientNames();
    apiResponse.addNavigationItems([['Torrs', 'torrs']], 'torr/');
    apiResponse.setTitle('Torrent service');
    for (const clientName of searchClientNames) {
      apiResponse.addNavigationItems(
        [
          [clientName + ' Search', 'search/' + clientName, ''],
          [clientName + ' Neseniai ieškoti', 'recent/' + clientName],
        ],
        'torr/',
      );
      const customMenu = await this.torrSearchClient.getCustomMenu(clientName);
      apiResponse.addNavigationItems(
        customMenu.navigationItems,
        'torr/custom-menu/' + clientName + '/',
      );
      this.addTorrentSearchResultsToApiResponse(
        apiResponse,
        customMenu.searchResults,
      );
    }

    return apiResponse;
  }

  async getCustomMenu(provider: string, path: string) {
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse.setNoSort();
    const customMenu: TorrentSearchClientResponse | false =
      await this.torrSearchClient
        .getCustomMenu(provider, path)
        .catch(() => false);

    if (customMenu === false) {
      return this.koiApiResponseFactory.createNotificationResponse(
        'Error while searching',
        false,
      );
    }
    apiResponse.setTitle(customMenu.title);
    apiResponse.addNavigationItems(
      customMenu.navigationItems,
      'torr/custom-menu/' + provider + '/',
    );
    this.addTorrentSearchResultsToApiResponse(
      apiResponse,
      customMenu.searchResults,
    );

    return apiResponse;
  }

  async search(
    query: string,
    provider: string,
  ): Promise<ApiResponse | NotificationResponse> {
    this.recentSearchesService.addRecentSearch('torr', query).then(/*ignore*/);
    const searchResults: TorrentSearchClientResponse | false =
      await this.torrSearchClient.search(query, provider).catch(() => false);

    if (searchResults === false) {
      return this.koiApiResponseFactory.createNotificationResponse(
        'Error while searching',
        false,
      );
    }

    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse.setNoSort();
    this.addTorrentSearchResultsToApiResponse(
      apiResponse,
      searchResults.searchResults,
    );

    return apiResponse;
  }

  async getRecentSearches(provider: string): Promise<ApiResponse> {
    return this.recentSearchesService.getRecentSearches(
      'torr',
      'torr/search/' + provider,
    );
  }

  async add(torrId: string): Promise<ApiResponse | NotificationResponse> {
    const torrSearchData = this.torrentsCache[torrId];
    if (torrSearchData === undefined) {
      throw new NotFoundException('torrent search data not found');
    }
    const fileEntities = await this.torrDownloadClient
      .addTorrent(torrSearchData.magnet)
      .catch(() => null);

    if (fileEntities === null) {
      return this.koiApiResponseFactory.createNotificationResponse(
        'error adding torrent',
        false,
      );
    }

    return this.allFilesService.buildFilesResponse(
      torrSearchData.name,
      fileEntities,
      true,
    );
  }

  private addTorrentSearchResultsToApiResponse(
    apiResponse: ApiResponse,
    searchResults: TorrentSearchResult[],
  ): void {
    for (const searchResult of searchResults) {
      this.torrentsCache[searchResult.id] = searchResult;
      apiResponse
        .createItem()
        .setDate(searchResult.date)
        .setLabel(searchResult.name)
        .setToFolder()
        .setPath('torr/add/' + searchResult.id)
        .setPlot(
          [
            searchResult.date,
            searchResult.size,
            'S' + searchResult.seeders + ' L' + searchResult.leechers,
            searchResult.info,
          ].join('\n'),
        );
    }
  }

  async getTorrents(): Promise<ApiResponse> {
    const torrentEntities = await this.torrDownloadClient.getTorrents();
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    apiResponse.setTitle('Torrents');

    for (const torrentEntity of torrentEntities) {
      this.addTorrentToApiResponse(torrentEntity, apiResponse);
    }

    return apiResponse;
  }

  private addTorrentToApiResponse(
    torrentEntity: TorrentEntity,
    apiResponse: ApiResponse,
  ): void {
    const firstFileEntity = torrentEntity.files[0];
    if (!firstFileEntity) {
      return;
    }

    firstFileEntity.progress = torrentEntity.progress;
    firstFileEntity.size = torrentEntity.size;
    const item = apiResponse
      .createItem()
      .setPlot(this.buildPlot(torrentEntity))
      .setLabel(torrentEntity.name)
      .setPath('/torr/torr/' + torrentEntity.id)
      .setToFolder();

    if (torrentEntity.stopped && torrentEntity.progress !== 1) {
      item.addContextMenu('resume wt', '/torr/resume/' + torrentEntity.id);
    }

    if (!torrentEntity.stopped) {
      item.addContextMenu('stop wt', '/torr/stop/' + torrentEntity.id);
    }

    if (torrentEntity.transmissionId) {
      item.addContextMenu(
        'stop transmission',
        '/torr/stop-transmission/' + torrentEntity.id,
      );
    }

    if (!torrentEntity.transmissionId && torrentEntity.progress === 1) {
      item.addContextMenu(
        'add transmission',
        '/torr/add-transmission/' + torrentEntity.id,
      );
    }

    item.addContextMenu('delete', '/torr/delete/' + torrentEntity.id);
  }

  buildPlot(torrentEntity: TorrentEntity): string {
    const plot: string[] = [];
    if (torrentEntity.size) {
      plot.push(
        'Size ' + this.allFilesService.getHRFileSize(torrentEntity.size),
      );
    }

    const arrTorrProps: string[] = [];
    if (torrentEntity.linkomanija) {
      arrTorrProps.push('LM');
    }
    if (torrentEntity.transmissionId) {
      arrTorrProps.push('transm');
    }

    arrTorrProps.push('wt');

    const torrProps = arrTorrProps.join(' + ');
    if (torrProps) {
      plot.push(torrProps);
    }

    if (torrentEntity.progress) {
      const progress = Math.round(torrentEntity.progress * 1000) / 10;
      const stopped = torrentEntity.stopped ? ' Stopped' : '';
      plot.push(`${progress}%${stopped}`);
    }

    return plot.join('\n');
  }

  getOneTorrentAsListFromContextMenu(torrentId: string) {
    //by default context menu does not update container (view), we need to force it
    return {
      forceUpdate: {
        urlParams: {
          action: 'query',
          path: 'torr/torrent/' + torrentId,
        },
      },
    };
  }

  async getOneTorrentAsList(torrentId: string): Promise<ApiResponse> {
    const id = parseInt(torrentId);
    const torrentEntity = await this.torrDownloadClient.getTorrentById(id);
    const apiResponse = this.koiApiResponseFactory.createApiResponse();
    if (torrentEntity) {
      this.addTorrentToApiResponse(torrentEntity, apiResponse);
    }

    return apiResponse;
  }

  async getTorrentFiles(id: string): Promise<ApiResponse> {
    const torrentEntity = await this.torrDownloadClient.getTorrentById(
      parseInt(id),
    );

    return this.allFilesService.buildFilesResponse(
      torrentEntity.name,
      torrentEntity.files,
      true,
    );
  }

  async stopTorrent(id: string) {
    const torrId = parseInt(id);
    try {
      await this.torrDownloadClient.stopTorrent(torrId);
    } catch (e) {
      return this.koiApiResponseFactory.createNotificationResponse(
        'error stopping',
      );
    }

    return this.koiApiResponseFactory.createNotificationResponse('stopped');
  }

  async resumeTorrent(id: string) {
    const torrId = parseInt(id);
    try {
      await this.torrDownloadClient.resumeTorrent(torrId);
    } catch (e) {
      return this.koiApiResponseFactory.createNotificationResponse(
        'error resuming',
      );
    }

    return this.koiApiResponseFactory.createNotificationResponse('resumed');
  }

  async stopTransmissionTorrent(id: string) {
    const torrId = parseInt(id);
    const result = await this.torrSeedClient
      .removeTorrent(torrId)
      .catch(() => false);

    return new NotificationResponse(
      result ? 'torrent removed from transmission' : 'removal failed',
      true,
    );
  }

  async addTransmissionTorrent(id: string) {
    const torrId = parseInt(id);
    const result = await this.torrSeedClient
      .addTorrentById(torrId)
      .catch(() => false);

    return new NotificationResponse(
      result ? 'torrent added to transmission' : 'adding failed',
      true,
    );
  }

  async deleteTorrent(id: string) {
    const torrId = parseInt(id);
    const result = await this.torrSeedClient
      .removeTorrent(torrId, true)
      .catch(() => false);

    return new NotificationResponse(
      result ? 'torrent deleted' : 'deleting from wt not implemented',
      true,
    );
  }
}

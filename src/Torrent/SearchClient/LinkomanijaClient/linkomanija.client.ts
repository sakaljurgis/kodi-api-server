import { Injectable } from '@nestjs/common';
import { LinkomanijaHttpClient } from './HttpClient/linkomanija-http.client';
import { LinkomanijaResponseParser } from './ResponseParser/linkomanija-response.parser';
import { TorrentSearchResult } from '../../Dto/torrent-search-result.class';
import { SearchClientInterface } from '../Interface/search-client.interface';
import { NavigationItem } from '../../../Shared/Dto/navigation-item.dto';
import { TorrentSearchClientResponse } from '../../Dto/torrent-search-client-response.dto';

@Injectable()
export class LinkomanijaClient implements SearchClientInterface {
  clientName = 'LM';

  constructor(
    private readonly lmHttpClient: LinkomanijaHttpClient,
    private readonly lmResponseParser: LinkomanijaResponseParser,
  ) {}

  async search(query: string): Promise<TorrentSearchResult[]> {
    const rawData = await this.lmHttpClient.search(query).catch((e) => e);

    return this.lmResponseParser.parseRaw(rawData);
  }

  async getTop(category: string, time: string): Promise<TorrentSearchResult[]> {
    const rawData = await this.lmHttpClient
      .getTop(category, time)
      .catch((e) => e);

    return this.lmResponseParser.parseRaw(rawData);
  }

  async customMenu(path: string): Promise<TorrentSearchClientResponse> {
    const [service, category, time] = path.split('/');
    const customMenuResponse = new TorrentSearchClientResponse();

    if (!service) {
      customMenuResponse.navigationItems.push(['LM Top', 'top']);
      return Promise.resolve(customMenuResponse);
    }

    const categories: NavigationItem[] = [
      ['Movies LT', 'top/53'],
      ['Movies LT HD', 'top/61'],
      ['Movies', 'top/29'],
      ['Movies HD', 'top/52'],
      ['TV LT', 'top/28'],
      ['TV LT HD', 'top/62'],
      ['TV', 'top/30'],
      ['TV HD', 'top/60'],
    ];

    if (!category) {
      customMenuResponse.navigationItems = categories;
      customMenuResponse.title = 'LM Top';
      return Promise.resolve(customMenuResponse);
    }

    const times: NavigationItem[] = [
      ['Savaitės', 'top/' + category + '/7'],
      ['2 Savaičių', 'top/' + category + '/14'],
      ['Mėnesio', 'top/' + category + '/30'],
      ['3 Mėnesių', 'top/' + category + '/90'],
      ['Metų', 'top/' + category + '/365'],
      ['Visų laikų', 'top/' + category + '/0'],
    ];

    if (!time) {
      customMenuResponse.navigationItems = times;
      customMenuResponse.title =
        'LM Top, ' + categories.find((value) => value[1] == path)[0];
      return Promise.resolve(customMenuResponse);
    }

    customMenuResponse.title =
      'LM Top, ' +
      categories.find((value) => value[1] == 'top/' + category)[0] +
      ', ' +
      times.find((value) => value[1] == path)[0];
    customMenuResponse.searchResults = await this.getTop(category, time);

    return customMenuResponse;
  }
}

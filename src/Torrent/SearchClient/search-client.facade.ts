import { Inject, Injectable } from '@nestjs/common';
import { SearchClientInterface } from './Interface/search-client.interface';
import { TorrentSearchClientResponse } from '../Dto/torrent-search-client-response.dto';

export const SearchClients = 'SearchClients';

@Injectable()
export class SearchClientFacade {
  constructor(
    @Inject(SearchClients)
    private readonly searchClients: SearchClientInterface[],
  ) {}

  getSearchClientNames(): string[] {
    const clients = [];
    for (const searchClient of this.searchClients) {
      clients.push(searchClient.clientName);
    }

    return clients;
  }

  //todo - page
  async search(
    query: string,
    clientName: string,
  ): Promise<TorrentSearchClientResponse> {
    for (const searchClient of this.searchClients) {
      if (searchClient.clientName.toLowerCase() === clientName.toLowerCase()) {
        const response = new TorrentSearchClientResponse();
        response.title = searchClient.clientName + ' search for: ' + query;
        response.searchResults = await searchClient.search(query);

        return response;
      }
    }

    return Promise.reject('client not found');
  }

  getCustomMenu(
    clientName: string,
    path = '',
  ): Promise<TorrentSearchClientResponse> {
    for (const searchClient of this.searchClients) {
      if (searchClient.clientName.toLowerCase() === clientName.toLowerCase()) {
        return searchClient.customMenu(path);
      }
    }

    return Promise.reject('client not found');
  }
}

import { SearchClientInterface } from '../Interface/search-client.interface';
import { LinkomanijaClient } from '../LinkomanijaClient/linkomanija.client';
import { Injectable } from '@nestjs/common';
import { TorrentSearchClientResponse } from '../../Dto/torrent-search-client-response.dto';

/**
 * Bridge is needed as it seems you cannot inject providers from other modules using factory in module level
 */
@Injectable()
export class LinkomanijaClientBridge implements SearchClientInterface {
  clientName: string;

  constructor(private readonly client: LinkomanijaClient) {
    this.clientName = client.clientName;
  }

  search(query: string) {
    return this.client.search(query);
  }

  customMenu(path: string): Promise<TorrentSearchClientResponse> {
    return this.client.customMenu(path);
  }
}

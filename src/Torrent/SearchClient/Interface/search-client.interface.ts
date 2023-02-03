import { TorrentSearchResult } from '../../Dto/torrent-search-result.class';
import { TorrentSearchClientResponse } from '../../Dto/torrent-search-client-response.dto';

export interface SearchClientInterface {
  clientName: string;

  search(query: string): Promise<TorrentSearchResult[]>;

  customMenu(path: string): Promise<TorrentSearchClientResponse>;
}

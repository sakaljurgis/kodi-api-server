import { NavigationItem } from '../../Shared/Dto/navigation-item.dto';
import { TorrentSearchResult } from './torrent-search-result.class';

export class TorrentSearchClientResponse {
  title = '';
  navigationItems: NavigationItem[] = [];
  searchResults: TorrentSearchResult[] = [];
  //todo pagination
}

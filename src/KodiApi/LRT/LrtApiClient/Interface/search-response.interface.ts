import { SearchResponseItemInterface } from './search-response-item.interface';

export interface SearchResponseInterface {
  q: string;
  meta: {
    time: string;
    total: string;
    total_found: string;
  };
  page: string;
  total_found: string;
  items: Array<SearchResponseItemInterface>;
}

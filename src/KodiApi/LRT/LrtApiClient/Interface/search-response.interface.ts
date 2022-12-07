interface SearchResponseInterface {
  q: string;
  meta: {
    time: number;
    total: number;
    total_found: number;
  };
  total_found: string | number;
  items: Array<SearchResponseItemInterface>;
}

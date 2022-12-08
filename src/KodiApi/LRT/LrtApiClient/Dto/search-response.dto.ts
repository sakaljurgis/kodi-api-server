import { SearchResponseItemDto } from './search-response-item.dto';

export class SearchResponseDto {
  readonly items: Array<SearchResponseItemDto> = [];
  constructor(readonly page: number, readonly total: number) {
    this.page = page;
    this.total = total;
  }

  addItem(item: SearchResponseItemDto) {
    this.items.push(item);

    return this;
  }
}

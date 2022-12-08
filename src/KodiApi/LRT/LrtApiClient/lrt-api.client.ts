import { Injectable } from '@nestjs/common';
import { LrtApiSearchClient } from './Client/lrt-api-search.client';
import { SearchResponseDto } from './Dto/search-response.dto';
import { LrtApiCategoryClient } from './Client/lrt-api-category.client';
import { LrtApiPlaylistClient } from './Client/lrt-api-playlist.client';

@Injectable()
export class LrtApiClient {
  constructor(
    private readonly searchClient: LrtApiSearchClient,
    private readonly categoryClient: LrtApiCategoryClient,
    private readonly playlistClient: LrtApiPlaylistClient,
  ) {}

  searchCategories(query: string): Promise<SearchResponseDto> {
    return this.searchClient.searchCategories(query);
  }

  getCategory(catId: string): Promise<SearchResponseDto> {
    return this.categoryClient.getCategory(catId);
  }

  getPlaylist(mediaUrl: string): Promise<string> {
    return this.playlistClient.getPlaylistUrl(mediaUrl);
  }
}

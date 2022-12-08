import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SearchResponseInterface } from '../Interface/search-response.interface';
import { SearchResponseDto } from '../Dto/search-response.dto';
import { SearchResponseItemDto } from '../Dto/search-response-item.dto';

@Injectable()
export class LrtApiSearchClient {
  constructor(private readonly httpService: HttpService) {}

  async searchCategories(query: string): Promise<SearchResponseDto> {
    query = query === 'viskas' ? '' : query;
    const url = 'https://www.lrt.lt/api/search?type=3&tema=' + query;
    //https://www.lrt.lt/api/search?page=1&count=44&order=desc
    //https://www.lrt.lt/api/search?get_terms=1
    const resp = await firstValueFrom(this.httpService.get(url));
    const searchResponse: SearchResponseInterface = resp.data;

    const cats = [];

    //todo - move to mapper
    const responseDto = new SearchResponseDto(
      parseInt(searchResponse.page),
      parseInt(searchResponse.total_found),
    );

    for (const searchItem of searchResponse.items) {
      if (cats.indexOf(searchItem.category_title) > -1) {
        continue;
      }
      const itemDto = new SearchResponseItemDto();
      itemDto.label = searchItem.category_title;
      itemDto.thumb =
        'https://www.lrt.lt' +
        searchItem.img_path_prefix +
        '282x158' +
        searchItem.img_path_postfix;
      itemDto.categoryId = await this.findCategoryId(searchItem.category_url);

      cats.push(searchItem.category_title);
      responseDto.addItem(itemDto);
    }

    return responseDto;
  }

  private async findCategoryId(categoryUrl: string): Promise<string> {
    //todo - cache to database
    const url = 'https://www.lrt.lt' + categoryUrl;
    const resp = await firstValueFrom(this.httpService.get(url));
    const body: string = resp.data;
    const start = body.indexOf('data.category_id');
    if (start > -1) {
      const interim = body.indexOf('"', start);
      const end = body.indexOf('"', interim + 1);
      if (end > interim) {
        return body.substring(interim + 1, end);
      } else {
        throw 'unexpected response body 1';
      }
    } else {
      throw 'unexpected response body 2';
    }
  }
}

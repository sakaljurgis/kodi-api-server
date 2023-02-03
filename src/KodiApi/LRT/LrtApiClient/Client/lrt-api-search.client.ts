import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SearchResponseInterface } from '../Interface/search-response.interface';
import { SearchResponseDto } from '../Dto/search-response.dto';
import { SearchResponseItemDto } from '../Dto/search-response-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LrtCategory } from '../Entity/lrt-category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LrtApiSearchClient {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(LrtCategory)
    private lrtCategoriesRepository: Repository<LrtCategory>,
  ) {}

  async searchCategories(query: string): Promise<SearchResponseDto> {
    query = query === 'viskas' ? '' : query;
    //const url = 'https://www.lrt.lt/api/search?type=3&tema=' + query;
    const url = 'https://www.lrt.lt/api/search?type=3&order=desc&tema=' + query;
    //https://www.lrt.lt/api/search?page=1&count=44&order=desc
    //https://www.lrt.lt/api/search?get_terms=1
    const resp = await firstValueFrom(this.httpService.get(url));
    const searchResponse: SearchResponseInterface = resp.data;

    const loadedCategories = new Set();

    //todo - move to mapper
    const responseDto = new SearchResponseDto(
      parseInt(searchResponse.page),
      parseInt(searchResponse.total_found),
    );

    for (const searchItem of searchResponse.items) {
      if (loadedCategories.has(searchItem.category_title)) {
        continue;
      }
      const itemDto = new SearchResponseItemDto();
      itemDto.label = searchItem.category_title;
      itemDto.thumb =
        'https://www.lrt.lt' +
        searchItem.img_path_prefix +
        '282x158' +
        searchItem.img_path_postfix;
      let categoryId = await this.findCategoryIdInDb(searchItem.category_url);

      if (categoryId === null) {
        categoryId = await this.findCategoryIdInLrt(searchItem.category_url);
        this.saveCategory(
          searchItem.category_url,
          categoryId,
          searchItem.category_title,
          itemDto.thumb,
        );
      }

      itemDto.categoryId = await this.findCategoryId(searchItem.category_url);

      loadedCategories.add(searchItem.category_title);
      responseDto.addItem(itemDto);
    }

    return responseDto;
  }

  private async findCategoryId(categoryUrl: string): Promise<string> {
    const catId = await this.findCategoryIdInDb(categoryUrl);
    if (catId !== null) {
      return catId;
    }
    return this.findCategoryIdInLrt(categoryUrl);
  }

  private saveCategory(
    categoryUrl: string,
    catId: string,
    catTitle: string,
    thumb: string,
  ) {
    const cat = new LrtCategory();
    cat.categoryUrl = categoryUrl;
    cat.categoryId = catId;
    cat.title = catTitle;
    cat.thumb = thumb;
    this.lrtCategoriesRepository.save(cat).then();
  }

  private async findCategoryIdInDb(
    categoryUrl: string,
  ): Promise<string | null> {
    const entity: LrtCategory | null = await this.lrtCategoriesRepository
      .findOneBy({
        categoryUrl: categoryUrl,
      })
      .catch(() => null);
    if (entity !== null) {
      return entity.categoryId;
    }

    return null;
  }

  private async findCategoryIdInLrt(categoryUrl: string): Promise<string> {
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

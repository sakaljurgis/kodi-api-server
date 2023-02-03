import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SearchResponseInterface } from '../Interface/search-response.interface';
import { SearchResponseDto } from '../Dto/search-response.dto';
import { SearchResponseItemDto } from '../Dto/search-response-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LrtCategory } from '../Entity/lrt-category.entity';
import { IsNull, Not, Repository } from 'typeorm';

@Injectable()
export class LrtApiCategoryClient {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(LrtCategory)
    private lrtCategoriesRepository: Repository<LrtCategory>,
  ) {}

  async getCategory(catId: string): Promise<SearchResponseDto> {
    const url = 'https://www.lrt.lt/api/search?type=3&category_id=' + catId;
    const resp = await firstValueFrom(this.httpService.get(url));
    const searchResponse: SearchResponseInterface = resp.data;

    //todo - move to mapper
    const responseDto = new SearchResponseDto(
      parseInt(searchResponse.page),
      parseInt(searchResponse.total_found),
      //todo - consider calculating total pages?
    );

    for (const searchItem of searchResponse.items) {
      const itemDto = new SearchResponseItemDto();
      itemDto.label = searchItem.title;
      itemDto.thumb =
        'https://www.lrt.lt' +
        searchItem.img_path_prefix +
        '282x158' +
        searchItem.img_path_postfix;
      itemDto.categoryId = catId;
      itemDto.date = searchItem.item_date;
      itemDto.url = searchItem.url;

      responseDto.addItem(itemDto);
    }

    //update last access
    this.lrtCategoriesRepository
      .update({ categoryId: catId }, { lastAccess: Date.now() })
      .then((r) => {
        if (r.affected === 0) {
          //todo - search-update category info
        }
      });

    return responseDto;
  }

  getRecentCategories(count: number): Promise<LrtCategory[]> {
    return this.lrtCategoriesRepository.find({
      order: { lastAccess: 'DESC' },
      take: count,
      where: { lastAccess: Not(IsNull()) },
    });
  }
}

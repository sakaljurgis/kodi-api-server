import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LrtApiClient {
  constructor(private readonly httpService: HttpService) {}

  async getSearch(topic: string): Promise<any> {
    //todo return api response
    topic = topic === 'viskas' ? topic : '';
    const url = 'https://www.lrt.lt/api/search?type=3&tema=' + topic;
    const resp = await firstValueFrom(this.httpService.get(url));
    const data: SearchResponseInterface = resp.data;
    const items: Array<any> = data.items;

    const cats = [];
    const returnItems = [];

    if (items) {
      for (const i in items) {
        const item = items[i];
        if (cats.indexOf(item.category_title) > -1) {
          continue;
        }
        //todo refactor to api response item
        const newItem = {
          label: item.category_title,
          isFolder: true,
          thumb:
            'https://www.lrt.lt' +
            item.img_path_prefix +
            '282x158' +
            item.img_path_postfix,
          categoryId: await this.findCategoryId(item.category_url),
        };
        cats.push(item.category_title);
        returnItems.push(newItem);
      }
    }

    return returnItems;
  }

  private async findCategoryId(categoryUrl: string): Promise<string> {
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

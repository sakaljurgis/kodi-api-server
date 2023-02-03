import { Injectable } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { configService, ConfigService } from '../../config/config.service';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { RecentSearchesConfig } from '../../config/recent-searches.config';

@Injectable()
export class RecentSearchesService {
  private readonly config: RecentSearchesConfig;

  constructor(private readonly kodiApiResponseFactory: KodiApiResponseFactory) {
    this.config = configService.getRecentSearchesConfig();
  }

  async getRecentSearches(module: string, path: string): Promise<ApiResponse> {
    const data = await this.getRecentSearchesData(module);
    const response = this.kodiApiResponseFactory
      .createApiResponse()
      .setNoSort();
    for (const recentSearch of data) {
      response
        .createItem()
        .setLabel(recentSearch)
        .setActionSearch(recentSearch)
        .setPath(path);
    }

    return response;
  }

  async addRecentSearch(module: string, term: string): Promise<void> {
    const data = await this.getRecentSearchesData(module);
    const index = data.indexOf(term);
    if (index === 0) {
      return Promise.resolve();
    }
    if (index > 0) {
      data.splice(index, 1);
    }
    data.unshift(term);

    const rawData = JSON.stringify(
      data.slice(0, this.config.getRecentSearchesLimit()),
    );
    const filePath = this.getFilePath(module);
    writeFile(filePath, rawData).then();
  }

  private async getRecentSearchesData(module: string): Promise<Array<string>> {
    const filePath = this.getFilePath(module);
    const rawData = '' + (await readFile(filePath).catch(() => '[]'));

    return JSON.parse(rawData);
  }

  private getFilePath(module: string): string {
    return join(this.config.getRecentSearchesFolder(), module + '.json');
  }
}

import { Injectable } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { configService, ConfigService } from '../../config/config.service';
import { KodiApiResponseFactory } from '../kodi-api-response.factory';
import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';

@Injectable()
export class RecentSearchesService {
  private readonly configService: ConfigService;
  constructor(
    private readonly kodiApiResponseFactory: KodiApiResponseFactory,
  ) {
    this.configService = configService;
  }
  async getRecentSearches(module: string, path: string): Promise<ApiResponse> {
    const data = await this.getRecentSearchesData(module);
    const response = this.kodiApiResponseFactory.createApiResponse();
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
    if (index > -1) {
      data.splice(index, 1);
    }
    data.push(term);
    const rawData = JSON.stringify(data);
    const filePath = this.getFilePath(module);

    await writeFile(filePath, rawData);
  }

  private async getRecentSearchesData(module: string): Promise<Array<string>> {
    const filePath = this.getFilePath(module);
    const rawData = '' + (await readFile(filePath).catch(() => '[]'));

    return JSON.parse(rawData);
  }

  private getFilePath(module: string): string {
    return join(this.configService.getRecentSearchesFolder(), module + '.json');
  }
}

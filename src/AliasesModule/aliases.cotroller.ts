import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { JsonFileDataStorageService } from '../DataStorage/json-file-data-storage.service';
import { createReadStream } from 'fs';
import { join } from 'path';
import { Response } from 'express';

@Controller('aliases')
export class AliasesController {
  constructor(private readonly jsonDs: JsonFileDataStorageService) {}

  @Get('')
  async main(@Res() res: Response) {
    //todo - make the views directory global so no need to edit nest-cli.json every time
    const readable = createReadStream(join(__dirname, './View/index.html'));
    readable.pipe(res);
  }

  @Get('data')
  async getData() {
    return this.jsonDs.get('aliases', []);
  }

  @Post('')
  async setData(@Body() data: any) {
    await this.jsonDs.set('aliases', data);
    return data;
  }

  @Get('schema')
  getSchema() {
    return {
      title: 'Aliases',
      type: 'array',
      format: 'table',
      uniqueItems: true,
      items: {
        type: 'object',
        title: 'Alias',
        properties: {
          alias: {
            type: 'string',
            title: 'alias',
          },
          title: {
            type: 'string',
            title: 'title',
          },
        },
      },
    };
  }
}

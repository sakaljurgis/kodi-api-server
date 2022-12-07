import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { LrtService } from './lrt.service';
import { LrtApiClient } from './lrt-api.client';

@Controller('api/lrt')
export class LrtController {
  constructor(
    private readonly lrtService: LrtService,
    private readonly lrtApiClient: LrtApiClient,
  ) {}

  @Get()
  getLrtMenu() {
    return this.lrtService.getMainMenu();
  }

  @Get('search')
  getSearch(@Req() request: Request, @Query('search') search: string) {
    return {
      mod: 'lrt',
      path: request.url,
      search: search ?? 'no',
    };
  }

  @Get('recent')
  async getRecent(@Req() request: Request) {
    return {
      mod: 'lrt',
      path: request.url,
      recent: true,
    };
  }

  @Get('cat/:id')
  async getCategory(@Req() request: Request, @Param('id') id: number) {
    return {
      mod: 'lrt - category',
      path: request.url,
      category: id,
    };
  }

  @Get('tema/:topic')
  async getTema(@Req() request: Request, @Param('topic') topic: string) {
    const resp = await this.lrtApiClient.getSearch(topic);
    return {
      mod: 'lrt - category',
      path: request.url,
      topic: resp,
    };
  }

  @Get('play/*')
  getPlay(@Req() request: Request, @Param() params: string[]) {
    const playPath = params[0];
    return {
      mod: 'lrt - play',
      path: request.url,
      playPath: playPath,
    };
  }
}

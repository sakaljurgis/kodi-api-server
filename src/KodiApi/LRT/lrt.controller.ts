import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { LrtService } from './lrt.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('api/lrt')
export class LrtController {
  constructor(
    private readonly lrtService: LrtService,
    private readonly httpService: HttpService,
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
    const resp = await firstValueFrom(
      this.httpService.get('http://localhost:3000/api'),
    );
    return {
      mod: 'lrt',
      path: request.url,
      recent: true,
      resp: resp.data,
    };
  }

  @Get('cat/:id')
  getCategory(@Req() request: Request, @Param('id') id: number) {
    return {
      mod: 'lrt - category',
      path: request.url,
      category: id,
    };
  }

  @Get('tema/:tema')
  getTema(@Req() request: Request, @Param('tema') tema: string) {
    return {
      mod: 'lrt - category',
      path: request.url,
      tema: tema,
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

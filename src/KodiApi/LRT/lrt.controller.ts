import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('api/lrt')
export class LrtController {
  @Get()
  getLrtMenu(@Req() request: Request) {
    return {
      mod: 'lrt - menu',
      path: request.url,
    };
  }

  @Get('search')
  getSearch(@Req() request: Request, @Query('search') search: string) {
    return {
      mod: 'lrt',
      path: request.url,
      search: search ?? 'no',
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

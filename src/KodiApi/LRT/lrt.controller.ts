import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { LrtService } from './lrt.service';
import ApiResponse from '../Dto/api-response.dto';

@Controller('api/lrt')
export class LrtController {
  constructor(private readonly lrtService: LrtService) {}

  @Get()
  getLrtMenu(): ApiResponse {
    return this.lrtService.getMainMenu();
  }

  @Get('search')
  getSearch(@Query('search') search: string): Promise<ApiResponse> {
    return this.lrtService.searchCategories(search);
  }

  @Get('cat/:id')
  async getCategory(@Param('id') id: string): Promise<ApiResponse> {
    return this.lrtService.getCategory(id);
  }

  @Get('tema/:topic')
  async getTema(@Param('topic') topic: string): Promise<ApiResponse> {
    return this.lrtService.searchCategories(topic);
  }

  @Get('play/*')
  async getPlay(@Req() request: Request, @Param() params: string[]) {
    const mediaUrl = params[0];

    return this.lrtService.getPlayableItem(mediaUrl);
  }
}

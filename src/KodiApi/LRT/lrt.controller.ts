import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { LrtService } from './lrt.service';
import ApiResponse from '../Dto/api-response.dto';
import { RecentSearchesService } from '../RecentSearches/recent-searches.service';

@Controller('api/lrt')
export class LrtController {
  constructor(
    private readonly lrtService: LrtService,
    private readonly recentSearchesService: RecentSearchesService,
  ) {}

  @Get()
  getLrtMenu(): ApiResponse {
    return this.lrtService.getMainMenu();
  }

  @Get('search')
  getSearch(@Query('search') search: string): Promise<ApiResponse> {
    this.recentSearchesService.addRecentSearch('lrt', search).then();
    return this.lrtService.searchCategories(search);
  }

  @Get('recent')
  getRecent(): Promise<ApiResponse> {
    return this.lrtService.getRecentSearches();
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

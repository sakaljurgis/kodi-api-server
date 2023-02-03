import { Controller, Get, Param, Query } from '@nestjs/common';
import ApiResponse from '../Dto/api-response.dto';
import { TorrentService } from './torrent.service';

@Controller('api/torr')
export class TorrentController {
  constructor(private readonly torrService: TorrentService) {}

  @Get()
  async getMenu(): Promise<ApiResponse> {
    return this.torrService.getMenu();
  }

  @Get('torrs')
  async getTorrents(): Promise<ApiResponse> {
    return this.torrService.getTorrents();
  }

  @Get('torr/:id')
  async getTorrFiles(@Param('id') id: string): Promise<ApiResponse> {
    return this.torrService.getTorrentFiles(id);
  }

  @Get('torrent/:id')
  async getOneTorrentAsList(@Param('id') id: string) {
    return this.torrService.getOneTorrentAsList(id);
  }

  @Get('torrent-context/:id')
  async getOneTorrentAsListFromContextMenu(@Param('id') id: string) {
    return this.torrService.getOneTorrentAsListFromContextMenu(id);
  }

  @Get('search/:provider')
  getSearch(
    @Query('search') query: string,
    @Param('provider') provider: string,
  ) {
    return this.torrService.search(query, provider);
  }

  @Get('recent/:provider')
  getRecent(@Param('provider') provider: string) {
    return this.torrService.getRecentSearches(provider);
  }

  @Get('add/:torrId')
  add(@Param('torrId') torrId: string) {
    return this.torrService.add(torrId);
  }

  @Get('custom-menu/:provider')
  async getCustomMenu(@Param() params: string[]) {
    return this.torrService.getCustomMenu(params['provider'], '');
  }

  @Get('custom-menu/:provider/*')
  async getCustomMenuAction(@Param() params: string[]) {
    return this.torrService.getCustomMenu(params['provider'], params[0]);
  }

  @Get('delete/:id')
  deleteTorrent(@Param('id') id: string) {
    return this.torrService.deleteTorrent(id);
  }

  @Get('resume/:id')
  async resumeTorrent(@Param('id') id: string) {
    return this.torrService.resumeTorrent(id);
  }

  @Get('stop/:id')
  async stopTorrent(@Param('id') id: string) {
    return this.torrService.stopTorrent(id);
  }

  @Get('stop-transmission/:id')
  async stopTransmissionTorrent(@Param('id') id: string) {
    return this.torrService.stopTransmissionTorrent(id);
  }

  @Get('add-transmission/:id')
  async addTransmissionTorrent(@Param('id') id: string) {
    return this.torrService.addTransmissionTorrent(id);
  }
}

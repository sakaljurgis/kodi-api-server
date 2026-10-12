import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { WatchStateService } from './watch-state.service';
import { PlaybackReport } from './Dto/playback-report.dto';
import { PlaybackStateDto } from './Dto/playback-state.dto';

/**
 * Plain JSON for players (not the Kodi menu protocol). Listings carry the
 * same state, see AllFilesService.
 */
@Controller('api/state')
export class WatchStateController {
  constructor(private readonly watchStateService: WatchStateService) {}

  @Get(':fileId')
  async get(@Param('fileId') fileId: string): Promise<PlaybackStateDto> {
    const state = await this.watchStateService.get(parseInt(fileId));
    return PlaybackStateDto.fromEntity(state);
  }

  /**
   * Progress of a playing file, `{position, duration?, event?, client?, at?}`
   * in seconds; event is start | tick | pause | stop | end (default tick).
   * `at` (ms since epoch) only for reports sent late: older than the stored
   * state, they're ignored.
   */
  @Post(':fileId')
  @HttpCode(200)
  async report(
    @Param('fileId') fileId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<PlaybackStateDto> {
    const state = await this.watchStateService.report(
      parseInt(fileId),
      PlaybackReport.fromBody(body),
    );
    return PlaybackStateDto.fromEntity(state);
  }
}

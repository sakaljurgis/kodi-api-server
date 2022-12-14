import { Module } from '@nestjs/common';
import { StreamerFacade } from './streamer.facade';
import { MimeService } from './Mime/mime.service';
import { RequestRangeService } from './RequestRange/request-range.service';
import { StreamerService } from './streamer.service';

@Module({
  imports: [],
  providers: [
    MimeService,
    RequestRangeService,
    StreamerService,
    StreamerFacade,
  ],
  exports: [StreamerFacade],
})
export class StreamerModule {}

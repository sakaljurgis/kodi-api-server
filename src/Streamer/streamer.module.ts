import { Module } from '@nestjs/common';
import { StreamerFacade } from './streamer.facade';
import { MimeService } from './Mime/mime.service';
import { RequestRangeService } from './RequestRange/request-range.service';
import { StreamerService } from './StreamerService/streamer.service';
import { FileStreamerService } from './StreamerService/file-streamer.service';
import { ResponseHeadersService } from './ResponseHeadersService/response-headers.service';
import { ResponseSenderService } from './ResponseSender/response-sender.service';

@Module({
  imports: [],
  providers: [
    MimeService,
    RequestRangeService,
    ResponseHeadersService,
    ResponseSenderService,
    FileStreamerService,
    StreamerService,
    StreamerFacade,
  ],
  exports: [StreamerFacade],
})
export class StreamerModule {}

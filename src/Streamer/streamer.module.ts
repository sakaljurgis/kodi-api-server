import { Module } from '@nestjs/common';
import { StreamerFacade } from './streamer.facade';
import { MimeService } from './Mime/mime.service';
import { RequestRangeService } from './RequestRange/request-range.service';
import { StreamerService } from './StreamerService/streamer.service';
import { ResponseHeadersService } from './ResponseHeadersService/response-headers.service';
import { ResponseSenderService } from './ResponseSender/response-sender.service';
import {
  ReadStreamCreatableProvider,
  ReadStreamCreatableProviders,
} from './ReadStreamProvider/read-stream-creatable.provider';
import { FsReadStreamCreatableProvider } from './ReadStreamProvider/FileSystem/fs-read-stream-creatable.provider';

@Module({
  imports: [],
  providers: [
    MimeService,
    RequestRangeService,
    ResponseHeadersService,
    ResponseSenderService,
    StreamerService,
    StreamerFacade,
    ReadStreamCreatableProvider,
    FsReadStreamCreatableProvider,
    {
      provide: ReadStreamCreatableProviders,
      useFactory: (...providers) => providers,
      inject: [FsReadStreamCreatableProvider],
    },
  ],
  exports: [StreamerFacade],
})
export class StreamerModule {}

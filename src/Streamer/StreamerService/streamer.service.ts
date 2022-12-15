import { ReadStreamCreatable } from '../Interface/read-stream-creatable.interface';
import { RequestRangeService } from '../RequestRange/request-range.service';
import { MimeService } from '../Mime/mime.service';
import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseHeadersService } from '../ResponseHeadersService/response-headers.service';
import { ResponseSenderService } from '../ResponseSender/response-sender.service';
import RequestRangeBytes from '../RequestRange/request-range-bytes.class';

@Injectable()
export class StreamerService {
  constructor(
    private readonly mimeService: MimeService,
    private readonly requestRangeService: RequestRangeService,
    private readonly responseHeadersService: ResponseHeadersService,
    private readonly responseSender: ResponseSenderService,
  ) {}
  stream(
    req: Request,
    res: Response,
    streamCreatable: ReadStreamCreatable,
  ): void {
    const size = streamCreatable.length;
    const requestRange = this.getRange(req, size);

    if (!this.requestRangeService.isRangeSatisfiable(requestRange, size)) {
      return this.handleUnsatisfiable(size, res);
    }

    const responseHeaders = this.responseHeadersService.createResponseHeaders(
      streamCreatable.mimeType,
      size,
      requestRange,
    );

    const status = req.headers.range ? 206 : 200;
    const readable =
      req.method === 'HEAD'
        ? null
        : streamCreatable.createReadStream(requestRange);

    return this.responseSender.send(res, status, responseHeaders, readable);
  }

  private getRange(req: Request, size: number): RequestRangeBytes {
    return this.requestRangeService.getRangeFromHeaders(req, size);
  }

  private handleUnsatisfiable(size: number, res: Response) {
    const responseHeaders = { 'Content-Range': 'bytes */' + size };
    this.responseSender.send(res, 416, responseHeaders, null);

    return;
  }
}

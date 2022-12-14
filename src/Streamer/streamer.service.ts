import { Injectable, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { MimeService } from './Mime/mime.service';
import { RequestRangeService } from './RequestRange/request-range.service';
import { stat } from 'fs/promises';
import { createReadStream, ReadStream, Stats } from 'fs';
import RequestRangeBytes from './RequestRange/request-range-bytes.class';

@Injectable()
export class StreamerService {
  constructor(
    readonly mimeService: MimeService,
    readonly requestRangeService: RequestRangeService,
  ) {}

  async streamFile(
    request: Request,
    response: Response,
    filePath: string,
  ): Promise<void> {
    const stats: Stats | false = await stat(filePath).catch(() => false);
    if (stats === false) {
      throw new NotFoundException('file not found');
    }

    const requestRange = this.requestRangeService.getRangeFromHeaders(
      request,
      stats.size,
    );
    console.log(requestRange, request.method);

    if (!this.isRangeSatisfiable(requestRange, stats.size)) {
      const responseHeaders = { 'Content-Range': 'bytes */' + stats.size };
      this.sendResponse(response, 416, responseHeaders, null);

      return;
    }

    const responseHeaders = this.createResponseHeaders(
      filePath,
      stats.size,
      requestRange,
    );

    if (request.method == 'HEAD') {
      this.sendResponse(
        response,
        request.headers.range ? 206 : 200,
        responseHeaders,
        null,
      );
    } else {
      this.sendResponse(
        response,
        request.headers.range ? 206 : 200,
        responseHeaders,
        createReadStream(filePath, requestRange),
      );
    }
  }

  private createResponseHeaders(
    filePath: string,
    contentSize: number,
    requestRange: RequestRangeBytes | null,
  ): Record<string, string> {
    const responseHeaders = {};
    responseHeaders['Content-Type'] = this.mimeService.getMime(filePath);
    responseHeaders['Accept-Ranges'] = 'bytes';
    responseHeaders['Cache-Control'] = 'no-cache';
    responseHeaders['Content-Length'] = contentSize;

    if (requestRange) {
      responseHeaders[
        'Content-Range'
      ] = `bytes ${requestRange.start}-${requestRange.end}/${contentSize}`;

      responseHeaders['Content-Length'] =
        requestRange.end - requestRange.start + 1;
    }

    return responseHeaders;
  }

  private sendResponse(
    response: Response,
    status: number,
    headers: Record<string, string>,
    readable: ReadStream | null = null,
  ): void {
    response.writeHead(status, headers);
    if (!readable) {
      response.end();
      return;
    }

    readable.pipe(response);
  }

  private isRangeSatisfiable(
    requestRange: RequestRangeBytes,
    fileSize: number,
  ): boolean {
    return (
      requestRange.start < fileSize &&
      requestRange.end < fileSize &&
      requestRange.end >= requestRange.start
    );
  }
}

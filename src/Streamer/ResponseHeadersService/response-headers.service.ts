import RequestRangeBytes from '../RequestRange/request-range-bytes.class';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseHeadersService {
  createResponseHeaders(
    mimeType: string,
    length: number,
    requestRange: RequestRangeBytes | null,
  ): Record<string, string> {
    const responseHeaders = {};
    responseHeaders['Content-Type'] = mimeType;
    responseHeaders['Accept-Ranges'] = 'bytes';
    responseHeaders['Cache-Control'] = 'no-cache';
    responseHeaders['Content-Length'] = length;

    if (requestRange) {
      responseHeaders[
        'Content-Range'
      ] = `bytes ${requestRange.start}-${requestRange.end}/${length}`;

      responseHeaders['Content-Length'] =
        requestRange.end - requestRange.start + 1;
    }

    return responseHeaders;
  }
}

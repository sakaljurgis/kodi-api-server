import { Injectable } from '@nestjs/common';
import RequestRangeBytes from './request-range-bytes.class';
import { Request } from 'express';

@Injectable()
export class RequestRangeService {
  getRangeFromHeaders(request: Request, fileSize: number): RequestRangeBytes {
    const range = request.headers['range'];
    if (!range || range.length === 0) {
      return new RequestRangeBytes(0, fileSize - 1);
    }

    const rangeArray = range.split(/bytes=([0-9]*)-([0-9]*)/);

    const start = parseInt(rangeArray[1]);
    const end = parseInt(rangeArray[2]);

    if (isNaN(start) && isNaN(end)) {
      return new RequestRangeBytes(0, fileSize - 1);
    }

    if (!isNaN(start) && isNaN(end)) {
      return new RequestRangeBytes(start, fileSize - 1);
    }

    if (isNaN(start) && !isNaN(end)) {
      return new RequestRangeBytes(fileSize - end, fileSize - 1);
    }

    return new RequestRangeBytes(start, end);
  }

  isRangeSatisfiable(requestRange: RequestRangeBytes, size: number): boolean {
    return (
      requestRange.start < size &&
      requestRange.end < size &&
      requestRange.end >= requestRange.start
    );
  }
}

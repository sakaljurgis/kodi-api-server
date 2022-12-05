import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import RequestRangeBytes from './request-range-bytes.class';

export const RequestRange = createParamDecorator(
  (data: string, ctx: ExecutionContext): RequestRangeBytes | null => {
    const request = ctx.switchToHttp().getRequest().headers;

    const range = request['range'];
    if (!range) {
      return null;
    }

    const array = range.split(/bytes=([0-9]*)-([0-9]*)/);

    let start = parseInt(array[1]);
    let end = parseInt(array[2]);

    //both isNaN? -> incorrect request header, response with everything we have
    start = isNaN(start) ? null : start; //isNaN? -> only num of end bytes requested
    end = isNaN(end) ? null : end; //isNaN? -> everything from start to the end requested

    return new RequestRangeBytes(start, end);
  },
);

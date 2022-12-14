import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import RequestRangeBytes from './request-range-bytes.class';

export const RequestRange = createParamDecorator(
  (data: string, ctx: ExecutionContext): RequestRangeBytes | null => {
    const headers = ctx.switchToHttp().getRequest().headers;

    if (headers['range']) {
      throw new HttpException('not implemented', 501);
    }

    return new RequestRangeBytes(null, null);
  },
);

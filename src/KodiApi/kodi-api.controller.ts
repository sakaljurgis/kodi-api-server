import { Controller, Get, Req } from '@nestjs/common';
import RequestRangeBytes from 'src/RequestRange/request-range-bytes.class';
import { RequestRange } from 'src/RequestRange/request-range.decorator';
import { Request } from 'express';

@Controller('api')
export class KodiApiController {
  @Get('*')
  getMainMenu(
    @RequestRange() requestedRange: RequestRangeBytes,
    @Req() request: Request,
  ) {
    return {
      range: requestedRange,
      path: request.url,
    };
  }
}

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RequestRange } from './RequestRange/request-range.decorator';
import RequestRangeBytes from './RequestRange/request-range-bytes.class';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get('api')
  getElse(@RequestRange() requestedRange: RequestRangeBytes) {
    return {
      range: requestedRange,
    };
  }

  @Get('*')
  getHello(): string {
    return this.appService.getHello();
  }
}

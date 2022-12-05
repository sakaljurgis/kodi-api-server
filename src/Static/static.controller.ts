import { Controller, Get, Next, Req, Res } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { StaticService } from './static.service';

@Controller('*')
export class StaticController {
  constructor(private readonly staticService: StaticService) {}
  @Get()
  async main(
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    const dirIndexHtml = await this.staticService.provideDirIndex(request.url);
    if (dirIndexHtml === null) {
      return next();
    }

    return response.status(200).send(dirIndexHtml);
  }
}

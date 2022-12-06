import { Controller, Get, Next, Req, Res } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { StaticService } from './static.service';
import IndexView from './View/index.view';

@Controller('*')
export class StaticController {
  constructor(private readonly staticService: StaticService) {}
  @Get()
  async main(
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    const dirIndex = await this.staticService.provideDirIndex(request.url);
    if (dirIndex === null) {
      return next();
    }
    const view = new IndexView();

    return response.status(200).send(view.render(request.url, dirIndex));
  }
}

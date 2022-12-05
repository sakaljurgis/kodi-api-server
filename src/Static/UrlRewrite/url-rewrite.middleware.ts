import { NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import { Request, Response } from 'express';

//we dont care about query params for static response
export class RemoveQueryUrlRewriteMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const urlArray = req.url.split('?');
    req.url = urlArray[0];

    next();
  }
}

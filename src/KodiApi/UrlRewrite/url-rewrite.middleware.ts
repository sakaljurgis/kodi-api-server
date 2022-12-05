import { NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import { Request, Response } from 'express';
import { join } from 'path';

export class KodiApiUrlRewriteMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    let path: string;
    if (req.query && req.query.path) {
      path = req.query.path as string;
    }
    req.url = join('/api/', path);

    next();
  }
}

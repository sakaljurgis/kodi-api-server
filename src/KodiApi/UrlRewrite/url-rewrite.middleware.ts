import { NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import { Request, Response } from 'express';
import { join } from 'path';

export class KodiApiUrlRewriteMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    if (req.query && req.query.path) {
      let path = '';
      path = req.query.path as string;
      const query = req.url.split('?').pop();
      req.url = join('/api/', path) + (query ? '?' + query : '');
    }

    next();
  }
}

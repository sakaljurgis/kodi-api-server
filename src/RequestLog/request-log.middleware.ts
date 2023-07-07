import { NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import { Request, Response } from 'express';
import { appendFile } from 'fs';
import { configService } from '../config/config.service';

export class RequestLogMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const strIP = this.extractIp(req);
    this.log(strIP + ' ' + req.method + ' ' + decodeURI(req.url));
    console.log(decodeURI(req.url));

    next();
  }

  private extractIp(req: Request): string {
    let strIP = 'unk_IP';
    const strRemoteAddress = req.socket.remoteAddress;
    if (strRemoteAddress != undefined) {
      strIP = strRemoteAddress.substring(strRemoteAddress.lastIndexOf(':') + 1);
    }

    //todo - x-forwarded-for
    if (!strIP || strIP === '1') {
      if (req.hostname === 'localhost') {
        strIP = '127.0.0.1';
      } else {
        strIP = 'unk_IP';
      }
    }

    return strIP;
  }

  private log(message: string) {
    const strTime = new Date().toISOString();
    const logFile = configService.getPaths().getStaticRequestsLogPath();
    appendFile(logFile, strTime + ' ' + message + '\n', function (err) {
      if (err) {
        console.log('error logging ' + message);
        console.log(err);
      }
    });
  }
}

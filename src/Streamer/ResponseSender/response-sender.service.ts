import { Response } from 'express';
import { ReadStream } from 'fs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseSenderService {
  send(
    response: Response,
    status: number,
    headers: Record<string, string>,
    readable: ReadStream | null = null,
  ): void {
    response.writeHead(status, headers);
    if (!readable) {
      response.end();
      return;
    }

    readable.pipe(response);
  }
}

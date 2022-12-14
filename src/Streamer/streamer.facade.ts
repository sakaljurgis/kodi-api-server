import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { StreamerService } from './streamer.service';

@Injectable()
export class StreamerFacade {
  constructor(private readonly streamerService: StreamerService) {}

  streamFile(request: Request, response: Response, filePath: string): void {
    this.streamerService.streamFile(request, response, filePath);
  }
}

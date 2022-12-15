import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { FileStreamerService } from './StreamerService/file-streamer.service';

@Injectable()
export class StreamerFacade {
  constructor(private readonly fileStreamerService: FileStreamerService) {}

  async streamFile(
    request: Request,
    response: Response,
    filePath: string,
  ): Promise<void> {
    return this.fileStreamerService.streamFile(request, response, filePath);
  }
}

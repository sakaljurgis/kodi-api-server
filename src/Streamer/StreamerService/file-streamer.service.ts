import { Request, Response } from 'express';
import { Stats } from 'fs';
import { stat } from 'fs/promises';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ReadStreamCreatableFile } from '../Dto/read-stream-creatable-file.dto';
import { StreamerService } from './streamer.service';
import { MimeService } from '../Mime/mime.service';

@Injectable()
export class FileStreamerService {
  constructor(
    private readonly streamerService: StreamerService,
    private readonly mimeService: MimeService,
  ) {}
  async streamFile(
    request: Request,
    response: Response,
    filePath: string,
  ): Promise<void> {
    const stats: Stats | false = await stat(filePath).catch(() => false);
    if (stats === false) {
      //todo - set the file to deleted, since no longer available. Events?
      throw new NotFoundException('file not found');
    }
    const mimeType = this.mimeService.getMime(filePath);
    const streamCreatable = new ReadStreamCreatableFile(
      filePath,
      stats.size,
      mimeType,
    );

    return this.streamerService.stream(request, response, streamCreatable);
  }
}

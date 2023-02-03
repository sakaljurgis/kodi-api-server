import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { FileEntity } from '../Shared/Entity/file.entity';
import { ReadStreamCreatableProvider } from './ReadStreamProvider/read-stream-creatable.provider';
import { StreamerService } from './StreamerService/streamer.service';

@Injectable()
export class StreamerFacade {
  constructor(
    private readonly streamerService: StreamerService,
    private readonly readStreamCreatableProvider: ReadStreamCreatableProvider,
  ) {}

  async streamVideoFile(
    request: Request,
    response: Response,
    fileEntity: FileEntity,
  ): Promise<void> {
    const readStreamCreatable =
      await this.readStreamCreatableProvider.getReadStreamCreatable(fileEntity);

    return this.streamerService.stream(request, response, readStreamCreatable);
  }
}

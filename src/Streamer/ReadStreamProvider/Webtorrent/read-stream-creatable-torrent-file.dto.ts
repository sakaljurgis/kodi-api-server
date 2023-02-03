import { ReadStream } from 'fs';
import { ReadStreamOptions } from '../../Interface/read-stream-options.interface';
import { ReadStreamCreatable } from '../../Interface/read-stream-creatable.interface';
import { Injectable } from '@nestjs/common';
import { TorrentFile } from 'webtorrent';

@Injectable()
export class ReadStreamCreatableTorrentFile implements ReadStreamCreatable {
  constructor(
    private readonly torrentFile: TorrentFile,
    readonly length: number,
    readonly mimeType: string,
  ) {
    this.torrentFile = torrentFile;
    this.length = length;
    this.mimeType = mimeType;
  }

  createReadStream(options: ReadStreamOptions): ReadStream {
    return this.torrentFile.createReadStream(
      options as { start: number; end: number },
    ) as ReadStream;
  }
}

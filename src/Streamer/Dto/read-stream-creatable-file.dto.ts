import { ReadStreamCreatable } from '../Interface/read-stream-creatable.interface';
import { createReadStream, ReadStream } from 'fs';
import { ReadStreamOptions } from '../Interface/read-stream-options.interface';

export class ReadStreamCreatableFile implements ReadStreamCreatable {
  constructor(
    private readonly path: string,
    readonly length: number,
    readonly mimeType: string,
  ) {
    this.path = path;
    this.length = length;
    this.mimeType = mimeType;
  }

  createReadStream(options: ReadStreamOptions): ReadStream {
    return createReadStream(this.path, options);
  }
}

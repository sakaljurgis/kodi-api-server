import { ReadStream } from 'fs';
import { ReadStreamOptions } from './read-stream-options.interface';

export interface ReadStreamCreatable {
  readonly mimeType: string;
  readonly length: number;
  createReadStream(options: ReadStreamOptions): ReadStream;
}

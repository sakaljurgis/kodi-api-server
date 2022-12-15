import { ReadStreamOptions } from '../Interface/read-stream-options.interface';

export default class RequestRangeBytes implements ReadStreamOptions {
  readonly start: number;
  readonly end: number;

  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }
}

export default class RequestRangeBytes {
  readonly end: number;
  readonly start: number;

  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }
}

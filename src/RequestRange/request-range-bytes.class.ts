export default class RequestRangeBytes {
  readonly end: number | null;
  readonly start: number | null;

  constructor(start: number | null, end: number | null) {
    this.start = start;
    this.end = end;
  }
}

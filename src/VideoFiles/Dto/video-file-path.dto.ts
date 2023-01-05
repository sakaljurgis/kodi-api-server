export class VideoFilePathDto {
  constructor(readonly path: string, readonly relativePath: string) {
    this.path = path;
    this.relativePath = relativePath;
  }
}

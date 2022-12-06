export default class FileDto {
  constructor(
    readonly name: string,
    readonly size: number,
    readonly date: Date,
    readonly isDirectory: boolean,
  ) {
    this.name = name;
    this.size = size;
    this.date = date;
    this.isDirectory = isDirectory;
  }
}

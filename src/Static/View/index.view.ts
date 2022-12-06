import FileDto from '../Dto/file.dto';

export default class IndexView {
  public render(relPath: string, files: Array<FileDto>): string {
    return this.buildHtml(relPath, files);
  }

  private buildHtml(relPath: string, files: Array<FileDto>): string {
    const longestFileLength = this.getLongestFileLength(files);

    let result: string;
    const resultHtmlStart = `
    <html lang="en">
        <head><title>Index of ${relPath} </title></head>
        <body>
          <h1>Index of ${relPath}</h1>
          <hr><pre>`;

    result = `<a href="../">../</a>`;

    for (const file of files) {
      result += this.getFileLink(file, longestFileLength);
    }

    const resultHtmlEnd = `</pre><hr></body></html>`;

    return resultHtmlStart + result + resultHtmlEnd;
  }

  private getFileLink(file: FileDto, longestFileLength: number) {
    const arrDate: Array<string> = file.date.toUTCString().split(' ');
    const strDate: string =
      ' '.repeat(longestFileLength - file.name.length) +
      `${arrDate[1]}-${arrDate[2]}-${arrDate[3]} ${arrDate[4]}`;

    if (file.isDirectory) {
      const strSize = ' '.repeat(19) + '-';
      return (
        '\n' + `<a href="${file.name}/">${file.name}/</a>${strDate + strSize}`
      );
    }
    let strSize = file.size.toString();
    strSize = ' '.repeat(20 - strSize.length) + strSize;

    return (
      '\n' + `<a href="${file.name}">${file.name}</a> ${strDate + strSize}`
    );
  }

  private getLongestFileLength(files: Array<FileDto>) {
    let longestFileLength = 0;
    for (const file of files) {
      longestFileLength =
        longestFileLength < file.name.length
          ? file.name.length
          : longestFileLength;
    }
    longestFileLength += 10;
    return longestFileLength;
  }
}

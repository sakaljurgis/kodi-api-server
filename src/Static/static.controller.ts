import {
  Controller,
  Get,
  Next,
  NotFoundException,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { Stats } from 'fs';

@Controller('*')
export class StaticController {
  @Get()
  async main(
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    //todo - refactor to use service
    const relPath = request.url;
    //relPath = relPath.split('%2E').join('.');
    //relPath = relPath.split('%2e').join('.');

    if (relPath.indexOf('..') > -1) {
      throw new UnauthorizedException(
        'You are not authorized to visit ' + request.url,
      );
    }

    const path = join(__dirname, process.env.STATIC_SERVE_FOLDER, relPath);

    const stats: Stats | false = await stat(path).catch(() => false);

    if (stats === false) {
      throw new NotFoundException('Path not found: ' + relPath);
    }

    if (!stats.isDirectory()) {
      return next();
    }

    response.status(200).send(await readDirectory(path, relPath));

    return;
  }
}

//todo - move this to service
async function readDirectory(path: string, relPath: string) {
  let files = await readdir(path);
  let longestFileLength = 0;

  files = files.filter((fileName: string) => {
    const fileIncluded = fileName[0] !== '.';
    longestFileLength =
      fileIncluded && longestFileLength < fileName.length
        ? fileName.length
        : longestFileLength;

    return fileIncluded;
  });

  longestFileLength += 10;

  let result: string;
  const resultHtmlStart = `
    <html lang="en">
        <head><title>Index of ${relPath} </title></head>
        <body>
          <h1>Index of ${relPath}</h1>
          <hr><pre>`;

  result = `<a href="../">../</a>`;

  for (const file of files) {
    const stats: Stats | false = await stat(join(path, file)).catch(
      () => false,
    );

    if (stats === false) {
      continue;
    }
    const arrDate: Array<string> = stats.birthtime.toUTCString().split(' ');
    const strDate: string =
      ' '.repeat(longestFileLength - file.length) +
      `${arrDate[1]}-${arrDate[2]}-${arrDate[3]} ${arrDate[4]}`;

    if (stats.isDirectory()) {
      const strSize = ' '.repeat(19) + '-';
      result += '\n' + `<a href="${file}/">${file}/</a>${strDate + strSize}`;
      continue;
    }
    let strSize = stats.size.toString();
    strSize = ' '.repeat(20 - strSize.length) + strSize;

    result += '\n' + `<a href="${file}">${file}</a> ${strDate + strSize}`;
  }

  const resultHtmlEnd = `</pre><hr></body></html>`;

  return resultHtmlStart + result + resultHtmlEnd;
}

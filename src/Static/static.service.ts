import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { readdir, stat } from 'fs/promises';
import { Stats } from 'fs';
import { join } from 'path';
import FileDto from './Dto/file.dto';
import { configService } from '../config/config.service';

@Injectable()
export class StaticService {
  async provideDirIndex(relPath: string): Promise<Array<FileDto>> {
    if (relPath.indexOf('..') > -1) {
      throw new UnauthorizedException(
        'You are not authorized to visit ' + relPath,
      );
    }

    const path = join(configService.getPaths().getStaticFolder(), relPath);

    const stats: Stats | false = await stat(path).catch(() => false);

    if (stats === false) {
      throw new NotFoundException('Path not found: ' + relPath);
    }

    if (!stats.isDirectory()) {
      return null;
    }

    return this.readDirectory(path);
  }

  private async readDirectory(path: string): Promise<Array<FileDto>> {
    let files = await readdir(path);

    files = files.filter((fileName: string) => {
      return fileName[0] !== '.';
    });

    const filesDtos: Array<FileDto> = [];
    for (const file of files) {
      const stats: Stats | false = await stat(join(path, file)).catch(
        () => false,
      );

      if (stats === false) {
        continue;
      }
      const fileDto = new FileDto(
        file,
        stats.size,
        stats.birthtime,
        stats.isDirectory(),
      );

      filesDtos.push(fileDto);
    }

    return filesDtos;
  }
}

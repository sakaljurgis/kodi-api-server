import { Injectable } from '@nestjs/common';
import { configService } from '../../../config/config.service';
import { VideoFilesConfig } from '../../../config/video-files.config';
import { spawn } from 'child_process';

@Injectable()
export class VideoFilesScannerService {
  private readonly config: VideoFilesConfig;

  constructor() {
    this.config = configService.getVideoFilesConfig();
  }

  public async scanFsForVideoFiles(): Promise<
    [paths: string[], pathToRelPath: Record<string, string>]
  > {
    let filesInFs = [];
    let pathToRelPath = {}; //needed for title/season parsing
    for (const videoFilesFolder of this.config.getVideoFilesFolders()) {
      const [paths, relPaths] = await this.scanFolderForVideoFiles(
        videoFilesFolder,
      ).catch(() => [[], {}]);
      filesInFs = filesInFs.concat(paths);
      pathToRelPath = Object.assign(pathToRelPath, relPaths);
    }

    return [filesInFs, pathToRelPath];
  }

  private scanFolderForVideoFiles(
    path: string,
  ): Promise<[paths: string[], pathToRelPath: Record<string, string>]> {
    return new Promise((resolve, reject) => {
      if (path.slice(-1) !== '/') {
        path += '/';
      }

      const findOptions = [path, '-name'].concat(
        ('*' + this.config.getVideoFilesExt().join(' -o -name *')).split(' '),
      );

      const objCommand = spawn('find', findOptions);

      let strList = '';

      objCommand.stdout.on('data', (data) => {
        strList = strList + data;
      });

      objCommand.stderr.on('data', (data) => {
        reject(`stderr: ${data}`);
      });

      objCommand.on('close', (code) => {
        if (code !== 0) {
          reject(`rejected ${code}`);
          return;
        }
        const arrList = strList.split('\n').filter((item) => item);
        const objList = {};
        for (const filePath of arrList) {
          objList[filePath] = filePath.replace(path, '');
        }

        resolve([arrList, objList]);
      });
    });
  }
}

import { Injectable } from '@nestjs/common';
import { VideoFilesScannerService } from './video-files-scanner.service';
import { VideoFilePathDto } from '../Dto/video-file-path.dto';
import { VideoFilesUpdateRepository } from './video-files-update.repository';
import { VideoFilesSavingService } from './video-files-saving.service';

@Injectable()
export class VideoFilesUpdateService {
  constructor(
    private readonly scanner: VideoFilesScannerService,
    private readonly repository: VideoFilesUpdateRepository,
    private readonly savingService: VideoFilesSavingService,
  ) {}

  async updateFsVideoFiles() {
    const [filesInFs, filesToRelativePaths] = await this.scanner.scanNewFiles();

    await this.repository.markRemovedFilesAsDeleted(filesInFs);

    const filesInDb = await this.repository.getMatchingPaths(filesInFs);

    const filesToAddToDb = filesInFs.filter(
      (filePath) => !filesInDb.includes(filePath),
    );

    const newFiles = [];

    for (const fileToAddToDb of filesToAddToDb) {
      if (this.checkPathToIgnore(fileToAddToDb)) {
        continue;
      }
      newFiles.push(
        new VideoFilePathDto(
          fileToAddToDb,
          filesToRelativePaths[fileToAddToDb],
        ),
      );
    }

    await this.savingService.saveFiles(newFiles);

    return newFiles;
  }

  private checkPathToIgnore(filePath: string): boolean {
    //todo - move to separate provider, include in settings
    return filePath.indexOf('AOE1') > -1;
  }
}

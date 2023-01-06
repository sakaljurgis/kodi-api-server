import { Injectable } from '@nestjs/common';
import { VideoFilesScannerService } from './Scanner/video-files-scanner.service';
import { VideoFilesUpdateRepository } from './video-files-update.repository';
import { FileEntityExpander } from './Expander/file-entity.expander';
import { FileEntity } from '../Entity/file.entity';
import { StreamProviderEnum } from '../../Streamer/ReadStreamProvider/stream-provider.enum';

@Injectable()
export class VideoFilesUpdateService {
  constructor(
    private readonly scanner: VideoFilesScannerService,
    private readonly repository: VideoFilesUpdateRepository,
    private readonly expander: FileEntityExpander,
  ) {}

  async updateFsVideoFiles(): Promise<void> {
    const [filesInFs, filesToRelativePaths] = await this.scanner.scanNewFiles();

    await this.repository.markRemovedFilesAsDeleted(filesInFs);

    const filesInDb = await this.repository.getMatchingPaths(filesInFs);
    const filesToAddToDb = filesInFs.filter(
      (filePath) => !filesInDb.includes(filePath),
    );

    const entitiesToSave = [];

    for (const fileToAddToDb of filesToAddToDb) {
      if (this.checkPathToIgnore(fileToAddToDb)) {
        continue;
      }

      const fileEntity = await this.buildFileEntity(
        fileToAddToDb,
        filesToRelativePaths[fileToAddToDb],
      );

      entitiesToSave.push(fileEntity);
    }

    await this.repository.saveFiles(entitiesToSave);
  }

  private checkPathToIgnore(filePath: string): boolean {
    //todo - move to separate provider, include in settings
    return filePath.indexOf('AOE1') > -1;
  }

  private async buildFileEntity(
    path: string,
    relativePath: string,
  ): Promise<FileEntity> {
    const fileEntity = await this.repository.findOrCreateFile(path, false);
    fileEntity.relativePath = relativePath;
    fileEntity.streamProvider = StreamProviderEnum.fs;

    return await this.expander.expand(fileEntity);
  }
}

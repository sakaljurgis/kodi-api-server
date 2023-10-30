import { Injectable } from '@nestjs/common';
import { VideoFilesScannerService } from './Scanner/video-files-scanner.service';
import { VideoFilesUpdateRepository } from './video-files-update.repository';
import { FileEntityExpander } from './Expander/file-entity.expander';
import { FileEntity } from '../../Shared/Entity/file.entity';
import { StreamProviderEnum } from '../../Shared/Enum/stream-provider.enum';
import { configService } from '../../config/config.service';
import { VideoFilesConfig } from '../../config/video-files.config';

@Injectable()
export class VideoFilesUpdateService {
  private readonly config: VideoFilesConfig =
    configService.getVideoFilesConfig();

  constructor(
    private readonly scanner: VideoFilesScannerService,
    private readonly repository: VideoFilesUpdateRepository,
    private readonly expander: FileEntityExpander,
  ) {}

  /**
   * Scan for new files and remove deleted.
   * Refresh is used to force a refresh of all files
   *   i.e. existing files db will be parsed on new rules (e.g. new aliases)
   * @param refresh
   */
  async updateFsVideoFiles(refresh = false): Promise<void> {
    const [filesInFs, filesToRelativePaths] =
      await this.scanner.scanFsForVideoFiles();

    await this.repository.markRemovedFilesAsDeleted(filesInFs);

    let filesToAddToDb: string[] = filesInFs;

    if (!refresh) {
      const filesInDb = await this.repository.getMatchingPaths(filesInFs);
      filesToAddToDb = filesInFs.filter(
        (filePath) =>
          !filesInDb.includes(filePath) && !this.isPathToIgnore(filePath),
      );
    }
    const entitiesToSave = [];

    for (const fileToAddToDb of filesToAddToDb) {
      const fileEntity = await this.repository.findOrCreateFile(
        fileToAddToDb,
        false,
      );

      //check if download is complete
      //todo - figure out if this makes sense
      if (
        fileEntity.streamProvider === StreamProviderEnum.wt &&
        fileEntity.torrent &&
        fileEntity.torrent.stopped === false
      ) {
        continue;
      }
      fileEntity.relativePath = filesToRelativePaths[fileToAddToDb];
      fileEntity.streamProvider = StreamProviderEnum.fs;

      await this.expander.expand(fileEntity);

      entitiesToSave.push(fileEntity);
    }

    await this.repository.saveFiles(entitiesToSave);
  }

  private isPathToIgnore(filePath: string): boolean {
    for (const pathPattern of this.config.getPathPatternsToIgnore()) {
      if (filePath.indexOf(pathPattern) > -1) {
        return true;
      }
    }

    return false;
  }

  async updateEntitiesByPath(filePaths: string[]) {
    const fileEntitiesToUpdate = [];
    const fileEntities = await this.repository.findFilesByPaths(filePaths);

    for (const fileEntity of fileEntities) {
      if (!fileEntity.relativePath) {
        continue;
      }

      if (
        fileEntity.streamProvider === StreamProviderEnum.wt &&
        fileEntity.torrent &&
        fileEntity.torrent.stopped === false
      ) {
        continue;
      }
      fileEntity.streamProvider = StreamProviderEnum.fs;

      await this.expander.expand(fileEntity);
      fileEntitiesToUpdate.push(fileEntity);
    }

    await this.repository.saveFiles(fileEntitiesToUpdate);
  }

  public async buildAndSaveEntitiesFromPartial(
    partialFileEntities: Partial<FileEntity>[],
  ): Promise<FileEntity[]> {
    const entitiesToSave: FileEntity[] = [];
    for (const partialFileEntity of partialFileEntities) {
      let fileEntity = await this.repository.findOrCreateFile(
        partialFileEntity.path,
        false,
      );

      fileEntity = { ...fileEntity, ...partialFileEntity };

      await this.expander.expand(fileEntity);
      entitiesToSave.push(fileEntity);
    }

    await this.repository.saveFiles(entitiesToSave);

    return this.repository.findFilesByPaths(
      entitiesToSave.map((fileEntity) => {
        return fileEntity.path;
      }),
    );
  }
}

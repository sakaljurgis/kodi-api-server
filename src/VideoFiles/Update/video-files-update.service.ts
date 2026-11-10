import { Injectable } from '@nestjs/common';
import { VideoFilesScannerService } from './Scanner/video-files-scanner.service';
import { VideoFilesUpdateRepository } from './video-files-update.repository';
import { FileEntityExpander } from './Expander/file-entity.expander';
import { FileEntity } from '../../Shared/Entity/file.entity';
import { StreamProviderEnum } from '../../Shared/Enum/stream-provider.enum';
import { configService } from '../../config/config.service';
import { VideoFilesConfig } from '../../config/video-files.config';
import { FileEntityTitleInfoExpander } from './Expander/file-entity-title-info.expander';
import { getReleaseFolder, isSample } from '../../Shared/Util/file-order';

@Injectable()
export class VideoFilesUpdateService {
  private readonly config: VideoFilesConfig =
    configService.getVideoFilesConfig();

  constructor(
    private readonly scanner: VideoFilesScannerService,
    private readonly repository: VideoFilesUpdateRepository,
    private readonly expander: FileEntityExpander,
    private readonly titleInfoExpander: FileEntityTitleInfoExpander,
  ) {}

  /** scans and title re-parses run one at a time */
  private queue: Promise<unknown> = Promise.resolve();

  /**
   * Scan for new files and remove deleted.
   * Refresh is used to force a refresh of all files
   *   i.e. existing files db will be parsed on new rules (e.g. new title rules)
   * @param refresh
   */
  updateFsVideoFiles(refresh = false): Promise<void> {
    return this.oneAtATime(() => this.scanAndUpdate(refresh));
  }

  private async scanAndUpdate(refresh: boolean): Promise<void> {
    console.log(
      `file scan and update started - ${refresh ? 'full update' : 'only new'}`,
    );
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

    await this.attachSamplesToReleases(entitiesToSave);
    await this.repository.saveFiles(entitiesToSave);
    console.log(
      `file scan and update complete - ${refresh ? 'full update' : 'only new'}`,
    );
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

    await this.attachSamplesToReleases(fileEntitiesToUpdate);
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

    await this.attachSamplesToReleases(entitiesToSave);
    await this.repository.saveFiles(entitiesToSave);

    return this.repository.findFilesByPaths(
      entitiesToSave.map((fileEntity) => {
        return fileEntity.path;
      }),
    );
  }

  /**
   * Title and season of every file again (no re-scan), e.g. after the title
   * rules changed. Returns how many files got another title or season.
   */
  reparseTitles(): Promise<number> {
    return this.oneAtATime(async () => {
      const fileEntities = await this.repository.findActiveFiles();
      const titleKey = (fileEntity: FileEntity) =>
        `${fileEntity.title?.id}|${fileEntity.season ?? null}`;
      const before = new Map(
        fileEntities.map((fileEntity) => [
          fileEntity.id,
          {
            title: titleKey(fileEntity),
            info: fileEntity.info + fileEntity.infos,
          },
        ]),
      );

      for (const fileEntity of fileEntities) {
        await this.titleInfoExpander.expand(fileEntity);
      }
      await this.attachSamplesToReleases(fileEntities);

      const changed = new Set(
        fileEntities.filter(
          (fileEntity) =>
            before.get(fileEntity.id).title !== titleKey(fileEntity),
        ),
      );
      await this.repository.saveTitleInfo(
        fileEntities.filter(
          (fileEntity) =>
            changed.has(fileEntity) ||
            before.get(fileEntity.id).info !==
              fileEntity.info + fileEntity.infos,
        ),
      );

      return changed.size;
    });
  }

  /**
   * A sample gets the title of its release (a show's sample isn't a movie of
   * its own), and its season if it has none: of a file saved with it, else of
   * one in the db.
   */
  private async attachSamplesToReleases(
    fileEntities: FileEntity[],
  ): Promise<void> {
    for (const sample of fileEntities.filter((file) => isSample(file))) {
      const folder = getReleaseFolder(sample.relativePath);
      if (!folder) {
        continue;
      }

      const releaseFile =
        fileEntities
          .filter(
            (file) =>
              file.title &&
              !isSample(file) &&
              getReleaseFolder(file.relativePath) === folder,
          )
          .sort((a, b) => (a.season ?? 0) - (b.season ?? 0))[0] ??
        (await this.repository.findReleaseFile(folder));

      if (releaseFile?.title) {
        sample.title = releaseFile.title;
        sample.titleId = releaseFile.title.id;
        sample.season = sample.season ?? releaseFile.season ?? null;
      }
    }
  }

  private oneAtATime<T>(job: () => Promise<T>): Promise<T> {
    const run = this.queue.then(job, job);
    this.queue = run.catch(() => undefined);

    return run;
  }
}

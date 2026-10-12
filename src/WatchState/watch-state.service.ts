import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WatchStateEntity } from '../Shared/Entity/watch-state.entity';
import { FileEntity } from '../Shared/Entity/file.entity';
import { TitleTypeEnum } from '../Shared/Enum/title-type.enum';
import {
  compareFiles,
  getEpisodeKey,
  isSample,
} from '../Shared/Util/file-order';
import { PlaybackReport } from './Dto/playback-report.dto';

/** share of the duration after which a file counts as watched (Kodi's default) */
const WATCHED_RATIO = 0.9;
/** earlier positions don't move the resume point, so a quick open/close keeps it */
const MIN_POSITION = 10;

export type WatchStates = Map<number, WatchStateEntity>;

/**
 * Watched state and resume points of files, the one source of truth for all
 * clients: players report progress, listings show it.
 */
@Injectable()
export class WatchStateService {
  constructor(
    @InjectRepository(WatchStateEntity)
    private readonly watchStateRepository: Repository<WatchStateEntity>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {}

  /** by file id; there are rows only for files that were played or marked */
  async getAll(): Promise<WatchStates> {
    const states = await this.watchStateRepository.find();
    return new Map(states.map((state) => [state.fileId, state]));
  }

  async get(fileId: number): Promise<WatchStateEntity> {
    await this.getFile(fileId);
    return (
      (await this.watchStateRepository.findOneBy({ fileId })) ??
      this.create(fileId)
    );
  }

  async report(
    fileId: number,
    report: PlaybackReport,
  ): Promise<WatchStateEntity> {
    const fileEntity = await this.getFile(fileId);
    const existing = await this.watchStateRepository.findOneBy({ fileId });
    if (existing && report.at !== null && report.at < existing.updatedAt) {
      // a late resend; something newer is already in
      return existing;
    }

    const state = existing ?? this.create(fileId);
    const duration = report.duration ?? state.duration ?? fileEntity.duration;

    if (
      report.event === 'end' ||
      (duration > 0 && report.position >= duration * WATCHED_RATIO)
    ) {
      // the end credits keep reporting, but it's one play-through
      if (!state.watched || state.position > 0) {
        state.playCount++;
      }
      state.watched = true;
      state.position = 0;
    } else if (report.position >= MIN_POSITION) {
      state.position = report.position;
    }

    if (duration > 0) {
      state.duration = duration;
    }
    state.lastPlayed = Math.min(report.at ?? Date.now(), Date.now());
    state.updatedAt = state.lastPlayed;
    state.client = report.client;
    state.hidden = false;

    return this.watchStateRepository.save(state);
  }

  /**
   * Also clears resume points. Marked watched counts as played (Continue
   * watching moves on to the next episode), unwatched as never played.
   */
  async setWatched(fileIds: number[], watched: boolean): Promise<void> {
    const existing = await this.watchStateRepository.findBy({
      fileId: In(fileIds),
    });
    const byId = new Map(existing.map((state) => [state.fileId, state]));
    const now = Date.now();

    const states = fileIds.map((fileId) => {
      const state = byId.get(fileId) ?? this.create(fileId);
      state.watched = watched;
      state.playCount = watched ? Math.max(state.playCount, 1) : 0;
      state.position = 0;
      state.hidden = false;
      state.updatedAt = now;
      state.lastPlayed = watched ? now : null;
      return state;
    });

    await this.watchStateRepository.save(states);
  }

  /** leave out of Continue watching until it's played again */
  async hide(fileId: number): Promise<void> {
    await this.getFile(fileId);
    const state =
      (await this.watchStateRepository.findOneBy({ fileId })) ??
      this.create(fileId);
    state.hidden = true;
    state.updatedAt = Date.now();

    await this.watchStateRepository.save(state);
  }

  /** episodes (releases of the same episode count once), samples left out */
  countWatched(
    fileEntities: FileEntity[],
    states: WatchStates,
  ): { watched: number; total: number } {
    const episodes = new Map<string, boolean>();
    for (const fileEntity of fileEntities) {
      if (isSample(fileEntity)) {
        continue;
      }
      const key = getEpisodeKey(fileEntity);
      episodes.set(
        key,
        episodes.get(key) || !!states.get(fileEntity.id)?.watched,
      );
    }

    let watched = 0;
    episodes.forEach((isWatched) => (watched += isWatched ? 1 : 0));

    return { watched, total: episodes.size };
  }

  /**
   * What to watch next, one file per title, latest activity first: the title's
   * last played file while it's unfinished, or for shows the next unwatched
   * episode after it. Finished movies and shows are left out, and so are files
   * hidden from Continue watching.
   * Files come with their title and torrent.
   */
  async getContinueWatching(
    states: WatchStates,
    limit = 20,
  ): Promise<FileEntity[]> {
    const fileEntities = await this.fileRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.title', 'title')
      .leftJoinAndSelect('file.torrent', 'torrent')
      .where('file.deleted = :deleted', { deleted: false })
      .andWhere(
        `file.title_id IN (
          SELECT f.title_id FROM files f
          INNER JOIN watch_state s ON s.file_id = f.id
          WHERE s.last_played IS NOT NULL
        )`,
      )
      .getMany();

    const byTitle = new Map<number, FileEntity[]>();
    for (const fileEntity of fileEntities) {
      const titleFiles = byTitle.get(fileEntity.titleId) ?? [];
      titleFiles.push(fileEntity);
      byTitle.set(fileEntity.titleId, titleFiles);
    }

    const lastPlayed = (fileEntity: FileEntity) =>
      states.get(fileEntity.id)?.lastPlayed ?? 0;
    const found: FileEntity[] = [];
    const activity = new Map<FileEntity, number>();

    byTitle.forEach((titleFiles) => {
      titleFiles.sort(compareFiles);
      // the later episode wins a tie, e.g. a whole season marked watched
      const last = titleFiles.reduce((latest, fileEntity) =>
        lastPlayed(fileEntity) >= lastPlayed(latest) ? fileEntity : latest,
      );
      if (lastPlayed(last) === 0) {
        return;
      }

      let next: FileEntity | null = last;
      if (states.get(last.id).watched) {
        next =
          last.title.type === TitleTypeEnum.show
            ? this.findNextEpisode(titleFiles, last, states)
            : null;
      }

      if (next && !states.get(next.id)?.hidden) {
        found.push(next);
        activity.set(next, lastPlayed(last));
      }
    });

    return found
      .sort((a, b) => activity.get(b) - activity.get(a))
      .slice(0, limit);
  }

  /** the first unwatched episode after [after]; [sortedFiles] are the title's files in order */
  private findNextEpisode(
    sortedFiles: FileEntity[],
    after: FileEntity,
    states: WatchStates,
  ): FileEntity | null {
    const episodes = new Map<string, FileEntity[]>();
    for (const fileEntity of sortedFiles) {
      if (isSample(fileEntity)) {
        continue;
      }
      const key = getEpisodeKey(fileEntity);
      episodes.set(key, [...(episodes.get(key) ?? []), fileEntity]);
    }

    const keys = [...episodes.keys()];
    const index = keys.indexOf(getEpisodeKey(after));
    if (index === -1) {
      return null;
    }

    for (const key of keys.slice(index + 1)) {
      const releases = episodes.get(key);
      if (releases.some((fileEntity) => states.get(fileEntity.id)?.watched)) {
        continue;
      }
      // the release that was started, else the biggest one
      return (
        releases.find(
          (fileEntity) => states.get(fileEntity.id)?.position > 0,
        ) ?? releases.reduce((a, b) => (b.size > a.size ? b : a))
      );
    }

    return null;
  }

  private async getFile(fileId: number): Promise<FileEntity> {
    const fileEntity = isNaN(fileId)
      ? null
      : await this.fileRepository.findOneBy({ id: fileId });
    if (fileEntity === null) {
      throw new NotFoundException(`id #${fileId} not found`);
    }

    return fileEntity;
  }

  private create(fileId: number): WatchStateEntity {
    const state = new WatchStateEntity();
    state.fileId = fileId;
    state.position = 0;
    state.duration = null;
    state.watched = false;
    state.playCount = 0;
    state.lastPlayed = null;
    state.updatedAt = Date.now();
    state.client = null;
    state.hidden = false;

    return state;
  }
}

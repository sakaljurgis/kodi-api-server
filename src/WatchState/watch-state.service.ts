import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WatchStateEntity } from '../Shared/Entity/watch-state.entity';
import { FileEntity } from '../Shared/Entity/file.entity';
import { TitleTypeEnum } from '../Shared/Enum/title-type.enum';
import {
  compareFiles,
  getEpisode,
  getEpisodeKey,
  getReleaseFolder,
  isSample,
} from '../Shared/Util/file-order';
import { PlaybackReport } from './Dto/playback-report.dto';

/** share of the duration after which a file counts as watched (Kodi's default) */
const WATCHED_RATIO = 0.9;
/** earlier positions don't move the resume point, so a quick open/close keeps it */
const MIN_POSITION = 10;
/** Continue watching only goes this far back, older activity doesn't crowd it */
const CONTINUE_WATCHING_MONTHS = 3;
/**
 * Episodes played in order, each within this of the one before, are one run
 * (watching or rewatching a show); a longer gap starts a new one.
 */
const RUN_GAP_MS = 7 * 24 * 60 * 60 * 1000;

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
   * last played file while it's unfinished or has a resume point (a rewatch
   * stopped halfway), or for shows the next episode after it that wasn't played
   * in this run (see findNextEpisode). Only titles played in the last CONTINUE_WATCHING_MONTHS;
   * finished movies and shows are left out, and so are files hidden from
   * Continue watching.
   * Files come with their title (and its live files) and torrent.
   */
  async getContinueWatching(
    states: WatchStates,
    limit = 20,
  ): Promise<FileEntity[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - CONTINUE_WATCHING_MONTHS);

    const fileEntities = await this.fileRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.title', 'title')
      .leftJoinAndSelect('file.torrent', 'torrent')
      .where('file.deleted = :deleted', { deleted: false })
      .andWhere(
        `file.title_id IN (
          SELECT f.title_id FROM files f
          INNER JOIN watch_state s ON s.file_id = f.id
          WHERE s.last_played >= :since
        )`,
        { since: since.getTime() },
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
      // (the recent activity may have been on a file deleted since)
      if (lastPlayed(last) < since.getTime()) {
        return;
      }

      let next: FileEntity | null = last;
      const lastState = states.get(last.id);
      if (lastState.watched && !(lastState.position > 0)) {
        next =
          last.title.type === TitleTypeEnum.show
            ? this.findNextEpisode(titleFiles, last, states)
            : null;
      }

      if (next && !states.get(next.id)?.hidden) {
        next.title.files = titleFiles;
        found.push(next);
        activity.set(next, lastPlayed(last));
      }
    });

    return found
      .sort((a, b) => activity.get(b) - activity.get(a))
      .slice(0, limit);
  }

  /**
   * The first episode after [after] (just finished) that's still to watch.
   * After a first watch of [after] (play count 1): the next unwatched episode,
   * also when watching out of order. After a rewatch of it (play count 2+):
   * the next episode that wasn't played in this run. The run goes back from
   * [after] over the episodes before it while each was played before the next
   * one and within RUN_GAP_MS of it. So a rewatch goes on to the next episode
   * (last played before the rewatch started), and replaying an episode of this
   * week's run doesn't go back over the ones played after it.
   * [sortedFiles] are the title's files in order.
   */
  private findNextEpisode(
    sortedFiles: FileEntity[],
    after: FileEntity,
    states: WatchStates,
  ): FileEntity | null {
    // after an episode the next episode, after a special (season 0) the next
    // numbered special; extras without a number are never "next"
    const inSpecials = after.season === 0;
    const episodes = new Map<string, FileEntity[]>();
    for (const fileEntity of sortedFiles) {
      if (
        isSample(fileEntity) ||
        (fileEntity.season === 0) !== inSpecials ||
        (inSpecials && getEpisode(fileEntity) === undefined)
      ) {
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

    // an episode's releases count as one: when any of them was last played
    const played = (key: string) =>
      Math.max(
        0,
        ...episodes
          .get(key)
          .map((fileEntity) => states.get(fileEntity.id)?.lastPlayed ?? 0),
      );
    let start = index;
    while (start > 0) {
      const previous = played(keys[start - 1]);
      const current = played(keys[start]);
      if (!previous || previous > current || current - previous > RUN_GAP_MS) {
        break;
      }
      start--;
    }
    const runStart = played(keys[start]);
    const isRewatch = (states.get(after.id)?.playCount ?? 0) > 1;

    for (const key of keys.slice(index + 1)) {
      const releases = episodes.get(key);
      // first watch: any watched release; rewatch: played in this run,
      // watched, and not stopped halfway again (no resume point)
      const watched = releases.some(
        (fileEntity) => states.get(fileEntity.id)?.watched,
      );
      const done = isRewatch
        ? played(key) >= runStart &&
          watched &&
          !releases.some(
            (fileEntity) => states.get(fileEntity.id)?.position > 0,
          )
        : watched;
      if (done) {
        continue;
      }
      // the release that was started, else the one watched so far, else the biggest
      const release = getReleaseFolder(after.relativePath);
      return (
        releases.find(
          (fileEntity) => states.get(fileEntity.id)?.position > 0,
        ) ??
        releases.find(
          (fileEntity) =>
            release !== undefined &&
            getReleaseFolder(fileEntity.relativePath) === release,
        ) ??
        releases.reduce((a, b) => (b.size > a.size ? b : a))
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

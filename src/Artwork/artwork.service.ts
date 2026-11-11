import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArtworkEntity } from '../Shared/Entity/artwork.entity';
import { FileEntity } from '../Shared/Entity/file.entity';
import { TitleTypeEnum } from '../Shared/Enum/title-type.enum';
import { ArtworkQuery, collectQueries } from './artwork-query';
import { ArtworkIndex } from './artwork-index';
import { TmdbClient, TmdbMatch } from './tmdb.client';

/** nothing found: search again after this (TMDB gets new entries) */
const RETRY_NOT_FOUND_MS = 7 * 24 * 60 * 60 * 1000;
/** TMDB unreachable: not before this */
const RETRY_FAILED_MS = 30 * 60 * 1000;
/** a list asking for something not looked up yet starts a lookup at most this often */
const MISSING_FETCH_GAP_MS = 5 * 60 * 1000;
/** errors in a row before a run gives up (TMDB down, bad key) */
const MAX_ERRORS_IN_ROW = 3;

/**
 * Posters and backdrops from TMDB for movies and shows, kept in the
 * artwork table (cached in memory: only this writes it). Looked up in the
 * background: at start, after scans and title changes, and when a list
 * asks for something new. Matches can be picked by hand on /library.
 */
@Injectable()
export class ArtworkService implements OnApplicationBootstrap {
  private rows: Promise<Map<string, ArtworkEntity>> | null = null;
  private running: Promise<void> | null = null;
  private runAgain = false;
  private refetchAll = false;
  private lastMissingFetch = 0;
  private readonly failedAt = new Map<string, number>();

  constructor(
    @InjectRepository(ArtworkEntity)
    private readonly artworkRepository: Repository<ArtworkEntity>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly tmdbClient: TmdbClient,
  ) {}

  onApplicationBootstrap() {
    if (!this.tmdbClient.isConfigured()) {
      console.log('artwork: no TMDB_API_KEY, no posters');
    }
    this.fetchMissing();
  }

  async getIndex(): Promise<ArtworkIndex> {
    return new ArtworkIndex(await this.getRows(), () =>
      this.fetchMissingSoon(),
    );
  }

  /** by key */
  async getAll(): Promise<ArtworkEntity[]> {
    return [...(await this.getRows()).values()];
  }

  /**
   * Looks up whatever has no artwork yet. One run at a time (a call during
   * a run makes it go once more); never fails.
   */
  fetchMissing(): Promise<void> {
    if (this.running) {
      this.runAgain = true;
      return this.running;
    }

    this.running = (async () => {
      do {
        this.runAgain = false;
        await this.lookUpMissing();
      } while (this.runAgain);
    })()
      .catch((error) => console.error('artwork: ' + error?.message))
      .finally(() => {
        this.running = null;
        if (this.runAgain) {
          this.fetchMissing();
        }
      });

    return this.running;
  }

  /** every match not picked by hand searched again (e.g. after matching changed) */
  refetch(): Promise<void> {
    this.refetchAll = true;
    this.failedAt.clear();
    return this.fetchMissing();
  }

  /**
   * Picks the match by hand: a TMDB id or link
   * (https://www.themoviedb.org/movie/603-the-matrix), or null for none.
   */
  async setMatch(id: number, tmdb: unknown): Promise<ArtworkEntity> {
    const row = await this.getRow(id);
    if (tmdb === null || tmdb === '') {
      return this.save(row, null, true);
    }

    const tmdbId = parseTmdbId(tmdb, row.type);
    const match = await this.tmdbClient.getDetails(row.type, tmdbId);
    if (!match) {
      throw new NotFoundException(`no ${tmdbType(row.type)} ${tmdbId} on TMDB`);
    }

    return this.save(row, match, true);
  }

  /** back to an automatic match: searched again right away */
  async resetMatch(id: number): Promise<void> {
    const row = await this.getRow(id);
    await this.artworkRepository.delete({ id: row.id });
    (await this.getRows()).delete(row.key);
    this.failedAt.delete(row.key);
    await this.fetchMissing();
  }

  private fetchMissingSoon() {
    if (Date.now() - this.lastMissingFetch < MISSING_FETCH_GAP_MS) {
      return;
    }
    this.lastMissingFetch = Date.now();
    this.fetchMissing();
  }

  private async lookUpMissing(): Promise<void> {
    if (!this.tmdbClient.isConfigured()) {
      return;
    }
    const refetchAll = this.refetchAll;
    this.refetchAll = false;

    const files = await this.fileRepository.find({
      where: { deleted: false, hidden: false },
      relations: { title: true },
    });
    const rows = await this.getRows();
    const now = Date.now();
    const toLookUp = [...collectQueries(files).values()].filter((query) => {
      const row = rows.get(query.key);
      if (row) {
        return (
          !row.manual &&
          (refetchAll ||
            (!row.tmdbId && now - row.fetchedAt > RETRY_NOT_FOUND_MS))
        );
      }

      return now - (this.failedAt.get(query.key) ?? 0) > RETRY_FAILED_MS;
    });
    if (!toLookUp.length) {
      return;
    }

    let found = 0;
    let errorsInRow = 0;
    for (const query of toLookUp) {
      if (rows.get(query.key)?.manual) {
        continue; // picked by hand meanwhile
      }
      try {
        const row = await this.lookUp(query, rows.get(query.key));
        found += row.tmdbId ? 1 : 0;
        errorsInRow = 0;
      } catch (error: any) {
        this.failedAt.set(query.key, Date.now());
        console.error(`artwork: ${query.queries[0]}: ${error?.message}`);
        if (++errorsInRow >= MAX_ERRORS_IN_ROW) {
          console.error('artwork: giving up for now');
          break;
        }
      }
    }
    console.log(`artwork: looked up ${toLookUp.length}, found ${found}`);
  }

  private async lookUp(
    query: ArtworkQuery,
    row: ArtworkEntity | undefined,
  ): Promise<ArtworkEntity> {
    let match = await this.tmdbClient.find(
      query.type,
      query.queries,
      query.year,
    );
    if (match && query.type === TitleTypeEnum.show) {
      match = (await this.tmdbClient.getDetails(query.type, match.id)) ?? match;
    }

    const target =
      row ??
      this.artworkRepository.create({
        key: query.key,
        type: query.type,
        query: query.queries[0] ?? '',
      });
    target.year = query.year;

    return this.save(target, match, false);
  }

  private async save(
    row: ArtworkEntity,
    match: TmdbMatch | null,
    manual: boolean,
  ): Promise<ArtworkEntity> {
    row.tmdbId = match?.id ?? null;
    row.tmdbTitle = match?.title ?? null;
    row.tmdbYear = match?.year ?? null;
    row.poster = match?.poster ?? null;
    row.backdrop = match?.backdrop ?? null;
    row.seasons = match?.seasons ? JSON.stringify(match.seasons) : null;
    row.manual = manual;
    row.fetchedAt = Date.now();

    const saved = await this.artworkRepository.save(row);
    (await this.getRows()).set(saved.key, saved);

    return saved;
  }

  private async getRow(id: number): Promise<ArtworkEntity> {
    const row = Number.isInteger(id)
      ? [...(await this.getRows()).values()].find((r) => r.id === id)
      : undefined;
    if (!row) {
      throw new NotFoundException(`artwork #${id} not found`);
    }

    return row;
  }

  private getRows(): Promise<Map<string, ArtworkEntity>> {
    this.rows =
      this.rows ??
      this.artworkRepository
        .find()
        .then((rows) => new Map(rows.map((row) => [row.key, row])));

    return this.rows;
  }
}

function tmdbType(type: TitleTypeEnum): string {
  return type === TitleTypeEnum.movie ? 'movie' : 'tv';
}

/** 603, "603" or a link: themoviedb.org/movie/603-the-matrix (of the right type) */
function parseTmdbId(tmdb: unknown, type: TitleTypeEnum): number {
  const text = String(tmdb).trim();
  if (/^[0-9]+$/.test(text)) {
    return parseInt(text);
  }

  const link = text.match(
    /themoviedb\.org\/(?:[a-z-]+\/)?(movie|tv)\/([0-9]+)/i,
  );
  if (!link) {
    throw new BadRequestException('a TMDB id or link');
  }
  if (link[1].toLowerCase() !== tmdbType(type)) {
    throw new BadRequestException(
      `that's a ${link[1] === 'tv' ? 'show' : 'movie'} link, this is a ${type}`,
    );
  }

  return parseInt(link[2]);
}

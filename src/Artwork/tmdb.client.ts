import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { configService } from '../config/config.service';
import { TitleTypeEnum } from '../Shared/Enum/title-type.enum';
import { normalizeTitle } from './artwork-query';

const API_URL = 'https://api.themoviedb.org/3/';
export const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/';

/** a movie or show on TMDB; image paths like "/abc.jpg" */
export interface TmdbMatch {
  id: number;
  title: string;
  year: number | null;
  poster: string | null;
  backdrop: string | null;
  /** shows, from the details: season number → poster */
  seasons?: Record<number, string>;
}

interface TmdbSearchResult extends TmdbMatch {
  originalTitle: string;
  votes: number;
}

/** results looked at when none has the query as its title */
const TOP_RESULTS = 5;

/**
 * TMDB API (v3 key in TMDB_API_KEY). Free for non-commercial use, credit
 * TMDB as the source (the /library page does).
 */
@Injectable()
export class TmdbClient {
  private readonly apiKey = configService.getEnv('TMDB_API_KEY');

  constructor(private readonly httpService: HttpService) {}

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /** the best match for any of the queries (most likely first); null if none */
  find(
    type: TitleTypeEnum,
    queries: string[],
    year: number | null,
  ): Promise<TmdbMatch | null> {
    return type === TitleTypeEnum.movie
      ? this.findMovie(queries, year)
      : this.findShow(queries, year);
  }

  /** with the year first, then without it (off by one at most: festival vs cinema release) */
  private async findMovie(
    queries: string[],
    year: number | null,
  ): Promise<TmdbMatch | null> {
    if (year) {
      for (const query of queries) {
        const match = pick(
          await this.search(TitleTypeEnum.movie, query, year),
          query,
          true,
        );
        if (match) {
          return match;
        }
      }
    }

    for (const query of queries) {
      const results = await this.search(TitleTypeEnum.movie, query);
      const match = pick(
        results.filter(
          (result) =>
            !year || !result.year || Math.abs(result.year - year) <= 1,
        ),
        query,
        !!year,
      );
      if (match) {
        return match;
      }
    }

    return null;
  }

  /**
   * A show's year is only a hint (a release folder's can be a later
   * season's: "Monk" 2011 found "Fleabag Monkeyface"), so by title first:
   * the one named exactly that which started last by then ("The Twilight
   * Zone" 2019, not 1959); else with the year, else the title's results
   * that started by then.
   */
  private async findShow(
    queries: string[],
    year: number | null,
  ): Promise<TmdbMatch | null> {
    const startedBy = (result: TmdbSearchResult) =>
      !year || !result.year || result.year <= year + 1;

    for (const query of queries) {
      const results = await this.search(TitleTypeEnum.show, query);
      const exact = results.filter(
        (result) => isNamed(result, query) && startedBy(result),
      );
      if (exact.length) {
        return toMatch(
          year
            ? exact.reduce((a, b) => ((b.year ?? 0) > (a.year ?? 0) ? b : a))
            : exact[0],
        );
      }

      const match =
        (year &&
          pick(
            await this.search(TitleTypeEnum.show, query, year),
            query,
            true,
          )) ||
        pick(results.filter(startedBy), query, false);
      if (match) {
        return match;
      }
    }

    return null;
  }

  /** with season posters for shows; null if there's no such id */
  async getDetails(type: TitleTypeEnum, id: number): Promise<TmdbMatch | null> {
    const data = await this.get(
      (type === TitleTypeEnum.movie ? 'movie/' : 'tv/') + id,
      {},
      true,
    );
    if (!data) {
      return null;
    }

    const match: TmdbMatch = toResult(data);
    if (type === TitleTypeEnum.show) {
      match.seasons = {};
      for (const season of data.seasons ?? []) {
        if (season.poster_path && Number.isInteger(season.season_number)) {
          match.seasons[season.season_number] = season.poster_path;
        }
      }
    }

    return match;
  }

  private async search(
    type: TitleTypeEnum,
    query: string,
    year?: number,
  ): Promise<TmdbSearchResult[]> {
    const params: Record<string, string | number | boolean> = {
      query,
      include_adult: false,
    };
    if (year) {
      params[
        type === TitleTypeEnum.movie
          ? 'primary_release_year'
          : 'first_air_date_year'
      ] = year;
    }
    const data = await this.get(
      type === TitleTypeEnum.movie ? 'search/movie' : 'search/tv',
      params,
    );

    return (data?.results ?? []).map(toResult);
  }

  /** null on 404 if allowed; errors never carry the url (it has the key) */
  private async get(
    path: string,
    params: Record<string, string | number | boolean>,
    allowNotFound = false,
    retries = 2,
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(API_URL + path, {
          params: { ...params, language: 'en-US', api_key: this.apiKey },
          timeout: 15000,
        }),
      );
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404 && allowNotFound) {
        return null;
      }
      if (status === 429 && retries > 0) {
        const seconds = Number(error.response.headers?.['retry-after']) || 2;
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
        return this.get(path, params, allowNotFound, retries - 1);
      }
      throw new Error(
        `TMDB ${path.split('/')[0]}: ${
          status ?? error?.code ?? error?.message
        }`,
      );
    }
  }
}

/**
 * The one with the query as its title, else TMDB's first; of results of
 * the right year (byVotes) the best known of the first few: "The Garfield"
 * 2004 is "Garfield" (4k votes), not the making-of TMDB puts first. Not
 * without a year: "Desas" (LT) finds "Des" first, "Mayday" has more votes.
 */
function pick(
  results: TmdbSearchResult[],
  query: string,
  byVotes: boolean,
): TmdbMatch | null {
  const match =
    results.find((result) => isNamed(result, query)) ??
    (byVotes
      ? results
          .slice(0, TOP_RESULTS)
          .reduce<TmdbSearchResult | undefined>(
            (best, result) =>
              !best || result.votes > best.votes ? result : best,
            undefined,
          )
      : results[0]);

  return match ? toMatch(match) : null;
}

function isNamed(result: TmdbSearchResult, query: string): boolean {
  const wanted = normalizeTitle(query);
  return (
    normalizeTitle(result.title) === wanted ||
    normalizeTitle(result.originalTitle) === wanted
  );
}

function toMatch(result: TmdbSearchResult): TmdbMatch {
  return {
    id: result.id,
    title: result.title,
    year: result.year,
    poster: result.poster,
    backdrop: result.backdrop,
  };
}

function toResult(data): TmdbSearchResult {
  const date: string = data.release_date || data.first_air_date || '';

  return {
    id: data.id,
    title: data.title ?? data.name ?? '',
    originalTitle: data.original_title ?? data.original_name ?? '',
    votes: data.vote_count ?? 0,
    year: parseInt(date.slice(0, 4)) || null,
    poster: data.poster_path ?? null,
    backdrop: data.backdrop_path ?? null,
  };
}

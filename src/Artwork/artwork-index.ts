import { ArtworkEntity } from '../Shared/Entity/artwork.entity';
import { FileEntity } from '../Shared/Entity/file.entity';
import { TitleEntity } from '../Shared/Entity/title.entity';
import { TitleTypeEnum } from '../Shared/Enum/title-type.enum';
import {
  ArtworkQuery,
  getMovieQuery,
  getShowQuery,
  getTitleQuery,
} from './artwork-query';
import { TMDB_IMAGE_URL } from './tmdb.client';

/** what list items get: full image urls (players load them from TMDB) */
export interface Art {
  thumb?: string;
  fanart?: string;
}

const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'w1280';

export function imageUrl(
  path: string | null,
  size: string,
): string | undefined {
  return path ? TMDB_IMAGE_URL + size + path : undefined;
}

/**
 * The artwork known when a list is built. Asking for something that was
 * never looked up starts a lookup in the background (onMissing).
 */
export class ArtworkIndex {
  private readonly seasons = new Map<number, Record<number, string>>();

  constructor(
    private readonly rows: Map<string, ArtworkEntity>,
    private readonly onMissing: () => void,
  ) {}

  /** a movie title: its first film; a show: itself */
  forTitle(titleEntity: TitleEntity, files: FileEntity[]): Art {
    return toArt(this.find(getTitleQuery(titleEntity, files)));
  }

  /** a show's season (0: specials): its poster, else the show's */
  forSeason(titleEntity: TitleEntity, season: number | null): Art {
    const row = this.find(getShowQuery(titleEntity));
    const art = toArt(row);
    const poster = row?.tmdbId ? this.getSeasons(row)[season] : undefined;

    return poster ? { ...art, thumb: imageUrl(poster, POSTER_SIZE) } : art;
  }

  /** a movie file: its film, else its title's; an episode: its season */
  forFile(
    fileEntity: FileEntity,
    titleEntity: TitleEntity,
    titleFiles: FileEntity[],
  ): Art {
    if (titleEntity.type === TitleTypeEnum.show) {
      return this.forSeason(titleEntity, fileEntity.season);
    }

    const art = toArt(this.find(getMovieQuery(fileEntity, titleEntity)));
    return art.thumb || art.fanart
      ? art
      : this.forTitle(titleEntity, titleFiles);
  }

  private find(query: ArtworkQuery | null): ArtworkEntity | undefined {
    if (!query) {
      return undefined;
    }
    const row = this.rows.get(query.key);
    if (!row) {
      this.onMissing();
    }

    return row;
  }

  private getSeasons(row: ArtworkEntity): Record<number, string> {
    if (!this.seasons.has(row.id)) {
      let seasons = {};
      try {
        seasons = JSON.parse(row.seasons || '{}');
      } catch {
        // stays empty
      }
      this.seasons.set(row.id, seasons);
    }

    return this.seasons.get(row.id);
  }
}

function toArt(row: ArtworkEntity | undefined): Art {
  if (!row?.tmdbId) {
    return {};
  }

  return {
    thumb: imageUrl(row.poster, POSTER_SIZE),
    fanart: imageUrl(row.backdrop, BACKDROP_SIZE),
  };
}

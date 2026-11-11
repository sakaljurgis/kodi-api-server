import { FileEntity } from '../Shared/Entity/file.entity';
import { TitleEntity } from '../Shared/Entity/title.entity';
import { TitleTypeEnum } from '../Shared/Enum/title-type.enum';
import { isSample } from '../Shared/Util/file-order';

/**
 * What to look up on TMDB. A movie title can hold several films (rules
 * group franchises: "007 James Bond", "Garfield"), so each movie file is
 * looked up as its own film; a show once, by its title.
 */
export interface ArtworkQuery {
  /** `<type>|<normalized first query>|<movie year>` */
  key: string;
  type: TitleTypeEnum;
  /** what to search for, most likely first */
  queries: string[];
  /** movies: the film's year from the path; shows: a hint, the earliest release folder year */
  year: number | null;
}

interface SegmentInfo {
  title?: string;
  year?: number;
}

export function getArtworkKey(
  type: TitleTypeEnum,
  query: string,
  year: number | null,
): string {
  return `${type}|${normalizeTitle(query)}|${
    type === TitleTypeEnum.movie ? year ?? '' : ''
  }`;
}

/** "Ledo šalis", "Ledo.Salis" and "ledo  salis!" are the same */
export function normalizeTitle(text: string | null | undefined): string {
  return (text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** files that count: listed, not samples */
export function isListedFile(fileEntity: FileEntity): boolean {
  return !fileEntity.deleted && !fileEntity.hidden && !isSample(fileEntity);
}

/**
 * A movie file's film: the deepest path segment with a year names it
 * ("007 James Bond…/6.Casino.Royale.1967…mkv"), else the listed title (a
 * rule's: the fix) or the parsed one; not the listed one if it's the
 * franchise the parsed title is in ("Indiana Jones" for "Indiana Jones and
 * the Temple of Doom").
 */
export function getMovieQuery(
  fileEntity: FileEntity,
  titleEntity: TitleEntity,
): ArtworkQuery {
  const infos = parseJson<SegmentInfo[]>(fileEntity.infos) ?? [];
  let year: number | null = null;
  let fromSegment: string[] = [];
  for (let i = infos.length - 1; i >= 0; i--) {
    if (typeof infos[i]?.year === 'number') {
      year = infos[i].year;
      fromSegment = segmentQueries(infos[i].title, i > 0);
      break;
    }
  }

  const parsed = cleanQuery(parseJson<SegmentInfo>(fileEntity.info)?.title);
  const listed = titleEntity.title;
  // never the franchise itself: "Spider Man" would find the 2002 film
  const inFranchise =
    normalizeTitle(parsed).length > normalizeTitle(listed).length &&
    normalizeTitle(parsed).includes(normalizeTitle(listed));
  const queries = unique([
    ...fromSegment,
    ...(inFranchise ? [parsed] : [listed, parsed]),
  ]);

  return {
    key: getArtworkKey(TitleTypeEnum.movie, queries[0], year),
    type: TitleTypeEnum.movie,
    queries,
    year,
  };
}

/** a show by its listed title; a year in a release folder helps pick the right one */
export function getShowQuery(
  titleEntity: TitleEntity,
  files: FileEntity[] = [],
): ArtworkQuery {
  const years = files
    .filter(isListedFile)
    .map((fileEntity) => parseJson<SegmentInfo[]>(fileEntity.infos)?.[0]?.year)
    .filter((year): year is number => typeof year === 'number');

  return {
    key: getArtworkKey(TitleTypeEnum.show, titleEntity.title, null),
    type: TitleTypeEnum.show,
    queries: [titleEntity.title],
    year: years.length ? Math.min(...years) : null,
  };
}

/** a movie title shows its first film (earliest year), a show itself */
export function getTitleQuery(
  titleEntity: TitleEntity,
  files: FileEntity[],
): ArtworkQuery | null {
  if (titleEntity.type === TitleTypeEnum.show) {
    return getShowQuery(titleEntity, files);
  }

  const queries = files
    .filter(isListedFile)
    .map((fileEntity) => getMovieQuery(fileEntity, titleEntity))
    .sort((a, b) => (a.year ?? Infinity) - (b.year ?? Infinity));

  return queries[0] ?? null;
}

/**
 * Everything to look up for these files (with their titles): each movie
 * file's film, each show. By key.
 */
export function collectQueries(files: FileEntity[]): Map<string, ArtworkQuery> {
  const queries = new Map<string, ArtworkQuery>();
  const showFiles = new Map<number, FileEntity[]>();

  for (const fileEntity of files.filter(isListedFile)) {
    const titleEntity = fileEntity.title;
    if (!titleEntity) {
      continue;
    }
    if (titleEntity.type === TitleTypeEnum.movie) {
      const query = getMovieQuery(fileEntity, titleEntity);
      queries.set(query.key, queries.get(query.key) ?? query);
    } else {
      showFiles.set(titleEntity.id, [
        ...(showFiles.get(titleEntity.id) ?? []),
        fileEntity,
      ]);
    }
  }

  for (const titleFiles of showFiles.values()) {
    const query = getShowQuery(titleFiles[0].title, titleFiles);
    queries.set(query.key, query);
  }

  return queries;
}

/**
 * A pack's file: "6.Casino.Royale." → "Casino Royale" (the number is its
 * place in the pack), then as it is ("21 Jump Street").
 */
function segmentQueries(title: string | undefined, inPack: boolean): string[] {
  const cleaned = cleanQuery(title);
  const withoutNumber = inPack
    ? cleaned.replace(/^[0-9]{1,2} (?=[^0-9])/, '')
    : cleaned;

  return [withoutNumber, cleaned];
}

/** "7.On Her Majesty‘s Secret Service." → "On Her Majesty‘s Secret Service" */
function cleanQuery(title: string | undefined): string {
  return (title ?? '').replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function unique(queries: string[]): string[] {
  const seen = new Set<string>();

  return queries.filter((query) => {
    const key = normalizeTitle(query);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function parseJson<T>(json: string | null | undefined): T | undefined {
  try {
    return json ? JSON.parse(json) : undefined;
  } catch {
    return undefined;
  }
}

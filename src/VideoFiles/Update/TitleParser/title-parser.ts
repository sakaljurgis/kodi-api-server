import * as tnp from 'torrent-name-parser';

/**
 * tnp's own season pattern also matches inside words ("Se7en" → 7,
 * "boots720p" → 72, "2xLT" → 2). Only "S01" / "S01E02" not glued to a word
 * before it, and "1x02".
 */
const SEASON =
  /(?<![a-z0-9])(s([0-9]{1,2}))(?=e[0-9]|[^a-z0-9]|$)|(?<![a-z0-9])[0-9]{1,2}(?=x[0-9]{2}(?![0-9]))/i;

/**
 * A whole word only: "WandaVision" has "aVi" in it and the title ends where
 * the container starts ("Wand"), "The Aviator" would be "The".
 */
const CONTAINER = /(?<![a-z0-9])(?:mkv|avi|mp4)(?![a-z0-9])/i;

/**
 * Release group ("x264-NTb") or episode name ("Show - S01E01 - Pilot"), the
 * title ends there. tnp's own takes whatever follows the last hyphen, so
 * "Spider-Man No Way Home" was "Spider": a hyphen inside a word only counts
 * when one word follows it.
 */
const GROUP = /((?:\s-\s?|-(?=[^\s-]+$))([^-]+))$/;

tnp.configure(
  {
    season: SEASON,
    sample: /sample/i,
    year: /([\[\(]?((?:19[0-9][0-9]|20[0-2][0-9]))[\]\)]?)/,
    container: CONTAINER,
    group: GROUP,
  },
  { sample: 'boolean' },
);

/** "The.Expanse.S06E04SP04.One.Ship…": special 4 */
const SPECIAL = /(?<![a-z])sp([0-9]{2})(?![0-9])/i;

/** a show's folder of extras, its files go to season 0 with the specials */
const EXTRAS_FOLDER =
  /^(?:specials?|extras?|featurettes?|bonus(?:es| features)?|behind[ ._-]the[ ._-]scenes|deleted[ ._-]scenes|interviews)$/i;

/** release name words at the end of a title, e.g. "Boston Legal Complete" */
const TRAILING_JUNK =
  /(?:^|\s)(?:(?:the )?complete(?: series)?|box ?set|collection|du[a]?ology|trilogy|quadrilogy|pentalogy|hexalogy|nordic|[0-9]{1,2} seasons|[0-9]{1,2}-[0-9]{1,2})$/i;

export interface TitleInfo {
  title: string;
  season?: number;
  episode?: number;
}

export interface ParsedPath {
  /** combined over all path segments */
  info: TitleInfo;
  /** raw tnp result per path segment */
  infos: Record<string, unknown>[];
}

/** title, season and episode from a path relative to the media folder */
export function parseRelativePath(relativePath: string): ParsedPath {
  const segments = relativePath.split('/');
  const infos = segments.map((segment) => parseSegment(segment));

  return { info: combineInfos(segments, infos), infos };
}

function parseSegment(segment: string) {
  const info = tnp(segment);
  info.title = info.title ?? '';

  if (info.season === undefined) {
    for (const rx of [/season ([0-9]{1,2})/i, /([0-9]{1,2}) sezonas/i]) {
      const match = info.title.match(rx);
      if (match) {
        info.season = parseInt(match[1]);
        info.title = info.title.replace(rx, '').trim();
        break;
      }
    }
  }

  return info;
}

/**
 * Title of the first segment (release folder), season/episode of the deepest
 * one that has them. Specials are season 0: S00, "SP04", and a show's files
 * in a Specials/Extras/Featurettes… folder (those keep only an S00 episode).
 * An episode whose own title is longer than the folder's ("Project Runway All
 * Stars" in "Project Runway 10 Seasons") is that other show.
 */
function combineInfos(segments: string[], infos): TitleInfo {
  const combined: TitleInfo = {
    title: undefined,
    season: undefined,
    episode: undefined,
  };
  let specialEpisode: number | undefined;
  let isSpecial = false;
  let isExtra = false;

  infos.forEach((info, i) => {
    combined.title = combined.title ? combined.title : info.title;
    if (typeof info.season === 'number') {
      combined.season = info.season;
    }
    if (info.episode) {
      combined.episode = info.episode;
    }
    const special = SPECIAL.exec(segments[i]);
    if (special) {
      isSpecial = true;
      specialEpisode = parseInt(special[1]);
    }
    if (i < segments.length - 1 && EXTRAS_FOLDER.test(segments[i].trim())) {
      isExtra = true;
    }
  });

  if (isSpecial) {
    combined.season = 0;
    combined.episode = specialEpisode;
  } else if (isExtra && combined.season !== undefined) {
    if (combined.season !== 0) {
      combined.episode = undefined;
    }
    combined.season = 0;
  }

  combined.title = cleanTitle(combined.title ?? '');

  const own = infos[infos.length - 1];
  const ownTitle = cleanTitle(own.title ?? '');
  if (
    infos.length > 1 &&
    typeof own.season === 'number' &&
    combined.title &&
    ownTitle.toLowerCase().startsWith(combined.title.toLowerCase() + ' ')
  ) {
    combined.title = ownTitle;
  }

  return combined;
}

export function cleanTitle(title: string): string {
  let clean = title.replace(/\s+/g, ' ').trim();

  // "Don.t" → "Don t" → "Don't"
  clean = clean.replace(/\b([a-z]+n) t\b/gi, "$1't");

  let previous: string;
  do {
    previous = clean;
    // "Fight Or Flight.2024" → "Fight Or Flight." (but keep "That...")
    clean = clean.replace(/(?<!\.)\.$/, '').replace(/[\s\-_,:;]+$/, '');
    const stripped = clean.replace(TRAILING_JUNK, '').trim();
    if (!/^(?:|the|a|an)$/i.test(stripped)) {
      clean = stripped;
    }
  } while (clean !== previous);

  return removePartNumber(clean);
}

/** "Shrek 2" → "Shrek", so the parts of a series are one title */
function removePartNumber(title: string): string {
  const words = title.split(' ');
  if (words.length > 1 && /^[0-9]$/.test(words[words.length - 1])) {
    words.pop();
  }

  return words.join(' ');
}

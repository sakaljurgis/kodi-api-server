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

tnp.configure(
  {
    season: SEASON,
    sample: /sample/i,
    year: /([\[\(]?((?:19[0-9][0-9]|20[0-2][0-9]))[\]\)]?)/,
    container: CONTAINER,
  },
  { sample: 'boolean' },
);

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
  const infos = relativePath.split('/').map((segment) => parseSegment(segment));

  return { info: combineInfos(infos), infos };
}

function parseSegment(segment: string) {
  const info = tnp(segment);
  info.title = info.title ?? '';

  if (!info.season) {
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
 * one that has them. Season/episode 0 don't count (S00 specials stay in the
 * folder's season, a show's season 0 can't be opened in the menus).
 */
function combineInfos(infos): TitleInfo {
  const combined: TitleInfo = {
    title: undefined,
    season: undefined,
    episode: undefined,
  };

  for (const info of infos) {
    combined.title = combined.title ? combined.title : info.title;
    if (info.season) {
      combined.season = info.season;
    }
    if (info.episode) {
      combined.episode = info.episode;
    }
  }

  combined.title = cleanTitle(combined.title ?? '');

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

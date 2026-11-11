import { FileEntity } from '../Entity/file.entity';
import { compareFiles, getEpisodeKey, getReleaseFolder } from './file-order';

/** a release of a season that has the same episodes as another one */
export interface FileVersion {
  /** a file of it (the oldest), used in its path; any of its files finds it */
  id: number;
  releaseFolder: string;
  /** e.g. "1080p · BDRip · HEVC · LT EN · EN subs — Kronox" */
  label: string;
  /** in episode order */
  files: FileEntity[];
}

export interface SeasonVersions {
  versions: FileVersion[];
  /** files that aren't in a release with several episodes, in episode order */
  others: FileEntity[];
}

/**
 * The versions of a season's files (samples left out) when there's a choice:
 * the same episode is there more than once (e.g. an LT and an EN release, or
 * 1080p and 4K). Each release folder with several of the season's files is a
 * version; loose files and single-episode releases stay files. Null if no
 * episode is there twice, or all files are in one release.
 */
export function splitVersions(
  seasonFiles: FileEntity[],
): SeasonVersions | null {
  const keys = new Set(seasonFiles.map(getEpisodeKey));
  if (keys.size === seasonFiles.length) {
    return null;
  }

  const byRelease = new Map<string, FileEntity[]>();
  const others: FileEntity[] = [];
  for (const fileEntity of seasonFiles) {
    const folder = getReleaseFolder(fileEntity.relativePath);
    if (folder === undefined) {
      others.push(fileEntity);
      continue;
    }
    byRelease.set(folder, [...(byRelease.get(folder) ?? []), fileEntity]);
  }

  const versions: FileVersion[] = [];
  byRelease.forEach((files, releaseFolder) => {
    if (files.length < 2) {
      others.push(...files);
      return;
    }
    const sorted = [...files].sort(compareFiles);
    versions.push({
      id: Math.min(...files.map((fileEntity) => fileEntity.id)),
      releaseFolder,
      label: getReleaseLabel(releaseFolder, sorted[0].fileName),
      files: sorted,
    });
  });

  if (versions.length === 0 || (versions.length === 1 && !others.length)) {
    return null;
  }

  // two releases that look the same are told apart by their folder names
  for (const version of versions) {
    if (versions.some((v) => v !== version && v.label === version.label)) {
      version.label = version.releaseFolder;
    }
  }

  return {
    versions: versions.sort((a, b) => a.id - b.id),
    others: others.sort(compareFiles),
  };
}

const RESOLUTION = /(?<![a-z0-9])(2160p|1080p|720p|576p|480p|4k)(?![a-z0-9])/i;
const SOURCE =
  /(?<![a-z0-9])(remux|blu-?ray|bdrip|brrip|web-?dl|webrip|web|hdtv|dvdrip|hdrip)(?![a-z0-9])/i;
const CODEC =
  /(?<![a-z0-9])(x265|h\.?265|hevc|x264|h\.?264|avc|av1|xvid)(?![a-z0-9])/i;
const HDR = /(?<![a-z0-9])(hdr10\+?|hdr|dv|dovi)(?![a-z0-9])/i;
// upper case only, "en" or "lt" in a lower case name is more likely a word
const LANGUAGE = /(?<![A-Za-z0-9])(LT|EN|RU|KR|LV|PL|DE|FR|ES)(?![A-Za-z0-9])/g;
const SUBTITLES = /(?<![A-Za-z0-9])(LT|EN|RU)[.\s_]?Subs?(?![A-Za-z0-9])/gi;
const VIDEO_EXTENSION = /\.(mkv|mp4|avi|ts|m4v|wmv|mov)$/i;

const CANONICAL: Record<string, string> = {
  '4k': '2160p',
  remux: 'REMUX',
  bluray: 'BluRay',
  'blu-ray': 'BluRay',
  bdrip: 'BDRip',
  brrip: 'BRRip',
  'web-dl': 'WEB-DL',
  webdl: 'WEB-DL',
  webrip: 'WEBRip',
  web: 'WEB',
  hdtv: 'HDTV',
  dvdrip: 'DVDRip',
  hdrip: 'HDRip',
  x265: 'x265',
  h265: 'H.265',
  'h.265': 'H.265',
  hevc: 'HEVC',
  x264: 'x264',
  h264: 'H.264',
  'h.264': 'H.264',
  avc: 'AVC',
  av1: 'AV1',
  xvid: 'XviD',
  hdr: 'HDR',
  hdr10: 'HDR10',
  'hdr10+': 'HDR10+',
  dv: 'DV',
  dovi: 'DV',
};

/**
 * What tells a release apart, from its folder name and a file name in it:
 * resolution, source, codec, HDR, audio languages, subtitles, group. The
 * folder name if none of it is there.
 */
export function getReleaseLabel(releaseFolder: string, fileName = ''): string {
  const names = `${releaseFolder} ${fileName.replace(VIDEO_EXTENSION, '')}`;
  const first = (pattern: RegExp) => {
    const found = pattern.exec(names)?.[1];
    return found ? CANONICAL[found.toLowerCase()] ?? found.toLowerCase() : '';
  };
  const all = (pattern: RegExp) => {
    const found = new Set<string>();
    const global = new RegExp(pattern.source, pattern.flags);
    for (let m = global.exec(names); m; m = global.exec(names)) {
      found.add(m[1].toUpperCase());
    }
    return [...found];
  };

  const subtitles = all(SUBTITLES);
  const tags = [
    first(RESOLUTION),
    first(SOURCE),
    first(CODEC),
    first(HDR),
    all(LANGUAGE).join(' '),
    subtitles.length ? subtitles.join(' ') + ' subs' : '',
  ].filter(Boolean);
  if (!tags.length) {
    return releaseFolder;
  }
  const group = getReleaseGroup(releaseFolder) ?? getReleaseGroup(fileName);

  return tags.join(' · ') + (group ? ' — ' + group : '');
}

/** "…x264-NTb" → NTb, "… (1080p BluRay x265 Silence)" → Silence */
function getReleaseGroup(name: string): string | undefined {
  const base = name
    .replace(VIDEO_EXTENSION, '')
    .replace(/(\s*\[[^\]]*\])+$/, '')
    .trim();
  const candidate =
    /-([A-Za-z0-9_]+)$/.exec(base)?.[1] ??
    /\(([^()]*)\)$/.exec(base)?.[1].trim().split(/\s+/).pop();

  const isTag = [RESOLUTION, SOURCE, CODEC, HDR].some((pattern) =>
    pattern.test(candidate ?? ''),
  );
  if (
    !candidate ||
    isTag ||
    !/[a-z]/i.test(candidate) ||
    /^(s\d+|\d+bit)$/i.test(candidate)
  ) {
    return undefined;
  }

  return candidate;
}

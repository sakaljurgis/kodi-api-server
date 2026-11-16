import { FileEntity } from '../Entity/file.entity';

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

/** episode number parsed from the file name, if there is one */
export function getEpisode(fileEntity: FileEntity): number | undefined {
  try {
    const episode = JSON.parse(fileEntity.info)?.episode;
    return typeof episode === 'number' ? episode : undefined;
  } catch (e) {
    return undefined;
  }
}

export function isSample(fileEntity: FileEntity): boolean {
  return /\bsample\b/i.test(fileEntity.fileName);
}

/** the first segment of a relative path, none for a file that's not in a folder */
export function getReleaseFolder(relativePath: string): string | undefined {
  const slash = relativePath?.indexOf('/') ?? -1;
  return slash > 0 ? relativePath.slice(0, slash) : undefined;
}

/**
 * Files that are the same episode (e.g. two releases of S01E01) share a key,
 * files without an episode number are each their own.
 */
export function getEpisodeKey(fileEntity: FileEntity): string {
  const episode = getEpisode(fileEntity);
  return episode === undefined
    ? 'file ' + fileEntity.id
    : `${fileEntity.season ?? 0}x${episode}`;
}

/** by season and episode, then natural file name order (episode 2 before 10) */
export function compareFiles(a: FileEntity, b: FileEntity): number {
  const seasonA = a.season ?? 0;
  const seasonB = b.season ?? 0;
  if (seasonA !== seasonB) {
    return seasonA - seasonB;
  }

  const episodeA = getEpisode(a) ?? Number.MAX_SAFE_INTEGER;
  const episodeB = getEpisode(b) ?? Number.MAX_SAFE_INTEGER;
  if (episodeA !== episodeB) {
    return episodeA - episodeB;
  }

  return collator.compare(a.fileName, b.fileName);
}

/**
 * The episodes [after] can go on to, in order, each with its files (one per
 * release): after an episode the regular episodes, after a special (season 0)
 * the numbered specials; samples and extras without a number are never next.
 * [sortedFiles] are a title's files in order (compareFiles).
 */
export function groupEpisodes(
  sortedFiles: FileEntity[],
  after: FileEntity,
): Map<string, FileEntity[]> {
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

  return episodes;
}

/**
 * The episode right after [after] (E03 → E04, a season's last → the next
 * season's first), watched or not: from [after]'s release when it has it,
 * else the biggest file of it. Null after the last one, or for a file that
 * isn't an episode in [sortedFiles] (see groupEpisodes).
 */
export function getNextInOrder(
  sortedFiles: FileEntity[],
  after: FileEntity,
): FileEntity | null {
  const episodes = groupEpisodes(sortedFiles, after);
  const keys = [...episodes.keys()];
  const index = keys.indexOf(getEpisodeKey(after));
  const releases = index === -1 ? undefined : episodes.get(keys[index + 1]);
  if (!releases) {
    return null;
  }

  const release = getReleaseFolder(after.relativePath);
  return (
    releases.find(
      (fileEntity) =>
        release !== undefined &&
        getReleaseFolder(fileEntity.relativePath) === release,
    ) ?? releases.reduce((a, b) => (b.size > a.size ? b : a))
  );
}

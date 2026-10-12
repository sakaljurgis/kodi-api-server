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

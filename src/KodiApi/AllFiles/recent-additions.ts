import { FileEntity } from '../../Shared/Entity/file.entity';
import { TitleEntity } from '../../Shared/Entity/title.entity';
import { TitleTypeEnum } from '../../Shared/Enum/title-type.enum';
import { getEpisodeKey, isSample } from '../../Shared/Util/file-order';

/** files of a title found further apart than this were added separately */
const BATCH_GAP_MS = 12 * 60 * 60 * 1000;
/** the same for files found before added_at was kept: by how far apart their ids are */
const BATCH_GAP_IDS = 50;

export interface RecentAddition {
  title: TitleEntity;
  /** the title's live files, samples left out */
  titleFiles: FileEntity[];
  /** what was added last (files found together) */
  added: FileEntity[];
  /** the title had nothing before */
  isNewTitle: boolean;
  /** shows: the seasons of what was added, in order */
  seasons: number[];
  /** shows: seasons that had no files before */
  newSeasons: number[];
  /** shows: episodes that weren't there in another release before */
  newEpisodes: number;
  /** when it was added, if known */
  addedAt: number | null;
}

/**
 * One entry per title, newest first: what was added to it last. File ids
 * follow the order files were found, so they order the titles; files of a
 * title found within a few hours of each other (or, without dates, with ids
 * close together) were added together.
 */
export function getRecentAdditions(
  liveFiles: FileEntity[],
  limit: number,
): RecentAddition[] {
  const byTitle = new Map<number, FileEntity[]>();
  const titles = new Map<number, TitleEntity>();
  const newestFirst = liveFiles
    .filter((fileEntity) => fileEntity.title && !isSample(fileEntity))
    .sort((a, b) => b.id - a.id);
  for (const fileEntity of newestFirst) {
    byTitle.set(fileEntity.titleId, [
      ...(byTitle.get(fileEntity.titleId) ?? []),
      fileEntity,
    ]);
    titles.set(fileEntity.titleId, fileEntity.title);
  }

  const additions: RecentAddition[] = [];
  for (const [titleId, titleFiles] of byTitle) {
    if (additions.length >= limit) {
      break;
    }

    let count = 1;
    while (
      count < titleFiles.length &&
      addedTogether(titleFiles[count - 1], titleFiles[count])
    ) {
      count++;
    }
    const added = titleFiles.slice(0, count);
    const before = titleFiles.slice(count);
    const title = titles.get(titleId);

    const seasons = [];
    const newSeasons = [];
    let newEpisodes = 0;
    if (title.type === TitleTypeEnum.show) {
      seasons.push(...new Set(added.map((fileEntity) => fileEntity.season)));
      seasons.sort((a, b) => a - b);
      newSeasons.push(
        ...seasons.filter(
          (season) =>
            !before.some((fileEntity) => fileEntity.season === season),
        ),
      );
      const episodesBefore = new Set(before.map(getEpisodeKey));
      newEpisodes = new Set(
        added
          .map(getEpisodeKey)
          .filter((episode) => !episodesBefore.has(episode)),
      ).size;
    }

    additions.push({
      title,
      titleFiles,
      added,
      isNewTitle: before.length === 0,
      seasons,
      newSeasons,
      newEpisodes,
      addedAt: added[0].addedAt ?? null,
    });
  }

  return additions;
}

/** [newer] and [older] are files of the same title, by id */
function addedTogether(newer: FileEntity, older: FileEntity): boolean {
  if (newer.addedAt && older.addedAt) {
    return newer.addedAt - older.addedAt <= BATCH_GAP_MS;
  }
  if (newer.addedAt || older.addedAt) {
    return false;
  }

  return newer.id - older.id <= BATCH_GAP_IDS;
}

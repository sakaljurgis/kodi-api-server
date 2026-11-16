/** a chapter as kept in files.chapters, in seconds */
export interface Chapter {
  start: number;
  end: number;
  title: string;
}

/** a part players can offer to skip (Up Next's skip_segments) */
export interface SkipSegment {
  kind: 'intro' | 'recap';
  start: number;
  end: number;
}

/** what a file's chapters mark, for players */
export interface ChapterMarkers {
  /** intros and recaps, in order */
  skip: SkipSegment[];
  /** where the end credits start (s); null if not marked */
  creditsAt: number | null;
}

/**
 * Whole chapter names (after a "2. " numbering), any case. Names that only
 * contain them don't count: Elementary has a 400 s scene called "Holmes and
 * Watson check out the crime scene, Opening Credits".
 */
const NAMES = {
  intro:
    /^(intro|opening (credits|titles|sequence)|title sequence|main titles?)$/i,
  recap: /^(previously( on\b.*)?|recap)$/i,
  credits: /^(((end|ending|closing) )?credits|end titles)$/i,
};
/** intros and recaps start in the first quarter, credits in the second half */
const SKIP_BEFORE = 0.25;
const CREDITS_AFTER = 0.5;
/** shorter ones aren't worth a button (Up Next hides it 1 s before the end) */
const MIN_SKIP = 10;
/** longer ones aren't intros or recaps */
const MAX_SKIP = 5 * 60;
/** back-to-back chapters of the same kind are one part */
const JOIN_GAP = 1;

/** chapters as ffprobe (fluent-ffmpeg) lists them, in order */
export function toChapters(
  probed: Array<Record<string, unknown>> | undefined,
): Chapter[] {
  return (probed ?? [])
    .map((chapter) => ({
      start: roundTime(Number(chapter.start_time)),
      end: roundTime(Number(chapter.end_time)),
      title: String(
        (chapter.tags as Record<string, unknown>)?.title ??
          chapter['TAG:title'] ??
          '',
      ).trim(),
    }))
    .filter(
      (chapter) =>
        Number.isFinite(chapter.start) &&
        Number.isFinite(chapter.end) &&
        chapter.end > chapter.start,
    )
    .sort((a, b) => a.start - b.start);
}

/** files.chapters; null if not read yet (or unreadable) */
export function parseChapters(json: string | null): Chapter[] | null {
  if (!json) {
    return null;
  }
  try {
    const chapters = JSON.parse(json);
    return Array.isArray(chapters) ? chapters : null;
  } catch (e) {
    return null;
  }
}

/** the file's length (s): its duration, else where its last chapter ends */
export function getPlayLength(
  chapters: Chapter[] | null,
  duration: number | null,
): number {
  return duration > 0
    ? duration
    : Math.max(0, ...(chapters ?? []).map((chapter) => chapter.end));
}

/** intros, recaps and end credits by the chapters' names, see NAMES */
export function getChapterMarkers(
  chapters: Chapter[] | null,
  duration: number | null,
): ChapterMarkers {
  const markers: ChapterMarkers = { skip: [], creditsAt: null };
  const length = getPlayLength(chapters, duration);
  if (!chapters?.length || !(length > 0)) {
    return markers;
  }

  for (const chapter of chapters) {
    const name = chapter.title.replace(/^\d+\s*[.):-]\s*/, '').trim();
    if (NAMES.credits.test(name)) {
      if (
        markers.creditsAt === null &&
        chapter.start >= length * CREDITS_AFTER &&
        chapter.start < length
      ) {
        markers.creditsAt = chapter.start;
      }
      continue;
    }

    const kind = NAMES.intro.test(name)
      ? 'intro'
      : NAMES.recap.test(name)
      ? 'recap'
      : null;
    if (!kind || chapter.start >= length * SKIP_BEFORE) {
      continue;
    }
    const last = markers.skip[markers.skip.length - 1];
    if (last?.kind === kind && chapter.start - last.end <= JOIN_GAP) {
      last.end = chapter.end;
    } else {
      markers.skip.push({ kind, start: chapter.start, end: chapter.end });
    }
  }

  markers.skip = markers.skip.filter(
    (segment) =>
      segment.end - segment.start >= MIN_SKIP &&
      segment.end - segment.start <= MAX_SKIP,
  );
  return markers;
}

function roundTime(seconds: number): number {
  return Math.round(seconds * 1000) / 1000;
}

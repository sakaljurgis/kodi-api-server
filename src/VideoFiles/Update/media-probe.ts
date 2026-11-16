import * as ffmpeg from 'fluent-ffmpeg';
import { Chapter, toChapters } from '../../Shared/Util/chapters';

export interface MediaInfo {
  /** s; null if ffprobe doesn't know it */
  duration: number | null;
  chapters: Chapter[];
}

/** a file's duration and chapters (ffprobe); null if it can't be read */
export function probeMedia(path: string): Promise<MediaInfo | null> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(path, ['-show_chapters'], (err, data) => {
      if (err) {
        return resolve(null);
      }
      const duration = Number(data.format?.duration);
      resolve({
        duration: Number.isFinite(duration) ? duration : null,
        chapters: toChapters(data.chapters),
      });
    });
  });
}

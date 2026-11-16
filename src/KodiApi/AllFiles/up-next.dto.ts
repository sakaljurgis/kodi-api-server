/** a file as players' "Up next" popup needs it (plain JSON, not the Kodi menu protocol) */
export interface UpNextEpisode {
  fileId: number;
  titleId: number;
  /** the listed title (show) */
  title: string;
  season: number | null;
  episode: number | null;
  fileName: string;
  /** server-relative, as in listings: `/api?path=all/play/<id>` */
  path: string;
  /** s, from ffprobe when the file was found; null if unknown */
  duration: number | null;
  /** as in listings: the season's poster and the show's backdrop (full urls) */
  thumb?: string;
  fanart?: string;
}

export interface UpNextDto {
  /** the file asked about; null if its title has no listed files */
  current: UpNextEpisode | null;
  /** the episode right after it in order; null for movies and last episodes */
  next: UpNextEpisode | null;
  /** share of the playback (0–1) from which to offer the next episode */
  popupAt: number;
}

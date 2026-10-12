import { WatchStateEntity } from '../../Shared/Entity/watch-state.entity';

/** what players get back: resume point and watched state, positions in seconds */
export class PlaybackStateDto {
  fileId: number;
  position: number;
  duration: number | null;
  watched: boolean;
  playcount: number;
  /** ms since epoch */
  lastPlayed: number | null;

  static fromEntity(state: WatchStateEntity): PlaybackStateDto {
    const dto = new PlaybackStateDto();
    dto.fileId = state.fileId;
    dto.position = state.position;
    dto.duration = state.duration;
    dto.watched = state.watched;
    dto.playcount = state.playCount;
    dto.lastPlayed = state.lastPlayed;

    return dto;
  }
}

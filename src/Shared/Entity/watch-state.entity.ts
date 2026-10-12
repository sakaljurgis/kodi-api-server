import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Playback state of a file, shared by all clients (Kodi, SKLK TV, ...).
 * Positions are in seconds, timestamps in ms since epoch.
 */
@Entity('watch_state')
export class WatchStateEntity {
  @PrimaryColumn({ name: 'file_id' })
  fileId: number;

  /** resume point, 0 if there is none */
  @Column({ type: 'float' })
  position: number;

  @Column({ type: 'float' })
  duration: number | null;

  @Column()
  watched: boolean;

  @Column({ name: 'play_count' })
  playCount: number;

  /** last played or marked watched; null if never (e.g. only hidden) */
  @Column({ name: 'last_played' })
  lastPlayed: number | null;

  @Column({ name: 'updated_at' })
  updatedAt: number;

  @Column()
  client: string | null;

  /** left out of Continue watching until it's played again */
  @Column()
  hidden: boolean;
}

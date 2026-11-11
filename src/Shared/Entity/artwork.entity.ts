import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TitleTypeEnum } from '../Enum/title-type.enum';

/**
 * Poster and backdrop of a movie or show from TMDB, by what was looked up
 * (see Artwork/artwork-query.ts): a movie file's film (title + year), a
 * show's title. Image paths are TMDB's ("/abc.jpg").
 */
@Entity('artwork')
export class ArtworkEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /** `<type>|<normalized query>|<year>` */
  @Column()
  key: string;

  @Column()
  type: TitleTypeEnum;

  /** what was searched for */
  @Column()
  query: string;

  @Column()
  year: number | null;

  /** null: nothing found (or "none" picked by hand) */
  @Column({ name: 'tmdb_id' })
  tmdbId: number | null;

  @Column({ name: 'tmdb_title' })
  tmdbTitle: string | null;

  @Column({ name: 'tmdb_year' })
  tmdbYear: number | null;

  @Column()
  poster: string | null;

  @Column()
  backdrop: string | null;

  /** shows: season posters, JSON `{"1": "/abc.jpg"}` */
  @Column()
  seasons: string | null;

  /** the match was picked on /library, never searched again */
  @Column()
  manual: boolean;

  @Column({ name: 'fetched_at' })
  fetchedAt: number;
}

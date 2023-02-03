import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TitleEntity } from './title.entity';
import { StreamProviderEnum } from '../Enum/stream-provider.enum';
import { TorrentEntity } from './torrent.entity';

@Entity('files')
export class FileEntity {
  @PrimaryColumn()
  id: number;

  @Column()
  path: string;

  @Column()
  deleted: boolean;

  @Column()
  size: number;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column()
  infos: string;

  @Column()
  info: string;

  @Column({ name: 'title_id' })
  titleId: number;

  @ManyToOne(() => TitleEntity, (title) => title.files)
  @JoinColumn({ name: 'title_id' })
  title: TitleEntity;

  @Column()
  season: number | null;

  @Column()
  duration: number;

  @Column({ name: 'stream_provider' })
  streamProvider: StreamProviderEnum;

  @Column({ name: 'relative_path' })
  relativePath: string;

  @Column({ name: 'transmission_id' })
  transmissionId: number;

  @Column()
  linkomanija: boolean;

  @Column({ name: 'torrent_id' })
  torrentId: number;

  @ManyToOne(() => TorrentEntity, (torrent) => torrent.files)
  @JoinColumn({ name: 'torrent_id' })
  torrent: TorrentEntity;

  @Column({ type: 'float' })
  progress: number;
}

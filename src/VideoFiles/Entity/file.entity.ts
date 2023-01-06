import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TitleEntity } from './title.entity';
import { StreamProviderEnum } from '../../Streamer/ReadStreamProvider/stream-provider.enum';

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

  //todo - consider if these 3 below should be better organized
  @Column()
  transmission: boolean;

  @Column()
  linkomanija: boolean;

  @Column()
  webtorrent: boolean;
}

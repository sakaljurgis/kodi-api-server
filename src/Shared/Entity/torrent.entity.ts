import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { FileEntity } from './file.entity';

@Entity('torrents')
export class TorrentEntity {
  @PrimaryColumn()
  id: number;

  @Column()
  magnet: string;

  @Column()
  name: string;

  @Column()
  path: string;

  @Column()
  stopped: boolean;

  @Column({ name: 'info_hash' })
  infoHash: string;

  @Column({ type: 'float' })
  progress: number;

  @OneToMany(() => FileEntity, (file) => file.torrent)
  files: FileEntity[];

  @Column()
  size: number;

  @Column({ name: 'transmission_id' })
  transmissionId: number;

  //todo - consider changing to a must-seed property for other private trackers (trl, etc)
  @Column()
  linkomanija: boolean;

  @Column()
  info: string;
}

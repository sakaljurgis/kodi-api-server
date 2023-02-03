import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { TitleTypeEnum } from '../Enum/title-type.enum';
import { FileEntity } from './file.entity';

@Entity('titles')
export class TitleEntity {
  @PrimaryColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  type: TitleTypeEnum;

  @OneToMany(() => FileEntity, (file) => file.title)
  files: FileEntity[];
}

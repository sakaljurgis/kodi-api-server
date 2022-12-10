import { Column, Entity, PrimaryColumn } from 'typeorm';
import { TitleTypeEnum } from '../Enum/title-type.enum';

@Entity('titles')
export class TitleEntity {
  @PrimaryColumn({ name: 'id' })
  id: number;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'type' })
  type: TitleTypeEnum;
}

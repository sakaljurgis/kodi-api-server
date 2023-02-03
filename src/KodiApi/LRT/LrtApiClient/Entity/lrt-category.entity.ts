import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('lrt_categories')
export class LrtCategory {
  @PrimaryColumn({ name: 'category_url' })
  categoryUrl: string;

  @Column({ name: 'category_id' })
  categoryId: string;

  @Column()
  title: string;

  @Column({ name: 'last_access' })
  lastAccess: number;

  @Column()
  thumb: string;
}

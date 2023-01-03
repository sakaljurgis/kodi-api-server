import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('lrt_categories')
export class LrtCategory {
  @PrimaryColumn({ name: 'category_url' })
  categoryUrl: string;

  @Column({ name: 'category_id' })
  categoryId: string;
}

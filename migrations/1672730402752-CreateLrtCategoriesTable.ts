import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLrtCategoriesTable1672730402752
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `create table lrt_categories
       (
           category_url TEXT,
           category_id  TEXT
       );`,
    );

    await queryRunner.query(
      `create index lrt_categories_category_url_index
          on lrt_categories (category_url);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE lrt_categories`);
  }
}

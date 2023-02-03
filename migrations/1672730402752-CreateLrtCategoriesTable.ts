import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLrtCategoriesTable1672730402752
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `create table lrt_categories
       (
           category_url VARCHAR(256),
           category_id  INTEGER,
           title        VARCHAR(128),
           last_access  TIMESTAMP,
           thumb        VARCHAR(256)
       );`,
    );

    await queryRunner.query(
      `create index lrt_categories_category_url_index
          on lrt_categories (category_url);`,
    );

    await queryRunner.query(
      `create index lrt_categories_category_id
          on lrt_categories (category_id);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE lrt_categories`);
  }
}

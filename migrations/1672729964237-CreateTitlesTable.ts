import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTitlesTable1672729964237 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `create table titles
       (
           id    INTEGER
               primary key autoincrement,
           title VARCHAR(512),
           type  VARCHAR(50)
       );`,
    );

    await queryRunner.query(
      `create unique index title_type
          on titles (title, type);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE titles`);
  }

}

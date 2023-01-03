import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFilesTable1672729641013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `create table files
       (
           id           INTEGER
               primary key autoincrement,
           path         VARCHAR(512),
           deleted      TINYINT,
           size         INTEGER,
           file_name    VARCHAR(512),
           infos        TEXT,
           info         TEXT,
           title_id     INTEGER,
           season       INTEGER default NULL,
           duration     REAL,
           transmission INTEGER default NULL,
           lm           INTEGER default NULL
       );`,
    );

    await queryRunner.query(
      `create unique index path
          on files (path);`,
    );

    await queryRunner.query(
      `create index season
          on files (season);`,
    );

    await queryRunner.query(
      `create index title_id
          on files (title_id);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE files`);
  }
}

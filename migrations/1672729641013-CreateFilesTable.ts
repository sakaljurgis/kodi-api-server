import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFilesTable1672729641013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `create table files
       (
           id              INTEGER
               primary key autoincrement,
           path            VARCHAR(512),
           relative_path   TEXT,
           deleted         TINYINT,
           size            INTEGER,
           file_name       VARCHAR(512),
           infos           TEXT,
           info            TEXT,
           title_id        INTEGER,
           season          INTEGER default NULL,
           duration        REAL,
           transmission_id INTEGER default NULL,
           linkomanija     INTEGER default NULL,
           progress        REAL,
           stream_provider TEXT    default 'fs' not null
       );`,
    );

    await queryRunner.query(
      `create unique index files_path
          on files (path);`,
    );

    await queryRunner.query(
      `create index files_season
          on files (season);`,
    );

    await queryRunner.query(
      `create index files_title_id
          on files (title_id);`,
    );

    await queryRunner.query(
      `create index files_relative_path
          on files (relative_path);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE files`);
  }
}

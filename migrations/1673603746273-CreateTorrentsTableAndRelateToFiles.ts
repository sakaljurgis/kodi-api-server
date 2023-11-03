import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTorrentsTableAndRelateToFiles1673603746273
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table files
          add torrent_id INTEGER;`,
    );

    await queryRunner.query(
      `create index file_torrent_id
          on files (torrent_id);`,
    );

    await queryRunner.query(
      `create table torrents
       (
           id              INTEGER primary key autoincrement,
           magnet          VARCHAR(512),
           name            VARCHAR(256),
           path            VARCHAR(512),
           size            INTEGER,
           stopped         TINYINT,
           info_hash       VARCHAR(64),
           progress        REAL,
           transmission_id INTEGER,
           linkomanija     TINYINT,
           info            TEXT
       );`,
    );

    await queryRunner.query(
      `create unique index torrent_magnet
          on torrents (magnet);`,
    );

    await queryRunner.query(
      `create unique index torrent_transmission_id
          on torrents (transmission_id);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table files
          drop column torrent_id;`,
    );

    await queryRunner.query(`DROP TABLE torrents`);
  }
}

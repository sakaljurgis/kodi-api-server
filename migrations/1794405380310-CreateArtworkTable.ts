import { MigrationInterface, QueryRunner } from 'typeorm';

/** posters and backdrops from TMDB, one row per movie/show looked up */
export class CreateArtworkTable1794405380310 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `create table artwork
       (
           id         INTEGER primary key autoincrement,
           key        VARCHAR not null unique,
           type       VARCHAR(8) not null,
           query      VARCHAR not null,
           year       INTEGER,
           tmdb_id    INTEGER,
           tmdb_title VARCHAR,
           tmdb_year  INTEGER,
           poster     VARCHAR,
           backdrop   VARCHAR,
           seasons    TEXT,
           manual     TINYINT default 0 not null,
           fetched_at INTEGER not null
       );`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE artwork`);
  }
}

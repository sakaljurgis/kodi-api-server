import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWatchStateTable1791786266498 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `create table watch_state
       (
           file_id     INTEGER primary key,
           position    REAL    default 0 not null,
           duration    REAL,
           watched     TINYINT default 0 not null,
           play_count  INTEGER default 0 not null,
           last_played INTEGER,
           updated_at  INTEGER not null,
           client      VARCHAR(32),
           hidden      TINYINT default 0 not null
       );`,
    );

    await queryRunner.query(
      `create index watch_state_last_played
          on watch_state (last_played);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE watch_state`);
  }
}

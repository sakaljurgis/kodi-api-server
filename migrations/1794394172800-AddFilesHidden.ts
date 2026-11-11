import { MigrationInterface, QueryRunner } from 'typeorm';

/** hidden from the library's lists by hand (e.g. a release kept only for seeding) */
export class AddFilesHidden1794394172800 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE files ADD COLUMN hidden TINYINT NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE files DROP COLUMN hidden`);
  }
}

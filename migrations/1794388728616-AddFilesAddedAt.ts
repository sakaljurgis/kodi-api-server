import { MigrationInterface, QueryRunner } from 'typeorm';

/** when a file was first found (ms epoch); null for files found before this */
export class AddFilesAddedAt1794388728616 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE files ADD COLUMN added_at INTEGER`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE files DROP COLUMN added_at`);
  }
}

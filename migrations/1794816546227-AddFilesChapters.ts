import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * the file's chapters as ffprobe read them (JSON `[{start, end, title}]`, s);
 * null = not read yet, `[]` = none
 */
export class AddFilesChapters1794816546227 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE files ADD COLUMN chapters TEXT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE files DROP COLUMN chapters`);
  }
}

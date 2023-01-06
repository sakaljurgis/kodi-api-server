import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameLinkomanijaColumnInFilesTable1673010469305
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE files RENAME COLUMN lm to linkomanija;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE files RENAME COLUMN linkomanija to lm;`,
    );
  }
}

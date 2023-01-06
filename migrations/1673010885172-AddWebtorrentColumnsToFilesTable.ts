import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWebtorrentColumnsToFilesTable1673010885172
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table files
          add webtorrent INTEGER;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table files
          drop column webtorrent;`,
    );
  }
}

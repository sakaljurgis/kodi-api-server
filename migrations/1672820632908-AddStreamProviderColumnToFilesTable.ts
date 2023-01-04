import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStreamProviderColumnToFilesTable1672820632908
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table files
          add stream_provider TEXT default 'fs' not null;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table files
          drop column stream_provider;`,
    );
  }
}

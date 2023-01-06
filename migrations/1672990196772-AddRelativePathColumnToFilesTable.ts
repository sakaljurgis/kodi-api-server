import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelativePathColumnToFilesTable1672990196772
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table files
          add relative_path TEXT;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table files
          drop column relative_path;`,
    );
  }
}

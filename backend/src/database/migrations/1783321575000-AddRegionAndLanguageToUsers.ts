import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegionAndLanguageToUsers1783321575000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN region VARCHAR(255) DEFAULT NULL,
      ADD COLUMN language VARCHAR(50) DEFAULT 'en';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN region,
      DROP COLUMN language;
    `);
  }
}

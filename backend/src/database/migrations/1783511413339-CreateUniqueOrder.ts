import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUniqueOrder1783511413339 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNIQUE INDEX idx_unique_active_buyer_listing 
            ON orders (buyer_id, listing_id) 
            WHERE status IN ('pending', 'pending_agent_confirmation', 'pending_sms_confirmation', 'negotiating', 'confirmed');
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drops the partial index safely during rollback sequences
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_unique_active_buyer_listing;
        `);
    }

}
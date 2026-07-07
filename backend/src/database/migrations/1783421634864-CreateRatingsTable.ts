import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRatingsTable1783421634864 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await queryRunner.query(`
            CREATE TABLE ratings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                rater_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                ratee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
                role_rated VARCHAR(20) NOT NULL,
                score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
                comment TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (rater_id, order_id)
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS ratings CASCADE;
        `);
    }

}

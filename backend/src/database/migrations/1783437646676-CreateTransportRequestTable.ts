import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTransportRequestTable1783437646676 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis";`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_status') THEN
                    CREATE TYPE transport_status AS ENUM (
                        'open', 
                        'accepted', 
                        'en_route', 
                        'picked_up', 
                        'in_transit', 
                        'delivered', 
                        'cancelled'
                    );
                END IF;
            END
            $$;
        `);
    await queryRunner.query(`
            CREATE TABLE transport_requests (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
                transporter_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL until accepted
                pickup_location GEOMETRY(Point, 4326) NOT NULL,
                dropoff_location GEOMETRY(Point, 4326) NOT NULL,
                distance_km NUMERIC(8, 2), -- calculated by PostGIS
                estimated_cost_ghs NUMERIC(10, 2),
                packaging_type_name VARCHAR(255), -- denormalised for transporter briefing
                special_handling TEXT,
                status transport_status NOT NULL DEFAULT 'open',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX idx_transport_order_id ON transport_requests(order_id);
            CREATE INDEX idx_transport_transporter_id ON transport_requests(transporter_id);
            CREATE INDEX idx_transport_status ON transport_requests(status);
            CREATE INDEX idx_transport_pickup ON transport_requests USING GIST(pickup_location);

            CREATE TRIGGER update_transport_modtime
                BEFORE UPDATE ON transport_requests
                FOR EACH ROW
                EXECUTE FUNCTION update_modified_column();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE IF EXIST transport_requests;
            DROP TYPE IF EXIST transport_status;
        `);
  }
}

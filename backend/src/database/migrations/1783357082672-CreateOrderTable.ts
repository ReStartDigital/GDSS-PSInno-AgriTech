import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrderTable1783357082672 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create the detailed order status enum matching your state machine code
    await queryRunner.query(`
      CREATE TYPE order_status AS ENUM (
        'pending', 
        'pending_agent_confirmation', 
        'pending_sms_confirmation', 
        'negotiating', 
        'confirmed', 
        'packed', 
        'in_transit', 
        'delivered', 
        'collected', 
        'cancelled', 
        'cancelled_expired', 
        'farmer_disputed'
      );
    `);

    // 2. Create the order_mode enum and add it to the users table
    await queryRunner.query(`
      CREATE TYPE order_mode AS ENUM ('auto', 'agent', 'sms_reply');
      ALTER TABLE users ADD COLUMN order_mode order_mode NOT NULL DEFAULT 'auto';
    `);

    // 3. Create the orders table (with syntax bugs fixed)
    await queryRunner.query(`
      CREATE TABLE orders (
        id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        buyer_id                    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        farmer_id                   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        listing_id                  UUID NOT NULL REFERENCES produce_listings(id) ON DELETE RESTRICT,
        
        mode                        fulfillment_mode NOT NULL DEFAULT 'delivery',

        quantity_kg                 NUMERIC(10, 2) NOT NULL CHECK (quantity_kg > 0),
        price_per_kg_ghs            NUMERIC(10, 2) NOT NULL,
        negotiated_price_per_kg_ghs NUMERIC(10, 2),
        produce_subtotal_ghs        NUMERIC(12, 2) NOT NULL,
        
        packaging_type_id           UUID REFERENCES packaging_options(id) ON DELETE SET NULL,
        
        transport_cost_estimate_ghs NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        total_ghs                   NUMERIC(12, 2) NOT NULL,
        
        delivery_address            TEXT,
        delivery_location           GEOMETRY(Point, 4326),
        
        status                      order_status NOT NULL DEFAULT 'pending',
        cancelled_by                UUID REFERENCES users(id) ON DELETE SET NULL,
        cancellation_reason         TEXT,
        
        created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT chk_delivery_details CHECK (
            (mode = 'delivery' AND delivery_address IS NOT NULL) OR 
            (mode = 'pickup')
        )
      );

      CREATE INDEX idx_orders_buyer_id   ON orders(buyer_id);
      CREATE INDEX idx_orders_farmer_id  ON orders(farmer_id);
      CREATE INDEX idx_orders_listing_id ON orders(listing_id);
      CREATE INDEX idx_orders_status     ON orders(status);
      CREATE INDEX idx_orders_mode       ON orders(mode);
      CREATE INDEX idx_orders_location   ON orders USING GIST(delivery_location);

      CREATE TRIGGER update_orders_modtime
          BEFORE UPDATE ON orders
          FOR EACH ROW
          EXECUTE FUNCTION update_modified_column();    
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS orders CASCADE;
      ALTER TABLE users DROP COLUMN IF EXISTS order_mode;
      DROP TYPE IF EXISTS order_mode;
      DROP TYPE IF EXISTS order_status;
    `);
  }
}

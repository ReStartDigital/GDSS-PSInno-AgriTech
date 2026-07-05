import type { MigrationInterface, QueryRunner } from "typeorm";

export class PackagingOptionsAndProductListings1783216802569 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── packaging_options ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE protection_level AS ENUM ('low', 'medium', 'high');
    `);

    await queryRunner.query(`
      CREATE TABLE packaging_options (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name                VARCHAR(255) NOT NULL,
        capacity_kg         NUMERIC(8,2) NOT NULL,
        cost_per_unit_ghs   NUMERIC(10,2) NOT NULL,
        suitable_for        TEXT[] NOT NULL,
        protection_level    protection_level NOT NULL,
        description         TEXT,
        guidelines_text     TEXT,
        image_url           TEXT,
        is_active           BOOLEAN NOT NULL DEFAULT TRUE,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Seed the 5 standard packaging options
    await queryRunner.query(`
      INSERT INTO packaging_options
        (name, capacity_kg, cost_per_unit_ghs, suitable_for, protection_level, description)
      VALUES
        ('Ventilated Crates',  15, 8.00,  ARRAY['tomatoes','peppers','garden eggs'],                   'high',   'Stackable plastic crates with ventilation holes. Best for fragile produce.'),
        ('Plastic Baskets',    20, 5.50,  ARRAY['garden eggs','okra','tomatoes'],                      'medium', 'Durable reusable baskets. Good general-purpose option.'),
        ('Mesh Bags',          10, 1.50,  ARRAY['leafy greens','spinach','cabbage'],                   'low',    'Lightweight breathable bags. Suitable for produce that needs airflow.'),
        ('Export-grade Boxes', 12, 12.00, ARRAY['tomatoes','peppers','garden eggs','exotic produce'],  'high',   'Corrugated boxes meeting export standards. For premium or export buyers.'),
        ('Bulk Sacks',         50, 2.00,  ARRAY['yams','cassava','plantain','root vegetables'],        'low',    'Heavy-duty woven sacks for high-volume root vegetable transport.');
    `);

    // ── produce_listings ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE listing_status AS ENUM ('active', 'sold', 'cancelled');
    `);

    await queryRunner.query(`
      CREATE TABLE produce_listings (
        id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        farmer_id                   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        vegetable_type              VARCHAR(100) NOT NULL,
        quantity_kg                 NUMERIC(10,2) NOT NULL CHECK (quantity_kg > 0),
        price_per_kg_ghs            NUMERIC(10,2) NOT NULL CHECK (price_per_kg_ghs > 0),
        harvest_date                DATE NOT NULL,
        images                      JSONB NOT NULL DEFAULT '[]',
        recommended_packaging_id    UUID REFERENCES packaging_options(id) ON DELETE SET NULL,
        location                    GEOMETRY(Point, 4326) NOT NULL,
        status                      listing_status NOT NULL DEFAULT 'active',
        auto_confirm_until_kg       NUMERIC(10,2),
        auto_confirm_price_floor_ghs NUMERIC(10,2),
        committed_kg                NUMERIC(10,2) NOT NULL DEFAULT 0,
        supports_delivery           BOOLEAN NOT NULL DEFAULT TRUE,
        supports_pickup             BOOLEAN NOT NULL DEFAULT TRUE,
        created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_committed_within_ceiling
          CHECK (committed_kg <= COALESCE(auto_confirm_until_kg, committed_kg)),
        CONSTRAINT chk_at_least_one_fulfilment_mode
          CHECK (supports_delivery = TRUE OR supports_pickup = TRUE)
      );
    `);

    await queryRunner.query(
      `CREATE INDEX idx_listings_farmer_id    ON produce_listings(farmer_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_listings_status        ON produce_listings(status);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_listings_vegetable     ON produce_listings(vegetable_type);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_listings_location      ON produce_listings USING GIST(location);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_listings_harvest_date  ON produce_listings(harvest_date);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS produce_listings CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS listing_status;`);
    await queryRunner.query(`DROP TABLE IF EXISTS packaging_options CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS protection_level;`);
  }
}

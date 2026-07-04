import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialAuthAndUsers1782749693448 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        -- Enable PostGIS and UUID dependencies
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS postgis;

        -- Reusable trigger function to automatically manage updated_at sequences
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Global Application Context Enums
        CREATE TYPE user_role AS ENUM ('farmer', 'buyer', 'transporter', 'agent', 'admin');
        CREATE TYPE listing_status AS ENUM ('active', 'sold', 'cancelled');
        CREATE TYPE order_status AS ENUM ('pending', 'negotiating', 'confirmed', 'packed', 'in_transit', 'delivered', 'cancelled');
        CREATE TYPE fulfillment_mode AS ENUM ('pickup', 'delivery');
        CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');
        CREATE TYPE payment_channel AS ENUM ('mobile_money', 'card');
        CREATE TYPE mobile_money_provider AS ENUM ('mtn', 'vodafone', 'airteltigo', 'telecel');
        CREATE TYPE transport_status AS ENUM ('open', 'accepted', 'en_route', 'picked_up', 'in_transit', 'delivered', 'cancelled');
        CREATE TYPE protection_level AS ENUM ('low', 'medium', 'high');
        CREATE TYPE sms_status AS ENUM ('sent', 'failed');
        CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYMENT');

        -- Users Layout
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          phone VARCHAR(20) NOT NULL UNIQUE,
          first_name VARCHAR(255) NOT NULL,
          middle_name VARCHAR(255) DEFAULT NULL,
          last_name VARCHAR(255) NOT NULL,
          role user_role NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE, 
          pin_hash VARCHAR(255), 
          profile_photo_url TEXT,
          location GEOMETRY(Point, 4326), 

          -- ✨ Financial Routing Parameters
          payment_details_set BOOLEAN NOT NULL DEFAULT FALSE,
          mobile_money_number VARCHAR(20) DEFAULT NULL,
          mobile_money_network VARCHAR(50) DEFAULT NULL,
          paystack_subaccount_code VARCHAR(100) DEFAULT NULL,

          phone_verified_at TIMESTAMPTZ DEFAULT NULL,
          is_active BOOLEAN NOT NULL DEFAULT FALSE,
          deleted_at TIMESTAMPTZ DEFAULT NULL,

          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Performance Indices for Users
        CREATE INDEX idx_users_phone ON users(phone);
        CREATE INDEX idx_users_role ON users(role);
        CREATE INDEX idx_users_location ON users USING GIST(location); 
        CREATE INDEX idx_users_active_role ON users(is_active, role);

        -- Agent Clients Assignment Track Matrix
        CREATE TABLE agent_assignments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
          assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          unassigned_at TIMESTAMPTZ DEFAULT NULL
        );

        -- Verification Trigger: Guarantees agent_id maps strictly to an Agent role
        CREATE OR REPLACE FUNCTION verify_agent_role()
        RETURNS TRIGGER AS $$
        BEGIN
            IF (SELECT role FROM users WHERE id = NEW.agent_id) != 'agent' THEN
                RAISE EXCEPTION 'The assigned agent_id must belong to a user with the agent role.';
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trg_verify_agent_role
            BEFORE INSERT OR UPDATE ON agent_assignments
            FOR EACH ROW
            EXECUTE FUNCTION verify_agent_role();

        -- Relational Tracking Indices
        CREATE INDEX idx_agent_assignments_agent ON agent_assignments(agent_id);
        CREATE INDEX idx_agent_assignments_user ON agent_assignments(user_id) WHERE (unassigned_at IS NULL);
        
        -- Guardrail: Restricts a client to only having one active agent link concurrently
        CREATE UNIQUE INDEX idx_unique_active_user_agent 
            ON agent_assignments(user_id) 
            WHERE (unassigned_at IS NULL);

        -- Security Session Matrix
        CREATE TABLE refresh_tokens (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash VARCHAR(64) NOT NULL UNIQUE, 
          expires_at TIMESTAMPTZ NOT NULL,
          revoked_at TIMESTAMPTZ DEFAULT NULL, 
          user_agent TEXT,
          ip_address INET,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
            
        -- Wire mutation modifier triggers
        CREATE TRIGGER update_users_modtime
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        -- Drop triggers explicitly
        DROP TRIGGER IF EXISTS update_users_modtime ON users;
        DROP TRIGGER IF EXISTS trg_verify_agent_role ON agent_assignments;

        -- Drop tables in safe relational reference dependency order
        DROP TABLE IF EXISTS refresh_tokens;
        DROP TABLE IF EXISTS agent_assignments;
        DROP TABLE IF EXISTS users;

        -- Drop custom logic tracking routing functions
        DROP FUNCTION IF EXISTS verify_agent_role();
        DROP FUNCTION IF EXISTS update_modified_column();

        -- Drop custom application system enums
        DROP TYPE IF EXISTS audit_action;
        DROP TYPE IF EXISTS sms_status;
        DROP TYPE IF EXISTS protection_level;
        DROP TYPE IF EXISTS transport_status;
        DROP TYPE IF EXISTS mobile_money_provider;
        DROP TYPE IF EXISTS payment_channel;
        DROP TYPE IF EXISTS payment_status;
        DROP TYPE IF EXISTS fulfillment_mode;
        DROP TYPE IF EXISTS order_status;
        DROP TYPE IF EXISTS listing_status;
        DROP TYPE IF EXISTS user_role;
    `);
  }
}

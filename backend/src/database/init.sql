-- Enable PostGIS for geolocation queries
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Reusable function to auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enums
CREATE TYPE user_role AS ENUM ('farmer', 'buyer', 'transporter', 'agent', 'admin');
CREATE TYPE listing_status AS ENUM ('active', 'sold', 'cancelled');
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
CREATE TYPE fulfillment_mode AS ENUM ('pickup', 'delivery');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE payment_channel AS ENUM ('mobile_money', 'card');
CREATE TYPE mobile_money_provider AS ENUM ('mtn', 'vodafone', 'airteltigo', 'telecel'); -- Fixed spelling
CREATE TYPE transport_status AS ENUM ('open', 'accepted', 'en_route', 'picked_up', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE protection_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE sms_status AS ENUM ('sent', 'failed');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYMENT');

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

 -- ✨ Added demographic fields
 region VARCHAR(255) DEFAULT NULL,
 language VARCHAR(50) DEFAULT 'en',

 -- ✨ Added Payout routing targets
 payment_details_set BOOLEAN NOT NULL DEFAULT FALSE,
 mobile_money_number VARCHAR(20) DEFAULT NULL,
 mobile_money_network VARCHAR(50) DEFAULT NULL,
 paystack_subaccount_code VARCHAR(100) DEFAULT NULL,

 phone_verified_at TIMESTAMPTZ,
 is_active BOOLEAN NOT NULL DEFAULT FALSE,
 deleted_at TIMESTAMPTZ,

 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_location ON users USING GIST(location); 
CREATE INDEX idx_users_active_role ON users(is_active, role);

CREATE TABLE agent_assignments (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 unassigned_at TIMESTAMPTZ
);

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

CREATE INDEX idx_agent_assignments_agent ON agent_assignments(agent_id);
CREATE INDEX idx_agent_assignments_user ON agent_assignments(user_id) WHERE (is_active = TRUE);

CREATE UNIQUE INDEX idx_unique_active_user_agent 
    ON agent_assignments(user_id) 
    WHERE is_active = TRUE;

CREATE TABLE refresh_tokens (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash VARCHAR(64) NOT NULL UNIQUE, 
 expires_at TIMESTAMPTZ NOT NULL,
 revoked_at TIMESTAMPTZ, 
 user_agent TEXT,
 ip_address INET,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rt_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_rt_token_hash ON refresh_tokens(token_hash);
    
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TABLE packaging_options (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 name VARCHAR(255) NOT NULL,
 capacity_kg NUMERIC(8, 2) NOT NULL,
 suitable_for TEXT[] NOT NULL, -- e.g. ARRAY['tomatoes','peppers']
 protection_level protection_level NOT NULL,
 description TEXT,
 guidelines_text TEXT,
 image_url TEXT,
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE produce_listings (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 vegetable_type VARCHAR(100) NOT NULL,
 quantity_kg NUMERIC(10, 2) NOT NULL CHECK (quantity_kg > 0),
 price_per_kg_ghs NUMERIC(10, 2) NOT NULL CHECK (price_per_kg_ghs > 0),
 packaging_cost_per_unit_ghs NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (packaging_cost_per_unit_ghs >= 0),
 harvest_date DATE NOT NULL,
 images JSONB NOT NULL DEFAULT '[]', -- Cloudinary URL array
 recommended_packaging_id UUID REFERENCES packaging_options(id) ON DELETE SET NULL,
 location GEOMETRY(Point, 4326) NOT NULL,
 status listing_status NOT NULL DEFAULT 'active',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_farmer_id ON produce_listings(farmer_id);
CREATE INDEX idx_listings_status ON produce_listings(status);
CREATE INDEX idx_listings_veg_type ON produce_listings(vegetable_type);
CREATE INDEX idx_listings_location ON produce_listings USING GIST(location);

CREATE TYPE order_mode AS ENUM ('auto', 'agent', 'sms_reply');
ALTER TABLE users ADD COLUMN order_mode order_mode NOT NULL DEFAULT 'auto';

CREATE TABLE orders (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 listing_id UUID NOT NULL REFERENCES produce_listings(id) ON DELETE RESTRICT,
 
 mode fulfillment_mode NOT NULL DEFAULT 'delivery',

 quantity_kg NUMERIC(10, 2) NOT NULL CHECK (quantity_kg > 0),
 price_per_kg_ghs NUMERIC(10, 2) NOT NULL, -- locked at order time
 negotiated_price_per_kg_ghs NUMERIC(10, 2), -- set if negotiation occurred
 produce_subtotal_ghs NUMERIC(12, 2) NOT NULL,

 packaging_type_id UUID REFERENCES packaging_options(id) ON DELETE SET NULL,

 transport_cost_estimate_ghs NUMERIC(10, 2) NOT NULL DEFAULT 0,
 total_ghs NUMERIC(12, 2) NOT NULL,
 
 delivery_address TEXT,
 delivery_location GEOMETRY(Point, 4326), -- buyer delivery GPS
 
 status order_status NOT NULL DEFAULT 'pending',
 cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
 cancellation_reason TEXT,

 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

 CONSTRAINT chk_delivery_details CHECK (
    (mode = 'delivery' AND delivery_address IS NOT NULL) OR 
    (mode = 'pickup')
 )
);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_farmer_id ON orders(farmer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_listing_id ON orders(listing_id);
CREATE INDEX idx_orders_mode ON orders(mode);

CREATE TRIGGER update_orders_modtime
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
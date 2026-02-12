-- Description: Add missing columns to existing tables for TerraFusion schema alignment

-- Helper function to check if a column exists before adding it
CREATE OR REPLACE FUNCTION column_exists(tab text, col text) RETURNS boolean AS $$
DECLARE
    exists boolean;
BEGIN
    SELECT count(*) > 0 INTO exists
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = tab
      AND column_name = col;
    RETURN exists;
END;
$$ LANGUAGE plpgsql;

-- Properties table updates
DO $$ 
BEGIN
    -- Add missing columns to properties table
    IF NOT column_exists('properties', 'parcel_id') THEN
        ALTER TABLE properties ADD COLUMN parcel_id TEXT;
    END IF;
    
    IF NOT column_exists('properties', 'property_identifier') THEN
        ALTER TABLE properties ADD COLUMN property_identifier TEXT;
    END IF;
    
    IF NOT column_exists('properties', 'acreage') THEN
        ALTER TABLE properties ADD COLUMN acreage NUMERIC(10, 2);
    END IF;
    
    IF NOT column_exists('properties', 'square_feet') THEN
        ALTER TABLE properties ADD COLUMN square_feet INTEGER;
    END IF;
    
    IF NOT column_exists('properties', 'last_sale_date') THEN
        ALTER TABLE properties ADD COLUMN last_sale_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT column_exists('properties', 'last_sale_amount') THEN
        ALTER TABLE properties ADD COLUMN last_sale_amount NUMERIC(12, 2);
    END IF;
    
    IF NOT column_exists('properties', 'latitude') THEN
        ALTER TABLE properties ADD COLUMN latitude NUMERIC(10, 6);
    END IF;
    
    IF NOT column_exists('properties', 'longitude') THEN
        ALTER TABLE properties ADD COLUMN longitude NUMERIC(10, 6);
    END IF;
    
    IF NOT column_exists('properties', 'metadata') THEN
        ALTER TABLE properties ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    IF NOT column_exists('properties', 'enable_r_l_s') THEN
        ALTER TABLE properties ADD COLUMN enable_r_l_s BOOLEAN DEFAULT TRUE;
    END IF;

    -- Compliance checks table updates
    IF NOT column_exists('compliance_checks', 'check_result') THEN
        ALTER TABLE compliance_checks ADD COLUMN check_result TEXT;
    END IF;
    
    IF NOT column_exists('compliance_checks', 'description') THEN
        ALTER TABLE compliance_checks ADD COLUMN description TEXT;
    END IF;
    
    IF NOT column_exists('compliance_checks', 'details') THEN
        ALTER TABLE compliance_checks ADD COLUMN details JSONB DEFAULT '{}';
    END IF;
    
    IF NOT column_exists('compliance_checks', 'rule') THEN
        ALTER TABLE compliance_checks ADD COLUMN rule TEXT;
    END IF;
    
    IF NOT column_exists('compliance_checks', 'recommendation') THEN
        ALTER TABLE compliance_checks ADD COLUMN recommendation TEXT;
    END IF;
    
    IF NOT column_exists('compliance_checks', 'enable_r_l_s') THEN
        ALTER TABLE compliance_checks ADD COLUMN enable_r_l_s BOOLEAN DEFAULT TRUE;
    END IF;

    -- Sketches table updates
    IF NOT column_exists('sketches', 'title') THEN
        ALTER TABLE sketches ADD COLUMN title TEXT;
    END IF;
    
    IF NOT column_exists('sketches', 'description') THEN
        ALTER TABLE sketches ADD COLUMN description TEXT;
    END IF;
    
    IF NOT column_exists('sketches', 'sketch_url') THEN
        ALTER TABLE sketches ADD COLUMN sketch_url TEXT;
    END IF;
    
    IF NOT column_exists('sketches', 'sketch_data') THEN
        ALTER TABLE sketches ADD COLUMN sketch_data TEXT;
    END IF;
    
    IF NOT column_exists('sketches', 'square_footage') THEN
        ALTER TABLE sketches ADD COLUMN square_footage INTEGER;
    END IF;
    
    IF NOT column_exists('sketches', 'scale') THEN
        ALTER TABLE sketches ADD COLUMN scale TEXT;
    END IF;
    
    IF NOT column_exists('sketches', 'notes') THEN
        ALTER TABLE sketches ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT column_exists('sketches', 'enable_r_l_s') THEN
        ALTER TABLE sketches ADD COLUMN enable_r_l_s BOOLEAN DEFAULT TRUE;
    END IF;

    -- Photos table updates
    IF NOT column_exists('photos', 'enable_r_l_s') THEN
        ALTER TABLE photos ADD COLUMN enable_r_l_s BOOLEAN DEFAULT TRUE;
    END IF;

    -- Real estate terms table updates
    IF NOT column_exists('real_estate_terms', 'definition') THEN
        ALTER TABLE real_estate_terms ADD COLUMN definition TEXT;
    END IF;
    
    IF NOT column_exists('real_estate_terms', 'contextual_explanation') THEN
        ALTER TABLE real_estate_terms ADD COLUMN contextual_explanation TEXT;
    END IF;
    
    IF NOT column_exists('real_estate_terms', 'is_common') THEN
        ALTER TABLE real_estate_terms ADD COLUMN is_common BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT column_exists('real_estate_terms', 'source') THEN
        ALTER TABLE real_estate_terms ADD COLUMN source TEXT;
    END IF;
    
    IF NOT column_exists('real_estate_terms', 'enable_r_l_s') THEN
        ALTER TABLE real_estate_terms ADD COLUMN enable_r_l_s BOOLEAN DEFAULT TRUE;
    END IF;

    -- Orders table updates
    IF NOT column_exists('orders', 'enable_r_l_s') THEN
        ALTER TABLE orders ADD COLUMN enable_r_l_s BOOLEAN DEFAULT TRUE;
    END IF;

    -- Property share links table updates
    IF NOT column_exists('property_share_links', 'enable_r_l_s') THEN
        ALTER TABLE property_share_links ADD COLUMN enable_r_l_s BOOLEAN DEFAULT TRUE;
    END IF;

    -- Users table updates
    IF NOT column_exists('users', 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
    
    IF NOT column_exists('users', 'department') THEN
        ALTER TABLE users ADD COLUMN department TEXT;
    END IF;
    
    IF NOT column_exists('users', 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT column_exists('users', 'last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT column_exists('users', 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT column_exists('users', 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT column_exists('users', 'enable_r_l_s') THEN
        ALTER TABLE users ADD COLUMN enable_r_l_s BOOLEAN DEFAULT TRUE;
    END IF;
    
END $$;

-- Add new tables that exist in schema but not in database
DO $$ 
BEGIN
    -- ai_agents table
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_agents') THEN
        CREATE TABLE ai_agents (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            capabilities JSONB DEFAULT '{}',
            api_endpoint TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            enable_r_l_s BOOLEAN DEFAULT TRUE
        );
    END IF;

    -- api_keys table
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_keys') THEN
        CREATE TABLE api_keys (
            id SERIAL PRIMARY KEY,
            key TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE,
            last_used_at TIMESTAMP WITH TIME ZONE,
            enabled BOOLEAN DEFAULT TRUE,
            permissions JSONB DEFAULT '{}',
            enable_r_l_s BOOLEAN DEFAULT TRUE
        );
    END IF;

    -- plugins table
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plugins') THEN
        CREATE TABLE plugins (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            version TEXT NOT NULL,
            enabled BOOLEAN DEFAULT TRUE,
            config JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            enable_r_l_s BOOLEAN DEFAULT TRUE
        );
    END IF;
END $$;

-- Clean up helper function when done
DROP FUNCTION column_exists(text, text);
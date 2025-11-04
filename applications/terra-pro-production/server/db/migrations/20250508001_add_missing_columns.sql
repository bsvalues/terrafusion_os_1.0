-- Migration to add missing columns that are defined in the schema but missing in the database
-- This migration uses functions to check if columns exist before attempting to add them

-- Functions to check if schema and table exist
DO $$
DECLARE
  schema_exists BOOLEAN;
BEGIN
  -- Check if drizzle schema exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'drizzle'
  ) INTO schema_exists;
  
  -- Create schema if it doesn't exist
  IF NOT schema_exists THEN
    EXECUTE 'CREATE SCHEMA drizzle';
  END IF;
END $$;

-- Create migrations table if it doesn't exist
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if migrations table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'drizzle' AND table_name = 'migrations'
  ) INTO table_exists;
  
  -- Create migrations table if it doesn't exist
  IF NOT table_exists THEN
    CREATE TABLE drizzle.migrations (
      id TEXT PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
END $$;

-- Set up a function to check if a column exists before adding it
CREATE OR REPLACE FUNCTION column_exists(
    _table_name text, 
    _column_name text
) RETURNS BOOLEAN AS $$
DECLARE
    exists_result BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = _table_name
        AND column_name = _column_name
    ) INTO exists_result;
    
    RETURN exists_result;
END;
$$ LANGUAGE plpgsql;

-- Properties table columns
DO $$
BEGIN
    -- Add parcel_id if it doesn't exist
    IF NOT column_exists('properties', 'parcel_id') THEN
        ALTER TABLE properties ADD COLUMN parcel_id TEXT UNIQUE;
    END IF;
    
    -- Add property_identifier if it doesn't exist
    IF NOT column_exists('properties', 'property_identifier') THEN
        ALTER TABLE properties ADD COLUMN property_identifier TEXT;
    END IF;
    
    -- Add acreage if it doesn't exist
    IF NOT column_exists('properties', 'acreage') THEN
        ALTER TABLE properties ADD COLUMN acreage REAL;
    END IF;
    
    -- Add square_feet if it doesn't exist
    IF NOT column_exists('properties', 'square_feet') THEN
        ALTER TABLE properties ADD COLUMN square_feet INTEGER;
    END IF;
    
    -- Add last_sale_date if it doesn't exist
    IF NOT column_exists('properties', 'last_sale_date') THEN
        ALTER TABLE properties ADD COLUMN last_sale_date TIMESTAMP;
    END IF;
    
    -- Add last_sale_amount if it doesn't exist
    IF NOT column_exists('properties', 'last_sale_amount') THEN
        ALTER TABLE properties ADD COLUMN last_sale_amount REAL;
    END IF;
    
    -- Add latitude if it doesn't exist
    IF NOT column_exists('properties', 'latitude') THEN
        ALTER TABLE properties ADD COLUMN latitude REAL;
    END IF;
    
    -- Add longitude if it doesn't exist
    IF NOT column_exists('properties', 'longitude') THEN
        ALTER TABLE properties ADD COLUMN longitude REAL;
    END IF;
    
    -- Add metadata if it doesn't exist
    IF NOT column_exists('properties', 'metadata') THEN
        ALTER TABLE properties ADD COLUMN metadata JSONB;
    END IF;
    
    -- Add enable_r_l_s if it doesn't exist
    IF NOT column_exists('properties', 'enable_r_l_s') THEN
        ALTER TABLE properties ADD COLUMN enable_r_l_s BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Compliance checks table columns
DO $$
BEGIN
    -- Add check_result if it doesn't exist
    IF NOT column_exists('compliance_checks', 'check_result') THEN
        ALTER TABLE compliance_checks ADD COLUMN check_result TEXT DEFAULT 'info';
    END IF;
    
    -- Add description if it doesn't exist
    IF NOT column_exists('compliance_checks', 'description') THEN
        ALTER TABLE compliance_checks ADD COLUMN description TEXT NOT NULL DEFAULT 'Compliance check';
    END IF;
    
    -- Add details if it doesn't exist
    IF NOT column_exists('compliance_checks', 'details') THEN
        ALTER TABLE compliance_checks ADD COLUMN details TEXT;
    END IF;
    
    -- Add rule if it doesn't exist
    IF NOT column_exists('compliance_checks', 'rule') THEN
        ALTER TABLE compliance_checks ADD COLUMN rule TEXT;
    END IF;
    
    -- Add recommendation if it doesn't exist
    IF NOT column_exists('compliance_checks', 'recommendation') THEN
        ALTER TABLE compliance_checks ADD COLUMN recommendation TEXT;
    END IF;
    
    -- Add enable_r_l_s if it doesn't exist
    IF NOT column_exists('compliance_checks', 'enable_r_l_s') THEN
        ALTER TABLE compliance_checks ADD COLUMN enable_r_l_s BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Sketches table columns
DO $$
BEGIN
    -- Add title if it doesn't exist
    IF NOT column_exists('sketches', 'title') THEN
        ALTER TABLE sketches ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled';
    END IF;
    
    -- Add description if it doesn't exist
    IF NOT column_exists('sketches', 'description') THEN
        ALTER TABLE sketches ADD COLUMN description TEXT;
    END IF;
    
    -- Add sketch_url if it doesn't exist
    IF NOT column_exists('sketches', 'sketch_url') THEN
        ALTER TABLE sketches ADD COLUMN sketch_url TEXT;
    END IF;
    
    -- Add sketch_data if it doesn't exist
    IF NOT column_exists('sketches', 'sketch_data') THEN
        ALTER TABLE sketches ADD COLUMN sketch_data TEXT;
    END IF;
    
    -- Add square_footage if it doesn't exist
    IF NOT column_exists('sketches', 'square_footage') THEN
        ALTER TABLE sketches ADD COLUMN square_footage INTEGER;
    END IF;
    
    -- Add scale if it doesn't exist
    IF NOT column_exists('sketches', 'scale') THEN
        ALTER TABLE sketches ADD COLUMN scale TEXT;
    END IF;
    
    -- Add notes if it doesn't exist
    IF NOT column_exists('sketches', 'notes') THEN
        ALTER TABLE sketches ADD COLUMN notes TEXT;
    END IF;
    
    -- Add enable_r_l_s if it doesn't exist
    IF NOT column_exists('sketches', 'enable_r_l_s') THEN
        ALTER TABLE sketches ADD COLUMN enable_r_l_s BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add enable_r_l_s to photos
DO $$
BEGIN
    IF NOT column_exists('photos', 'enable_r_l_s') THEN
        ALTER TABLE photos ADD COLUMN enable_r_l_s BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Real estate terms table columns
DO $$
BEGIN
    -- Add definition if it doesn't exist
    IF NOT column_exists('real_estate_terms', 'definition') THEN
        ALTER TABLE real_estate_terms ADD COLUMN definition TEXT NOT NULL DEFAULT 'Definition not provided';
    END IF;
    
    -- Add contextual_explanation if it doesn't exist
    IF NOT column_exists('real_estate_terms', 'contextual_explanation') THEN
        ALTER TABLE real_estate_terms ADD COLUMN contextual_explanation TEXT;
    END IF;
    
    -- Add is_common if it doesn't exist
    IF NOT column_exists('real_estate_terms', 'is_common') THEN
        ALTER TABLE real_estate_terms ADD COLUMN is_common BOOLEAN DEFAULT false;
    END IF;
    
    -- Add source if it doesn't exist
    IF NOT column_exists('real_estate_terms', 'source') THEN
        ALTER TABLE real_estate_terms ADD COLUMN source TEXT;
    END IF;
    
    -- Add enable_r_l_s if it doesn't exist
    IF NOT column_exists('real_estate_terms', 'enable_r_l_s') THEN
        ALTER TABLE real_estate_terms ADD COLUMN enable_r_l_s BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add enable_r_l_s to orders
DO $$
BEGIN
    IF NOT column_exists('orders', 'enable_r_l_s') THEN
        ALTER TABLE orders ADD COLUMN enable_r_l_s BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add enable_r_l_s to property_share_links
DO $$
BEGIN
    IF NOT column_exists('property_share_links', 'enable_r_l_s') THEN
        ALTER TABLE property_share_links ADD COLUMN enable_r_l_s BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Users table columns
DO $$
BEGIN
    -- Add role if it doesn't exist
    IF NOT column_exists('users', 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'readonly';
    END IF;
    
    -- Add department if it doesn't exist
    IF NOT column_exists('users', 'department') THEN
        ALTER TABLE users ADD COLUMN department TEXT;
    END IF;
    
    -- Add is_active if it doesn't exist
    IF NOT column_exists('users', 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add last_login if it doesn't exist
    IF NOT column_exists('users', 'last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
    END IF;
    
    -- Add created_at if it doesn't exist
    IF NOT column_exists('users', 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT column_exists('users', 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
    
    -- Add enable_r_l_s if it doesn't exist
    IF NOT column_exists('users', 'enable_r_l_s') THEN
        ALTER TABLE users ADD COLUMN enable_r_l_s BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Clean up the function since we don't need it anymore
DROP FUNCTION IF EXISTS column_exists(text, text);

-- Update migration metadata
INSERT INTO drizzle.migrations (id, hash, created_at)
VALUES ('20250508001_add_missing_columns', 'afdbfd08fe25e6ab68c42c3eed20a942', NOW())
ON CONFLICT DO NOTHING;
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    user_id UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    description TEXT,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS gis_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES files(id),
    geometry GEOMETRY,
    properties JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_quality_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    alert_type TEXT NOT NULL,
    query TEXT,
    parameters JSONB,
    severity TEXT DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_checked TIMESTAMP WITH TIME ZONE,
    last_triggered TIMESTAMP WITH TIME ZONE
);

-- Create spatial indexes
CREATE INDEX IF NOT EXISTS gis_data_geometry_idx ON gis_data USING GIST (geometry);

-- Create RPC functions for common operations
CREATE OR REPLACE FUNCTION check_extension(extension_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    ext_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = extension_name
    ) INTO ext_exists;
    RETURN ext_exists;
END;
$$ LANGUAGE plpgsql;

-- Create storage access policies
-- Note: This would typically be done in the Supabase Dashboard

-- Insert initial roles
INSERT INTO roles (name, description)
VALUES 
    ('admin', 'Administrator with full access'),
    ('analyst', 'Data analyst with read access'),
    ('editor', 'Content editor with write access')
ON CONFLICT (name) DO NOTHING;

-- Create Function to Execute Parameterized Queries for Data Quality Checks
CREATE OR REPLACE FUNCTION run_quality_check(
    sql_query TEXT,
    params JSONB DEFAULT '{}'::JSONB
) RETURNS TABLE (result JSONB) AS $$
DECLARE
    query_with_params TEXT;
    param_keys TEXT[];
    param_values TEXT[];
    i INTEGER;
BEGIN
    -- Replace placeholders with parameter values
    query_with_params := sql_query;
    
    -- Extract parameter keys and values
    SELECT array_agg(key), array_agg(value #>> '{}')
    INTO param_keys, param_values
    FROM jsonb_each(params);
    
    -- Replace placeholders
    IF param_keys IS NOT NULL THEN
        FOR i IN 1..array_length(param_keys, 1) LOOP
            query_with_params := replace(
                query_with_params, 
                '$' || param_keys[i], 
                param_values[i]
            );
        END LOOP;
    END IF;
    
    -- Execute query and return results
    RETURN QUERY EXECUTE 'WITH query_result AS (' || query_with_params || ') 
                         SELECT row_to_json(query_result)::jsonb AS result 
                         FROM query_result';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
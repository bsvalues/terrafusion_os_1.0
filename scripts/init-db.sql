-- TerraFusion Database Initialization Script
-- This script sets up the initial database schema and data
-- Note: This runs AFTER the database is created by POSTGRES_DB env var

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- PostGIS removed - not needed for core TerraFusion OS
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS ai;

-- Set default search path (database name will be whatever POSTGRES_DB is set to)
-- ALTER DATABASE terrafusion SET search_path TO core, auth, analytics, ai, public;

-- Create basic tables for immediate functionality
-- Users table
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Properties table
CREATE TABLE IF NOT EXISTS core.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id),
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    county VARCHAR(100),
    parcel_id VARCHAR(100),
    property_type VARCHAR(100),
    square_footage INTEGER,
    lot_size DECIMAL(10,2),
    year_built INTEGER,
    assessed_value DECIMAL(15,2),
    market_value DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    -- location GEOMETRY(POINT, 4326),  -- PostGIS not available
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notebooks table (TerraDossier)
CREATE TABLE IF NOT EXISTS public.notebooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled Operation',
    content JSONB DEFAULT '[]',
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notebooks_updated_at ON public.notebooks(updated_at DESC);

CREATE TRIGGER update_notebooks_updated_at BEFORE UPDATE ON public.notebooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AI Conversations table
CREATE TABLE IF NOT EXISTS ai.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    title VARCHAR(255),
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Messages table
CREATE TABLE IF NOT EXISTS ai.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES ai.conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON auth.users(created_at);

CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON core.properties(owner_id);
-- CREATE INDEX IF NOT EXISTS idx_properties_location ON core.properties USING GIST(location);  -- PostGIS not available
CREATE INDEX IF NOT EXISTS idx_properties_lat_lng ON core.properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_city_state ON core.properties(city, state);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON core.properties(created_at);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON ai.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON ai.conversations(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON ai.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON ai.messages(created_at);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON analytics.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON analytics.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON analytics.events(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON core.properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON ai.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional, for development)
-- Admin user (password: admin123)
INSERT INTO auth.users (email, password_hash, first_name, last_name, role, email_verified)
VALUES (
    'admin@terrafusion.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'Admin',
    'User',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Sample user (password: user123)
INSERT INTO auth.users (email, password_hash, first_name, last_name, role, email_verified)
VALUES (
    'user@terrafusion.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- user123
    'Sample',
    'User',
    'user',
    true
) ON CONFLICT (email) DO NOTHING;

-- Grant permissions (user will be whatever POSTGRES_USER is set to)
-- GRANT USAGE ON SCHEMA auth TO postgres;
-- GRANT USAGE ON SCHEMA core TO postgres;
-- GRANT USAGE ON SCHEMA analytics TO postgres;
-- GRANT USAGE ON SCHEMA ai TO postgres;

-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA core TO postgres;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO postgres;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ai TO postgres;

-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA core TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA analytics TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ai TO postgres;

-- Create database user for application (if different from postgres)
-- CREATE USER terrafusion_user WITH PASSWORD 'your_password_here';
-- GRANT CONNECT ON DATABASE terrafusion TO terrafusion_user;
-- GRANT USAGE ON SCHEMA auth, core, analytics, ai TO terrafusion_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth, core, analytics, ai TO terrafusion_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth, core, analytics, ai TO terrafusion_user;

COMMIT;

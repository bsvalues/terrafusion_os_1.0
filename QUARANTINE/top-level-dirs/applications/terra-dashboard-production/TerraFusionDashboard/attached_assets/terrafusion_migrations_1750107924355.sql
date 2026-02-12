-- TerraFusion Database Migrations
-- Migration 001: Core Schema Setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE property_type AS ENUM (
    'Residential',
    'Commercial', 
    'Industrial',
    'Agricultural',
    'Exempt',
    'Utility',
    'PublicUse'
);

CREATE TYPE owner_type AS ENUM (
    'Individual',
    'Corporation',
    'Partnership',
    'LLC',
    'Trust',
    'Government',
    'Nonprofit',
    'Other'
);

CREATE TYPE appeal_status AS ENUM (
    'None',
    'Filed',
    'UnderReview',
    'Approved',
    'Denied',
    'Withdrawn'
);

CREATE TYPE execution_status AS ENUM (
    'Pending',
    'Running',
    'Completed',
    'Failed',
    'Cancelled',
    'Timeout'
);

CREATE TYPE audit_action AS ENUM (
    'Insert',
    'Update',
    'Delete',
    'View'
);

-- ============================================================================
-- COUNTIES TABLE
-- ============================================================================

CREATE TABLE counties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    fips_code VARCHAR(5) NOT NULL UNIQUE,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Los_Angeles',
    assessment_cycle VARCHAR(20) NOT NULL DEFAULT 'Annual',
    contact_info JSONB NOT NULL DEFAULT '{}',
    configuration JSONB NOT NULL DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for counties
CREATE INDEX idx_counties_state ON counties(state);
CREATE INDEX idx_counties_fips ON counties(fips_code);
CREATE INDEX idx_counties_active ON counties(active) WHERE active = true;

-- ============================================================================
-- PROPERTIES TABLE
-- ============================================================================

CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    legal_description TEXT,
    assessed_value BIGINT NOT NULL DEFAULT 0, -- Stored as cents
    market_value BIGINT,
    land_value BIGINT NOT NULL DEFAULT 0,
    improvement_value BIGINT NOT NULL DEFAULT 0,
    square_feet INTEGER,
    lot_size_acres DECIMAL(10,4),
    year_built INTEGER,
    property_type property_type NOT NULL DEFAULT 'Residential',
    zoning VARCHAR(20),
    neighborhood_id UUID,
    coordinates JSONB, -- {latitude: float, longitude: float, elevation?: float}
    geometry GEOMETRY(POINT, 4326), -- PostGIS geometry for spatial queries
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_assessment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    next_assessment_due TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '1 year',
    county_id UUID NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    
    CONSTRAINT chk_assessed_value_positive CHECK (assessed_value >= 0),
    CONSTRAINT chk_land_value_positive CHECK (land_value >= 0),
    CONSTRAINT chk_improvement_value_positive CHECK (improvement_value >= 0),
    CONSTRAINT chk_year_built_reasonable CHECK (year_built IS NULL OR (year_built >= 1800 AND year_built <= EXTRACT(YEAR FROM NOW()) + 5)),
    CONSTRAINT chk_square_feet_positive CHECK (square_feet IS NULL OR square_feet > 0),
    CONSTRAINT chk_lot_size_positive CHECK (lot_size_acres IS NULL OR lot_size_acres > 0)
);

-- Unique constraint for parcel_id within county
CREATE UNIQUE INDEX idx_properties_parcel_county ON properties(parcel_id, county_id) WHERE active = true;

-- Performance indexes
CREATE INDEX idx_properties_county_id ON properties(county_id);
CREATE INDEX idx_properties_address ON properties USING gin(to_tsvector('english', address));
CREATE INDEX idx_properties_assessed_value ON properties(assessed_value);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_last_assessment ON properties(last_assessment_date);
CREATE INDEX idx_properties_next_assessment ON properties(next_assessment_due);
CREATE INDEX idx_properties_coordinates ON properties USING gin(coordinates);

-- Spatial index for geometry
CREATE INDEX idx_properties_geometry ON properties USING gist(geometry);

-- Composite indexes for common queries
CREATE INDEX idx_properties_county_type_active ON properties(county_id, property_type, active);
CREATE INDEX idx_properties_assessment_due ON properties(county_id, next_assessment_due) WHERE active = true;

-- ============================================================================
-- PROPERTY OWNERS TABLE
-- ============================================================================

CREATE TABLE property_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    owner_name VARCHAR(200) NOT NULL,
    owner_type owner_type NOT NULL DEFAULT 'Individual',
    mailing_address TEXT NOT NULL,
    mailing_city VARCHAR(100) NOT NULL,
    mailing_state VARCHAR(2) NOT NULL,
    mailing_zip VARCHAR(10) NOT NULL,
    percentage_owned SMALLINT NOT NULL DEFAULT 100,
    primary_owner BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_percentage_owned CHECK (percentage_owned >= 0 AND percentage_owned <= 100)
);

-- Indexes for property_owners
CREATE INDEX idx_property_owners_property_id ON property_owners(property_id);
CREATE INDEX idx_property_owners_name ON property_owners USING gin(to_tsvector('english', owner_name));
CREATE INDEX idx_property_owners_type ON property_owners(owner_type);
CREATE INDEX idx_property_owners_primary ON property_owners(property_id, primary_owner) WHERE primary_owner = true;

-- ============================================================================
-- ASSESSMENT HISTORY TABLE
-- ============================================================================

CREATE TABLE assessment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    assessment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assessed_value BIGINT NOT NULL,
    land_value BIGINT NOT NULL,
    improvement_value BIGINT NOT NULL,
    assessor_id UUID NOT NULL, -- References users table (to be created)
    assessment_method VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    ai_confidence_score REAL,
    notes TEXT,
    appeal_status appeal_status DEFAULT 'None',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_assessment_values_positive CHECK (
        assessed_value >= 0 AND land_value >= 0 AND improvement_value >= 0
    ),
    CONSTRAINT chk_confidence_score CHECK (
        ai_confidence_score IS NULL OR (ai_confidence_score >= 0.0 AND ai_confidence_score <= 1.0)
    )
);

-- Indexes for assessment_history
CREATE INDEX idx_assessment_history_property_id ON assessment_history(property_id);
CREATE INDEX idx_assessment_history_date ON assessment_history(assessment_date);
CREATE INDEX idx_assessment_history_assessor ON assessment_history(assessor_id);
CREATE INDEX idx_assessment_history_appeal_status ON assessment_history(appeal_status);

-- Composite index for property assessment timeline
CREATE INDEX idx_assessment_history_property_date ON assessment_history(property_id, assessment_date DESC);

-- ============================================================================
-- AGENT EXECUTIONS TABLE
-- ============================================================================

CREATE TABLE agent_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    result JSONB,
    status execution_status NOT NULL DEFAULT 'Pending',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    error_message TEXT,
    confidence_score REAL,
    created_by UUID NOT NULL, -- References users table
    
    CONSTRAINT chk_duration_positive CHECK (duration_ms IS NULL OR duration_ms >= 0),
    CONSTRAINT chk_confidence_score_valid CHECK (
        confidence_score IS NULL OR (confidence_score >= 0.0 AND confidence_score <= 1.0)
    ),
    CONSTRAINT chk_completed_after_started CHECK (
        completed_at IS NULL OR completed_at >= started_at
    )
);

-- Indexes for agent_executions
CREATE INDEX idx_agent_executions_property_id ON agent_executions(property_id);
CREATE INDEX idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX idx_agent_executions_status ON agent_executions(status);
CREATE INDEX idx_agent_executions_started_at ON agent_executions(started_at);
CREATE INDEX idx_agent_executions_created_by ON agent_executions(created_by);

-- Composite indexes for analytics
CREATE INDEX idx_agent_executions_agent_status ON agent_executions(agent_id, status);
CREATE INDEX idx_agent_executions_property_task ON agent_executions(property_id, task_type, started_at DESC);

-- ============================================================================
-- NEIGHBORHOODS TABLE
-- ============================================================================

CREATE TABLE neighborhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    county_id UUID NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
    boundary GEOMETRY(MULTIPOLYGON, 4326),
    characteristics JSONB NOT NULL DEFAULT '{}',
    market_statistics JSONB NOT NULL DEFAULT '{}',
    last_analyzed TIMESTAMP WITH TIME ZONE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for neighborhoods
CREATE INDEX idx_neighborhoods_county_id ON neighborhoods(county_id);
CREATE INDEX idx_neighborhoods_name ON neighborhoods(county_id, name) WHERE active = true;
CREATE INDEX idx_neighborhoods_boundary ON neighborhoods USING gist(boundary);

-- Update properties table to reference neighborhoods
ALTER TABLE properties ADD CONSTRAINT fk_properties_neighborhood 
    FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id) ON DELETE SET NULL;

-- ============================================================================
-- USERS TABLE (for authentication)
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'assessor',
    county_id UUID REFERENCES counties(id) ON DELETE SET NULL,
    permissions JSONB NOT NULL DEFAULT '[]',
    last_login TIMESTAMP WITH TIME ZONE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email) WHERE active = true;
CREATE INDEX idx_users_county_id ON users(county_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action audit_action NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    reason TEXT,
    
    CONSTRAINT chk_audit_values CHECK (
        (action = 'Insert' AND old_values IS NULL AND new_values IS NOT NULL) OR
        (action = 'Update' AND old_values IS NOT NULL AND new_values IS NOT NULL) OR
        (action = 'Delete' AND old_values IS NOT NULL AND new_values IS NULL) OR
        (action = 'View' AND old_values IS NULL AND new_values IS NULL)
    )
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Partition audit_logs by month for performance
-- CREATE TABLE audit_logs_y2024m01 PARTITION OF audit_logs
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ============================================================================
-- EXEMPTIONS TABLE
-- ============================================================================

CREATE TABLE exemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    exemption_type VARCHAR(50) NOT NULL,
    exemption_amount BIGINT NOT NULL DEFAULT 0,
    percentage_exempt DECIMAL(5,2),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    application_date DATE,
    approved_by UUID REFERENCES users(id),
    approval_date DATE,
    documentation JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_exemption_amount_positive CHECK (exemption_amount >= 0),
    CONSTRAINT chk_percentage_exempt_valid CHECK (
        percentage_exempt IS NULL OR (percentage_exempt >= 0 AND percentage_exempt <= 100)
    ),
    CONSTRAINT chk_end_date_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Indexes for exemptions
CREATE INDEX idx_exemptions_property_id ON exemptions(property_id);
CREATE INDEX idx_exemptions_type ON exemptions(exemption_type);
CREATE INDEX idx_exemptions_status ON exemptions(status);
CREATE INDEX idx_exemptions_dates ON exemptions(start_date, end_date);

-- ============================================================================
-- SALES COMPARABLES TABLE
-- ============================================================================

CREATE TABLE sales_comparables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    sale_date DATE NOT NULL,
    sale_price BIGINT NOT NULL,
    sale_type VARCHAR(30) NOT NULL DEFAULT 'Market',
    verified BOOLEAN NOT NULL DEFAULT false,
    verification_source VARCHAR(100),
    financing_terms TEXT,
    conditions_of_sale TEXT,
    buyer_seller_relationship VARCHAR(50),
    deed_type VARCHAR(50),
    validity_score REAL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_sale_price_positive CHECK (sale_price > 0),
    CONSTRAINT chk_validity_score CHECK (
        validity_score IS NULL OR (validity_score >= 0.0 AND validity_score <= 1.0)
    )
);

-- Indexes for sales_comparables
CREATE INDEX idx_sales_comparables_property_id ON sales_comparables(property_id);
CREATE INDEX idx_sales_comparables_sale_date ON sales_comparables(sale_date);
CREATE INDEX idx_sales_comparables_sale_price ON sales_comparables(sale_price);
CREATE INDEX idx_sales_comparables_verified ON sales_comparables(verified);
CREATE INDEX idx_sales_comparables_type ON sales_comparables(sale_type);

-- ============================================================================
-- SYSTEM CONFIGURATION TABLE
-- ============================================================================

CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    county_id UUID NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(county_id, config_key)
);

-- Indexes for system_config
CREATE INDEX idx_system_config_county_key ON system_config(county_id, config_key);
CREATE INDEX idx_system_config_category ON system_config(category);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Apply triggers to all relevant tables
CREATE TRIGGER update_counties_updated_at BEFORE UPDATE ON counties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_owners_updated_at BEFORE UPDATE ON property_owners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_neighborhoods_updated_at BEFORE UPDATE ON neighborhoods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exemptions_updated_at BEFORE UPDATE ON exemptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_comparables_updated_at BEFORE UPDATE ON sales_comparables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR SPATIAL CALCULATIONS
-- ============================================================================

-- Function to update geometry from coordinates JSON
CREATE OR REPLACE FUNCTION update_property_geometry()
RETURNS TRIGGER AS $
BEGIN
    IF NEW.coordinates IS NOT NULL THEN
        NEW.geometry = ST_SetSRID(
            ST_MakePoint(
                (NEW.coordinates->>'longitude')::DOUBLE PRECISION,
                (NEW.coordinates->>'latitude')::DOUBLE PRECISION
            ), 
            4326
        );
    END IF;
    RETURN NEW;
END;
$ language 'plpgsql';

-- Trigger to automatically update geometry when coordinates change
CREATE TRIGGER update_property_geometry_trigger
    BEFORE INSERT OR UPDATE OF coordinates ON properties
    FOR EACH ROW EXECUTE FUNCTION update_property_geometry();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for property summary with owner information
CREATE VIEW property_summary AS
SELECT 
    p.id,
    p.parcel_id,
    p.address,
    p.assessed_value,
    p.property_type,
    p.square_feet,
    p.year_built,
    p.last_assessment_date,
    po.owner_name,
    po.owner_type,
    c.name as county_name,
    c.state,
    n.name as neighborhood_name
FROM properties p
LEFT JOIN property_owners po ON p.id = po.property_id AND po.primary_owner = true
LEFT JOIN counties c ON p.county_id = c.id
LEFT JOIN neighborhoods n ON p.neighborhood_id = n.id
WHERE p.active = true;

-- View for assessment statistics by county
CREATE VIEW county_assessment_stats AS
SELECT 
    c.id as county_id,
    c.name as county_name,
    COUNT(p.id) as total_properties,
    AVG(p.assessed_value::NUMERIC) as avg_assessed_value,
    MIN(p.assessed_value) as min_assessed_value,
    MAX(p.assessed_value) as max_assessed_value,
    COUNT(CASE WHEN p.last_assessment_date > NOW() - INTERVAL '1 year' THEN 1 END) as recent_assessments
FROM counties c
LEFT JOIN properties p ON c.id = p.county_id AND p.active = true
GROUP BY c.id, c.name;

-- ============================================================================
-- SAMPLE DATA INSERTION
-- ============================================================================

-- Insert sample county (Benton County, WA)
INSERT INTO counties (id, name, state, fips_code, timezone, assessment_cycle, contact_info) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Benton County',
    'WA',
    '53005',
    'America/Los_Angeles',
    'Annual',
    '{"phone": "509-736-3085", "website": "https://www.co.benton.wa.us", "address": "7122 W Okanogan Pl, Kennewick, WA 99336"}'
);

-- Insert sample user (system administrator)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, county_id, permissions)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'admin@terrafusion.platform',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewmBa0Y5/2J/YI2K', -- password: terrafusion2024
    'System',
    'Administrator',
    'admin',
    '550e8400-e29b-41d4-a716-446655440000',
    '["read", "write", "admin", "agent_management"]'
);

-- Insert sample neighborhood
INSERT INTO neighborhoods (id, name, county_id, characteristics, market_statistics)
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'Downtown Richland',
    '550e8400-e29b-41d4-a716-446655440000',
    '{"development_era": "1940s-1950s", "housing_type": "Single Family", "average_lot_size": 0.15}',
    '{"median_home_value": 485000, "price_per_sqft": 207, "market_trend": "stable"}'
);

-- Insert sample property
INSERT INTO properties (
    id, parcel_id, address, assessed_value, land_value, improvement_value,
    square_feet, year_built, property_type, county_id, neighborhood_id,
    coordinates, last_assessment_date
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    '1102234412',
    '123 Main Street, Richland, WA 99354',
    48520000, -- $485,200 in cents
    8240000,  -- $82,400 in cents  
    40280000, -- $402,800 in cents
    2340,
    1995,
    'Residential',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440002',
    '{"latitude": 46.2382, "longitude": -119.2751}',
    '2024-12-15'
);

-- Insert property owner
INSERT INTO property_owners (
    property_id, owner_name, owner_type, mailing_address,
    mailing_city, mailing_state, mailing_zip, percentage_owned, primary_owner
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'John & Jane Smith',
    'Individual',
    '123 Main Street',
    'Richland',
    'WA',
    '99354',
    100,
    true
);

-- ============================================================================
-- PERFORMANCE OPTIMIZATION QUERIES
-- ============================================================================

-- Analyze tables for query optimization
ANALYZE counties;
ANALYZE properties;
ANALYZE property_owners;
ANALYZE assessment_history;
ANALYZE agent_executions;
ANALYZE neighborhoods;
ANALYZE users;
ANALYZE audit_logs;
ANALYZE exemptions;
ANALYZE sales_comparables;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Set up version tracking for future migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');
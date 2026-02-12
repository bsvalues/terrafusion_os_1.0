-- TerraFusion Database Migrations
-- Migration 001: Core Schema Setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE TABLE counties_enhanced (
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
CREATE INDEX idx_counties_enhanced_state ON counties_enhanced(state);
CREATE INDEX idx_counties_enhanced_fips ON counties_enhanced(fips_code);
CREATE INDEX idx_counties_enhanced_active ON counties_enhanced(active) WHERE active = true;

-- ============================================================================
-- PROPERTIES TABLE (Enhanced)
-- ============================================================================

CREATE TABLE properties_enhanced (
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_assessment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    next_assessment_due TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '1 year',
    county_id UUID NOT NULL REFERENCES counties_enhanced(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    
    CONSTRAINT chk_assessed_value_positive CHECK (assessed_value >= 0),
    CONSTRAINT chk_land_value_positive CHECK (land_value >= 0),
    CONSTRAINT chk_improvement_value_positive CHECK (improvement_value >= 0),
    CONSTRAINT chk_year_built_reasonable CHECK (year_built IS NULL OR (year_built >= 1800 AND year_built <= EXTRACT(YEAR FROM NOW()) + 5)),
    CONSTRAINT chk_square_feet_positive CHECK (square_feet IS NULL OR square_feet > 0),
    CONSTRAINT chk_lot_size_positive CHECK (lot_size_acres IS NULL OR lot_size_acres > 0)
);

-- Unique constraint for parcel_id within county
CREATE UNIQUE INDEX idx_properties_enhanced_parcel_county ON properties_enhanced(parcel_id, county_id) WHERE active = true;

-- Performance indexes
CREATE INDEX idx_properties_enhanced_county_id ON properties_enhanced(county_id);
CREATE INDEX idx_properties_enhanced_address ON properties_enhanced USING gin(to_tsvector('english', address));
CREATE INDEX idx_properties_enhanced_assessed_value ON properties_enhanced(assessed_value);
CREATE INDEX idx_properties_enhanced_property_type ON properties_enhanced(property_type);
CREATE INDEX idx_properties_enhanced_last_assessment ON properties_enhanced(last_assessment_date);
CREATE INDEX idx_properties_enhanced_next_assessment ON properties_enhanced(next_assessment_due);
CREATE INDEX idx_properties_enhanced_coordinates ON properties_enhanced USING gin(coordinates);

-- Composite indexes for common queries
CREATE INDEX idx_properties_enhanced_county_type_active ON properties_enhanced(county_id, property_type, active);
CREATE INDEX idx_properties_enhanced_assessment_due ON properties_enhanced(county_id, next_assessment_due) WHERE active = true;

-- ============================================================================
-- NEIGHBORHOODS TABLE
-- ============================================================================

CREATE TABLE neighborhoods_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    county_id UUID NOT NULL REFERENCES counties_enhanced(id) ON DELETE CASCADE,
    characteristics JSONB NOT NULL DEFAULT '{}',
    market_statistics JSONB NOT NULL DEFAULT '{}',
    last_analyzed TIMESTAMP WITH TIME ZONE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for neighborhoods
CREATE INDEX idx_neighborhoods_enhanced_county_id ON neighborhoods_enhanced(county_id);
CREATE INDEX idx_neighborhoods_enhanced_name ON neighborhoods_enhanced(county_id, name) WHERE active = true;

-- Update properties table to reference neighborhoods
ALTER TABLE properties_enhanced ADD CONSTRAINT fk_properties_enhanced_neighborhood 
    FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods_enhanced(id) ON DELETE SET NULL;

-- ============================================================================
-- USERS TABLE (Enhanced)
-- ============================================================================

CREATE TABLE users_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'assessor',
    county_id UUID REFERENCES counties_enhanced(id) ON DELETE SET NULL,
    permissions JSONB NOT NULL DEFAULT '[]',
    last_login TIMESTAMP WITH TIME ZONE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_enhanced_email ON users_enhanced(email) WHERE active = true;
CREATE INDEX idx_users_enhanced_county_id ON users_enhanced(county_id);
CREATE INDEX idx_users_enhanced_role ON users_enhanced(role);

-- ============================================================================
-- PROPERTY OWNERS TABLE
-- ============================================================================

CREATE TABLE property_owners_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties_enhanced(id) ON DELETE CASCADE,
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
CREATE INDEX idx_property_owners_enhanced_property_id ON property_owners_enhanced(property_id);
CREATE INDEX idx_property_owners_enhanced_name ON property_owners_enhanced USING gin(to_tsvector('english', owner_name));
CREATE INDEX idx_property_owners_enhanced_type ON property_owners_enhanced(owner_type);
CREATE INDEX idx_property_owners_enhanced_primary ON property_owners_enhanced(property_id, primary_owner) WHERE primary_owner = true;

-- ============================================================================
-- ASSESSMENT HISTORY TABLE
-- ============================================================================

CREATE TABLE assessment_history_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties_enhanced(id) ON DELETE CASCADE,
    assessment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assessed_value BIGINT NOT NULL,
    land_value BIGINT NOT NULL,
    improvement_value BIGINT NOT NULL,
    assessor_id UUID NOT NULL REFERENCES users_enhanced(id),
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
CREATE INDEX idx_assessment_history_enhanced_property_id ON assessment_history_enhanced(property_id);
CREATE INDEX idx_assessment_history_enhanced_date ON assessment_history_enhanced(assessment_date);
CREATE INDEX idx_assessment_history_enhanced_assessor ON assessment_history_enhanced(assessor_id);
CREATE INDEX idx_assessment_history_enhanced_appeal_status ON assessment_history_enhanced(appeal_status);

-- Composite index for property assessment timeline
CREATE INDEX idx_assessment_history_enhanced_property_date ON assessment_history_enhanced(property_id, assessment_date DESC);

-- ============================================================================
-- AGENT EXECUTIONS TABLE (Enhanced)
-- ============================================================================

CREATE TABLE agent_executions_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties_enhanced(id) ON DELETE CASCADE,
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
    created_by UUID NOT NULL REFERENCES users_enhanced(id),
    
    CONSTRAINT chk_duration_positive CHECK (duration_ms IS NULL OR duration_ms >= 0),
    CONSTRAINT chk_confidence_score_valid CHECK (
        confidence_score IS NULL OR (confidence_score >= 0.0 AND confidence_score <= 1.0)
    ),
    CONSTRAINT chk_completed_after_started CHECK (
        completed_at IS NULL OR completed_at >= started_at
    )
);

-- Indexes for agent_executions_enhanced
CREATE INDEX idx_agent_executions_enhanced_property_id ON agent_executions_enhanced(property_id);
CREATE INDEX idx_agent_executions_enhanced_agent_id ON agent_executions_enhanced(agent_id);
CREATE INDEX idx_agent_executions_enhanced_status ON agent_executions_enhanced(status);
CREATE INDEX idx_agent_executions_enhanced_started_at ON agent_executions_enhanced(started_at);
CREATE INDEX idx_agent_executions_enhanced_created_by ON agent_executions_enhanced(created_by);

-- Composite indexes for analytics
CREATE INDEX idx_agent_executions_enhanced_agent_status ON agent_executions_enhanced(agent_id, status);
CREATE INDEX idx_agent_executions_enhanced_property_task ON agent_executions_enhanced(property_id, task_type, started_at DESC);

-- ============================================================================
-- AUDIT LOGS TABLE (Enhanced)
-- ============================================================================

CREATE TABLE audit_logs_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action audit_action NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID NOT NULL REFERENCES users_enhanced(id),
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
CREATE INDEX idx_audit_logs_enhanced_table_name ON audit_logs_enhanced(table_name);
CREATE INDEX idx_audit_logs_enhanced_record_id ON audit_logs_enhanced(record_id);
CREATE INDEX idx_audit_logs_enhanced_changed_by ON audit_logs_enhanced(changed_by);
CREATE INDEX idx_audit_logs_enhanced_changed_at ON audit_logs_enhanced(changed_at);
CREATE INDEX idx_audit_logs_enhanced_action ON audit_logs_enhanced(action);

-- Composite indexes for audit queries
CREATE INDEX idx_audit_logs_enhanced_table_record ON audit_logs_enhanced(table_name, record_id, changed_at DESC);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert production counties
INSERT INTO counties_enhanced (id, name, state, fips_code, timezone, assessment_cycle, contact_info, configuration) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Benton County', 'WA', '53005', 'America/Los_Angeles', 'Annual', 
 '{"phone": "+1-509-736-3085", "email": "assessor@co.benton.wa.us", "website": "https://www.co.benton.wa.us"}',
 '{"auto_assessment": true, "ai_validation": true, "notification_preferences": {"email": true, "sms": false}}'),
('550e8400-e29b-41d4-a716-446655440001', 'Yakima County', 'WA', '53077', 'America/Los_Angeles', 'Annual',
 '{"phone": "+1-509-574-1430", "email": "assessor@co.yakima.wa.us", "website": "https://www.yakimacounty.us"}',
 '{"auto_assessment": false, "ai_validation": true, "notification_preferences": {"email": true, "sms": true}}'),
('550e8400-e29b-41d4-a716-446655440002', 'King County', 'WA', '53033', 'America/Los_Angeles', 'Annual',
 '{"phone": "+1-206-296-7300", "email": "assessor@kingcounty.gov", "website": "https://www.kingcounty.gov"}',
 '{"auto_assessment": true, "ai_validation": true, "notification_preferences": {"email": true, "sms": true}}');

-- Insert neighborhoods
INSERT INTO neighborhoods_enhanced (id, name, county_id, characteristics, market_statistics) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'Downtown Richland', '550e8400-e29b-41d4-a716-446655440000',
 '{"area_type": "urban", "walkability": "high", "schools": "excellent", "amenities": ["parks", "shopping", "dining"]}',
 '{"median_home_value": 425000, "price_per_sqft": 185, "market_trend": "stable", "days_on_market": 35}'),
('660e8400-e29b-41d4-a716-446655440001', 'West Richland Residential', '550e8400-e29b-41d4-a716-446655440000',
 '{"area_type": "suburban", "walkability": "medium", "schools": "good", "amenities": ["parks", "recreation"]}',
 '{"median_home_value": 385000, "price_per_sqft": 165, "market_trend": "growing", "days_on_market": 28}');

-- Insert users with proper permissions
INSERT INTO users_enhanced (id, email, password_hash, first_name, last_name, role, county_id, permissions) VALUES
('770e8400-e29b-41d4-a716-446655440000', 'admin@terrafusion.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8J.0awn4UhqM2Vm5vOS', 'System', 'Administrator', 'admin', NULL, 
 '["system:admin", "property:read", "property:write", "property:delete", "agent:manage", "audit:view"]'),
('770e8400-e29b-41d4-a716-446655440001', 'assessor@benton.gov', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8J.0awn4UhqM2Vm5vOS', 'Jane', 'Assessor', 'assessor', '550e8400-e29b-41d4-a716-446655440000',
 '["property:read", "property:write", "assessment:create", "agent:execute"]'),
('770e8400-e29b-41d4-a716-446655440002', 'viewer@benton.gov', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8J.0awn4UhqM2Vm5vOS', 'John', 'Viewer', 'viewer', '550e8400-e29b-41d4-a716-446655440000',
 '["property:read", "assessment:view"]');
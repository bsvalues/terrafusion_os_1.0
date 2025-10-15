-- TerraFusion Commercial Database Schema
-- Migrated from F: drive production system

-- Create schemas
CREATE SCHEMA IF NOT EXISTS commercial;
CREATE SCHEMA IF NOT EXISTS appraisal;
CREATE SCHEMA IF NOT EXISTS market;

-- Set search path
SET search_path TO commercial, appraisal, market, public;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- COMMERCIAL SCHEMA - Core Business Entities
-- ============================================

-- Properties table
CREATE TABLE commercial.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(100) UNIQUE,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    property_type VARCHAR(50) NOT NULL,
    sub_type VARCHAR(50),
    square_feet INTEGER,
    lot_size DECIMAL(10,2),
    year_built INTEGER,
    year_renovated INTEGER,
    units INTEGER,
    occupancy_rate DECIMAL(5,2),
    noi DECIMAL(15,2),
    cap_rate DECIMAL(5,2),
    asking_price DECIMAL(15,2),
    market_value DECIMAL(15,2),
    confidence_score DECIMAL(3,2),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    geom GEOMETRY(Point, 4326),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appraisals table
CREATE TABLE commercial.appraisals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE,
    property_id UUID REFERENCES commercial.properties(id),
    appraiser_id UUID,
    client_id UUID,
    appraisal_type VARCHAR(50) NOT NULL,
    purpose VARCHAR(100),
    effective_date DATE,
    inspection_date DATE,
    income_approach DECIMAL(15,2),
    sales_approach DECIMAL(15,2),
    cost_approach DECIMAL(15,2),
    final_value DECIMAL(15,2),
    confidence_score DECIMAL(3,2),
    uspap_compliant BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'draft',
    report_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Comparable sales
CREATE TABLE commercial.comparables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appraisal_id UUID REFERENCES commercial.appraisals(id),
    property_id UUID REFERENCES commercial.properties(id),
    sale_date DATE,
    sale_price DECIMAL(15,2),
    price_per_sqft DECIMAL(10,2),
    distance_miles DECIMAL(5,2),
    similarity_score DECIMAL(3,2),
    adjustment_amount DECIMAL(15,2),
    adjustment_reason TEXT,
    weight DECIMAL(3,2),
    selected BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- APPRAISAL SCHEMA - Workflow Management
-- ============================================

-- Users (appraisers, clients, admins)
CREATE TABLE appraisal.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(200),
    license_number VARCHAR(50),
    license_state VARCHAR(2),
    role VARCHAR(50) DEFAULT 'appraiser',
    subscription_tier VARCHAR(50) DEFAULT 'individual',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Organizations (firms, banks, etc)
CREATE TABLE appraisal.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50),
    subscription_tier VARCHAR(50) DEFAULT 'enterprise',
    max_users INTEGER DEFAULT 5,
    billing_email VARCHAR(255),
    billing_address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- User-Organization relationships
CREATE TABLE appraisal.user_organizations (
    user_id UUID REFERENCES appraisal.users(id),
    organization_id UUID REFERENCES appraisal.organizations(id),
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, organization_id)
);

-- Workflow templates
CREATE TABLE appraisal.workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    property_type VARCHAR(50),
    steps JSONB NOT NULL,
    uspap_requirements JSONB,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES appraisal.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail
CREATE TABLE appraisal.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES appraisal.users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MARKET SCHEMA - Market Intelligence
-- ============================================

-- Market areas
CREATE TABLE market.areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50),
    boundary GEOMETRY(Polygon, 4326),
    population INTEGER,
    median_income DECIMAL(10,2),
    employment_rate DECIMAL(5,2),
    growth_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Market trends
CREATE TABLE market.trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID REFERENCES market.areas(id),
    property_type VARCHAR(50),
    period_date DATE,
    avg_price_sqft DECIMAL(10,2),
    median_cap_rate DECIMAL(5,2),
    vacancy_rate DECIMAL(5,2),
    absorption_rate DECIMAL(10,2),
    new_construction_sqft INTEGER,
    sales_volume DECIMAL(15,2),
    transaction_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Economic indicators
CREATE TABLE market.economic_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID REFERENCES market.areas(id),
    indicator_name VARCHAR(100),
    indicator_value DECIMAL(15,4),
    unit VARCHAR(50),
    source VARCHAR(200),
    as_of_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Commercial schema indexes
CREATE INDEX idx_properties_type ON commercial.properties(property_type);
CREATE INDEX idx_properties_location ON commercial.properties USING GIST(geom);
CREATE INDEX idx_properties_city_state ON commercial.properties(city, state);
CREATE INDEX idx_appraisals_status ON commercial.appraisals(status);
CREATE INDEX idx_appraisals_appraiser ON commercial.appraisals(appraiser_id);
CREATE INDEX idx_comparables_appraisal ON commercial.comparables(appraisal_id);

-- Appraisal schema indexes
CREATE INDEX idx_users_email ON appraisal.users(email);
CREATE INDEX idx_users_role ON appraisal.users(role);
CREATE INDEX idx_audit_user ON appraisal.audit_log(user_id);
CREATE INDEX idx_audit_entity ON appraisal.audit_log(entity_type, entity_id);

-- Market schema indexes
CREATE INDEX idx_areas_boundary ON market.areas USING GIST(boundary);
CREATE INDEX idx_trends_area_date ON market.trends(area_id, period_date);
CREATE INDEX idx_indicators_area ON market.economic_indicators(area_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON commercial.properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate property distance function
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(
        ST_MakePoint(lon1, lat1)::geography,
        ST_MakePoint(lon2, lat2)::geography
    ) / 1609.34; -- Convert meters to miles
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default workflow template
INSERT INTO appraisal.workflow_templates (name, description, property_type, steps, uspap_requirements, is_default) VALUES
('Commercial Office Standard', 'Standard workflow for office building appraisals', 'office', 
'{
  "steps": [
    {"order": 1, "name": "Client Engagement", "required": true},
    {"order": 2, "name": "Property Inspection", "required": true},
    {"order": 3, "name": "Market Analysis", "required": true},
    {"order": 4, "name": "Comparable Selection", "required": true},
    {"order": 5, "name": "Valuation Analysis", "required": true},
    {"order": 6, "name": "Report Generation", "required": true},
    {"order": 7, "name": "Quality Review", "required": true},
    {"order": 8, "name": "Client Delivery", "required": true}
  ]
}'::jsonb,
'{
  "standards": ["STANDARD 1", "STANDARD 2", "STANDARD 3"],
  "ethics": true,
  "competency": true,
  "scope_of_work": true
}'::jsonb,
true);

-- Insert sample subscription tiers
INSERT INTO appraisal.organizations (name, type, subscription_tier, max_users) VALUES
('Sample Individual Appraiser', 'individual', 'individual', 1),
('Sample Small Firm', 'firm', 'small_firm', 5),
('Sample Enterprise', 'enterprise', 'enterprise', 50);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA commercial TO terrafusion;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA appraisal TO terrafusion;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA market TO terrafusion;
GRANT USAGE ON ALL SCHEMAS TO terrafusion;
-- TerraFusion Production Database Schema
-- Optimized for Benton County Washington (94,149+ parcels)
-- Enterprise-grade with IAAO compliance and performance optimization

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schemas for organization
CREATE SCHEMA IF NOT EXISTS terra_core;
CREATE SCHEMA IF NOT EXISTS terra_agent;
CREATE SCHEMA IF NOT EXISTS terra_audit;

-- Set search path
SET search_path TO terra_core, public;

-- Core properties table (optimized for 94,149+ parcels)
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id VARCHAR(50) UNIQUE NOT NULL,
    parcel_number VARCHAR(30) NOT NULL,
    account_number VARCHAR(30),
    owner_name VARCHAR(200) NOT NULL,
    situs_address VARCHAR(300) NOT NULL,
    legal_description TEXT,
    property_class VARCHAR(10) NOT NULL,
    land_use_code VARCHAR(10),
    land_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    improvement_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    assessed_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    square_footage INTEGER,
    lot_size DECIMAL(10,2),
    year_built INTEGER,
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    geometry GEOMETRY(POLYGON, 4326),
    last_sale_date DATE,
    last_sale_price DECIMAL(12,2),
    exemptions JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Performance indexes for large dataset
CREATE INDEX IF NOT EXISTS idx_properties_parcel_id ON properties(parcel_id);
CREATE INDEX IF NOT EXISTS idx_properties_parcel_number ON properties(parcel_number);
CREATE INDEX IF NOT EXISTS idx_properties_owner_name_gin ON properties USING gin(owner_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_situs_address_gin ON properties USING gin(situs_address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_property_class ON properties(property_class);
CREATE INDEX IF NOT EXISTS idx_properties_total_value ON properties(total_value);
CREATE INDEX IF NOT EXISTS idx_properties_tax_year ON properties(tax_year);
CREATE INDEX IF NOT EXISTS idx_properties_geometry ON properties USING gist(geometry);
CREATE INDEX IF NOT EXISTS idx_properties_last_sale_date ON properties(last_sale_date);
CREATE INDEX IF NOT EXISTS idx_properties_deleted_at ON properties(deleted_at) WHERE deleted_at IS NULL;

-- Enhanced assessments table
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id),
    assessor_id UUID NOT NULL,
    assessment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    assessment_type VARCHAR(30) NOT NULL CHECK (assessment_type IN ('annual', 'revaluation', 'appeal', 'new_construction')),
    land_value DECIMAL(12,2) NOT NULL,
    improvement_value DECIMAL(12,2) NOT NULL,
    total_value DECIMAL(12,2) NOT NULL,
    methodology VARCHAR(100) NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    ai_analysis JSONB,
    comparable_sales JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI agent results table
CREATE TABLE IF NOT EXISTS terra_agent.agent_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type VARCHAR(50) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    property_id UUID REFERENCES terra_core.properties(id),
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    confidence DECIMAL(3,2),
    processing_time INTEGER NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    agent_version VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table for compliance
CREATE TABLE IF NOT EXISTS terra_audit.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
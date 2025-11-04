#!/usr/bin/env python3
"""
Generate Shared Database Schema

This script generates a comprehensive SQL schema file for the shared Supabase database
that can be executed in the Supabase SQL Editor or via the supabase-js client.

The schema includes all tables, functions, extensions, and security policies
needed for the shared database architecture.
"""

import os
import sys
import logging
import argparse
from typing import Dict, Any, List, Optional, Tuple
import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("generate_schema")

# SQL sections to include in the schema
SQL_SECTIONS = {
    "header": f"""-- GeoAssessmentPro Shared Database Schema
-- Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- This file contains the complete database schema for the shared Supabase database
-- including tables, functions, extensions, and security policies.

""",
    
    "extensions": """--
-- Extensions
--
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

""",
    
    "schemas": """--
-- Schemas
--
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS gis;
CREATE SCHEMA IF NOT EXISTS valuation;
CREATE SCHEMA IF NOT EXISTS sync;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS external;
CREATE SCHEMA IF NOT EXISTS api;
CREATE SCHEMA IF NOT EXISTS audit;

""",
    
    "utility_functions": """--
-- Utility Functions
--

-- Extension check function
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

-- SQL execution function
CREATE OR REPLACE FUNCTION exec_sql(query TEXT) 
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE 'SELECT to_jsonb(t) FROM (' || query || ') AS t' INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Distance calculation function
CREATE OR REPLACE FUNCTION distance_meters(
    lat1 DOUBLE PRECISION, 
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION, 
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN ST_Distance(
        ST_SetSRID(ST_MakePoint(lon1, lat1), 4326)::geography,
        ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)::geography
    );
END;
$$ LANGUAGE plpgsql;

-- GeoJSON conversion function
CREATE OR REPLACE FUNCTION to_geojson(geometry_column geometry)
RETURNS JSONB AS $$
BEGIN
    RETURN ST_AsGeoJSON(geometry_column)::jsonb;
END;
$$ LANGUAGE plpgsql;

""",
    
    "audit_tables": """--
-- Audit Tables
--

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schema_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT NOT NULL,
    service_name TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit.logs(timestamp);

-- Create index on record_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit.logs(record_id);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    service_name TEXT;
BEGIN
    -- Get the current application name (set by services when connecting)
    service_name := current_setting('app.service_name', true);
    
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit.logs (
            schema_name, table_name, operation, record_id, 
            old_data, new_data, changed_by, service_name
        )
        VALUES (
            TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, NEW.id,
            row_to_json(OLD), row_to_json(NEW), 
            current_user, service_name
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit.logs (
            schema_name, table_name, operation, record_id,
            new_data, changed_by, service_name
        )
        VALUES (
            TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, NEW.id,
            row_to_json(NEW), current_user, service_name
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit.logs (
            schema_name, table_name, operation, record_id,
            old_data, changed_by, service_name
        )
        VALUES (
            TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, OLD.id,
            row_to_json(OLD), current_user, service_name
        );
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

""",
    
    "core_tables": """--
-- Core Tables
--

-- Users table (note: for Supabase this would typically use auth.users)
CREATE TABLE IF NOT EXISTS core.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Roles table
CREATE TABLE IF NOT EXISTS core.roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- User roles mapping table
CREATE TABLE IF NOT EXISTS core.user_roles (
    user_id UUID REFERENCES core.users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES core.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

-- Files table
CREATE TABLE IF NOT EXISTS core.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    user_id UUID REFERENCES core.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    description TEXT,
    metadata JSONB
);

-- Properties table
CREATE TABLE IF NOT EXISTS core.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_number TEXT UNIQUE NOT NULL,
    address TEXT,
    property_class TEXT,
    zoning TEXT,
    owner_name TEXT,
    owner_contact TEXT,
    assessed_value NUMERIC,
    last_assessment_date DATE,
    location GEOMETRY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB
);

""",
    
    "gis_tables": """--
-- GIS Tables
--

-- GIS data table
CREATE TABLE IF NOT EXISTS gis.property_geometries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES core.properties(id) ON DELETE CASCADE,
    geometry GEOMETRY NOT NULL,
    geometry_type TEXT NOT NULL,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB
);

-- GIS layers table
CREATE TABLE IF NOT EXISTS gis.layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    style JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- GIS map views table
CREATE TABLE IF NOT EXISTS gis.map_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    center_longitude DOUBLE PRECISION NOT NULL,
    center_latitude DOUBLE PRECISION NOT NULL,
    zoom_level INTEGER NOT NULL,
    layers JSONB,
    user_id UUID REFERENCES core.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

""",
    
    "valuation_tables": """--
-- Valuation Tables
--

-- Property assessments table
CREATE TABLE IF NOT EXISTS valuation.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES core.properties(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    assessed_value NUMERIC NOT NULL,
    land_value NUMERIC,
    improvement_value NUMERIC,
    assessment_type TEXT NOT NULL,
    assessor TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Property improvements table
CREATE TABLE IF NOT EXISTS valuation.improvements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES core.properties(id) ON DELETE CASCADE,
    improvement_type TEXT NOT NULL,
    description TEXT,
    year_built INTEGER,
    condition TEXT,
    square_footage NUMERIC,
    value NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Property sales table
CREATE TABLE IF NOT EXISTS valuation.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES core.properties(id) ON DELETE CASCADE,
    sale_date DATE NOT NULL,
    sale_price NUMERIC NOT NULL,
    buyer_name TEXT,
    seller_name TEXT,
    sale_type TEXT,
    verification_status TEXT,
    verified_by TEXT,
    verification_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

""",
    
    "sync_tables": """--
-- Sync Tables
--

-- Data sync jobs table
CREATE TABLE IF NOT EXISTS sync.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type TEXT NOT NULL,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    parameters JSONB,
    status TEXT DEFAULT 'pending',
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    created_by UUID REFERENCES core.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data sync mappings table
CREATE TABLE IF NOT EXISTS sync.field_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_table TEXT NOT NULL,
    destination_table TEXT NOT NULL,
    source_field TEXT NOT NULL,
    destination_field TEXT NOT NULL,
    transformation TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data sync logs table
CREATE TABLE IF NOT EXISTS sync.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES sync.jobs(id) ON DELETE CASCADE,
    log_level TEXT NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

""",
    
    "analytics_tables": """--
-- Analytics Tables
--

-- Analytics reports table
CREATE TABLE IF NOT EXISTS analytics.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    query TEXT NOT NULL,
    parameters JSONB,
    created_by UUID REFERENCES core.users(id),
    schedule TEXT,
    last_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Analytics dashboards table
CREATE TABLE IF NOT EXISTS analytics.dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    layout JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES core.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Analytics dashboard items table
CREATE TABLE IF NOT EXISTS analytics.dashboard_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID REFERENCES analytics.dashboards(id) ON DELETE CASCADE,
    report_id UUID REFERENCES analytics.reports(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    title TEXT NOT NULL,
    position JSONB,
    size JSONB,
    parameters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Analytics cached results table
CREATE TABLE IF NOT EXISTS analytics.cached_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES analytics.reports(id) ON DELETE CASCADE,
    parameters JSONB,
    results JSONB,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE
);

""",
    
    "external_tables": """--
-- External Integration Tables
--

-- External systems table
CREATE TABLE IF NOT EXISTS external.systems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    api_endpoint TEXT,
    auth_type TEXT,
    credentials JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- External webhooks table
CREATE TABLE IF NOT EXISTS external.webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_id UUID REFERENCES external.systems(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    headers JSONB,
    payload_template JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- External data exchange logs table
CREATE TABLE IF NOT EXISTS external.exchange_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_id UUID REFERENCES external.systems(id) ON DELETE CASCADE,
    webhook_id UUID REFERENCES external.webhooks(id) ON DELETE SET NULL,
    direction TEXT NOT NULL,
    request_data JSONB,
    response_data JSONB,
    status_code INTEGER,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

""",
    
    "api_views": """--
-- API Views for Third-Party Access
--

-- Properties view (sanitized for external access)
CREATE OR REPLACE VIEW api.properties AS
SELECT 
    p.id,
    p.parcel_number,
    p.address,
    p.property_class,
    p.zoning,
    -- Exclude sensitive information
    NULL as owner_name,
    NULL as owner_contact,
    p.assessed_value,
    p.last_assessment_date,
    ST_AsGeoJSON(p.location)::jsonb as geometry
FROM 
    core.properties p;

-- Property assessments view
CREATE OR REPLACE VIEW api.assessments AS
SELECT 
    a.id,
    a.property_id,
    a.assessment_date,
    a.assessed_value,
    a.land_value,
    a.improvement_value,
    a.assessment_type
FROM 
    valuation.assessments a;

-- GIS layers view
CREATE OR REPLACE VIEW api.layers AS
SELECT 
    id,
    name,
    description,
    category,
    is_active
FROM 
    gis.layers;

-- Function to get sanitized property by ID
CREATE OR REPLACE FUNCTION api.get_property_by_id(property_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', p.id,
        'parcel_number', p.parcel_number,
        'address', p.address,
        'property_class', p.property_class,
        'zoning', p.zoning,
        'assessed_value', p.assessed_value,
        'last_assessment_date', p.last_assessment_date,
        'geometry', ST_AsGeoJSON(p.location)::jsonb
    ) INTO result
    FROM core.properties p
    WHERE p.id = property_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get properties in area
CREATE OR REPLACE FUNCTION api.get_properties_in_radius(
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT json_agg(
        jsonb_build_object(
            'id', p.id,
            'parcel_number', p.parcel_number,
            'address', p.address,
            'property_class', p.property_class,
            'distance_meters', ST_Distance(
                p.location::geography,
                ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
            )
        )
    )::jsonb INTO result
    FROM core.properties p
    WHERE ST_DWithin(
        p.location::geography,
        ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
        radius_meters
    );
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

""",
    
    "cross_schema_functions": """--
-- Cross-Schema Functions
--

-- Get property with valuation data
CREATE OR REPLACE FUNCTION core.get_property_with_valuation(property_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'property', row_to_json(p),
        'valuation', row_to_json(v),
        'gis_data', row_to_json(g)
    ) INTO result
    FROM core.properties p
    LEFT JOIN valuation.assessments v ON p.id = v.property_id
    LEFT JOIN gis.property_geometries g ON p.id = g.property_id
    WHERE p.id = property_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Property update notification function
CREATE OR REPLACE FUNCTION notify_property_update()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'property_updates',
        json_build_object(
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA,
            'operation', TG_OP,
            'record_id', NEW.id
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get latest assessment for property
CREATE OR REPLACE FUNCTION valuation.get_latest_assessment(property_id UUID)
RETURNS valuation.assessments AS $$
DECLARE
    result valuation.assessments;
BEGIN
    SELECT * INTO result
    FROM valuation.assessments
    WHERE property_id = $1
    ORDER BY assessment_date DESC
    LIMIT 1;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

""",
    
    "rls_policies": """--
-- Row Level Security Policies
--

-- Enable RLS on core tables
ALTER TABLE core.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.files ENABLE ROW LEVEL SECURITY;

-- Enable RLS on gis tables
ALTER TABLE gis.property_geometries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gis.layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gis.map_views ENABLE ROW LEVEL SECURITY;

-- Enable RLS on valuation tables
ALTER TABLE valuation.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuation.improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuation.sales ENABLE ROW LEVEL SECURITY;

-- Enable RLS on sync tables
ALTER TABLE sync.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync.field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync.logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on analytics tables
ALTER TABLE analytics.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.dashboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.cached_results ENABLE ROW LEVEL SECURITY;

-- Enable RLS on external tables
ALTER TABLE external.systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE external.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE external.exchange_logs ENABLE ROW LEVEL SECURITY;

-- Core properties policies
CREATE POLICY "Properties admin access" ON core.properties
    FOR ALL TO postgres, gis_service, valuation_service, sync_service;

CREATE POLICY "Analytics read properties" ON core.properties
    FOR SELECT TO analytics_service;

-- File policies
CREATE POLICY "Files admin access" ON core.files
    FOR ALL TO postgres, gis_service, sync_service;

CREATE POLICY "Valuation service file access" ON core.files
    FOR SELECT TO valuation_service;

-- GIS table policies
CREATE POLICY "GIS admin access" ON gis.property_geometries
    FOR ALL TO postgres, gis_service, sync_service;

CREATE POLICY "Valuation service GIS read access" ON gis.property_geometries
    FOR SELECT TO valuation_service;

CREATE POLICY "Analytics GIS read access" ON gis.property_geometries
    FOR SELECT TO analytics_service;

-- Valuation table policies
CREATE POLICY "Valuation admin access" ON valuation.assessments
    FOR ALL TO postgres, valuation_service, sync_service;

CREATE POLICY "GIS service valuation read access" ON valuation.assessments
    FOR SELECT TO gis_service;

CREATE POLICY "Analytics valuation read access" ON valuation.assessments
    FOR SELECT TO analytics_service;

-- Sync table policies
CREATE POLICY "Sync admin access" ON sync.jobs
    FOR ALL TO postgres, sync_service;

CREATE POLICY "Service sync read access" ON sync.jobs
    FOR SELECT TO gis_service, valuation_service, analytics_service;

-- Analytics table policies
CREATE POLICY "Analytics admin access" ON analytics.reports
    FOR ALL TO postgres, analytics_service;

CREATE POLICY "Service analytics read access" ON analytics.reports
    FOR SELECT TO gis_service, valuation_service, sync_service;

-- External access policies
CREATE POLICY "External API view access" ON api.properties
    FOR SELECT TO postgres, external_app_role, gis_service, valuation_service, 
                            sync_service, analytics_service;

""",
    
    "triggers": """--
-- Database Triggers
--

-- Audit triggers
CREATE TRIGGER properties_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON core.properties
FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

CREATE TRIGGER assessments_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON valuation.assessments
FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

CREATE TRIGGER improvements_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON valuation.improvements
FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

CREATE TRIGGER sales_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON valuation.sales
FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- Notification triggers
CREATE TRIGGER property_update_notify_trigger
AFTER INSERT OR UPDATE ON core.properties
FOR EACH ROW EXECUTE FUNCTION notify_property_update();

CREATE TRIGGER assessment_update_notify_trigger
AFTER INSERT OR UPDATE ON valuation.assessments
FOR EACH ROW EXECUTE FUNCTION notify_property_update();

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_core_properties_timestamp
BEFORE UPDATE ON core.properties
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_valuation_assessments_timestamp
BEFORE UPDATE ON valuation.assessments
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

""",
    
    "footer": """--
-- End of Schema
--
"""
}

def generate_schema(output_file: str, sections: List[str] = None):
    """
    Generate the SQL schema file.
    
    Args:
        output_file: Path to output file
        sections: List of section names to include (defaults to all)
    """
    if sections is None:
        sections = list(SQL_SECTIONS.keys())
    
    with open(output_file, 'w') as f:
        for section in sections:
            if section in SQL_SECTIONS:
                f.write(SQL_SECTIONS[section])
            else:
                logger.warning(f"Unknown section: {section}")
    
    logger.info(f"Schema generated and saved to {output_file}")
    logger.info(f"Included sections: {', '.join(sections)}")

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Generate shared database schema SQL file")
    parser.add_argument("--output", "-o", default="shared_schema.sql", help="Output file path")
    parser.add_argument("--sections", "-s", nargs='+', help="Specific sections to include")
    parser.add_argument("--list-sections", "-l", action="store_true", help="List available sections")
    args = parser.parse_args()
    
    if args.list_sections:
        print("Available schema sections:")
        for section in SQL_SECTIONS.keys():
            print(f"  - {section}")
        return 0
    
    generate_schema(args.output, args.sections)
    return 0

if __name__ == "__main__":
    sys.exit(main())
#!/usr/bin/env python3
"""
Supabase Shared Database Setup Script

This script sets up the necessary schema segregation, service accounts, and 
cross-schema functions for a shared Supabase database that supports multiple
modules, microservices, and third-party applications.
"""

import os
import sys
import logging
import time
import getpass
from typing import Dict, Any, List, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("shared_db_setup")

# Try to import supabase
try:
    from supabase import create_client, Client
    from postgrest.exceptions import APIError
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.error("❌ Supabase package not installed. Install with: pip install supabase")

# Import our client
from supabase_client import get_supabase_client

# Schema definitions
SCHEMAS = [
    {
        "name": "core",
        "description": "Core system functionality and shared tables"
    },
    {
        "name": "gis",
        "description": "GIS-specific tables and functions"
    },
    {
        "name": "valuation",
        "description": "Property valuation module"
    },
    {
        "name": "sync",
        "description": "Data synchronization service"
    },
    {
        "name": "analytics",
        "description": "Analytics and reporting"
    },
    {
        "name": "external",
        "description": "Third-party application integration"
    },
    {
        "name": "api",
        "description": "API views and functions for external access"
    },
    {
        "name": "audit",
        "description": "Audit logging and tracking"
    }
]

# Service roles
SERVICE_ROLES = [
    {
        "name": "gis_service",
        "description": "GIS module service account",
        "schema_permissions": {
            "core": ["SELECT"],
            "gis": ["SELECT", "INSERT", "UPDATE", "DELETE"],
            "api": ["SELECT"]
        }
    },
    {
        "name": "valuation_service",
        "description": "Property valuation service account",
        "schema_permissions": {
            "core": ["SELECT"],
            "gis": ["SELECT"],
            "valuation": ["SELECT", "INSERT", "UPDATE", "DELETE"],
            "api": ["SELECT"]
        }
    },
    {
        "name": "sync_service",
        "description": "Data synchronization service account",
        "schema_permissions": {
            "core": ["SELECT", "INSERT", "UPDATE", "DELETE"],
            "gis": ["SELECT", "INSERT", "UPDATE", "DELETE"],
            "valuation": ["SELECT", "INSERT", "UPDATE", "DELETE"],
            "sync": ["SELECT", "INSERT", "UPDATE", "DELETE"],
            "api": ["SELECT"]
        }
    },
    {
        "name": "analytics_service",
        "description": "Analytics and reporting service account",
        "schema_permissions": {
            "core": ["SELECT"],
            "gis": ["SELECT"],
            "valuation": ["SELECT"],
            "analytics": ["SELECT", "INSERT", "UPDATE", "DELETE"],
            "api": ["SELECT"]
        }
    },
    {
        "name": "external_app_role",
        "description": "External application access",
        "schema_permissions": {
            "api": ["SELECT"],
            "external": ["SELECT", "INSERT", "UPDATE", "DELETE"]
        }
    }
]

# Cross-schema functions
CROSS_SCHEMA_FUNCTIONS = [
    """
    -- Create a function to join property data across schemas
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
    """,
    
    """
    -- Create a notification function for change events
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
    """,
    
    """
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
    """
]

# Audit table creation
AUDIT_TABLE_SQL = """
-- Create audit log table
CREATE TABLE audit.logs (
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
CREATE INDEX idx_audit_logs_timestamp ON audit.logs(timestamp);

-- Create index on record_id for faster lookups
CREATE INDEX idx_audit_logs_record_id ON audit.logs(record_id);
"""

# API views for third-party access
API_VIEWS_SQL = """
-- Create a sanitized view for third-party applications
CREATE OR REPLACE VIEW api.properties AS
    SELECT 
        id,
        parcel_number,
        address,
        property_class,
        zoning,
        -- Exclude sensitive information
        NULL as owner_name,
        NULL as owner_contact,
        assessed_value,
        last_assessment_date,
        ST_AsGeoJSON(location)::jsonb as geometry
    FROM 
        core.properties;

-- Create function to get sanitized property by ID
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
"""

def check_schema_exists(client: Client, schema_name: str) -> bool:
    """Check if a schema exists."""
    try:
        query = f"SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = '{schema_name}');"
        response = client.sql(query).execute()
        return response.data[0]['exists']
    except Exception as e:
        logger.error(f"Error checking if schema {schema_name} exists: {str(e)}")
        return False

def create_schema(client: Client, schema_name: str) -> bool:
    """Create a database schema."""
    try:
        # Create the schema
        query = f"CREATE SCHEMA IF NOT EXISTS {schema_name};"
        client.sql(query).execute()
        logger.info(f"✅ Created schema: {schema_name}")
        return True
    except Exception as e:
        logger.error(f"❌ Error creating schema {schema_name}: {str(e)}")
        return False

def check_role_exists(client: Client, role_name: str) -> bool:
    """Check if a role exists."""
    try:
        query = f"SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = '{role_name}');"
        response = client.sql(query).execute()
        return response.data[0]['exists']
    except Exception as e:
        logger.error(f"Error checking if role {role_name} exists: {str(e)}")
        return False

def create_role(client: Client, role_name: str, password: str = None) -> bool:
    """Create a database role."""
    try:
        # Create the role
        if password:
            query = f"CREATE ROLE {role_name} WITH LOGIN PASSWORD '{password}';"
        else:
            query = f"CREATE ROLE {role_name};"
            
        client.sql(query).execute()
        logger.info(f"✅ Created role: {role_name}")
        return True
    except Exception as e:
        logger.error(f"❌ Error creating role {role_name}: {str(e)}")
        return False

def grant_permissions(client: Client, role_name: str, schema_name: str, permissions: List[str]) -> bool:
    """Grant permissions to a role on a schema."""
    try:
        # Grant schema usage
        query = f"GRANT USAGE ON SCHEMA {schema_name} TO {role_name};"
        client.sql(query).execute()
        
        # Grant permissions on all tables in schema
        for permission in permissions:
            query = f"GRANT {permission} ON ALL TABLES IN SCHEMA {schema_name} TO {role_name};"
            client.sql(query).execute()
            
            # Grant for future tables
            query = f"ALTER DEFAULT PRIVILEGES IN SCHEMA {schema_name} GRANT {permission} ON TABLES TO {role_name};"
            client.sql(query).execute()
        
        logger.info(f"✅ Granted {', '.join(permissions)} on schema {schema_name} to role {role_name}")
        return True
    except Exception as e:
        logger.error(f"❌ Error granting permissions to {role_name} on {schema_name}: {str(e)}")
        return False

def execute_sql(client: Client, sql: str, description: str) -> bool:
    """Execute an SQL statement."""
    try:
        client.sql(sql).execute()
        logger.info(f"✅ {description}")
        return True
    except Exception as e:
        logger.error(f"❌ Error executing SQL for {description}: {str(e)}")
        return False

def setup_schemas(client: Client) -> int:
    """Set up all required schemas."""
    success_count = 0
    
    logger.info("Creating database schemas...")
    for schema in SCHEMAS:
        if create_schema(client, schema['name']):
            success_count += 1
    
    return success_count

def setup_service_roles(client: Client, generate_passwords: bool = False) -> int:
    """Set up all service roles."""
    success_count = 0
    
    logger.info("Creating service roles...")
    for role in SERVICE_ROLES:
        role_name = role['name']
        
        # Check if role already exists
        if check_role_exists(client, role_name):
            logger.info(f"Role {role_name} already exists, skipping creation")
            continue
        
        # Generate or prompt for password
        password = None
        if generate_passwords:
            import secrets
            import string
            alphabet = string.ascii_letters + string.digits
            password = ''.join(secrets.choice(alphabet) for _ in range(16))
            logger.info(f"Generated password for role {role_name}: {password}")
        else:
            password = getpass.getpass(f"Enter password for role {role_name}: ")
        
        # Create the role
        if create_role(client, role_name, password):
            success_count += 1
    
    return success_count

def setup_permissions(client: Client) -> int:
    """Set up all role permissions."""
    success_count = 0
    
    logger.info("Setting up role permissions...")
    for role in SERVICE_ROLES:
        role_name = role['name']
        schema_permissions = role['schema_permissions']
        
        role_success = True
        for schema_name, permissions in schema_permissions.items():
            if not grant_permissions(client, role_name, schema_name, permissions):
                role_success = False
        
        if role_success:
            success_count += 1
    
    return success_count

def setup_cross_schema_functions(client: Client) -> int:
    """Set up all cross-schema functions."""
    success_count = 0
    
    logger.info("Creating cross-schema functions...")
    for i, function_sql in enumerate(CROSS_SCHEMA_FUNCTIONS):
        if execute_sql(client, function_sql, f"Created cross-schema function #{i+1}"):
            success_count += 1
    
    return success_count

def setup_audit_table(client: Client) -> bool:
    """Set up the audit logging table."""
    logger.info("Creating audit table...")
    return execute_sql(client, AUDIT_TABLE_SQL, "Created audit table")

def setup_api_views(client: Client) -> bool:
    """Set up API views for third-party access."""
    logger.info("Creating API views...")
    return execute_sql(client, API_VIEWS_SQL, "Created API views")

def main():
    """Main function."""
    logger.info("=== Supabase Shared Database Setup ===")
    
    # Get Supabase client
    client = get_supabase_client()
    if not client:
        logger.error("Failed to get Supabase client")
        return 1
    
    # Set up schemas
    logger.info("\n=== Setting up schemas ===")
    schemas_count = setup_schemas(client)
    logger.info(f"Created {schemas_count}/{len(SCHEMAS)} schemas")
    
    # Set up roles
    logger.info("\n=== Setting up service roles ===")
    roles_count = setup_service_roles(client, generate_passwords=False)
    logger.info(f"Created {roles_count}/{len(SERVICE_ROLES)} service roles")
    
    # Set up permissions
    logger.info("\n=== Setting up role permissions ===")
    permissions_count = setup_permissions(client)
    logger.info(f"Set up permissions for {permissions_count}/{len(SERVICE_ROLES)} roles")
    
    # Set up audit table
    logger.info("\n=== Setting up audit logging ===")
    audit_success = setup_audit_table(client)
    
    # Set up API views
    logger.info("\n=== Setting up API views ===")
    api_success = setup_api_views(client)
    
    # Set up cross-schema functions
    logger.info("\n=== Setting up cross-schema functions ===")
    functions_count = setup_cross_schema_functions(client)
    logger.info(f"Created {functions_count}/{len(CROSS_SCHEMA_FUNCTIONS)} cross-schema functions")
    
    # Summary
    logger.info("\n=== Setup Summary ===")
    if schemas_count == len(SCHEMAS) and roles_count == len(SERVICE_ROLES) and \
       permissions_count == len(SERVICE_ROLES) and audit_success and api_success and \
       functions_count == len(CROSS_SCHEMA_FUNCTIONS):
        logger.info("✅ Shared database setup completed successfully!")
        return 0
    else:
        logger.warning("⚠️ Shared database setup completed with some warnings or errors")
        return 1

if __name__ == "__main__":
    sys.exit(main())
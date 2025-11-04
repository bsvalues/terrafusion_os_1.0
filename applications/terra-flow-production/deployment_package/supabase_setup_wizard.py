#!/usr/bin/env python3
"""
Supabase Setup Wizard for GeoAssessmentPro

This script guides users through the process of setting up and configuring
Supabase for use with the GeoAssessmentPro application. It verifies environment
variables, checks the database connection, creates required tables and functions,
and sets up storage buckets.

Usage:
    python supabase_setup_wizard.py

Requirements:
    - supabase-py
    - colorama (for colored terminal output)
"""

import os
import sys
import time
import json
import logging
import argparse
from typing import Dict, Any, List, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("supabase_setup")

# Try to import colorama for colored output
try:
    from colorama import init, Fore, Back, Style
    init(autoreset=True)
    HAS_COLORS = True
except ImportError:
    HAS_COLORS = False
    # Stub color objects
    class DummyColor:
        def __getattr__(self, name):
            return ""
    Fore = DummyColor()
    Back = DummyColor()
    Style = DummyColor()

# Try to import supabase
try:
    from supabase import create_client, Client
    from postgrest.exceptions import APIError
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.error("❌ Supabase package not installed. Install with: pip install supabase")

# Import environment setup
try:
    from set_supabase_env import ensure_supabase_env
except ImportError:
    logger.error("❌ set_supabase_env.py not found in current directory")
    ensure_supabase_env = None

# Import required functions
from supabase_client import get_supabase_client

# SQL statements for custom functions
SQL_FUNCTIONS = [
    """
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
    """,
    
    """
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
    """,
    
    """
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
    """,
    
    """
    -- GeoJSON conversion function
    CREATE OR REPLACE FUNCTION to_geojson(geometry_column geometry)
    RETURNS JSONB AS $$
    BEGIN
        RETURN ST_AsGeoJSON(geometry_column)::jsonb;
    END;
    $$ LANGUAGE plpgsql;
    """
]

# Required extensions
REQUIRED_EXTENSIONS = [
    "postgis",
    "uuid-ossp",
    "pg_stat_statements"
]

# Required storage buckets
REQUIRED_BUCKETS = [
    {"name": "documents", "public": False, "description": "Project documentation and reports"},
    {"name": "maps", "public": True, "description": "GIS map exports and shared maps"},
    {"name": "images", "public": True, "description": "Images and graphics for the application"},
    {"name": "exports", "public": False, "description": "Data exports and backups"}
]

# Schema definition
TABLES = [
    {
        "name": "users",
        "columns": [
            {"name": "id", "type": "uuid", "constraints": "PRIMARY KEY DEFAULT uuid_generate_v4()"},
            {"name": "username", "type": "text", "constraints": "UNIQUE NOT NULL"},
            {"name": "email", "type": "text", "constraints": "UNIQUE NOT NULL"},
            {"name": "full_name", "type": "text"},
            {"name": "department", "type": "text"},
            {"name": "created_at", "type": "timestamp with time zone", "constraints": "DEFAULT now()"},
            {"name": "last_login", "type": "timestamp with time zone"}
        ]
    },
    {
        "name": "roles",
        "columns": [
            {"name": "id", "type": "serial", "constraints": "PRIMARY KEY"},
            {"name": "name", "type": "text", "constraints": "UNIQUE NOT NULL"},
            {"name": "description", "type": "text"}
        ]
    },
    {
        "name": "user_roles",
        "columns": [
            {"name": "user_id", "type": "uuid", "constraints": "REFERENCES users(id) ON DELETE CASCADE"},
            {"name": "role_id", "type": "integer", "constraints": "REFERENCES roles(id) ON DELETE CASCADE"},
            {"name": "assigned_at", "type": "timestamp with time zone", "constraints": "DEFAULT now()"},
            {"name": "PRIMARY KEY", "type": "", "constraints": "(user_id, role_id)"}
        ]
    },
    {
        "name": "files",
        "columns": [
            {"name": "id", "type": "uuid", "constraints": "PRIMARY KEY DEFAULT uuid_generate_v4()"},
            {"name": "filename", "type": "text", "constraints": "NOT NULL"},
            {"name": "original_filename", "type": "text", "constraints": "NOT NULL"},
            {"name": "file_path", "type": "text", "constraints": "NOT NULL"},
            {"name": "file_type", "type": "text"},
            {"name": "file_size", "type": "bigint"},
            {"name": "user_id", "type": "uuid", "constraints": "REFERENCES users(id)"},
            {"name": "uploaded_at", "type": "timestamp with time zone", "constraints": "DEFAULT now()"},
            {"name": "description", "type": "text"},
            {"name": "metadata", "type": "jsonb"}
        ]
    },
    {
        "name": "gis_data",
        "columns": [
            {"name": "id", "type": "uuid", "constraints": "PRIMARY KEY DEFAULT uuid_generate_v4()"},
            {"name": "file_id", "type": "uuid", "constraints": "REFERENCES files(id)"},
            {"name": "geometry", "type": "geometry"},
            {"name": "properties", "type": "jsonb"},
            {"name": "created_at", "type": "timestamp with time zone", "constraints": "DEFAULT now()"}
        ]
    },
    {
        "name": "data_quality_alerts",
        "columns": [
            {"name": "id", "type": "uuid", "constraints": "PRIMARY KEY DEFAULT uuid_generate_v4()"},
            {"name": "name", "type": "text", "constraints": "NOT NULL"},
            {"name": "description", "type": "text"},
            {"name": "query", "type": "text", "constraints": "NOT NULL"},
            {"name": "severity", "type": "text", "constraints": "NOT NULL"},
            {"name": "active", "type": "boolean", "constraints": "DEFAULT true"},
            {"name": "created_at", "type": "timestamp with time zone", "constraints": "DEFAULT now()"},
            {"name": "updated_at", "type": "timestamp with time zone", "constraints": "DEFAULT now()"}
        ]
    }
]

# Table policies
TABLE_POLICIES = [
    # Files table policies
    {
        "table": "files",
        "policies": [
            {
                "name": "Users can view their own files",
                "operation": "SELECT",
                "using": "auth.uid() = user_id"
            },
            {
                "name": "Users can insert their own files",
                "operation": "INSERT",
                "check": "auth.uid() = user_id"
            },
            {
                "name": "Users can update their own files",
                "operation": "UPDATE",
                "using": "auth.uid() = user_id"
            },
            {
                "name": "Users can delete their own files",
                "operation": "DELETE",
                "using": "auth.uid() = user_id"
            }
        ]
    },
    # GIS data table policies
    {
        "table": "gis_data",
        "policies": [
            {
                "name": "Users can view gis_data through files",
                "operation": "SELECT",
                "using": "EXISTS (SELECT 1 FROM files WHERE files.id = gis_data.file_id AND files.user_id = auth.uid())"
            },
            {
                "name": "Users can insert gis_data through files",
                "operation": "INSERT",
                "check": "EXISTS (SELECT 1 FROM files WHERE files.id = gis_data.file_id AND files.user_id = auth.uid())"
            },
            {
                "name": "Users can update gis_data through files",
                "operation": "UPDATE",
                "using": "EXISTS (SELECT 1 FROM files WHERE files.id = gis_data.file_id AND files.user_id = auth.uid())"
            },
            {
                "name": "Users can delete gis_data through files",
                "operation": "DELETE",
                "using": "EXISTS (SELECT 1 FROM files WHERE files.id = gis_data.file_id AND files.user_id = auth.uid())"
            }
        ]
    }
]

def print_header(title: str) -> None:
    """Print a formatted header."""
    if HAS_COLORS:
        print(f"\n{Fore.CYAN}{Style.BRIGHT}{'=' * 60}")
        print(f"{Fore.CYAN}{Style.BRIGHT}  {title}")
        print(f"{Fore.CYAN}{Style.BRIGHT}{'=' * 60}{Style.RESET_ALL}\n")
    else:
        print(f"\n{'=' * 60}")
        print(f"  {title}")
        print(f"{'=' * 60}\n")

def print_step(step: str, status: str = None) -> None:
    """Print a step with optional status."""
    if status:
        status_color = ""
        if HAS_COLORS:
            if status.lower() == "ok" or status.lower() == "success":
                status_color = f"{Fore.GREEN}[{status.upper()}]{Style.RESET_ALL}"
            elif status.lower() == "warning" or status.lower() == "warn":
                status_color = f"{Fore.YELLOW}[{status.upper()}]{Style.RESET_ALL}"
            elif status.lower() == "error" or status.lower() == "fail":
                status_color = f"{Fore.RED}[{status.upper()}]{Style.RESET_ALL}"
            else:
                status_color = f"[{status.upper()}]"
        else:
            status_color = f"[{status.upper()}]"
        
        print(f"  {step} {status_color}")
    else:
        print(f"  {step}")

def check_environment_variables() -> bool:
    """Check if required environment variables are set."""
    required_vars = ["SUPABASE_URL", "SUPABASE_KEY"]
    missing_vars = []
    
    for var in required_vars:
        if not os.environ.get(var):
            missing_vars.append(var)
    
    if missing_vars:
        print_step(f"The following required environment variables are missing: {', '.join(missing_vars)}", "error")
        if ensure_supabase_env:
            print_step("Attempting to set up environment variables...")
            ensure_supabase_env()
            
            # Check again
            still_missing = []
            for var in required_vars:
                if not os.environ.get(var):
                    still_missing.append(var)
            
            if still_missing:
                print_step(f"Still missing: {', '.join(still_missing)}", "error")
                return False
            else:
                print_step("Environment variables successfully set", "ok")
                return True
        else:
            print_step("Manual setup required. Please set these environment variables.", "warning")
            return False
    else:
        print_step("All required environment variables are set", "ok")
        return True

def check_supabase_connection() -> Tuple[bool, Optional[Client]]:
    """Check connection to Supabase."""
    if not SUPABASE_AVAILABLE:
        print_step("Supabase package not installed", "error")
        return False, None
    
    try:
        client = get_supabase_client()
        if not client:
            print_step("Failed to get Supabase client", "error")
            return False, None
        
        # Simple test query
        response = client.table("information_schema.tables").select("table_name").limit(1).execute()
        print_step("Successfully connected to Supabase", "ok")
        return True, client
    except Exception as e:
        print_step(f"Error connecting to Supabase: {str(e)}", "error")
        return False, None

def check_extensions(client: Client) -> Dict[str, bool]:
    """Check if required extensions are enabled."""
    results = {}
    
    try:
        # First check if we have the pg_extension table
        response = client.table("pg_extension").select("extname, extversion").execute()
        
        # Convert to dict for easy checking
        extensions = {}
        for ext in response.data:
            extensions[ext['extname']] = ext['extversion']
        
        for ext in REQUIRED_EXTENSIONS:
            if ext in extensions:
                print_step(f"Extension {ext} is installed (version: {extensions[ext]})", "ok")
                results[ext] = True
            else:
                print_step(f"Extension {ext} is not installed", "warning")
                results[ext] = False
    except Exception as e:
        print_step(f"Error checking extensions: {str(e)}", "error")
        for ext in REQUIRED_EXTENSIONS:
            results[ext] = False
    
    return results

def create_extension(client: Client, extension_name: str) -> bool:
    """Create a PostgreSQL extension."""
    try:
        query = f"CREATE EXTENSION IF NOT EXISTS {extension_name};"
        client.sql(query).execute()
        print_step(f"Created extension {extension_name}", "ok")
        return True
    except Exception as e:
        print_step(f"Error creating extension {extension_name}: {str(e)}", "error")
        return False

def setup_functions(client: Client) -> int:
    """Set up required database functions."""
    success_count = 0
    
    for i, sql in enumerate(SQL_FUNCTIONS):
        try:
            client.sql(sql).execute()
            print_step(f"Created function #{i+1}", "ok")
            success_count += 1
        except Exception as e:
            print_step(f"Error creating function #{i+1}: {str(e)}", "error")
    
    return success_count

def check_table_exists(client: Client, table_name: str) -> bool:
    """Check if a table exists."""
    try:
        query = f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table_name}');"
        response = client.sql(query).execute()
        return response.data[0]['exists']
    except Exception as e:
        print_step(f"Error checking if table {table_name} exists: {str(e)}", "error")
        return False

def create_table(client: Client, table_def: Dict[str, Any]) -> bool:
    """Create a database table."""
    table_name = table_def['name']
    columns = table_def['columns']
    
    # Skip if table already exists
    if check_table_exists(client, table_name):
        print_step(f"Table {table_name} already exists", "ok")
        return True
    
    try:
        # Build CREATE TABLE statement
        column_defs = []
        for col in columns:
            if col.get('constraints'):
                column_defs.append(f"{col['name']} {col['type']} {col['constraints']}")
            else:
                column_defs.append(f"{col['name']} {col['type']}")
        
        create_stmt = f"CREATE TABLE {table_name} (\n  " + ",\n  ".join(column_defs) + "\n);"
        
        # Execute statement
        client.sql(create_stmt).execute()
        print_step(f"Created table {table_name}", "ok")
        return True
    except Exception as e:
        print_step(f"Error creating table {table_name}: {str(e)}", "error")
        return False

def setup_tables(client: Client) -> int:
    """Set up all required database tables."""
    success_count = 0
    
    for table_def in TABLES:
        if create_table(client, table_def):
            success_count += 1
    
    return success_count

def enable_rls(client: Client, table_name: str) -> bool:
    """Enable Row Level Security for a table."""
    try:
        query = f"ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;"
        client.sql(query).execute()
        print_step(f"Enabled RLS for table {table_name}", "ok")
        return True
    except Exception as e:
        print_step(f"Error enabling RLS for table {table_name}: {str(e)}", "error")
        return False

def setup_policy(client: Client, table_name: str, policy: Dict[str, Any]) -> bool:
    """Set up a row security policy."""
    try:
        name = policy['name']
        operation = policy['operation']
        
        if 'using' in policy and policy['using']:
            using_clause = f"USING ({policy['using']})"
        else:
            using_clause = ""
            
        if 'check' in policy and policy['check']:
            check_clause = f"WITH CHECK ({policy['check']})"
        else:
            check_clause = ""
        
        # Build and execute policy statement
        policy_stmt = f"CREATE POLICY \"{name}\" ON {table_name} FOR {operation} {using_clause} {check_clause};"
        client.sql(policy_stmt).execute()
        
        print_step(f"Created policy '{name}' on table {table_name}", "ok")
        return True
    except Exception as e:
        print_step(f"Error creating policy '{policy['name']}' on table {table_name}: {str(e)}", "error")
        return False

def setup_table_policies(client: Client) -> int:
    """Set up all table policies for row level security."""
    success_count = 0
    
    for table_policy in TABLE_POLICIES:
        table_name = table_policy['table']
        
        # First, enable RLS for the table
        if not enable_rls(client, table_name):
            continue
        
        # Then create each policy
        policies_success = 0
        for policy in table_policy['policies']:
            if setup_policy(client, table_name, policy):
                policies_success += 1
        
        if policies_success == len(table_policy['policies']):
            success_count += 1
            print_step(f"All policies for table {table_name} created successfully", "ok")
        else:
            print_step(f"Some policies for table {table_name} failed to create", "warning")
    
    return success_count

def check_bucket_exists(client: Client, bucket_name: str) -> bool:
    """Check if a storage bucket exists."""
    try:
        # Just try to get the bucket details, will throw an exception if it doesn't exist
        client.storage.get_bucket(bucket_name)
        return True
    except Exception:
        return False

def create_bucket(client: Client, bucket_def: Dict[str, Any]) -> bool:
    """Create a storage bucket."""
    bucket_name = bucket_def['name']
    is_public = bucket_def['public']
    
    # Skip if bucket already exists
    if check_bucket_exists(client, bucket_name):
        print_step(f"Bucket {bucket_name} already exists", "ok")
        return True
    
    try:
        # Create the bucket
        client.storage.create_bucket(bucket_name, {'public': is_public})
        print_step(f"Created {'public' if is_public else 'private'} bucket {bucket_name}", "ok")
        return True
    except Exception as e:
        print_step(f"Error creating bucket {bucket_name}: {str(e)}", "error")
        return False

def setup_storage_buckets(client: Client) -> int:
    """Set up all required storage buckets."""
    success_count = 0
    
    for bucket_def in REQUIRED_BUCKETS:
        if create_bucket(client, bucket_def):
            success_count += 1
    
    return success_count

def interactive_setup() -> None:
    """Run the setup process interactively."""
    print_header("Supabase Setup Wizard for GeoAssessmentPro")
    print("This wizard will guide you through setting up Supabase for use with GeoAssessmentPro.\n")
    
    # Step 1: Environment Variables
    print_header("Step 1: Environment Variables")
    env_ok = check_environment_variables()
    if not env_ok:
        print("\nPlease set the required environment variables and run the script again.")
        return
    
    # Step 2: Supabase Connection
    print_header("Step 2: Supabase Connection")
    conn_ok, client = check_supabase_connection()
    if not conn_ok or not client:
        print("\nPlease check your Supabase credentials and connection.")
        return
    
    # Step 3: Extensions
    print_header("Step 3: PostgreSQL Extensions")
    ext_results = check_extensions(client)
    
    # Attempt to create missing extensions
    for ext_name, ext_ok in ext_results.items():
        if not ext_ok:
            print_step(f"Attempting to create extension {ext_name}...")
            create_extension(client, ext_name)
    
    # Step 4: Functions
    print_header("Step 4: Database Functions")
    function_count = setup_functions(client)
    print_step(f"Created {function_count}/{len(SQL_FUNCTIONS)} functions", 
               "ok" if function_count == len(SQL_FUNCTIONS) else "warning")
    
    # Step 5: Tables
    print_header("Step 5: Database Tables")
    table_count = setup_tables(client)
    print_step(f"Created {table_count}/{len(TABLES)} tables", 
               "ok" if table_count == len(TABLES) else "warning")
    
    # Step 6: Table Policies
    print_header("Step 6: Row Level Security Policies")
    policy_count = setup_table_policies(client)
    print_step(f"Set up policies for {policy_count}/{len(TABLE_POLICIES)} tables", 
               "ok" if policy_count == len(TABLE_POLICIES) else "warning")
    
    # Step 7: Storage Buckets
    print_header("Step 7: Storage Buckets")
    bucket_count = setup_storage_buckets(client)
    print_step(f"Created {bucket_count}/{len(REQUIRED_BUCKETS)} storage buckets", 
               "ok" if bucket_count == len(REQUIRED_BUCKETS) else "warning")
    
    # Summary
    print_header("Setup Summary")
    if env_ok and conn_ok and function_count == len(SQL_FUNCTIONS) and \
       table_count == len(TABLES) and policy_count == len(TABLE_POLICIES) and \
       bucket_count == len(REQUIRED_BUCKETS):
        print_step("Supabase setup completed successfully!", "ok")
    else:
        print_step("Supabase setup completed with some warnings or errors", "warning")
    
    print("\nYou can now use Supabase with your GeoAssessmentPro application.")

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Supabase Setup Wizard for GeoAssessmentPro")
    parser.add_argument("--non-interactive", action="store_true", help="Run in non-interactive mode")
    args = parser.parse_args()
    
    # Only one mode for now, more can be added later
    interactive_setup()

if __name__ == "__main__":
    main()
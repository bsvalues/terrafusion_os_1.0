#!/usr/bin/env python3
"""
Supabase Setup Script

This script sets up the necessary schema in Supabase for the application.
It creates tables, enables extensions, and configures the environment.
"""

import os
import sys
import logging
import time
import json
from typing import Dict, Any, List, Optional

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("supabase_setup")

# Import Supabase
try:
    from supabase import create_client, Client
    from postgrest.exceptions import APIError
except ImportError:
    logger.error("❌ Supabase package not installed. Run: pip install supabase")
    sys.exit(1)

# Import environment setup
from set_supabase_env import ensure_supabase_env

# Tables to create
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
            {"name": "constraints", "type": "text", "constraints": "PRIMARY KEY (user_id, role_id)"}
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
            {"name": "alert_type", "type": "text", "constraints": "NOT NULL"},
            {"name": "query", "type": "text"},
            {"name": "parameters", "type": "jsonb"},
            {"name": "severity", "type": "text", "constraints": "DEFAULT 'medium'"},
            {"name": "is_active", "type": "boolean", "constraints": "DEFAULT true"},
            {"name": "created_at", "type": "timestamp with time zone", "constraints": "DEFAULT now()"},
            {"name": "last_checked", "type": "timestamp with time zone"},
            {"name": "last_triggered", "type": "timestamp with time zone"}
        ]
    }
]

# Storage buckets to create
BUCKETS = [
    {"name": "documents", "public": False},
    {"name": "maps", "public": True},
    {"name": "images", "public": True},
    {"name": "exports", "public": False}
]

# Extensions to enable
EXTENSIONS = [
    "postgis",
    "uuid-ossp",
    "pg_stat_statements"
]

def get_supabase_client() -> Optional[Client]:
    """Get Supabase client with credentials from environment."""
    supabase_config = ensure_supabase_env()
    
    if not supabase_config["url"] or not supabase_config["key"]:
        logger.error("❌ Missing Supabase credentials")
        return None
    
    try:
        logger.info(f"Connecting to Supabase at {supabase_config['url']}")
        client = create_client(supabase_config["url"], supabase_config["key"])
        return client
    except Exception as e:
        logger.error(f"❌ Failed to create Supabase client: {str(e)}")
        return None

def execute_sql(client: Client, query: str, description: str) -> bool:
    """Execute SQL query using the service role."""
    try:
        logger.info(f"Executing: {description}")
        # Use the pg_meta API to execute SQL (requires service role key)
        # client.table("_rpc").select('*').execute()
        # For now, we'll use direct queries where possible
        client.rpc('query', {'sql': query}).execute()
        logger.info(f"✅ {description} - Success")
        return True
    except Exception as e:
        logger.error(f"❌ {description} - Failed: {str(e)}")
        return False

def enable_extensions(client: Client) -> bool:
    """Enable required PostgreSQL extensions."""
    success = True
    for ext in EXTENSIONS:
        query = f"CREATE EXTENSION IF NOT EXISTS {ext};"
        if not execute_sql(client, query, f"Enable {ext} extension"):
            success = False
    return success

def create_tables(client: Client) -> bool:
    """Create application tables."""
    success = True
    
    for table in TABLES:
        # Check if table already exists
        try:
            response = client.table(table["name"]).select("count").limit(1).execute()
            logger.info(f"Table {table['name']} already exists")
            continue
        except APIError as e:
            if "relation" in str(e) and "does not exist" in str(e):
                # Table doesn't exist, create it
                columns = []
                for col in table["columns"]:
                    col_def = f"{col['name']} {col['type']}"
                    if "constraints" in col:
                        col_def += f" {col['constraints']}"
                    columns.append(col_def)
                
                columns_str = ", ".join(columns)
                query = f"CREATE TABLE IF NOT EXISTS {table['name']} ({columns_str});"
                
                if not execute_sql(client, query, f"Create table {table['name']}"):
                    success = False
            else:
                logger.error(f"❌ Error checking table {table['name']}: {str(e)}")
                success = False
    
    return success

def create_storage_buckets(client: Client) -> bool:
    """Create storage buckets."""
    success = True
    
    try:
        # List existing buckets
        existing_buckets = client.storage.list_buckets()
        existing_bucket_names = [b["name"] for b in existing_buckets]
        
        for bucket in BUCKETS:
            if bucket["name"] in existing_bucket_names:
                logger.info(f"Bucket {bucket['name']} already exists")
                continue
            
            # Create bucket
            client.storage.create_bucket(bucket["name"], {"public": bucket["public"]})
            logger.info(f"✅ Created bucket {bucket['name']}")
    
    except Exception as e:
        logger.error(f"❌ Error creating storage buckets: {str(e)}")
        success = False
    
    return success

def setup():
    """Main setup function."""
    logger.info("=== Supabase Setup ===")
    
    # Get Supabase client
    client = get_supabase_client()
    if not client:
        logger.error("Cannot proceed without Supabase client")
        return False
    
    steps = [
        {"name": "Enable extensions", "function": lambda: enable_extensions(client)},
        {"name": "Create tables", "function": lambda: create_tables(client)},
        {"name": "Create storage buckets", "function": lambda: create_storage_buckets(client)}
    ]
    
    results = []
    for step in steps:
        logger.info(f"--- {step['name']} ---")
        success = step["function"]()
        results.append(success)
        if not success:
            logger.warning(f"⚠️ {step['name']} had errors")
    
    # Print summary
    logger.info("\n=== Setup Summary ===")
    success_count = sum(1 for r in results if r)
    total_count = len(results)
    
    logger.info(f"Completed {success_count} out of {total_count} steps successfully")
    
    if all(results):
        logger.info("✅ Setup completed successfully!")
        return True
    else:
        logger.warning("⚠️ Setup completed with errors. Review the log for details.")
        return False

if __name__ == "__main__":
    if setup():
        sys.exit(0)
    else:
        sys.exit(1)
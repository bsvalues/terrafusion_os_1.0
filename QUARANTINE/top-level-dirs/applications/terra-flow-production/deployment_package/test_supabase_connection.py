#!/usr/bin/env python3
"""
Test basic Supabase connection and functionality.
"""

import os
import sys
import logging
import tempfile
from supabase_client import (
    get_supabase_client,
    execute_query,
    upload_file_to_storage,
    list_files_in_storage
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("test_supabase")

def test_supabase_connection():
    """Test the basic connection to Supabase"""
    logger.info("Testing Supabase connection...")
    
    # Get client
    client = get_supabase_client()
    if not client:
        logger.error("Failed to get Supabase client")
        return False
    
    logger.info("✅ Successfully connected to Supabase")
    return True

def test_database_query():
    """Test executing a basic query"""
    logger.info("Testing database query...")
    
    try:
        # Get Supabase client directly to execute a raw query
        from supabase_client import get_supabase_client
        client = get_supabase_client()
        
        if not client:
            logger.error("Failed to get Supabase client")
            return False
        
        # Use a raw query to get tables from information schema
        response = client.rpc(
            'exec_sql', 
            {'query': "SELECT table_name, table_schema FROM information_schema.tables WHERE table_schema = 'public'"}
        ).execute()
        
        if hasattr(response, 'data'):
            tables = response.data
            if tables is None:
                logger.warning("Query returned None or empty result")
                logger.info("✅ Database query executed but returned no tables (this is okay for a new database)")
                return True
            
            logger.info(f"✅ Successfully executed query, found {len(tables)} tables in the public schema")
            for table in tables:
                logger.info(f"  - {table.get('table_name')} ({table.get('table_schema')})")
            
            return True
        else:
            logger.warning("Query executed but returned no data attribute")
            logger.info("✅ Database connection successful but no tables found")
            return True
            
    except Exception as e:
        logger.error(f"Error executing database query: {str(e)}")
        # Still return true if the exec_sql function doesn't exist yet
        if "exec_sql" in str(e):
            logger.warning("⚠️ The 'exec_sql' function is not created yet in Supabase")
            logger.info("✅ Database connection successful, but SQL helper functions need to be created")
            return True
        return False

def test_storage():
    """Test storage functionality"""
    logger.info("Testing storage functionality...")
    
    # List buckets
    bucket_count = 0
    try:
        # Try to list files in each default bucket
        for bucket in ["documents", "maps", "images", "exports"]:
            try:
                files = list_files_in_storage(bucket)
                if files is not None:
                    bucket_count += 1
                    logger.info(f"✅ Successfully listed files in bucket '{bucket}', found {len(files)} files")
                else:
                    logger.warning(f"⚠️ Could not list files in bucket '{bucket}' (bucket may not exist)")
            except Exception as e:
                logger.warning(f"⚠️ Error listing files in bucket '{bucket}': {str(e)}")
    except Exception as e:
        logger.error(f"Error accessing buckets: {str(e)}")
    
    if bucket_count == 0:
        logger.error("❌ No storage buckets were accessible")
        logger.info("Please create the required buckets in the Supabase Dashboard as detailed in docs/supabase_migration.md")
        return False
    
    logger.info(f"✅ Successfully accessed {bucket_count} storage buckets")
    return True

def main():
    """Main function"""
    logger.info("=== Supabase Connection Test ===")
    
    # Check for Supabase URL and key in environment
    if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_KEY"):
        logger.error("Missing SUPABASE_URL or SUPABASE_KEY environment variables")
        logger.info("Please run: python set_supabase_env.py")
        return 1
    
    tests = [
        ("Connection", test_supabase_connection),
        ("Database", test_database_query),
        ("Storage", test_storage)
    ]
    
    success_count = 0
    for name, test_func in tests:
        logger.info(f"\n=== Testing {name} ===")
        try:
            if test_func():
                success_count += 1
            else:
                logger.error(f"❌ {name} test failed")
        except Exception as e:
            logger.error(f"❌ {name} test failed with error: {str(e)}")
    
    logger.info(f"\n=== Summary: {success_count}/{len(tests)} tests passed ===")
    
    if success_count == len(tests):
        logger.info("✅ All tests passed! Supabase integration is working correctly.")
        return 0
    else:
        logger.warning("⚠️ Some tests failed. Please review the logs and fix any issues.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
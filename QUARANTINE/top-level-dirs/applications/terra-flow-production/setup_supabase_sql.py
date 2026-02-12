#!/usr/bin/env python3
"""
Script to set up SQL functions and extensions in Supabase.
"""

import os
import sys
import logging
import time
from supabase_client import get_supabase_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("setup_supabase_sql")

# SQL statements to execute
SQL_STATEMENTS = [
    # Extension check function
    """
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
    
    # SQL execution function (used for running arbitrary SQL)
    """
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
    
    # Quality check function
    """
    CREATE OR REPLACE FUNCTION run_quality_check(
        sql_query TEXT,
        params JSONB DEFAULT '{}'::JSONB
    ) RETURNS TABLE (result JSONB) AS $$
    DECLARE
        query_with_params TEXT;
        param_keys TEXT[];
        param_values TEXT[];
        i INTEGER;
    BEGIN
        -- Replace placeholders with parameter values
        query_with_params := sql_query;
        
        -- Extract parameter keys and values
        SELECT array_agg(key), array_agg(value #>> '{}')
        INTO param_keys, param_values
        FROM jsonb_each(params);
        
        -- Replace placeholders
        IF param_keys IS NOT NULL THEN
            FOR i IN 1..array_length(param_keys, 1) LOOP
                query_with_params := replace(
                    query_with_params, 
                    '$' || param_keys[i], 
                    param_values[i]
                );
            END LOOP;
        END IF;
        
        -- Execute query and return results
        RETURN QUERY EXECUTE 'WITH query_result AS (' || query_with_params || ') 
                            SELECT row_to_json(query_result)::jsonb AS result 
                            FROM query_result';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    """,
    
    # GIS utility function for point creation
    """
    CREATE OR REPLACE FUNCTION create_point(lat DOUBLE PRECISION, lon DOUBLE PRECISION)
    RETURNS GEOMETRY AS $$
    BEGIN
        RETURN ST_SetSRID(ST_MakePoint(lon, lat), 4326);
    END;
    $$ LANGUAGE plpgsql;
    """,
    
    # GIS utility function for calculating distance
    """
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
    
    # Generate GeoJSON function
    """
    CREATE OR REPLACE FUNCTION to_geojson(geometry_column geometry)
    RETURNS JSONB AS $$
    BEGIN
        RETURN ST_AsGeoJSON(geometry_column)::jsonb;
    END;
    $$ LANGUAGE plpgsql;
    """
]

def execute_sql(client, query):
    """
    Execute a SQL query using the Supabase client.
    
    Args:
        client: Supabase client
        query: SQL query to execute
        
    Returns:
        Result of the query
    """
    try:
        # Try to use the custom SQL API first
        response = client.rpc(
            'exec_sql',
            {'query': query}
        ).execute()
        
        if hasattr(response, 'data'):
            return response.data
        return None
    except Exception as e:
        # If that fails, try to execute it directly via the SQL API
        try:
            logger.warning(f"Using alternative method to execute SQL: {str(e)}")
            query_clean = query.strip().replace('\n', ' ')
            response = client.postgrest.rpc('exec_sql', {'query': query_clean}).execute()
            return response.data
        except Exception as e2:
            logger.error(f"Failed to execute SQL via alternative method: {str(e2)}")
            return None

def check_postgis_extension(client):
    """
    Check if PostGIS extension is enabled.
    
    Args:
        client: Supabase client
        
    Returns:
        True if enabled, False otherwise
    """
    try:
        # Try using the check_extension function
        response = client.rpc(
            'check_extension',
            {'extension_name': 'postgis'}
        ).execute()
        
        if hasattr(response, 'data') and response.data:
            return True
        return False
    except Exception as e:
        logger.warning(f"Error checking PostGIS extension: {str(e)}")
        
        # Alternative approach: try to execute a PostGIS query
        try:
            result = execute_sql(client, "SELECT PostGIS_version()")
            if result and not isinstance(result, dict) and 'error' not in result:
                return True
        except Exception:
            pass
        
        return False

def setup_database_functions(client):
    """
    Set up database functions.
    
    Args:
        client: Supabase client
        
    Returns:
        Number of successfully executed statements
    """
    success_count = 0
    
    # Execute each SQL statement
    for i, statement in enumerate(SQL_STATEMENTS):
        logger.info(f"Executing SQL statement {i+1}/{len(SQL_STATEMENTS)}...")
        
        try:
            # Execute directly via REST API
            query = statement.strip()
            response = client.sql(query)
            logger.info(f"✅ Successfully executed SQL statement {i+1}")
            success_count += 1
            
            # Add a delay to avoid rate limiting
            time.sleep(0.5)
        except Exception as e:
            logger.error(f"❌ Error executing SQL statement {i+1}: {str(e)}")
            logger.info(f"SQL:\n{statement}")
    
    return success_count

def main():
    """Main function"""
    logger.info("=== Supabase SQL Setup ===")
    
    # Check if environment variables are set
    if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_SERVICE_KEY"):
        logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables")
        return 1
    
    # Get Supabase client
    client = get_supabase_client()
    if not client:
        logger.error("Failed to get Supabase client")
        return 1
    
    # Check PostGIS extension
    logger.info("Checking PostGIS extension...")
    if check_postgis_extension(client):
        logger.info("✅ PostGIS extension is enabled")
    else:
        logger.warning("⚠️ PostGIS extension is not enabled")
        logger.info("Please enable it by running this SQL in the Supabase Dashboard:")
        logger.info("CREATE EXTENSION IF NOT EXISTS postgis;")
    
    # Set up database functions
    logger.info("Setting up database functions...")
    success_count = setup_database_functions(client)
    
    logger.info(f"=== Summary: {success_count}/{len(SQL_STATEMENTS)} SQL statements executed successfully ===")
    
    if success_count == len(SQL_STATEMENTS):
        logger.info("✅ All SQL statements executed successfully!")
        return 0
    else:
        logger.warning("⚠️ Some SQL statements failed. Please review the logs and fix any issues.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
#!/usr/bin/env python3
"""
Shared Database Verification Tool

This script verifies that the shared Supabase database architecture is 
properly configured for multiple services, microservices, and third-party 
applications to connect and interact with it.

Run this script to check:
1. Required schemas and tables
2. Cross-schema functions
3. Service account permissions
4. Row Level Security policies
5. Storage bucket configurations
6. Realtime subscription capabilities
"""

import os
import sys
import logging
import json
import argparse
import time
from typing import Dict, Any, List, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("verify_shared_db")

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

# Add parent directory to path to import shared modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Try to import supabase
try:
    from supabase import Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.error("❌ Supabase package not installed. Install with: pip install supabase")

# Try to import centralized client management
try:
    from supabase_client import get_supabase_client, release_supabase_client
    CENTRAL_CLIENT_AVAILABLE = True
except ImportError:
    CENTRAL_CLIENT_AVAILABLE = False
    logger.warning("⚠️ Centralized Supabase client management not available. Falling back to direct client creation.")
    try:
        from supabase import create_client
    except ImportError:
        logger.error("❌ Failed to import create_client from supabase package.")

# Import service tools
try:
    from service_supabase_client import get_service_supabase_client
    SERVICE_CLIENT_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ service_supabase_client.py not found in parent directory")
    SERVICE_CLIENT_AVAILABLE = False

# Required schemas
REQUIRED_SCHEMAS = [
    "core",
    "gis", 
    "valuation",
    "sync",
    "analytics",
    "external",
    "api",
    "audit"
]

# Service roles to check
SERVICE_ROLES = [
    "gis_service",
    "valuation_service",
    "sync_service",
    "analytics_service",
    "external_app_role"
]

# Tables to check
REQUIRED_TABLES = {
    "core": ["users", "roles", "user_roles", "files", "properties"],
    "gis": ["property_geometries", "layers", "map_views"],
    "valuation": ["assessments", "improvements", "sales"],
    "sync": ["jobs", "field_mappings", "logs"],
    "analytics": ["reports", "dashboards", "dashboard_items", "cached_results"],
    "external": ["systems", "webhooks", "exchange_logs"],
    "audit": ["logs"]
}

# Cross-schema functions to check
CROSS_SCHEMA_FUNCTIONS = [
    "core.get_property_with_valuation",
    "notify_property_update",
    "audit.audit_trigger_function",
    "api.get_property_by_id",
    "api.get_properties_in_radius"
]

# Required buckets
REQUIRED_BUCKETS = [
    "documents",
    "maps",
    "images",
    "exports"
]

def print_header(title: str) -> None:
    """Print a formatted header."""
    if HAS_COLORS:
        print(f"\n{Fore.CYAN}{Style.BRIGHT}{'=' * 70}")
        print(f"{Fore.CYAN}{Style.BRIGHT}  {title}")
        print(f"{Fore.CYAN}{Style.BRIGHT}{'=' * 70}{Style.RESET_ALL}\n")
    else:
        print(f"\n{'=' * 70}")
        print(f"  {title}")
        print(f"{'=' * 70}\n")

def print_result(message: str, status: str) -> None:
    """Print a test result."""
    status_str = f"[{status.upper()}]"
    
    if HAS_COLORS:
        if status.lower() == "pass":
            status_color = f"{Fore.GREEN}{Style.BRIGHT}{status_str}{Style.RESET_ALL}"
        elif status.lower() == "warning" or status.lower() == "warn":
            status_color = f"{Fore.YELLOW}{Style.BRIGHT}{status_str}{Style.RESET_ALL}"
        elif status.lower() == "fail":
            status_color = f"{Fore.RED}{Style.BRIGHT}{status_str}{Style.RESET_ALL}"
        else:
            status_color = status_str
        
        print(f"  {message.ljust(65)} {status_color}")
    else:
        print(f"  {message.ljust(65)} {status_str}")

def _get_supabase_client(url: str = None, key: str = None, environment: str = "development") -> Optional[Client]:
    """
    Get a Supabase client (local implementation).
    
    Args:
        url: Supabase URL (optional if using centralized client management)
        key: Supabase key (optional if using centralized client management)
        environment: Environment to use (development, staging, production)
    
    Returns:
        Supabase client or None if initialization failed
    """
    if not SUPABASE_AVAILABLE:
        logger.error("Supabase package is not available")
        return None
    
    # Try to use centralized client management if available
    if CENTRAL_CLIENT_AVAILABLE:
        try:
            logger.info(f"Using centralized client management for environment: {environment}")
            # Use the imported get_supabase_client from supabase_client module, not our local function
            from supabase_client import get_supabase_client as central_get_client
            client = central_get_client(environment)
            if client:
                return client
            logger.warning("Centralized client failed, falling back to direct client creation")
        except Exception as e:
            logger.warning(f"Error getting client from pool: {str(e)}")
            logger.warning("Falling back to direct client creation")
    
    # Fall back to direct client creation
    if not url or not key:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
        
        if not url or not key:
            logger.error("Supabase URL and key are required for direct client creation")
            return None
    
    try:
        return create_client(url, key)
    except Exception as e:
        logger.error(f"Error creating Supabase client: {str(e)}")
        return None

def check_schemas(client: Client) -> Tuple[int, int]:
    """
    Check that required schemas exist.
    
    Returns:
        Tuple of (found_count, total_count)
    """
    found_count = 0
    
    # Query database for schemas
    try:
        response = client.table('information_schema.schemata').select('schema_name').execute()
        schemas = [schema['schema_name'] for schema in response.data]
        
        for schema in REQUIRED_SCHEMAS:
            if schema in schemas:
                print_result(f"Schema '{schema}' exists", "pass")
                found_count += 1
            else:
                print_result(f"Schema '{schema}' is missing", "fail")
        
        return found_count, len(REQUIRED_SCHEMAS)
    except Exception as e:
        logger.error(f"Error checking schemas: {str(e)}")
        return 0, len(REQUIRED_SCHEMAS)

def check_tables(client: Client) -> Tuple[int, int]:
    """
    Check that required tables exist.
    
    Returns:
        Tuple of (found_count, total_count)
    """
    found_count = 0
    total_count = sum(len(tables) for tables in REQUIRED_TABLES.values())
    
    # Query database for tables
    try:
        response = client.table('information_schema.tables').select('table_schema, table_name').execute()
        tables_by_schema = {}
        
        # Group tables by schema
        for table in response.data:
            schema = table['table_schema']
            name = table['table_name']
            
            if schema not in tables_by_schema:
                tables_by_schema[schema] = []
            
            tables_by_schema[schema].append(name)
        
        # Check required tables
        for schema, tables in REQUIRED_TABLES.items():
            if schema not in tables_by_schema:
                print_result(f"All tables in schema '{schema}' are missing", "fail")
                continue
            
            for table in tables:
                if table in tables_by_schema[schema]:
                    print_result(f"Table '{schema}.{table}' exists", "pass")
                    found_count += 1
                else:
                    print_result(f"Table '{schema}.{table}' is missing", "fail")
        
        return found_count, total_count
    except Exception as e:
        logger.error(f"Error checking tables: {str(e)}")
        return 0, total_count

def check_functions(client: Client) -> Tuple[int, int]:
    """
    Check that required functions exist.
    
    Returns:
        Tuple of (found_count, total_count)
    """
    found_count = 0
    
    # Query database for functions
    try:
        response = client.table('information_schema.routines').select('routine_schema, routine_name').execute()
        functions = [f"{func['routine_schema']}.{func['routine_name']}" for func in response.data]
        
        for function in CROSS_SCHEMA_FUNCTIONS:
            if function in functions:
                print_result(f"Function '{function}' exists", "pass")
                found_count += 1
            else:
                print_result(f"Function '{function}' is missing", "fail")
        
        return found_count, len(CROSS_SCHEMA_FUNCTIONS)
    except Exception as e:
        logger.error(f"Error checking functions: {str(e)}")
        return 0, len(CROSS_SCHEMA_FUNCTIONS)

def check_rls_policies(client: Client) -> Tuple[int, int]:
    """
    Check that RLS policies are enabled on tables.
    
    Returns:
        Tuple of (enabled_count, total_count)
    """
    enabled_count = 0
    total_count = 0
    
    # List of tables to check RLS on
    tables_to_check = []
    for schema, tables in REQUIRED_TABLES.items():
        for table in tables:
            tables_to_check.append(f"{schema}.{table}")
    
    total_count = len(tables_to_check)
    
    # Query database for RLS status
    try:
        # Get all RLS-enabled tables
        rls_query = """
        SELECT
            n.nspname AS schema,
            c.relname AS table,
            CASE WHEN c.relrowsecurity THEN 'enabled' ELSE 'disabled' END AS rls_status
        FROM
            pg_class c
        JOIN
            pg_namespace n ON n.oid = c.relnamespace
        WHERE
            c.relkind = 'r'
        ORDER BY
            n.nspname, c.relname;
        """
        
        response = client.sql(rls_query).execute()
        
        # Create lookup table for RLS status
        rls_status = {}
        for row in response.data:
            table_name = f"{row['schema']}.{row['table']}"
            rls_status[table_name] = row['rls_status']
        
        # Check RLS status for each table
        for table in tables_to_check:
            if table in rls_status:
                if rls_status[table] == 'enabled':
                    print_result(f"RLS is enabled on table '{table}'", "pass")
                    enabled_count += 1
                else:
                    print_result(f"RLS is disabled on table '{table}'", "fail")
            else:
                print_result(f"Could not check RLS for table '{table}'", "fail")
        
        return enabled_count, total_count
    except Exception as e:
        logger.error(f"Error checking RLS policies: {str(e)}")
        return 0, total_count

def check_service_roles(client: Client) -> Tuple[int, int]:
    """
    Check that service roles exist.
    
    Returns:
        Tuple of (found_count, total_count)
    """
    found_count = 0
    
    # Query database for roles
    try:
        role_query = """
        SELECT rolname FROM pg_roles ORDER BY rolname;
        """
        
        response = client.sql(role_query).execute()
        roles = [role['rolname'] for role in response.data]
        
        for role in SERVICE_ROLES:
            if role in roles:
                print_result(f"Service role '{role}' exists", "pass")
                found_count += 1
            else:
                print_result(f"Service role '{role}' is missing", "fail")
        
        return found_count, len(SERVICE_ROLES)
    except Exception as e:
        logger.error(f"Error checking service roles: {str(e)}")
        return 0, len(SERVICE_ROLES)

def check_storage_buckets(client: Client) -> Tuple[int, int]:
    """
    Check that required storage buckets exist.
    
    Returns:
        Tuple of (found_count, total_count)
    """
    found_count = 0
    
    # Query storage for buckets
    try:
        response = client.storage.list_buckets()
        
        if not hasattr(response, 'data'):
            print_result("Storage API is not accessible", "fail")
            return 0, len(REQUIRED_BUCKETS)
        
        buckets = [bucket['name'] for bucket in response.data]
        
        for bucket in REQUIRED_BUCKETS:
            if bucket in buckets:
                print_result(f"Storage bucket '{bucket}' exists", "pass")
                found_count += 1
            else:
                print_result(f"Storage bucket '{bucket}' is missing", "fail")
        
        return found_count, len(REQUIRED_BUCKETS)
    except Exception as e:
        logger.error(f"Error checking storage buckets: {str(e)}")
        return 0, len(REQUIRED_BUCKETS)

def check_service_connections() -> Tuple[int, int]:
    """
    Check that services can connect to the database.
    
    Returns:
        Tuple of (success_count, total_count)
    """
    if not SERVICE_CLIENT_AVAILABLE:
        print_result("Service client module not available, skipping connection tests", "warn")
        return 0, 0
    
    success_count = 0
    
    # Try to import service client release function
    service_client_release_available = False
    try:
        from service_supabase_client import release_service_supabase_client
        service_client_release_available = True
    except ImportError:
        logger.warning("release_service_supabase_client not available, connections may not be properly closed")
    
    # Check each service
    for service_name in SERVICE_ROLES:
        client = None
        try:
            # Get client for service
            client = get_service_supabase_client(service_name)
            
            if client:
                # Test simple query
                response = client.table('information_schema.tables').select('table_name').limit(1).execute()
                
                if hasattr(response, 'data'):
                    print_result(f"Service '{service_name}' connection successful", "pass")
                    success_count += 1
                else:
                    print_result(f"Service '{service_name}' returned invalid response", "fail")
            else:
                print_result(f"Could not create client for service '{service_name}'", "fail")
        except Exception as e:
            logger.error(f"Error checking service connection for {service_name}: {str(e)}")
            print_result(f"Service '{service_name}' connection failed", "fail")
        finally:
            # Clean up connection
            if client and service_client_release_available:
                try:
                    release_service_supabase_client(service_name, client)
                except Exception as release_error:
                    logger.warning(f"Error releasing service client for {service_name}: {str(release_error)}")

    
    return success_count, len(SERVICE_ROLES)

def check_cross_schema_queries(client: Client) -> bool:
    """
    Verify a cross-schema query can execute successfully.
    
    Returns:
        True if the query was successful, False otherwise
    """
    # Try to execute a query that crosses schemas
    try:
        query = """
        SELECT
            p.id,
            p.parcel_number,
            a.assessed_value,
            g.geometry_type
        FROM
            core.properties p
        LEFT JOIN
            valuation.assessments a ON p.id = a.property_id
        LEFT JOIN
            gis.property_geometries g ON p.id = g.property_id
        LIMIT 1;
        """
        
        response = client.sql(query).execute()
        
        if hasattr(response, 'data'):
            print_result("Cross-schema query succeeded", "pass")
            return True
        else:
            print_result("Cross-schema query returned invalid response", "fail")
            return False
    except Exception as e:
        logger.error(f"Error executing cross-schema query: {str(e)}")
        print_result("Cross-schema query failed", "fail")
        return False

def check_realtime_capability(client: Client) -> bool:
    """
    Check if realtime capabilities are configured.
    
    Returns:
        True if realtime is configured, False otherwise
    """
    try:
        # Create a temporary channel
        channel = client.channel("test_realtime")
        
        # Try to subscribe (we'll immediately unsubscribe)
        channel_status = channel.subscribe()
        time.sleep(1)  # Brief pause to let subscription process
        channel.unsubscribe()
        
        if channel_status:
            print_result("Realtime subscriptions are working", "pass")
            return True
        else:
            print_result("Realtime subscriptions failed", "fail")
            return False
    except Exception as e:
        logger.error(f"Error checking realtime capability: {str(e)}")
        print_result("Realtime subscription check failed", "fail")
        return False

def run_verification(client: Client):
    """Run all verification checks."""
    print_header("Verifying Shared Database Configuration")
    
    # Check schemas
    print_header("Checking Database Schemas")
    schemas_found, schemas_total = check_schemas(client)
    
    # Check tables
    print_header("Checking Database Tables")
    tables_found, tables_total = check_tables(client)
    
    # Check functions
    print_header("Checking Cross-Schema Functions")
    functions_found, functions_total = check_functions(client)
    
    # Check RLS policies
    print_header("Checking Row Level Security")
    rls_enabled, rls_total = check_rls_policies(client)
    
    # Check service roles
    print_header("Checking Service Roles")
    roles_found, roles_total = check_service_roles(client)
    
    # Check storage buckets
    print_header("Checking Storage Buckets")
    buckets_found, buckets_total = check_storage_buckets(client)
    
    # Check cross-schema queries
    print_header("Testing Cross-Schema Queries")
    cross_schema_ok = check_cross_schema_queries(client)
    
    # Check realtime capability
    print_header("Testing Realtime Subscriptions")
    realtime_ok = check_realtime_capability(client)
    
    # Check service connections
    print_header("Testing Service Connections")
    services_ok, services_total = check_service_connections()
    
    # Print summary
    print_header("Verification Summary")
    print(f"  Schemas:            {schemas_found}/{schemas_total}")
    print(f"  Tables:             {tables_found}/{tables_total}")
    print(f"  Cross-Schema Funcs: {functions_found}/{functions_total}")
    print(f"  RLS Policies:       {rls_enabled}/{rls_total}")
    print(f"  Service Roles:      {roles_found}/{roles_total}")
    print(f"  Storage Buckets:    {buckets_found}/{buckets_total}")
    
    if services_total > 0:
        print(f"  Service Connections: {services_ok}/{services_total}")
    
    print(f"  Cross-Schema Query:  {'✓' if cross_schema_ok else '✗'}")
    print(f"  Realtime Capability: {'✓' if realtime_ok else '✗'}")
    
    # Calculate overall score
    total_checks = (
        schemas_total + tables_total + functions_total + 
        rls_total + roles_total + buckets_total + 
        (2 if cross_schema_ok and realtime_ok else 0) +
        services_total
    )
    
    passed_checks = (
        schemas_found + tables_found + functions_found +
        rls_enabled + roles_found + buckets_found +
        (2 if cross_schema_ok and realtime_ok else 0) +
        services_ok
    )
    
    if total_checks > 0:
        score_pct = (passed_checks / total_checks) * 100
        
        if HAS_COLORS:
            if score_pct >= 90:
                score_color = f"{Fore.GREEN}{Style.BRIGHT}"
            elif score_pct >= 75:
                score_color = f"{Fore.YELLOW}{Style.BRIGHT}"
            else:
                score_color = f"{Fore.RED}{Style.BRIGHT}"
            
            print(f"\n  Overall Score: {score_color}{score_pct:.1f}%{Style.RESET_ALL}")
        else:
            print(f"\n  Overall Score: {score_pct:.1f}%")
    
    # Print conclusion
    if passed_checks == total_checks:
        print("\n  🎉 All checks passed! Your shared database is correctly configured.")
    else:
        print("\n  ⚠️ Some checks failed. Please review the results and fix the issues.")

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Verify shared Supabase database configuration")
    parser.add_argument("--url", "-u", help="Supabase URL")
    parser.add_argument("--key", "-k", help="Supabase service key")
    parser.add_argument("--use-pool", "-p", action="store_true", help="Use connection pool instead of direct client")
    parser.add_argument("--environment", "-e", default="development", help="Environment to use (development, staging, production)")
    args = parser.parse_args()
    
    client = None
    release_func = None
    
    try:
        # Determine if we can/should use the centralized client management
        use_central = args.use_pool or CENTRAL_CLIENT_AVAILABLE
        
        if use_central:
            try:
                # Import centralized client management to avoid name collision
                from supabase_client import get_supabase_client as central_get_client
                from supabase_client import release_supabase_client as central_release_client
                
                logger.info(f"Using centralized client management for environment: {args.environment}")
                client = central_get_client(args.environment)
                release_func = central_release_client
                
                if not client:
                    if args.use_pool:  # Only error if pool was explicitly requested
                        logger.error("Failed to get Supabase client from connection pool")
                        return 1
                    else:
                        logger.warning("Failed to get client from centralized management, falling back to direct client")
                        use_central = False
            except ImportError as e:
                if args.use_pool:  # Only error if pool was explicitly requested
                    logger.error(f"Connection pool was explicitly requested but not available: {str(e)}")
                    return 1
                else:
                    logger.warning(f"Centralized client management not available: {str(e)}")
                    use_central = False
        
        # Fall back to direct client creation if needed
        if not client:
            # Get Supabase credentials for direct client
            url = args.url or os.environ.get("SUPABASE_URL")
            key = args.key or os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
            
            if not url or not key:
                logger.error(
                    "Supabase URL and key are required for direct client creation. "
                    "Provide them as arguments or set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables."
                )
                return 1
            
            logger.info("Using direct client creation")
            client = _get_supabase_client(url, key)
        
        if not client:
            logger.error("Failed to create Supabase client")
            return 1
        
        # Run verification
        run_verification(client)
        return 0
    
    finally:
        # Release client if we're using the centralized client management
        if client and release_func:
            try:
                release_func(client)
                logger.info("Released Supabase client back to connection pool")
            except Exception as e:
                logger.error(f"Error releasing client: {str(e)}")
                logger.warning("Connection may not have been properly released")
        elif client:
            logger.warning("No release function available for client, connection may not be properly released")

if __name__ == "__main__":
    sys.exit(main())
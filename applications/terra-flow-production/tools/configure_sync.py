#!/usr/bin/env python3
"""
Configuration Tool for Data Sync Agent

This script helps create and validate a configuration file for the data sync agent.
It can also be used to test the connection to the source database and target Supabase.

Usage:
  python configure_sync.py --create-config sync_config.json
  python configure_sync.py --test-connection sync_config.json
"""

import os
import sys
import json
import getpass
import argparse
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s'
)
logger = logging.getLogger("configure_sync")

# Define colors for terminal output, with a fallback for Windows
try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    HAS_COLORS = True
except ImportError:
    HAS_COLORS = False
    # Stub color objects
    class DummyColor:
        def __getattr__(self, name):
            return ""
    Fore = DummyColor()
    Style = DummyColor()

# Check for required packages
try:
    import pyodbc
    SQLSERVER_AVAILABLE = True
except ImportError:
    SQLSERVER_AVAILABLE = False
    logger.warning("pyodbc not installed. SQL Server configuration will be limited.")

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.warning("supabase package not installed. Supabase configuration will be limited.")

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

def print_success(message: str) -> None:
    """Print a success message."""
    if HAS_COLORS:
        print(f"{Fore.GREEN}{Style.BRIGHT}✓ {message}{Style.RESET_ALL}")
    else:
        print(f"✓ {message}")

def print_error(message: str) -> None:
    """Print an error message."""
    if HAS_COLORS:
        print(f"{Fore.RED}{Style.BRIGHT}✗ {message}{Style.RESET_ALL}")
    else:
        print(f"✗ {message}")

def print_warning(message: str) -> None:
    """Print a warning message."""
    if HAS_COLORS:
        print(f"{Fore.YELLOW}{Style.BRIGHT}⚠ {message}{Style.RESET_ALL}")
    else:
        print(f"⚠ {message}")

def print_info(message: str) -> None:
    """Print an info message."""
    if HAS_COLORS:
        print(f"{Fore.BLUE}{Style.BRIGHT}ℹ {message}{Style.RESET_ALL}")
    else:
        print(f"ℹ {message}")

def create_config(config_path: str) -> bool:
    """Create a configuration file for the data sync agent."""
    # Check if the file already exists
    if os.path.exists(config_path):
        overwrite = input(f"File {config_path} already exists. Overwrite? (y/n): ")
        if overwrite.lower() != 'y':
            print_info("Aborted configuration creation.")
            return False
    
    # Start with the template
    template_path = os.path.join(os.path.dirname(__file__), 'sync_config_template.json')
    if not os.path.exists(template_path):
        print_error(f"Template file {template_path} not found.")
        return False
    
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except Exception as e:
        print_error(f"Error loading template: {str(e)}")
        return False
    
    # Configure SQL Server connection
    print_header("SQL Server Configuration")
    sql_driver = input("SQL Server ODBC Driver (default: ODBC Driver 17 for SQL Server): ") or "ODBC Driver 17 for SQL Server"
    sql_server = input("SQL Server host: ")
    sql_database = input("SQL Server database name: ")
    sql_username = input("SQL Server username: ")
    sql_password = getpass.getpass("SQL Server password: ")
    
    # Build the connection string
    config["source_path"] = f"Driver={{{sql_driver}}};Server={sql_server};Database={sql_database};UID={sql_username};PWD={sql_password};"
    
    # Test the connection if pyodbc is available
    if SQLSERVER_AVAILABLE:
        print_info("Testing SQL Server connection...")
        try:
            conn = pyodbc.connect(config["source_path"], timeout=10)
            print_success("SQL Server connection successful.")
            conn.close()
        except Exception as e:
            print_error(f"SQL Server connection failed: {str(e)}")
            retry = input("Continue anyway? (y/n): ")
            if retry.lower() != 'y':
                print_info("Aborted configuration creation.")
                return False
    else:
        print_warning("Cannot test SQL Server connection: pyodbc not installed.")
    
    # Configure Supabase connection
    print_header("Supabase Configuration")
    supabase_url = input("Supabase URL: ")
    supabase_key = getpass.getpass("Supabase service key: ")
    
    # Store the Supabase credentials
    config["supabase_url"] = supabase_url
    config["supabase_key"] = supabase_key
    
    # Test the connection if supabase package is available
    if SUPABASE_AVAILABLE and supabase_url and supabase_key:
        print_info("Testing Supabase connection...")
        try:
            client = create_client(supabase_url, supabase_key)
            # Try a simple query to verify the connection
            response = client.table('migrations').select('id').limit(1).execute()
            print_success("Supabase connection successful.")
        except Exception as e:
            print_error(f"Supabase connection failed: {str(e)}")
            retry = input("Continue anyway? (y/n): ")
            if retry.lower() != 'y':
                print_info("Aborted configuration creation.")
                return False
    else:
        print_warning("Cannot test Supabase connection: supabase package not installed or credentials missing.")
    
    # Configure sync options
    print_header("Sync Configuration")
    
    # Sync interval
    sync_interval_str = input("Sync interval in seconds (default: 900): ")
    if sync_interval_str:
        try:
            config["sync_interval"] = int(sync_interval_str)
        except ValueError:
            print_warning("Invalid sync interval. Using default (900 seconds).")
            config["sync_interval"] = 900
    else:
        config["sync_interval"] = 900
    
    # Other sync options
    incremental = input("Use incremental sync? (y/n, default: y): ").lower() != 'n'
    dry_run = input("Start in dry-run mode? (y/n, default: n): ").lower() == 'y'
    enable_rollback = input("Enable rollback? (y/n, default: y): ").lower() != 'n'
    
    # Update sync options
    config["sync"]["incremental"] = incremental
    config["sync"]["dry_run"] = dry_run
    config["sync"]["enable_rollback"] = enable_rollback
    
    # Save the configuration file
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2)
        print_success(f"Configuration saved to {config_path}")
        return True
    except Exception as e:
        print_error(f"Error saving configuration: {str(e)}")
        return False

def test_connection(config_path: str) -> bool:
    """Test the connection to the source database and target Supabase."""
    # Load the configuration file
    if not os.path.exists(config_path):
        print_error(f"Configuration file {config_path} not found.")
        return False
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except Exception as e:
        print_error(f"Error loading configuration: {str(e)}")
        return False
    
    # Test SQL Server connection
    print_header("SQL Server Connection Test")
    
    if not SQLSERVER_AVAILABLE:
        print_error("Cannot test SQL Server connection: pyodbc not installed.")
    else:
        conn_string = config.get("source_path", "")
        if not conn_string:
            print_error("SQL Server connection string not found in configuration.")
        else:
            print_info(f"Testing connection to SQL Server...")
            try:
                conn = pyodbc.connect(conn_string, timeout=10)
                cursor = conn.cursor()
                
                # Get server version
                cursor.execute("SELECT @@VERSION")
                version = cursor.fetchone()[0]
                print_success(f"SQL Server connection successful.")
                print_info(f"Server version: {version.split('\\n')[0]}")
                
                # List tables
                tables = []
                table_mapping = {}
                
                # Collect tables from configuration
                for table_config in config.get("tables", []):
                    source_table = table_config.get("source_table")
                    if source_table:
                        tables.append(source_table)
                        table_mapping[source_table] = table_config.get("target_table")
                
                if tables:
                    print_info("Checking configured tables...")
                    for table_name in tables:
                        try:
                            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                            count = cursor.fetchone()[0]
                            print_success(f"Table {table_name} found with {count} records")
                        except Exception as e:
                            print_error(f"Error accessing table {table_name}: {str(e)}")
                
                conn.close()
            except Exception as e:
                print_error(f"SQL Server connection failed: {str(e)}")
    
    # Test Supabase connection
    print_header("Supabase Connection Test")
    
    if not SUPABASE_AVAILABLE:
        print_error("Cannot test Supabase connection: supabase package not installed.")
    else:
        supabase_url = config.get("supabase_url", "") or os.environ.get("SUPABASE_URL")
        supabase_key = config.get("supabase_key", "") or os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            print_error("Supabase URL and key not found in configuration or environment variables.")
        else:
            print_info(f"Testing connection to Supabase...")
            try:
                client = create_client(supabase_url, supabase_key)
                
                # Try a simple query to verify the connection
                response = client.table('migrations').select('id').limit(1).execute()
                print_success(f"Supabase connection successful.")
                
                # Check configured tables
                target_tables = []
                
                # Collect tables from configuration
                for table_config in config.get("tables", []):
                    target_table = table_config.get("target_table")
                    target_schema = table_config.get("target_schema", "public")
                    if target_table:
                        target_tables.append((target_schema, target_table))
                
                if target_tables:
                    print_info("Checking configured target tables...")
                    for schema, table in target_tables:
                        try:
                            full_table = f"{schema}.{table}" if schema != "public" else table
                            response = client.table(full_table).select('count').limit(1).execute()
                            print_success(f"Table {schema}.{table} found")
                        except Exception as e:
                            print_error(f"Error accessing table {schema}.{table}: {str(e)}")
            
            except Exception as e:
                print_error(f"Supabase connection failed: {str(e)}")
    
    return True

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Configuration Tool for Data Sync Agent")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--create-config", metavar="CONFIG_PATH", help="Create a configuration file")
    group.add_argument("--test-connection", metavar="CONFIG_PATH", help="Test the connection")
    args = parser.parse_args()
    
    if args.create_config:
        return 0 if create_config(args.create_config) else 1
    elif args.test_connection:
        return 0 if test_connection(args.test_connection) else 1
    else:
        parser.print_help()
        return 1

if __name__ == "__main__":
    sys.exit(main())
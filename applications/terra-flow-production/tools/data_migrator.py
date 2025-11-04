#!/usr/bin/env python3
"""
Data Migration Tool for Shared Supabase Database

This script helps migrate data from various sources into the shared Supabase database.
It supports:
- SQLite databases
- CSV files
- JSON files
- PostgreSQL databases
- SQL Server databases

It provides enhanced functionality for:
- Full and incremental data migration
- Dry-run mode to preview changes
- Rollback capability via transaction logs
- Detailed migration reports
- Data validation and transformation
- Change tracking for efficient incremental sync

Use this tool to safely migrate data from your legacy/training systems to Supabase.
"""

import os
import sys
import logging
import json
import argparse
import csv
import sqlite3
import datetime
import uuid
import time
import hashlib
import tempfile
import shutil
import threading
from typing import Dict, Any, List, Optional, Tuple, Callable, Union, Set
from concurrent.futures import ThreadPoolExecutor

# Configure logging based on environment variable or default to INFO
log_level = os.environ.get("SYNC_LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'data_migration.log'))
    ]
)
logger = logging.getLogger("data_migrator")

# Add parent directory to path to import shared modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Try to import supabase
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.error("❌ Supabase package not installed. Install with: pip install supabase")

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

# Try to import optional dependencies
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    logger.warning("⚠️ pandas not installed. Some features will be limited.")

try:
    import psycopg2
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False
    logger.warning("⚠️ psycopg2 not installed. PostgreSQL source migration will be unavailable.")

try:
    import pyodbc
    SQLSERVER_AVAILABLE = True
except ImportError:
    SQLSERVER_AVAILABLE = False
    logger.warning("⚠️ pyodbc not installed. SQL Server source migration will be unavailable.")

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

def get_supabase_client(url: str, key: str) -> Optional[Client]:
    """Get a Supabase client."""
    if not SUPABASE_AVAILABLE:
        logger.error("Supabase package is not available")
        return None
    
    try:
        client = create_client(url, key)
        
        # Set application name for audit logging
        try:
            client.sql("SET app.service_name TO 'data_migrator';").execute()
        except Exception as e:
            logger.warning(f"Could not set app.service_name: {str(e)}")
        
        return client
    except Exception as e:
        logger.error(f"Error creating Supabase client: {str(e)}")
        return None

def connect_sqlite(db_path: str) -> Optional[sqlite3.Connection]:
    """Connect to a SQLite database."""
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row  # Return rows as dictionaries
        return conn
    except Exception as e:
        logger.error(f"Error connecting to SQLite database: {str(e)}")
        return None

def connect_postgres(connstring: str) -> Optional[Any]:
    """Connect to a PostgreSQL database."""
    if not POSTGRES_AVAILABLE:
        logger.error("psycopg2 not installed. Cannot connect to PostgreSQL.")
        return None
    
    try:
        conn = psycopg2.connect(connstring)
        return conn
    except Exception as e:
        logger.error(f"Error connecting to PostgreSQL database: {str(e)}")
        return None

def connect_sqlserver(connstring: str) -> Optional[Any]:
    """Connect to a SQL Server database."""
    if not SQLSERVER_AVAILABLE:
        logger.error("pyodbc not installed. Cannot connect to SQL Server.")
        return None
    
    try:
        conn = pyodbc.connect(connstring)
        return conn
    except Exception as e:
        logger.error(f"Error connecting to SQL Server database: {str(e)}")
        return None

def get_sqlite_tables(conn: sqlite3.Connection) -> List[str]:
    """Get a list of tables in a SQLite database."""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        return [row['name'] for row in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Error getting SQLite tables: {str(e)}")
        return []

def get_sqlite_columns(conn: sqlite3.Connection, table: str) -> List[Dict[str, Any]]:
    """Get column information for a SQLite table."""
    try:
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table});")
        columns = []
        
        for row in cursor.fetchall():
            columns.append({
                "name": row['name'],
                "type": row['type'],
                "nullable": not row['notnull'],
                "primary_key": row['pk'] > 0
            })
        
        return columns
    except Exception as e:
        logger.error(f"Error getting SQLite columns for table {table}: {str(e)}")
        return []

def load_sqlite_data(conn: sqlite3.Connection, table: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """Load data from a SQLite table."""
    try:
        cursor = conn.cursor()
        
        if limit:
            cursor.execute(f"SELECT * FROM {table} LIMIT {limit};")
        else:
            cursor.execute(f"SELECT * FROM {table};")
        
        return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Error loading data from SQLite table {table}: {str(e)}")
        return []

def load_csv_data(file_path: str, has_header: bool = True) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Load data from a CSV file.
    
    Returns:
        Tuple of (data, headers)
    """
    try:
        with open(file_path, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            
            if has_header:
                headers = next(reader)
            else:
                # Read the first row to determine column count
                first_row = next(reader)
                # Create default headers
                headers = [f"column_{i+1}" for i in range(len(first_row))]
                # Reset file to start
                csvfile.seek(0)
                reader = csv.reader(csvfile)
            
            # Read the data
            data = []
            for row in reader:
                if has_header or row != first_row:  # Skip header row if present
                    data.append(dict(zip(headers, row)))
            
            return data, headers
    except Exception as e:
        logger.error(f"Error loading data from CSV file {file_path}: {str(e)}")
        return [], []

def load_json_data(file_path: str) -> List[Dict[str, Any]]:
    """Load data from a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Ensure data is a list of dictionaries
        if isinstance(data, dict):
            # Single record
            return [data]
        elif isinstance(data, list):
            if all(isinstance(item, dict) for item in data):
                return data
            else:
                logger.error(f"JSON file {file_path} does not contain a list of dictionaries")
                return []
        else:
            logger.error(f"JSON file {file_path} does not contain a valid data structure")
            return []
    except Exception as e:
        logger.error(f"Error loading data from JSON file {file_path}: {str(e)}")
        return []

def execute_pg_query(conn: Any, query: str, params: Optional[Tuple] = None) -> List[Dict[str, Any]]:
    """Execute a query on a PostgreSQL or SQL Server connection."""
    try:
        cursor = conn.cursor()
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        
        # Fetch and process results
        results = []
        for row in cursor.fetchall():
            results.append(dict(zip(columns, row)))
        
        return results
    except Exception as e:
        logger.error(f"Error executing query: {str(e)}")
        return []

def infer_schema_from_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Infer column structure from data.
    
    Returns:
        List of column definitions
    """
    if not data:
        return []
    
    # Start with the first record to get all keys
    sample = data[0]
    columns = []
    
    for key, value in sample.items():
        column = {
            "name": key,
            "type": infer_type(value),
            "nullable": True
        }
        columns.append(column)
    
    # Check remaining records for missing values or type conflicts
    for record in data[1:]:
        for column in columns:
            name = column["name"]
            
            if name in record:
                value = record[name]
                
                if value is not None:
                    # Check if type is consistent
                    inferred_type = infer_type(value)
                    
                    # Resolve any type conflicts
                    column["type"] = resolve_type_conflict(column["type"], inferred_type)
            else:
                # Column is missing in this record, so it must be nullable
                column["nullable"] = True
    
    return columns

def infer_type(value: Any) -> str:
    """Infer data type from a value."""
    if value is None:
        return "text"
    elif isinstance(value, bool):
        return "boolean"
    elif isinstance(value, int):
        return "integer"
    elif isinstance(value, float):
        return "float"
    elif isinstance(value, (dict, list)):
        return "jsonb"
    elif isinstance(value, str):
        # Try to detect if it's a date/time
        try:
            datetime.datetime.strptime(value, '%Y-%m-%d')
            return "date"
        except ValueError:
            pass
        
        try:
            datetime.datetime.strptime(value, '%Y-%m-%dT%H:%M:%S')
            return "timestamp"
        except ValueError:
            pass
        
        try:
            datetime.datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
            return "timestamp"
        except ValueError:
            pass
        
        # Check if it looks like a UUID
        if len(value) == 36 and value.count('-') == 4:
            try:
                uuid.UUID(value)
                return "uuid"
            except ValueError:
                pass
        
        return "text"
    else:
        return "text"

def resolve_type_conflict(type1: str, type2: str) -> str:
    """Resolve conflicts between inferred types."""
    # Type precedence (higher = more specific)
    type_hierarchy = {
        "text": 1,
        "uuid": 2,
        "boolean": 3,
        "integer": 4,
        "float": 5,
        "date": 6,
        "timestamp": 7,
        "jsonb": 8
    }
    
    # Some types can be converted to others
    compatible_types = {
        ("integer", "float"): "float",
        ("date", "timestamp"): "timestamp"
    }
    
    # Check for exact match
    if type1 == type2:
        return type1
    
    # Check for compatible types
    for (t1, t2), result in compatible_types.items():
        if (type1 == t1 and type2 == t2) or (type1 == t2 and type2 == t1):
            return result
    
    # Use type hierarchy to determine the most general type
    if type1 in type_hierarchy and type2 in type_hierarchy:
        if type_hierarchy[type1] > type_hierarchy[type2]:
            return type1
        else:
            return type2
    
    # Default to text if types are incompatible
    return "text"

def map_fields(
    source_data: List[Dict[str, Any]],
    mapping: Dict[str, Union[str, Dict[str, Any]]],
    transformers: Dict[str, Callable] = None
) -> List[Dict[str, Any]]:
    """
    Map fields from source data to target schema.
    
    Args:
        source_data: Source data records
        mapping: Field mapping configuration
        transformers: Optional field transformation functions
        
    Returns:
        Mapped data
    """
    if transformers is None:
        transformers = {}
    
    mapped_data = []
    
    for record in source_data:
        mapped_record = {}
        
        for target_field, source_field in mapping.items():
            if isinstance(source_field, str):
                # Simple field mapping
                if source_field in record:
                    value = record[source_field]
                    
                    # Apply transformer if available
                    if target_field in transformers:
                        try:
                            value = transformers[target_field](value)
                        except Exception as e:
                            logger.warning(f"Transformation error for field {target_field}: {str(e)}")
                    
                    mapped_record[target_field] = value
            elif isinstance(source_field, dict):
                # Complex field mapping with options
                value = None
                
                if "field" in source_field and source_field["field"] in record:
                    value = record[source_field["field"]]
                    
                    # Apply specific transformer if configured
                    if "transform" in source_field:
                        transform_name = source_field["transform"]
                        if transform_name in transformers:
                            try:
                                value = transformers[transform_name](value)
                            except Exception as e:
                                logger.warning(f"Transformation error for field {target_field}: {str(e)}")
                
                # Handle default value
                if value is None and "default" in source_field:
                    value = source_field["default"]
                
                mapped_record[target_field] = value
        
        mapped_data.append(mapped_record)
    
    return mapped_data

def validate_record(record: Dict[str, Any], rules: Dict[str, List[Callable]]) -> List[str]:
    """
    Validate a record against validation rules.
    
    Args:
        record: Data record
        rules: Validation rules
        
    Returns:
        List of validation errors
    """
    errors = []
    
    for field, validators in rules.items():
        if field in record:
            value = record[field]
            
            for validator in validators:
                try:
                    result = validator(value)
                    if result is not True:
                        errors.append(f"Field '{field}': {result}")
                except Exception as e:
                    errors.append(f"Field '{field}': Validation error - {str(e)}")
        else:
            # Check if field is required
            for validator in validators:
                if validator.__name__ == "required":
                    errors.append(f"Field '{field}': Required field is missing")
    
    return errors

def insert_data(
    client: Client,
    table: str,
    data: List[Dict[str, Any]],
    schema: str = "public",
    batch_size: int = 100,
    transaction_id: Optional[str] = None,
    upsert: bool = False,
    upsert_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Insert data into a Supabase table.
    
    Args:
        client: Supabase client
        table: Table name
        data: Data to insert
        schema: Schema name
        batch_size: Batch size for inserting data
        transaction_id: Optional transaction ID for rollback tracking
        upsert: If True, perform upsert operation instead of insert
        upsert_key: Column to use as key for upsert operations
        
    Returns:
        Result information with keys: success, inserted, updated, errors
    """
    if not data:
        return {
            "success": True,
            "inserted": 0,
            "updated": 0,
            "errors": []
        }
    
    inserted = 0
    updated = 0
    errors = []
    
    # Process in batches
    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        batch_num = i//batch_size + 1
        total_batches = (len(data) + batch_size - 1)//batch_size
        
        try:
            full_table_name = f"{schema}.{table}" if schema != "public" else table
            
            # If a transaction ID is provided, add it to the batch data for tracking
            if transaction_id:
                for record in batch:
                    record["_sync_transaction_id"] = transaction_id
            
            # Perform upsert or insert based on configuration
            if upsert and upsert_key:
                # Check for existing records to count updates vs inserts
                existing_keys = set()
                if upsert_key and all(upsert_key in record for record in batch):
                    # Extract keys from batch
                    batch_keys = [record[upsert_key] for record in batch if record[upsert_key] is not None]
                    
                    if batch_keys:
                        try:
                            # Query for existing keys
                            if len(batch_keys) == 1:
                                query = client.table(full_table_name).select(upsert_key).eq(upsert_key, batch_keys[0])
                            else:
                                query = client.table(full_table_name).select(upsert_key).in_(upsert_key, batch_keys)
                                
                            response = query.execute()
                            if hasattr(response, 'data'):
                                existing_keys = {record[upsert_key] for record in response.data}
                        except Exception as e:
                            logger.warning(f"Could not determine existing keys: {str(e)}")
                
                # Perform upsert
                response = client.table(full_table_name).upsert(batch, on_conflict=upsert_key).execute()
                
                if hasattr(response, 'data'):
                    new_inserted = 0
                    new_updated = 0
                    
                    # Count inserts vs updates based on existing keys
                    if existing_keys:
                        for record in response.data:
                            if record[upsert_key] in existing_keys:
                                new_updated += 1
                            else:
                                new_inserted += 1
                    else:
                        # If we couldn't determine existing keys, count all as inserts
                        new_inserted = len(response.data)
                    
                    inserted += new_inserted
                    updated += new_updated
                    
                    logger.info(f"Upsert batch {batch_num}/{total_batches}: {new_inserted} inserts, {new_updated} updates")
                else:
                    error_msg = f"Batch {batch_num}: Upsert returned invalid response"
                    logger.error(error_msg)
                    errors.append(error_msg)
            else:
                # Regular insert
                response = client.table(full_table_name).insert(batch).execute()
                
                if hasattr(response, 'data'):
                    inserted += len(response.data)
                    logger.info(f"Inserted batch {batch_num}/{total_batches}: {len(response.data)} records")
                else:
                    error_msg = f"Batch {batch_num}: Insert returned invalid response"
                    logger.error(error_msg)
                    errors.append(error_msg)
                    
        except Exception as e:
            error_msg = f"Batch {batch_num}: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
    
    return {
        "success": len(errors) == 0,
        "inserted": inserted,
        "updated": updated,
        "total": len(data),
        "errors": errors
    }

def migrate_sqlite_to_supabase(
    sqlite_path: str,
    supabase_client: Client,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Migrate data from SQLite to Supabase.
    
    Args:
        sqlite_path: Path to SQLite database
        supabase_client: Supabase client
        config: Migration configuration
        
    Returns:
        Migration results
    """
    results = {
        "success": False,
        "tables_migrated": 0,
        "records_migrated": 0,
        "tables": {}
    }
    
    # Connect to SQLite database
    sqlite_conn = connect_sqlite(sqlite_path)
    if not sqlite_conn:
        return results
    
    try:
        # Process each table mapping
        for table_mapping in config.get("tables", []):
            source_table = table_mapping.get("source_table")
            target_table = table_mapping.get("target_table")
            target_schema = table_mapping.get("target_schema", "public")
            field_mapping = table_mapping.get("field_mapping", {})
            transformers = table_mapping.get("transformers", {})
            limit = table_mapping.get("limit")
            
            print_info(f"Migrating data from {source_table} to {target_schema}.{target_table}...")
            
            # Load data from SQLite
            data = load_sqlite_data(sqlite_conn, source_table, limit)
            
            if not data:
                print_warning(f"No data found in table {source_table}")
                continue
            
            print_info(f"Loaded {len(data)} records from {source_table}")
            
            # Map fields
            mapped_data = map_fields(data, field_mapping, transformers)
            
            # Insert data into Supabase
            insert_result = insert_data(
                supabase_client, 
                target_table, 
                mapped_data, 
                target_schema, 
                table_mapping.get("batch_size", 100)
            )
            
            # Update results
            table_result = {
                "source_table": source_table,
                "target_table": f"{target_schema}.{target_table}",
                "records_total": len(data),
                "records_migrated": insert_result["inserted"],
                "success": insert_result["success"],
                "errors": insert_result["errors"]
            }
            
            results["tables"][source_table] = table_result
            
            if insert_result["success"]:
                results["tables_migrated"] += 1
                results["records_migrated"] += insert_result["inserted"]
                
                print_success(f"Successfully migrated {insert_result['inserted']} records from {source_table} to {target_schema}.{target_table}")
            else:
                print_error(f"Errors migrating {source_table} to {target_schema}.{target_table}")
                for error in insert_result["errors"]:
                    print_error(f"  - {error}")
        
        # Set overall success flag
        results["success"] = results["tables_migrated"] > 0
        
        return results
    finally:
        sqlite_conn.close()

def migrate_csv_to_supabase(
    csv_path: str,
    supabase_client: Client,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Migrate data from a CSV file to Supabase.
    
    Args:
        csv_path: Path to CSV file
        supabase_client: Supabase client
        config: Migration configuration
        
    Returns:
        Migration results
    """
    results = {
        "success": False,
        "records_migrated": 0,
        "source": csv_path,
        "target": f"{config.get('target_schema', 'public')}.{config.get('target_table')}",
        "errors": []
    }
    
    target_table = config.get("target_table")
    target_schema = config.get("target_schema", "public")
    field_mapping = config.get("field_mapping", {})
    transformers = config.get("transformers", {})
    has_header = config.get("has_header", True)
    
    # Load data from CSV
    data, headers = load_csv_data(csv_path, has_header)
    
    if not data:
        results["errors"].append("No data found in CSV file")
        return results
    
    # If no field mapping provided, create one from headers
    if not field_mapping:
        field_mapping = {header: header for header in headers}
    
    # Map fields
    mapped_data = map_fields(data, field_mapping, transformers)
    
    # Insert data into Supabase
    insert_result = insert_data(
        supabase_client, 
        target_table, 
        mapped_data, 
        target_schema, 
        config.get("batch_size", 100)
    )
    
    # Update results
    results["records_total"] = len(data)
    results["records_migrated"] = insert_result["inserted"]
    results["success"] = insert_result["success"]
    results["errors"] = insert_result["errors"]
    
    if insert_result["success"]:
        print_success(f"Successfully migrated {insert_result['inserted']} records from {csv_path} to {target_schema}.{target_table}")
    else:
        print_error(f"Errors migrating {csv_path} to {target_schema}.{target_table}")
        for error in insert_result["errors"]:
            print_error(f"  - {error}")
    
    return results

def migrate_json_to_supabase(
    json_path: str,
    supabase_client: Client,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Migrate data from a JSON file to Supabase.
    
    Args:
        json_path: Path to JSON file
        supabase_client: Supabase client
        config: Migration configuration
        
    Returns:
        Migration results
    """
    results = {
        "success": False,
        "records_migrated": 0,
        "source": json_path,
        "target": f"{config.get('target_schema', 'public')}.{config.get('target_table')}",
        "errors": []
    }
    
    target_table = config.get("target_table")
    target_schema = config.get("target_schema", "public")
    field_mapping = config.get("field_mapping", {})
    transformers = config.get("transformers", {})
    
    # Load data from JSON
    data = load_json_data(json_path)
    
    if not data:
        results["errors"].append("No data found in JSON file")
        return results
    
    # If no field mapping provided, create one from first record
    if not field_mapping:
        field_mapping = {key: key for key in data[0].keys()}
    
    # Map fields
    mapped_data = map_fields(data, field_mapping, transformers)
    
    # Insert data into Supabase
    insert_result = insert_data(
        supabase_client, 
        target_table, 
        mapped_data, 
        target_schema, 
        config.get("batch_size", 100)
    )
    
    # Update results
    results["records_total"] = len(data)
    results["records_migrated"] = insert_result["inserted"]
    results["success"] = insert_result["success"]
    results["errors"] = insert_result["errors"]
    
    if insert_result["success"]:
        print_success(f"Successfully migrated {insert_result['inserted']} records from {json_path} to {target_schema}.{target_table}")
    else:
        print_error(f"Errors migrating {json_path} to {target_schema}.{target_table}")
        for error in insert_result["errors"]:
            print_error(f"  - {error}")
    
    return results

def migrate_postgres_to_supabase(
    postgres_conn: Any,
    supabase_client: Client,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Migrate data from PostgreSQL to Supabase.
    
    Args:
        postgres_conn: PostgreSQL connection
        supabase_client: Supabase client
        config: Migration configuration
        
    Returns:
        Migration results
    """
    results = {
        "success": False,
        "tables_migrated": 0,
        "records_migrated": 0,
        "tables": {}
    }
    
    # Process each table mapping
    for table_mapping in config.get("tables", []):
        source_query = table_mapping.get("source_query")
        target_table = table_mapping.get("target_table")
        target_schema = table_mapping.get("target_schema", "public")
        field_mapping = table_mapping.get("field_mapping", {})
        transformers = table_mapping.get("transformers", {})
        
        print_info(f"Migrating data from query to {target_schema}.{target_table}...")
        
        # Load data from PostgreSQL
        data = execute_pg_query(postgres_conn, source_query)
        
        if not data:
            print_warning(f"No data found for query")
            continue
        
        print_info(f"Loaded {len(data)} records from PostgreSQL")
        
        # If no field mapping provided, create one from first record
        if not field_mapping:
            field_mapping = {key: key for key in data[0].keys()}
        
        # Map fields
        mapped_data = map_fields(data, field_mapping, transformers)
        
        # Insert data into Supabase
        insert_result = insert_data(
            supabase_client, 
            target_table, 
            mapped_data, 
            target_schema, 
            table_mapping.get("batch_size", 100)
        )
        
        # Update results
        table_result = {
            "source_query": source_query[:100] + "..." if len(source_query) > 100 else source_query,
            "target_table": f"{target_schema}.{target_table}",
            "records_total": len(data),
            "records_migrated": insert_result["inserted"],
            "success": insert_result["success"],
            "errors": insert_result["errors"]
        }
        
        results["tables"][target_table] = table_result
        
        if insert_result["success"]:
            results["tables_migrated"] += 1
            results["records_migrated"] += insert_result["inserted"]
            
            print_success(f"Successfully migrated {insert_result['inserted']} records to {target_schema}.{target_table}")
        else:
            print_error(f"Errors migrating to {target_schema}.{target_table}")
            for error in insert_result["errors"]:
                print_error(f"  - {error}")
    
    # Set overall success flag
    results["success"] = results["tables_migrated"] > 0
    
    return results

def migrate_sqlserver_to_supabase(
    sqlserver_conn: Any,
    supabase_client: Client,
    config: Dict[str, Any],
    dry_run: bool = False,
    incremental: bool = False
) -> Dict[str, Any]:
    """
    Migrate data from SQL Server to Supabase, with support for incremental sync.
    
    Args:
        sqlserver_conn: SQL Server connection
        supabase_client: Supabase client
        config: Migration configuration
        dry_run: If True, only preview changes without executing them
        incremental: If True, perform incremental sync based on last_sync table
        
    Returns:
        Migration results
    """
    results = {
        "success": False,
        "tables_migrated": 0,
        "records_migrated": 0,
        "records_updated": 0,
        "records_deleted": 0,
        "tables": {},
        "dry_run": dry_run,
        "incremental": incremental
    }
    
    # Create transaction log entry for rollback tracking if not in dry-run mode
    transaction_id = None
    if not dry_run and config.get("sync", {}).get("enable_rollback", True):
        transaction_id = str(uuid.uuid4())
        logger.info(f"Transaction ID for this migration: {transaction_id}")
        try:
            # Create sync_transactions table if it doesn't exist
            supabase_client.sql("""
            CREATE TABLE IF NOT EXISTS sync.transactions (
                id UUID PRIMARY KEY,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
                operation TEXT NOT NULL,
                source_type TEXT NOT NULL,
                target_schema TEXT NOT NULL,
                target_table TEXT NOT NULL,
                record_count INTEGER DEFAULT 0,
                metadata JSONB,
                rollback_executed BOOLEAN DEFAULT false
            );
            """).execute()
            
            # Create last_sync table if it doesn't exist (for incremental sync)
            if incremental:
                supabase_client.sql("""
                CREATE TABLE IF NOT EXISTS sync.last_sync (
                    id SERIAL PRIMARY KEY,
                    source_type TEXT NOT NULL,
                    source_table TEXT NOT NULL,
                    target_schema TEXT NOT NULL,
                    target_table TEXT NOT NULL,
                    last_sync_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
                    sync_key_column TEXT,
                    last_key_value TEXT,
                    record_count INTEGER DEFAULT 0
                );
                """).execute()
        except Exception as e:
            logger.warning(f"Could not ensure transaction tables exist: {str(e)}")
    
    # Enable change tracking in SQL Server if needed
    if incremental and config.get("sync", {}).get("enable_change_tracking", True):
        try:
            # Check if change tracking is enabled at the database level
            check_change_tracking = execute_pg_query(
                sqlserver_conn,
                "SELECT is_change_tracking_on FROM sys.change_tracking_databases WHERE database_id = DB_ID()"
            )
            
            if not check_change_tracking or not check_change_tracking[0].get('is_change_tracking_on', 0):
                logger.info("Enabling change tracking for the database...")
                if not dry_run:
                    sqlserver_conn.cursor().execute("ALTER DATABASE CURRENT SET CHANGE_TRACKING = ON (CHANGE_RETENTION = 7 DAYS, AUTO_CLEANUP = ON)")
                    sqlserver_conn.commit()
        except Exception as e:
            logger.warning(f"Could not enable change tracking: {str(e)}")
    
    # Process each table mapping
    for table_mapping in config.get("tables", []):
        source_table = table_mapping.get("source_table")
        source_query = table_mapping.get("source_query")
        target_table = table_mapping.get("target_table")
        target_schema = table_mapping.get("target_schema", "public")
        field_mapping = table_mapping.get("field_mapping", {})
        transformers = table_mapping.get("transformers", {})
        key_column = table_mapping.get("key_column", "id")
        batch_size = table_mapping.get("batch_size", config.get("sync", {}).get("batch_size", 100))
        
        # Determine sync mode message
        sync_mode = "incremental" if incremental else "full"
        exec_mode = "DRY RUN" if dry_run else "LIVE"
        print_info(f"[{exec_mode}] {sync_mode.upper()} SYNC: SQL Server to {target_schema}.{target_table}...")
        
        # For incremental sync, get the last sync time and modify the query
        last_sync_record = None
        if incremental:
            try:
                last_sync_response = supabase_client.table("sync.last_sync").select("*") \
                    .eq("source_table", source_table) \
                    .eq("target_schema", target_schema) \
                    .eq("target_table", target_table) \
                    .limit(1).execute()
                
                if last_sync_response.data:
                    last_sync_record = last_sync_response.data[0]
                    logger.info(f"Last sync for {source_table} -> {target_schema}.{target_table}: {last_sync_record['last_sync_time']}")
            except Exception as e:
                logger.warning(f"Could not get last sync record: {str(e)}")
        
        # Load data from SQL Server
        data = []
        try:
            if source_query:
                # Use the provided query as is
                if incremental and last_sync_record and "%LAST_SYNC_TIME%" in source_query:
                    # Replace placeholder with actual last sync time
                    modified_query = source_query.replace("%LAST_SYNC_TIME%", f"'{last_sync_record['last_sync_time']}'")
                    logger.info(f"Using modified query for incremental sync: {modified_query}")
                    data = execute_pg_query(sqlserver_conn, modified_query)
                else:
                    data = execute_pg_query(sqlserver_conn, source_query)
            elif source_table:
                # Build a query based on the source table
                if incremental and last_sync_record:
                    # Use last sync time if available
                    modified_time_column = table_mapping.get("modified_time_column", "modified_at")
                    query = f"SELECT * FROM {source_table} WHERE {modified_time_column} > '{last_sync_record['last_sync_time']}'"
                    data = execute_pg_query(sqlserver_conn, query)
                else:
                    # Full table sync
                    data = execute_pg_query(sqlserver_conn, f"SELECT * FROM {source_table}")
        except Exception as e:
            logger.error(f"Error executing SQL Server query: {str(e)}")
            continue
        
        if not data:
            print_warning(f"No data found for {source_table or source_query}")
            # Record in results even if no data found
            results["tables"][target_table] = {
                "source": source_table or source_query,
                "target_table": f"{target_schema}.{target_table}",
                "records_total": 0,
                "records_migrated": 0,
                "records_updated": 0,
                "records_deleted": 0,
                "success": True,
                "errors": []
            }
            continue
        
        print_info(f"Loaded {len(data)} records from SQL Server")
        
        # If no field mapping provided, create one from first record
        if not field_mapping:
            field_mapping = {key: key for key in data[0].keys()}
        
        # Map fields
        mapped_data = map_fields(data, field_mapping, transformers)
        
        # Track latest key value for incremental sync
        latest_key_value = None
        if key_column and mapped_data:
            # Find the max key value to store for next sync
            try:
                if key_column in mapped_data[0]:
                    latest_values = [record.get(key_column) for record in mapped_data if record.get(key_column) is not None]
                    if latest_values:
                        if isinstance(latest_values[0], (int, float)):
                            latest_key_value = str(max(latest_values))
                        else:
                            # For string keys, use the string with highest lexicographical value
                            latest_key_value = max(latest_values)
            except Exception as e:
                logger.warning(f"Could not determine latest key value: {str(e)}")
        
        # Prepare result object
        insert_result = {
            "success": True,
            "inserted": 0,
            "updated": 0,
            "deleted": 0,
            "errors": [],
            "dry_run": dry_run
        }
        
        if dry_run:
            # In dry-run mode, just report what would happen
            insert_result["inserted"] = len(mapped_data)
            print_info(f"[DRY RUN] Would migrate {len(mapped_data)} records to {target_schema}.{target_table}")
        else:
            # Determine if we're doing upsert or insert
            upsert_mode = incremental and table_mapping.get("upsert_on_key", True)
            
            # Insert (or upsert) data into Supabase
            insert_result = insert_data(
                supabase_client,
                target_table,
                mapped_data,
                target_schema,
                batch_size,
                transaction_id=transaction_id,
                upsert=upsert_mode,
                upsert_key=key_column if upsert_mode else None
            )
        
        # Update last_sync record for incremental sync
        if incremental and not dry_run and insert_result["success"]:
            current_time = datetime.datetime.now().isoformat()
            try:
                # Handle case where last_sync record exists or not
                if last_sync_record:
                    supabase_client.table("sync.last_sync").update({
                        "last_sync_time": current_time,
                        "sync_key_column": key_column,
                        "last_key_value": latest_key_value,
                        "record_count": insert_result["inserted"] + insert_result["updated"]
                    }).eq("id", last_sync_record["id"]).execute()
                else:
                    supabase_client.table("sync.last_sync").insert({
                        "source_type": "sqlserver",
                        "source_table": source_table or "custom_query",
                        "target_schema": target_schema,
                        "target_table": target_table,
                        "last_sync_time": current_time,
                        "sync_key_column": key_column,
                        "last_key_value": latest_key_value,
                        "record_count": insert_result["inserted"] + insert_result["updated"]
                    }).execute()
            except Exception as e:
                logger.warning(f"Could not update last_sync record: {str(e)}")
        
        # Update results
        table_result = {
            "source": source_table or source_query,
            "target_table": f"{target_schema}.{target_table}",
            "records_total": len(data),
            "records_migrated": insert_result["inserted"],
            "records_updated": insert_result.get("updated", 0),
            "records_deleted": insert_result.get("deleted", 0),
            "success": insert_result["success"],
            "errors": insert_result["errors"]
        }
        
        results["tables"][target_table] = table_result
        
        if insert_result["success"]:
            results["tables_migrated"] += 1
            results["records_migrated"] += insert_result["inserted"]
            results["records_updated"] += insert_result.get("updated", 0)
            results["records_deleted"] += insert_result.get("deleted", 0)
            
            if dry_run:
                print_info(f"[DRY RUN] Would migrate {insert_result['inserted']} records to {target_schema}.{target_table}")
                if incremental and insert_result.get("updated", 0):
                    print_info(f"[DRY RUN] Would update {insert_result.get('updated', 0)} records in {target_schema}.{target_table}")
            else:
                print_success(f"Successfully migrated {insert_result['inserted']} records to {target_schema}.{target_table}")
                if incremental and insert_result.get("updated", 0):
                    print_success(f"Updated {insert_result.get('updated', 0)} records in {target_schema}.{target_table}")
        else:
            print_error(f"Failed to migrate data to {target_schema}.{target_table}: {insert_result['errors']}")
    
    # Set overall success
    results["success"] = results["tables_migrated"] > 0
    
    # Record transaction in the transactions table if not dry run
    if transaction_id and not dry_run and results["success"]:
        try:
            supabase_client.table("sync.transactions").insert({
                "id": transaction_id,
                "operation": "incremental_sync" if incremental else "full_migration",
                "source_type": "sqlserver",
                "target_schema": config.get("target_schema", "public"),
                "target_table": ", ".join(results["tables"].keys()),
                "record_count": results["records_migrated"] + results["records_updated"],
                "metadata": {
                    "config": config,
                    "results": results
                }
            }).execute()
        except Exception as e:
            logger.warning(f"Could not record transaction: {str(e)}")
    
    return results

def load_config(config_path: str) -> Dict[str, Any]:
    """Load migration configuration from a JSON file."""
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config
    except Exception as e:
        logger.error(f"Error loading configuration: {str(e)}")
        return {}

def create_config_template() -> Dict[str, Any]:
    """Create a template migration configuration."""
    return {
        "source_type": "sqlite",  # sqlite, csv, json, postgres, sqlserver
        "source_path": "",  # Path to SQLite/CSV/JSON file or connection string for postgres/sqlserver
        "sync": {
            "dry_run": False,             # If True, preview changes without executing them
            "incremental": False,         # If True, perform incremental sync (SQL Server only)
            "enable_rollback": True,      # If True, enable transaction tracking for rollback
            "enable_change_tracking": True, # If True, enable change tracking in SQL Server
            "batch_size": 100,            # Default batch size for all tables
            "parallelism": 1              # Number of parallel threads (0 = auto)
        },
        "tables": [
            {
                "source_table": "users",  # For SQLite
                "source_query": "SELECT * FROM users",  # For postgres/sqlserver
                "target_table": "users",
                "target_schema": "core",
                "key_column": "id",       # Primary key column for upsert operations
                "modified_time_column": "modified_at", # Column for tracking changes in SQL Server
                "upsert_on_key": True,    # If True, perform upsert instead of insert for SQL Server incremental sync
                "field_mapping": {
                    "id": "id",
                    "username": "username",
                    "email": "email",
                    "full_name": {
                        "field": "name",
                        "transform": "title_case"
                    },
                    "created_at": {
                        "field": "created_date",
                        "transform": "to_iso_date"
                    }
                },
                "transformers": {
                    "title_case": "lambda x: x.title() if x else x",
                    "to_iso_date": "lambda x: x.strftime('%Y-%m-%dT%H:%M:%S') if x else None"
                },
                "batch_size": 100,        # Override default batch size
                "limit": 1000             # Optional limit for testing
            }
        ]
    }

def save_config_template(file_path: str) -> bool:
    """Save a template migration configuration to a file."""
    try:
        template = create_config_template()
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(template, f, indent=2)
        
        print_success(f"Saved configuration template to {file_path}")
        return True
    except Exception as e:
        print_error(f"Error saving configuration template: {str(e)}")
        return False

def get_transformers(transformer_defs: Dict[str, str]) -> Dict[str, Callable]:
    """
    Convert transformer definitions to callable functions.
    
    Args:
        transformer_defs: Transformer definitions (name -> function string)
        
    Returns:
        Dictionary of transformer functions
    """
    transformers = {}
    
    for name, func_str in transformer_defs.items():
        try:
            # Safely evaluate the function string
            transformer = eval(func_str)
            transformers[name] = transformer
        except Exception as e:
            logger.warning(f"Error creating transformer '{name}': {str(e)}")
    
    return transformers

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Data Migration Tool for Shared Supabase Database")
    parser.add_argument("--url", "-u", help="Supabase URL")
    parser.add_argument("--key", "-k", help="Supabase service key")
    parser.add_argument("--config", "-c", help="Path to migration configuration file")
    parser.add_argument("--create-template", "-t", help="Create a template configuration file at specified path")
    parser.add_argument("--dry-run", "-d", action="store_true", help="Dry run mode (preview changes without execution)")
    parser.add_argument("--incremental", "-i", action="store_true", help="Incremental sync mode (SQL Server only)")
    args = parser.parse_args()
    
    # Check if we need to create a template
    if args.create_template:
        save_config_template(args.create_template)
        return 0
    
    # Validate arguments
    if not args.config:
        logger.error("Migration configuration file is required")
        return 1
    
    # Load configuration
    config = load_config(args.config)
    if not config:
        logger.error("Failed to load configuration")
        return 1
        
    # Override configuration with command-line arguments
    if args.dry_run or args.incremental:
        # Initialize sync options if not present
        if "sync" not in config:
            config["sync"] = {}
        
        # Set dry run mode if specified
        if args.dry_run:
            config["sync"]["dry_run"] = True
            logger.info("Dry run mode enabled via command line")
            
        # Set incremental sync mode if specified
        if args.incremental:
            config["sync"]["incremental"] = True
            logger.info("Incremental sync mode enabled via command line")
    
    # Get Supabase credentials
    url = args.url or os.environ.get("SUPABASE_URL")
    key = args.key or os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        logger.error(
            "Supabase URL and key are required. "
            "Provide them as arguments or set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables."
        )
        return 1
    
    # Get Supabase client
    client = get_supabase_client(url, key)
    if not client:
        logger.error("Failed to create Supabase client")
        return 1
    
    # Process transformers
    source_type = config.get("source_type", "").lower()
    
    if source_type == "sqlite":
        # Process SQLite database migration
        source_path = config.get("source_path", "")
        
        if not source_path:
            logger.error("Source path is required for SQLite migration")
            return 1
        
        # Process transformers for each table mapping
        for table_mapping in config.get("tables", []):
            transformer_defs = table_mapping.get("transformers", {})
            table_mapping["transformers"] = get_transformers(transformer_defs)
        
        # Perform migration
        print_header(f"Migrating SQLite Database: {source_path}")
        results = migrate_sqlite_to_supabase(source_path, client, config)
        
        # Print summary
        print_header("Migration Summary")
        print(f"Tables migrated: {results['tables_migrated']}")
        print(f"Records migrated: {results['records_migrated']}")
        
        return 0 if results["success"] else 1
    
    elif source_type == "csv":
        # Process CSV file migration
        source_path = config.get("source_path", "")
        
        if not source_path:
            logger.error("Source path is required for CSV migration")
            return 1
        
        # Process transformers
        transformer_defs = config.get("transformers", {})
        config["transformers"] = get_transformers(transformer_defs)
        
        # Perform migration
        print_header(f"Migrating CSV File: {source_path}")
        results = migrate_csv_to_supabase(source_path, client, config)
        
        # Print summary
        print_header("Migration Summary")
        print(f"Records migrated: {results['records_migrated']} / {results['records_total']}")
        
        return 0 if results["success"] else 1
    
    elif source_type == "json":
        # Process JSON file migration
        source_path = config.get("source_path", "")
        
        if not source_path:
            logger.error("Source path is required for JSON migration")
            return 1
        
        # Process transformers
        transformer_defs = config.get("transformers", {})
        config["transformers"] = get_transformers(transformer_defs)
        
        # Perform migration
        print_header(f"Migrating JSON File: {source_path}")
        results = migrate_json_to_supabase(source_path, client, config)
        
        # Print summary
        print_header("Migration Summary")
        print(f"Records migrated: {results['records_migrated']} / {results['records_total']}")
        
        return 0 if results["success"] else 1
    
    elif source_type == "postgres":
        # Process PostgreSQL migration
        if not POSTGRES_AVAILABLE:
            logger.error("psycopg2 not installed. PostgreSQL migration is not available.")
            return 1
        
        conn_string = config.get("source_path", "")
        
        if not conn_string:
            logger.error("Connection string is required for PostgreSQL migration")
            return 1
        
        # Connect to PostgreSQL
        postgres_conn = connect_postgres(conn_string)
        if not postgres_conn:
            logger.error("Failed to connect to PostgreSQL database")
            return 1
        
        # Process transformers for each table mapping
        for table_mapping in config.get("tables", []):
            transformer_defs = table_mapping.get("transformers", {})
            table_mapping["transformers"] = get_transformers(transformer_defs)
        
        try:
            # Perform migration
            print_header("Migrating PostgreSQL Database")
            results = migrate_postgres_to_supabase(postgres_conn, client, config)
            
            # Print summary
            print_header("Migration Summary")
            print(f"Tables migrated: {results['tables_migrated']}")
            print(f"Records migrated: {results['records_migrated']}")
            
            return 0 if results["success"] else 1
        finally:
            postgres_conn.close()
    
    elif source_type == "sqlserver":
        # Process SQL Server migration
        if not SQLSERVER_AVAILABLE:
            logger.error("pyodbc not installed. SQL Server migration is not available.")
            return 1
        
        conn_string = config.get("source_path", "")
        
        if not conn_string:
            logger.error("Connection string is required for SQL Server migration")
            return 1
        
        # Connect to SQL Server
        sqlserver_conn = connect_sqlserver(conn_string)
        if not sqlserver_conn:
            logger.error("Failed to connect to SQL Server database")
            return 1
        
        # Process transformers for each table mapping
        for table_mapping in config.get("tables", []):
            transformer_defs = table_mapping.get("transformers", {})
            table_mapping["transformers"] = get_transformers(transformer_defs)
        
        # Add sync options
        dry_run = config.get("sync", {}).get("dry_run", False)
        incremental = config.get("sync", {}).get("incremental", False)
        
        try:
            # Perform migration
            mode = "INCREMENTAL" if incremental else "FULL"
            status = "DRY RUN" if dry_run else "LIVE"
            print_header(f"Migrating SQL Server Database ({status} {mode} SYNC)")
            
            results = migrate_sqlserver_to_supabase(
                sqlserver_conn, 
                client, 
                config,
                dry_run=dry_run,
                incremental=incremental
            )
            
            # Print summary
            print_header("Migration Summary")
            if dry_run:
                print(f"[DRY RUN] Would migrate {results['tables_migrated']} tables")
                print(f"[DRY RUN] Would migrate {results['records_migrated']} records")
                if incremental:
                    print(f"[DRY RUN] Would update {results['records_updated']} records")
            else:
                print(f"Tables migrated: {results['tables_migrated']}")
                print(f"Records migrated: {results['records_migrated']}")
                if incremental:
                    print(f"Records updated: {results['records_updated']}")
            
            return 0 if results["success"] else 1
        finally:
            sqlserver_conn.close()
    
    else:
        logger.error(f"Unsupported source type: {source_type}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
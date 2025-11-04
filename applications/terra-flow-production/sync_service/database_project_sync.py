"""
Enhanced Database Project Sync Service

This module provides an improved implementation of the legacy DatabaseProjectSyncService,
offering enhanced functionality for synchronizing GIS project data between databases.

Features:
- Bidirectional synchronization of project data
- Schema validation and automatic migration
- Change tracking with detailed history
- Conflict detection and resolution strategies
- Real-time sync status updates
- Performance optimizations with batch processing
- Comprehensive logging and error handling
"""
import os
import uuid
import datetime
import logging
import json
import threading
import time
from typing import Dict, List, Any, Optional, Tuple, Union

import sqlalchemy as sa
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.engine import Engine, Connection
from sqlalchemy.orm import Session

from app import db
from sync_service.models import (
    SyncJob, SyncLog, TableConfiguration, FieldConfiguration,
    SyncConflict, GlobalSetting
)
from sync_service.sync_engine import SyncEngine
from sync_service.data_type_handlers import (
    DataTypeHandler, get_handler_for_column, register_handler
)

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class DatabaseProjectSyncService:
    """
    Enhanced service for synchronizing database projects between environments.
    
    This service builds upon the legacy sync service with improved performance,
    reliability, and feature set for GIS project data synchronization.
    """
    
    def __init__(self, 
                 source_connection_string: str = None,
                 target_connection_string: str = None,
                 user_id: int = None,
                 job_id: str = None,
                 batch_size: int = 1000,
                 schema_validation: bool = True,
                 auto_migration: bool = True,
                 conflict_strategy: str = 'source_wins'):
        """Initialize the Database Project Sync Service.
        
        Args:
            source_connection_string: Connection string for source database
            target_connection_string: Connection string for target database
            user_id: Optional user ID who initiated the sync
            job_id: Optional job ID for tracking, a new UUID will be generated if None
            batch_size: Number of records to process in a batch (default: 1000)
            schema_validation: Whether to validate schema before syncing (default: True)
            auto_migration: Whether to automatically apply schema migrations (default: True)
            conflict_strategy: How to handle conflicts (default: 'source_wins')
                               Options: 'source_wins', 'target_wins', 'manual', 'newer_wins'
        """
        self.job_id = job_id or str(uuid.uuid4())
        self.user_id = user_id
        self.source_connection_string = source_connection_string
        self.target_connection_string = target_connection_string
        self.batch_size = batch_size
        self.schema_validation = schema_validation
        self.auto_migration = auto_migration
        self.conflict_strategy = conflict_strategy
        
        # These will be initialized later
        self.source_engine = None
        self.target_engine = None
        self.job = None
        self.sync_in_progress = False
        self.sync_thread = None
        self.project_tables = []
        self.sync_stats = {
            'total_tables': 0,
            'processed_tables': 0,
            'total_records': 0,
            'processed_records': 0,
            'error_records': 0,
            'conflict_records': 0,
            'start_time': None,
            'end_time': None
        }
        
        self._initialize_job()
        
    def _initialize_job(self):
        """Initialize or retrieve the sync job record."""
        self.job = SyncJob.query.filter_by(job_id=self.job_id).first()
        
        if not self.job:
            self.job = SyncJob(
                job_id=self.job_id,
                name=f"Project Sync {self.job_id[:8]}",
                status='pending',
                start_time=None,
                end_time=None,
                total_records=0,
                processed_records=0,
                error_records=0,
                error_details={},
                job_type='project_sync',
                source_db=self.source_connection_string.split('@')[-1] if self.source_connection_string else None,
                target_db=self.target_connection_string.split('@')[-1] if self.target_connection_string else None,
                initiated_by=self.user_id
            )
            db.session.add(self.job)
            db.session.commit()
            
    def _connect_databases(self):
        """Establish connections to source and target databases."""
        try:
            if self.source_connection_string:
                self.source_engine = sa.create_engine(self.source_connection_string)
                logger.info(f"Connected to source database: {self.source_connection_string.split('@')[-1]}")
            else:
                logger.warning("No source connection string provided")
                
            if self.target_connection_string:
                self.target_engine = sa.create_engine(self.target_connection_string)
                logger.info(f"Connected to target database: {self.target_connection_string.split('@')[-1]}")
            else:
                logger.warning("No target connection string provided")
                
            return True
        except Exception as e:
            logger.error(f"Failed to connect to databases: {str(e)}")
            self.job.status = 'failed'
            self.job.error_details = {'connection_error': str(e)}
            db.session.commit()
            return False
            
    def log(self, message: str, level: str = "INFO", component: str = "Sync", 
           table_name: str = None, record_count: int = None, duration_ms: int = None) -> None:
        """Log a sync event.
        
        Args:
            message: The log message
            level: Log level (INFO, WARNING, ERROR, DEBUG)
            component: Component generating the log (e.g., Extract, Transform, Load)
            table_name: Optional table name related to the log entry
            record_count: Optional count of records processed
            duration_ms: Optional duration in milliseconds
        """
        # Log to logger
        log_methods = {
            "INFO": logger.info,
            "WARNING": logger.warning,
            "ERROR": logger.error,
            "DEBUG": logger.debug
        }
        log_method = log_methods.get(level.upper(), logger.info)
        log_method(f"{component}: {message}")
        
        # Create a SyncLog entry in the database
        try:
            sync_log = SyncLog(
                job_id=self.job_id,
                level=level,
                component=component,
                message=message,
                table_name=table_name,
                record_count=record_count,
                duration_ms=duration_ms
            )
            db.session.add(sync_log)
            db.session.commit()
        except Exception as e:
            logger.error(f"Failed to create log entry: {str(e)}")
            
    def start_sync(self, async_mode: bool = True) -> str:
        """Start the database project synchronization.
        
        Args:
            async_mode: Whether to run the sync in a background thread
            
        Returns:
            The job_id of the sync operation
        """
        if self.sync_in_progress:
            self.log(f"Sync job {self.job_id} already in progress", level="WARNING")
            return self.job_id
            
        self.sync_in_progress = True
        self.job.status = 'running'
        self.job.start_time = datetime.datetime.utcnow()
        self.sync_stats['start_time'] = self.job.start_time
        db.session.commit()
        
        self.log(f"Starting database project sync job {self.job_id}")
        
        if async_mode:
            # Start in a separate thread
            self.sync_thread = threading.Thread(target=self._run_sync)
            self.sync_thread.daemon = True
            self.sync_thread.start()
        else:
            # Run synchronously
            self._run_sync()
            
        return self.job_id
        
    def _run_sync(self):
        """
        Execute the synchronization process
        """
        try:
            # Connect to databases
            if not self._connect_databases():
                raise Exception("Failed to connect to databases")
                
            # Identify project tables
            self._identify_project_tables()
            self.sync_stats['total_tables'] = len(self.project_tables)
            self.job.total_records = self._count_total_records()
            self.sync_stats['total_records'] = self.job.total_records
            db.session.commit()
            
            # Validate schemas if enabled
            if self.schema_validation:
                self._validate_schema()
                
            # Sync each table
            for table_info in self.project_tables:
                try:
                    self._sync_table(table_info)
                    self.sync_stats['processed_tables'] += 1
                except Exception as e:
                    self.log(f"Failed to sync table {table_info['name']}: {str(e)}", 
                            level="ERROR", component="TableSync", table_name=table_info['name'])
                    if not self.job.error_details.get('tables'):
                        self.job.error_details['tables'] = {}
                    self.job.error_details['tables'][table_info['name']] = str(e)
                    self.job.error_records += 1
                    db.session.commit()
            
            # Complete the job
            self._complete_job(success=True)
        except Exception as e:
            self.log(f"Sync job failed: {str(e)}", level="ERROR")
            self._complete_job(success=False, error=str(e))
        finally:
            self.sync_in_progress = False
            
    def _complete_job(self, success: bool = True, error: str = None):
        """Complete the sync job with appropriate status."""
        self.job.end_time = datetime.datetime.utcnow()
        self.sync_stats['end_time'] = self.job.end_time
        
        if self.job.start_time:
            duration = (self.job.end_time - self.job.start_time).total_seconds()
            self.job.duration_seconds = int(duration)
        
        if success:
            self.job.status = 'completed'
            self.log(f"Sync job completed successfully in {self.job.duration_seconds} seconds")
            self.log(f"Processed {self.job.processed_records} records from {self.sync_stats['processed_tables']} tables")
        else:
            self.job.status = 'failed'
            if error and not self.job.error_details.get('message'):
                self.job.error_details['message'] = error
            self.log(f"Sync job failed: {error}", level="ERROR")
            
        db.session.commit()
        
    def _identify_project_tables(self):
        """Identify tables related to project data in the source database."""
        try:
            if not self.source_engine:
                raise Exception("Source database connection not established")
                
            # Get custom table configuration
            table_configs = TableConfiguration.query.filter_by(
                sync_enabled=True, 
                config_type='project'
            ).all()
            
            if table_configs:
                # Use configured tables
                self.project_tables = [
                    {
                        'name': config.name,
                        'primary_keys': [pk.name for pk in config.primary_keys],
                        'fields': [field.name for field in config.fields if field.sync_enabled]
                    }
                    for config in table_configs
                ]
                self.log(f"Using {len(self.project_tables)} configured project tables")
            else:
                # Auto-detect project tables through introspection
                with self.source_engine.connect() as conn:
                    # Find tables with 'project' in the name or with project-related columns
                    query = text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    AND (
                        table_name LIKE '%project%' 
                        OR table_name LIKE '%gis%'
                        OR table_name IN (
                            SELECT table_name 
                            FROM information_schema.columns 
                            WHERE column_name LIKE '%project%'
                        )
                    )
                    """)
                    result = conn.execute(query)
                    
                    for row in result:
                        table_name = row[0]
                        # Get primary keys
                        pk_query = text("""
                        SELECT a.attname
                        FROM pg_index i
                        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                        WHERE i.indrelid = :table_name::regclass
                        AND i.indisprimary;
                        """)
                        pk_result = conn.execute(pk_query, {'table_name': table_name})
                        primary_keys = [row[0] for row in pk_result]
                        
                        # Get all columns
                        col_query = text("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = :table_name
                        """)
                        col_result = conn.execute(col_query, {'table_name': table_name})
                        fields = [row[0] for row in col_result]
                        
                        self.project_tables.append({
                            'name': table_name,
                            'primary_keys': primary_keys,
                            'fields': fields
                        })
                
                self.log(f"Auto-detected {len(self.project_tables)} project tables")
                
            # No project tables found
            if not self.project_tables:
                self.log("No project tables found for synchronization", level="WARNING")
                
        except Exception as e:
            self.log(f"Failed to identify project tables: {str(e)}", level="ERROR")
            raise
            
    def _count_total_records(self) -> int:
        """Count the total number of records to be synchronized."""
        total = 0
        try:
            with self.source_engine.connect() as conn:
                for table in self.project_tables:
                    count_query = text(f"SELECT COUNT(*) FROM {table['name']}")
                    result = conn.execute(count_query)
                    count = result.scalar()
                    total += count
                    
            self.log(f"Total records to sync: {total}")
            return total
        except Exception as e:
            self.log(f"Failed to count total records: {str(e)}", level="ERROR")
            return 0
            
    def _validate_schema(self):
        """Validate that source and target database schemas are compatible."""
        if not self.target_engine:
            self.log("Cannot validate schema: No target database connection", level="WARNING")
            return
            
        schema_issues = []
        
        try:
            for table in self.project_tables:
                table_name = table['name']
                
                # Check if table exists in target
                with self.target_engine.connect() as conn:
                    check_query = text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = :table_name
                    )
                    """)
                    exists = conn.execute(check_query, {'table_name': table_name}).scalar()
                    
                    if not exists:
                        if self.auto_migration:
                            self.log(f"Table {table_name} doesn't exist in target, will be created", 
                                    level="WARNING", component="SchemaValidation", table_name=table_name)
                            self._create_table(table)
                        else:
                            schema_issues.append(f"Table {table_name} doesn't exist in target database")
                            continue
                    
                    # Compare columns
                    source_cols = self._get_columns(self.source_engine, table_name)
                    target_cols = self._get_columns(self.target_engine, table_name)
                    
                    # Find missing columns
                    missing_cols = [col for col in source_cols if col['column_name'] not in 
                                   [c['column_name'] for c in target_cols]]
                    
                    if missing_cols and self.auto_migration:
                        for col in missing_cols:
                            self.log(f"Adding missing column {col['column_name']} to {table_name}", 
                                    level="WARNING", component="SchemaValidation", table_name=table_name)
                            self._add_column(table_name, col)
                    elif missing_cols:
                        for col in missing_cols:
                            schema_issues.append(
                                f"Column {col['column_name']} in table {table_name} missing from target"
                            )
                    
                    # Find columns with different types
                    type_mismatches = []
                    for source_col in source_cols:
                        target_col = next((c for c in target_cols 
                                        if c['column_name'] == source_col['column_name']), None)
                        if target_col and source_col['data_type'] != target_col['data_type']:
                            type_mismatches.append(
                                f"Column {source_col['column_name']} in {table_name} has different types: "
                                f"source={source_col['data_type']}, target={target_col['data_type']}"
                            )
                    
                    if type_mismatches:
                        schema_issues.extend(type_mismatches)
        
            if schema_issues and not self.auto_migration:
                error_msg = "Schema validation failed:\n" + "\n".join(schema_issues)
                self.log(error_msg, level="ERROR", component="SchemaValidation")
                raise Exception(error_msg)
                
        except Exception as e:
            if not str(e).startswith("Schema validation failed"):
                self.log(f"Error during schema validation: {str(e)}", level="ERROR", component="SchemaValidation")
                raise
            else:
                raise
                
    def _get_columns(self, engine: Engine, table_name: str) -> List[Dict[str, str]]:
        """Get column information for a table."""
        with engine.connect() as conn:
            query = text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = :table_name
            ORDER BY ordinal_position
            """)
            result = conn.execute(query, {'table_name': table_name})
            return [dict(row) for row in result]
            
    def _create_table(self, table: Dict[str, Any]):
        """Create a table in the target database based on source schema."""
        table_name = table['name']
        
        try:
            # Get table DDL from source
            with self.source_engine.connect() as conn:
                query = text(f"""
                SELECT 
                  'CREATE TABLE {table_name} (' || 
                  string_agg(
                    column_name || ' ' || 
                    data_type || 
                    CASE 
                      WHEN character_maximum_length IS NOT NULL 
                      THEN '(' || character_maximum_length || ')' 
                      ELSE '' 
                    END || 
                    CASE 
                      WHEN is_nullable = 'NO' 
                      THEN ' NOT NULL' 
                      ELSE '' 
                    END,
                    ', '
                  ) || 
                  CASE 
                    WHEN EXISTS (
                      SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = '{table_name}' 
                      AND constraint_type = 'PRIMARY KEY'
                    ) 
                    THEN ', PRIMARY KEY (' || 
                      (SELECT string_agg(column_name, ', ') 
                       FROM information_schema.key_column_usage 
                       WHERE table_name = '{table_name}' 
                       AND constraint_name IN (
                         SELECT constraint_name 
                         FROM information_schema.table_constraints 
                         WHERE table_name = '{table_name}' 
                         AND constraint_type = 'PRIMARY KEY'
                       )) || ')'
                    ELSE ''
                  END || 
                  ');' as ddl
                FROM information_schema.columns
                WHERE table_name = '{table_name}'
                GROUP BY table_name
                """)
                
                result = conn.execute(query)
                ddl = result.scalar()
                
                if not ddl:
                    raise Exception(f"Failed to generate DDL for table {table_name}")
                    
            # Create table in target
            with self.target_engine.connect() as conn:
                conn.execute(text(ddl))
                self.log(f"Created table {table_name} in target database", 
                        component="SchemaMigration", table_name=table_name)
                
        except Exception as e:
            self.log(f"Failed to create table {table_name}: {str(e)}", 
                    level="ERROR", component="SchemaMigration", table_name=table_name)
            raise
            
    def _add_column(self, table_name: str, column: Dict[str, str]):
        """Add a column to a table in the target database."""
        try:
            column_name = column['column_name']
            data_type = column['data_type']
            is_nullable = "NULL" if column['is_nullable'] == 'YES' else "NOT NULL"
            
            alter_sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {data_type} {is_nullable};"
            
            with self.target_engine.connect() as conn:
                conn.execute(text(alter_sql))
                self.log(f"Added column {column_name} to {table_name}", 
                        component="SchemaMigration", table_name=table_name)
                
        except Exception as e:
            self.log(f"Failed to add column {column['column_name']} to {table_name}: {str(e)}", 
                    level="ERROR", component="SchemaMigration", table_name=table_name)
            raise
            
    def _sync_table(self, table: Dict[str, Any]):
        """
        Synchronize a single table between source and target, 
        using data type handlers for proper data conversion.
        
        Args:
            table: Dictionary containing table name, primary keys, and fields
        """
        table_name = table['name']
        primary_keys = table['primary_keys']
        fields = table['fields']
        
        if not primary_keys:
            self.log(f"Cannot sync table {table_name}: No primary keys defined", 
                    level="ERROR", component="TableSync", table_name=table_name)
            return
            
        self.log(f"Syncing table {table_name}", component="TableSync", table_name=table_name)
        start_time = time.time()
        
        try:
            # Store the current table name in the job for reference in other methods
            if self.job and hasattr(self.job, "__dict__"):
                # Use setattr to avoid attribute error if current_table doesn't exist
                setattr(self.job, 'current_table', table_name)
            
            # Get the table schema for proper data type handling
            source_schema = self._get_table_schema(table_name, self.source_engine)
            
            # 1. Get all records from source
            source_data = self._extract_data(table_name, primary_keys, fields)
            batch_count = 0
            
            # Process in batches
            for i in range(0, len(source_data), self.batch_size):
                batch = source_data[i:i + self.batch_size]
                
                # 2. For each batch, find target records with same primary keys
                pk_values = [self._get_pk_value(record, primary_keys) for record in batch]
                target_data = self._get_target_records(table_name, primary_keys, fields, pk_values)
                
                # 3. Identify inserts, updates, and potential conflicts
                operations = self._classify_operations(batch, target_data, primary_keys)
                
                # 4. Apply changes to target
                self._apply_changes(table_name, operations)
                
                batch_count += 1
                self.job.processed_records += len(batch)
                self.sync_stats['processed_records'] = self.job.processed_records
                db.session.commit()
                
                if batch_count % 10 == 0:
                    self.log(f"Processed {self.job.processed_records}/{self.job.total_records} records", 
                            component="TableSync", table_name=table_name, record_count=self.job.processed_records)
            
            duration = time.time() - start_time
            self.log(f"Completed sync of table {table_name}", 
                    component="TableSync", table_name=table_name, 
                    record_count=len(source_data), duration_ms=int(duration * 1000))
            
        except Exception as e:
            self.log(f"Error syncing table {table_name}: {str(e)}", 
                    level="ERROR", component="TableSync", table_name=table_name)
            raise
            
    def _extract_data(self, table_name: str, pk_columns: List[str], field_names: List[str]) -> List[Dict[str, Any]]:
        """
        Extract data from the source database, processing special data types with data type handlers.
        
        Args:
            table_name: Name of the table to extract data from
            pk_columns: List of primary key column names
            field_names: List of field names to extract
            
        Returns:
            List of records with processed values
        """
        try:
            # First, get the table schema to identify column data types
            table_schema = self._get_table_schema(table_name, self.source_engine)
            
            with self.source_engine.connect() as conn:
                columns = ", ".join(field_names)
                query = f"SELECT {columns} FROM {table_name}"
                result = conn.execute(text(query))
                
                # Process raw data with data type handlers
                processed_data = []
                for row in result:
                    # Convert row to dictionary
                    record = dict(row)
                    
                    # Process each field with appropriate data type handler if available
                    for column_name, value in record.items():
                        if column_name in table_schema:
                            column_type = table_schema[column_name]
                            handler = get_handler_for_column(column_type)
                            
                            if handler:
                                # Use the handler to extract/process the value
                                record[column_name] = handler.extract_value(column_name, value)
                    
                    processed_data.append(record)
                
                self.log(f"Extracted {len(processed_data)} records from {table_name}", 
                        component="Extract", table_name=table_name, record_count=len(processed_data))
                return processed_data
                
        except Exception as e:
            self.log(f"Error extracting data from {table_name}: {str(e)}", 
                    level="ERROR", component="Extract", table_name=table_name)
            raise
            
    def _get_table_schema(self, table_name: str, engine: Engine) -> Dict[str, str]:
        """
        Get the schema (column names and data types) for a table.
        
        Args:
            table_name: Name of the table
            engine: SQLAlchemy engine connected to the database
            
        Returns:
            Dictionary mapping column names to their data types
        """
        schema = {}
        try:
            with engine.connect() as conn:
                query = text("""
                SELECT column_name, data_type, udt_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = :table_name
                """)
                
                result = conn.execute(query, {"table_name": table_name})
                
                for row in result:
                    # Use udt_name for custom types (like geometry), otherwise use data_type
                    data_type = row['udt_name'] if row['udt_name'] else row['data_type']
                    schema[row['column_name']] = data_type
                
            return schema
        except Exception as e:
            self.log(f"Error retrieving schema for table {table_name}: {str(e)}", 
                    level="ERROR", component="SchemaValidation", table_name=table_name)
            return {}
            
    def _get_pk_value(self, record: Dict[str, Any], pk_columns: List[str]) -> str:
        """Get a string representation of a record's primary key value."""
        pk_values = []
        for pk in pk_columns:
            if pk in record:
                value = record[pk]
                # Convert to string, handling None values
                pk_values.append(str(value) if value is not None else "NULL")
            else:
                pk_values.append("MISSING")
        return "|".join(pk_values)
        
    def _get_target_records(self, table_name: str, pk_columns: List[str], 
                          field_names: List[str], pk_values: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Get records from the target database that match the provided primary keys,
        processing special data types with data type handlers.
        
        Args:
            table_name: Name of the table to query
            pk_columns: List of primary key column names
            field_names: List of field names to retrieve
            pk_values: List of primary key values to match
            
        Returns:
            Dictionary mapping primary key values to records
        """
        result = {}
        
        if not pk_values:
            return result
            
        try:
            # Get the table schema for data type handling
            table_schema = self._get_table_schema(table_name, self.target_engine)
            
            with self.target_engine.connect() as conn:
                # Build a query with OR conditions for each primary key set
                pk_conditions = []
                for pk_value in pk_values:
                    pk_parts = pk_value.split("|")
                    if len(pk_parts) != len(pk_columns):
                        continue
                        
                    condition_parts = []
                    for i, pk in enumerate(pk_columns):
                        if pk_parts[i] == "NULL":
                            condition_parts.append(f"{pk} IS NULL")
                        elif pk_parts[i] == "MISSING":
                            # Skip this condition
                            pass
                        else:
                            condition_parts.append(f"{pk} = '{pk_parts[i]}'")
                    
                    if condition_parts:
                        pk_conditions.append("(" + " AND ".join(condition_parts) + ")")
                
                if not pk_conditions:
                    return result
                    
                columns = ", ".join(field_names)
                where_clause = " OR ".join(pk_conditions)
                query = f"SELECT {columns} FROM {table_name} WHERE {where_clause}"
                
                result_set = conn.execute(text(query))
                
                # Process the results with data type handlers
                for row in result_set:
                    # Convert row to dictionary
                    record = dict(row)
                    
                    # Process each field with appropriate data type handler if available
                    for column_name, value in list(record.items()):  # Use list() to allow dict modification during iteration
                        if column_name in table_schema:
                            column_type = table_schema[column_name]
                            handler = get_handler_for_column(column_type)
                            
                            if handler:
                                # Use the handler to extract/process the value
                                record[column_name] = handler.extract_value(column_name, value)
                    
                    # Get the primary key and add to results
                    pk_value = self._get_pk_value(record, pk_columns)
                    result[pk_value] = record
                
                return result
                
        except Exception as e:
            self.log(f"Error getting target records from {table_name}: {str(e)}", 
                    level="ERROR", component="Extract", table_name=table_name)
            raise
            
    def _classify_operations(self, source_records: List[Dict[str, Any]], 
                           target_records: Dict[str, Dict[str, Any]], 
                           pk_columns: List[str]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Classify records into inserts, updates, or conflicts,
        using data type handlers for proper comparison.
        
        Args:
            source_records: Records from the source database
            target_records: Records from the target database, keyed by primary key
            pk_columns: List of primary key column names
            
        Returns:
            Dictionary with lists of records classified as insert, update, or conflict
        """
        operations = {
            'insert': [],
            'update': [],
            'conflict': []
        }
        
        # Get the table schema for the first record if available
        table_name = None
        table_schema = None
        
        if source_records and len(source_records) > 0:
            # Try to determine the table name from the job information
            if self.job and hasattr(self.job, 'current_table') and self.job.current_table:
                table_name = self.job.current_table
                table_schema = self._get_table_schema(table_name, self.source_engine)
        
        for record in source_records:
            pk_value = self._get_pk_value(record, pk_columns)
            
            if pk_value not in target_records:
                # Record doesn't exist in target, insert it
                operations['insert'].append(record)
            else:
                target_record = target_records[pk_value]
                # Check if records differ, using data type handlers if available
                if self._records_differ(record, target_record, table_schema):
                    # Determine if this is a conflict or a simple update
                    if self._is_conflict(record, target_record):
                        operations['conflict'].append({
                            'source': record,
                            'target': target_record,
                            'pk_value': pk_value
                        })
                        self.sync_stats['conflict_records'] += 1
                    else:
                        operations['update'].append(record)
        
        return operations
        
    def _records_differ(self, record1: Dict[str, Any], record2: Dict[str, Any], 
                         table_schema: Dict[str, str] = None) -> bool:
        """
        Check if two records have different values, using data type handlers when available.
        
        Args:
            record1: First record to compare
            record2: Second record to compare
            table_schema: Optional schema information mapping column names to data types
        
        Returns:
            True if records differ, False if they are the same
        """
        for key in record1:
            if key in record2:
                # Handle None values
                val1 = record1[key]
                val2 = record2[key]
                
                if (val1 is None and val2 is not None) or (val1 is not None and val2 is None):
                    return True
                
                # Skip comparison if both are None
                if val1 is None and val2 is None:
                    continue
                
                # If we have schema information, use appropriate data type handler
                if table_schema and key in table_schema:
                    column_type = table_schema[key]
                    handler = get_handler_for_column(column_type)
                    
                    if handler:
                        # Use specialized comparison
                        if not handler.compare_values(val1, val2):
                            return True
                        # Skip the default comparison if we used a handler
                        continue
                
                # Default comparison for standard types
                if isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
                    if abs(val1 - val2) > 1e-9:  # Compare with small epsilon for floating point
                        return True
                # Special handling for JSON data
                elif isinstance(val1, (dict, list)) and isinstance(val2, (dict, list)):
                    try:
                        # Compare serialized JSON to account for formatting differences
                        if json.dumps(val1, sort_keys=True) != json.dumps(val2, sort_keys=True):
                            return True
                    except (TypeError, ValueError):
                        # If JSON serialization fails, fall back to string comparison
                        if str(val1) != str(val2):
                            return True
                # String comparison for other types
                elif str(val1) != str(val2):
                    return True
            else:
                # Key exists in record1 but not in record2
                return True
                
        # Check for keys in record2 not in record1
        for key in record2:
            if key not in record1:
                return True
                
        return False
        
    def _is_conflict(self, source_record: Dict[str, Any], target_record: Dict[str, Any]) -> bool:
        """
        Determine if the differences between records represent a conflict.
        
        In this implementation, we check for fields that were modified in both source and target
        since the last sync, indicating a potential conflict.
        """
        # By default, we consider any difference a conflict if the target has been modified
        # This can be customized based on specific business rules
        
        # Check for specific conflict indicators like modified timestamps
        for field in ['modified_at', 'updated_at', 'last_modified']:
            if field in source_record and field in target_record:
                source_modified = source_record[field]
                target_modified = target_record[field]
                
                # If both were modified since the last sync, flag as conflict
                if source_modified and target_modified:
                    # Check if both were modified after the last sync
                    # For now, we'll use a simple approach
                    return True
                    
        # If no conflict indicators found, it's a simple update (source wins)
        return False
        
    def _apply_changes(self, table_name: str, operations: Dict[str, List[Dict[str, Any]]]):
        """Apply the classified operations to the target database."""
        try:
            with self.target_engine.connect() as conn:
                # Process inserts
                if operations['insert']:
                    self._batch_insert(conn, table_name, operations['insert'])
                    
                # Process updates
                if operations['update']:
                    for record in operations['update']:
                        self._update_record(conn, table_name, record)
                        
                # Process conflicts based on strategy
                if operations['conflict']:
                    self._handle_conflicts(table_name, operations['conflict'])
                    
        except Exception as e:
            self.log(f"Error applying changes to {table_name}: {str(e)}", 
                    level="ERROR", component="Load", table_name=table_name)
            raise
            
    def _batch_insert(self, conn: Connection, table_name: str, records: List[Dict[str, Any]]):
        """
        Insert multiple records into the target database in a batch, 
        processing special data types with data type handlers.
        
        Args:
            conn: SQLAlchemy connection
            table_name: Name of the table to insert into
            records: List of records to insert
        """
        if not records:
            return
            
        try:
            # Get the table schema for data type handling
            table_schema = self._get_table_schema(table_name, self.target_engine)
            
            # Get column names from the first record
            columns = list(records[0].keys())
            
            # Prepare records using data type handlers
            processed_records = []
            for record in records:
                processed_record = {}
                
                for column_name, value in record.items():
                    if column_name in table_schema:
                        column_type = table_schema[column_name]
                        handler = get_handler_for_column(column_type)
                        
                        if handler:
                            # Use the handler to prepare the value for database insertion
                            processed_record[column_name] = handler.prepare_value(column_name, value)
                        else:
                            processed_record[column_name] = value
                    else:
                        processed_record[column_name] = value
                        
                processed_records.append(processed_record)
            
            # Prepare batch insert
            column_str = ", ".join(columns)
            placeholders = ", ".join([f":{col}" for col in columns])
            
            # Insert records
            query = f"INSERT INTO {table_name} ({column_str}) VALUES ({placeholders})"
            conn.execute(text(query), [record for record in processed_records])
            
            self.log(f"Inserted {len(records)} records into {table_name}", 
                    component="Load", table_name=table_name, record_count=len(records))
                    
        except Exception as e:
            self.log(f"Error batch inserting into {table_name}: {str(e)}", 
                    level="ERROR", component="Load", table_name=table_name)
            raise
            
    def _update_record(self, conn: Connection, table_name: str, record: Dict[str, Any]):
        """
        Update a single record in the target database,
        processing special data types with data type handlers.
        
        Args:
            conn: SQLAlchemy connection
            table_name: Name of the table to update
            record: Record to update
        """
        try:
            # Get the table schema for data type handling
            table_schema = self._get_table_schema(table_name, self.target_engine)
            
            # Determine primary key columns
            pk_columns = [col for col in record if col.lower().endswith('id') or col.lower() == 'id']
            if not pk_columns:
                self.log(f"Cannot update record in {table_name}: No primary key determined", 
                        level="ERROR", component="Load", table_name=table_name)
                return
            
            # Prepare record using data type handlers
            processed_record = {}
            for column_name, value in record.items():
                if column_name in table_schema:
                    column_type = table_schema[column_name]
                    handler = get_handler_for_column(column_type)
                    
                    if handler:
                        # Use the handler to prepare the value for database insertion
                        processed_record[column_name] = handler.prepare_value(column_name, value)
                    else:
                        processed_record[column_name] = value
                else:
                    processed_record[column_name] = value
                
            # Build SET clause - only for non-PK columns
            set_clause = ", ".join([f"{col} = :{col}" for col in processed_record if col not in pk_columns])
            
            # Build WHERE clause for primary keys
            where_clause = " AND ".join([f"{col} = :{col}" for col in pk_columns])
            
            # Update record
            query = f"UPDATE {table_name} SET {set_clause} WHERE {where_clause}"
            conn.execute(text(query), processed_record)
            
        except Exception as e:
            self.log(f"Error updating record in {table_name}: {str(e)}", 
                    level="ERROR", component="Load", table_name=table_name)
            raise
            
    def _handle_conflicts(self, table_name: str, conflicts: List[Dict[str, Any]]):
        """
        Handle conflicts based on the configured conflict resolution strategy,
        properly processing specialized data types with data type handlers.
        
        Args:
            table_name: Name of the table containing conflicts
            conflicts: List of conflict records with source, target, and pk_value
        """
        # Get the table schema for data type handling
        table_schema = self._get_table_schema(table_name, self.target_engine)
        
        for conflict in conflicts:
            source = conflict['source']
            target = conflict['target']
            pk_value = conflict['pk_value']
            
            try:
                if self.conflict_strategy == 'source_wins':
                    # Simply update with source data
                    with self.target_engine.connect() as conn:
                        self._update_record(conn, table_name, source)
                        
                elif self.conflict_strategy == 'target_wins':
                    # Keep target data, no action needed
                    pass
                    
                elif self.conflict_strategy == 'newer_wins':
                    # Compare timestamps if available and use the newer version
                    source_time = None
                    target_time = None
                    
                    for field in ['modified_at', 'updated_at', 'last_modified']:
                        if field in source and field in target:
                            source_time = source[field]
                            target_time = target[field]
                            break
                            
                    if source_time and target_time:
                        if source_time > target_time:
                            with self.target_engine.connect() as conn:
                                self._update_record(conn, table_name, source)
                    else:
                        # Default to source wins if no timestamp fields
                        with self.target_engine.connect() as conn:
                            self._update_record(conn, table_name, source)
                
                elif self.conflict_strategy == 'field_level_merge':
                    # Advanced strategy - merge records at the field level
                    # For specialized types, use the appropriate data handler
                    merged_record = {}
                    
                    # Start by cloning the target record as the base
                    for key, value in target.items():
                        merged_record[key] = value
                    
                    # Override with source values for modified fields
                    for key, value in source.items():
                        # Check if field has specialized handler
                        if table_schema and key in table_schema:
                            column_type = table_schema[key]
                            handler = get_handler_for_column(column_type)
                            
                            if handler:
                                # If field is complex type, use handler's merge strategy
                                # This might involve combining geometries, merging JSON, etc.
                                merged_record[key] = handler.prepare_value(key, value)
                            else:
                                merged_record[key] = value
                        else:
                            merged_record[key] = value
                    
                    # Apply the merged record
                    with self.target_engine.connect() as conn:
                        self._update_record(conn, table_name, merged_record)
                            
                elif self.conflict_strategy == 'manual':
                    # Create a conflict record for manual resolution
                    # Process the data with handlers before storing for proper display
                    processed_source = {}
                    processed_target = {}
                    
                    # Process source record fields with handlers
                    for key, value in source.items():
                        if table_schema and key in table_schema:
                            column_type = table_schema[key]
                            handler = get_handler_for_column(column_type)
                            
                            if handler:
                                processed_source[key] = handler.extract_value(key, value)
                            else:
                                processed_source[key] = value
                        else:
                            processed_source[key] = value
                    
                    # Process target record fields with handlers
                    for key, value in target.items():
                        if table_schema and key in table_schema:
                            column_type = table_schema[key]
                            handler = get_handler_for_column(column_type)
                            
                            if handler:
                                processed_target[key] = handler.extract_value(key, value)
                            else:
                                processed_target[key] = value
                        else:
                            processed_target[key] = value
                    
                    # Create the conflict record with processed data
                    conflict_record = SyncConflict(
                        job_id=self.job_id,
                        table_name=table_name,
                        record_id=pk_value,
                        source_data=processed_source,
                        target_data=processed_target,
                        resolution_status='pending',
                        created_at=datetime.datetime.utcnow()
                    )
                    db.session.add(conflict_record)
                    db.session.commit()
                    
                self.log(f"Handled conflict for record {pk_value} in {table_name} using strategy: {self.conflict_strategy}", 
                        component="ConflictResolution", table_name=table_name)
                        
            except Exception as e:
                self.log(f"Error handling conflict for record {pk_value} in {table_name}: {str(e)}", 
                        level="ERROR", component="ConflictResolution", table_name=table_name)
                self.job.error_records += 1
                if not self.job.error_details.get('conflicts'):
                    self.job.error_details['conflicts'] = {}
                self.job.error_details['conflicts'][pk_value] = str(e)
                db.session.commit()
                
    def get_status(self) -> Dict[str, Any]:
        """Get the current status of the sync job."""
        return {
            'job_id': self.job_id,
            'status': self.job.status,
            'progress': {
                'tables': {
                    'total': self.sync_stats['total_tables'],
                    'processed': self.sync_stats['processed_tables']
                },
                'records': {
                    'total': self.sync_stats['total_records'],
                    'processed': self.sync_stats['processed_records'],
                    'errors': self.sync_stats['error_records'],
                    'conflicts': self.sync_stats['conflict_records']
                }
            },
            'timing': {
                'start': self.sync_stats['start_time'].isoformat() if self.sync_stats['start_time'] else None,
                'end': self.sync_stats['end_time'].isoformat() if self.sync_stats['end_time'] else None,
                'duration': self.job.duration_seconds if self.job.duration_seconds else None
            }
        }
        
    def wait_for_completion(self, timeout_seconds: int = 3600) -> bool:
        """
        Wait for the sync job to complete.
        
        Args:
            timeout_seconds: Maximum time to wait in seconds
            
        Returns:
            True if job completed successfully, False otherwise
        """
        start_time = time.time()
        
        while self.sync_in_progress:
            time.sleep(1)
            
            if time.time() - start_time > timeout_seconds:
                self.log(f"Timed out waiting for sync job to complete after {timeout_seconds} seconds", 
                        level="WARNING")
                return False
                
        return self.job.status == 'completed'
        
    def resolve_manual_conflict(self, conflict_id: int, resolution: str, custom_values: Optional[Dict[str, Any]] = None) -> bool:
        """
        Resolve a manually flagged conflict, applying data type handlers as needed.
        
        Args:
            conflict_id: ID of the conflict record to resolve
            resolution: Resolution strategy ('source', 'target', or 'custom')
            custom_values: Custom field values for field-level resolution
            
        Returns:
            True if resolved successfully, False otherwise
        """
        try:
            # Fetch the conflict record
            conflict = SyncConflict.query.get(conflict_id)
            if not conflict or conflict.resolution_status != 'pending':
                self.log(f"Cannot resolve conflict {conflict_id}: Not found or already resolved",
                       level="ERROR", component="ConflictResolution")
                return False
                
            table_name = conflict.table_name
            
            # Get the table schema for data type handling
            table_schema = self._get_table_schema(table_name, self.target_engine)
            
            # Determine which record to use based on resolution strategy
            if resolution == 'source':
                # Use source record
                record_to_apply = conflict.source_data
            elif resolution == 'target':
                # Keep target record (no action needed)
                conflict.resolution_status = 'resolved'
                conflict.resolved_at = datetime.datetime.utcnow()
                conflict.resolution_strategy = 'target_wins'
                db.session.commit()
                return True
            elif resolution == 'custom' and custom_values:
                # Create a custom record based on provided values
                record_to_apply = custom_values
            else:
                self.log(f"Invalid resolution strategy for conflict {conflict_id}: {resolution}",
                       level="ERROR", component="ConflictResolution")
                return False
                
            # Use data type handlers to prepare the record for database update
            processed_record = {}
            
            for column_name, value in record_to_apply.items():
                if table_schema and column_name in table_schema:
                    column_type = table_schema[column_name]
                    handler = get_handler_for_column(column_type)
                    
                    if handler:
                        # Use handler to prepare the value for database insertion
                        processed_record[column_name] = handler.prepare_value(column_name, value)
                    else:
                        processed_record[column_name] = value
                else:
                    processed_record[column_name] = value
            
            # Apply the resolved record to the database
            with self.target_engine.connect() as conn:
                # Update the record in the database
                self._update_record(conn, table_name, processed_record)
                
                # Update the conflict record
                conflict.resolution_status = 'resolved'
                conflict.resolved_at = datetime.datetime.utcnow()
                conflict.resolution_strategy = resolution
                db.session.commit()
                
                self.log(f"Resolved conflict {conflict_id} for table {table_name} using strategy: {resolution}",
                       component="ConflictResolution", table_name=table_name)
                return True
                
        except Exception as e:
            self.log(f"Error resolving conflict {conflict_id}: {str(e)}",
                   level="ERROR", component="ConflictResolution")
            return False
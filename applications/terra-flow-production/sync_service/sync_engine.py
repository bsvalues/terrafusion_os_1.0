"""
Core Sync Engine for the Data Hub Sync Service.

This module contains the main classes and functions for extracting data from source systems,
transforming it according to configuration, and loading it into target systems.
"""
import os
import uuid
import datetime
import logging
import pyodbc
from typing import Dict, List, Any, Union, Optional, Tuple

import sqlalchemy as sa
from sqlalchemy.engine import Engine, Connection
from sqlalchemy.sql import text
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session

from app import db
from sync_service.models import (
    SyncJob, SyncLog, TableConfiguration, FieldConfiguration, 
    FieldDefaultValue, PrimaryKeyColumn, DataChangeMap,
    ParcelMap, UpSyncDataChange, GlobalSetting
)
from sync_service.config import (
    PROD_CLONE_DB_URI, TRAINING_DB_URI, CONFIG_DB_URI,
    BATCH_SIZE, MAX_RETRIES, ERROR_WAIT_SECONDS,
    SQL_SERVER_CONNECTION_STRING
)

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class SyncEngine:
    """Main engine for synchronization operations."""
    
    def __init__(self, job_id: str = None, user_id: int = None):
        """Initialize the sync engine.
        
        Args:
            job_id: Optional job ID for tracking. If None, a new UUID will be generated.
            user_id: Optional user ID who initiated the sync.
        """
        self.job_id = job_id or str(uuid.uuid4())
        self.user_id = user_id
        self.source_engine = None
        self.target_engine = None
        self.job = None
        self._initialize_job()
        self._connect_databases()
        
    def _initialize_job(self):
        """Initialize or retrieve the sync job record."""
        self.job = SyncJob.query.filter_by(job_id=self.job_id).first()
        
        if not self.job:
            self.job = SyncJob(
                job_id=self.job_id,
                name=f"Sync job {self.job_id}",
                status='pending',
                start_time=None,
                end_time=None,
                total_records=0,
                processed_records=0,
                error_records=0,
                error_details={},
                job_type='incremental',
                source_db=PROD_CLONE_DB_URI.split('@')[-1] if PROD_CLONE_DB_URI else None,
                target_db=TRAINING_DB_URI.split('@')[-1] if TRAINING_DB_URI else None,
                initiated_by=self.user_id
            )
            db.session.add(self.job)
            db.session.commit()
            self.log("Job initialized", level="INFO")
    
    def _connect_databases(self):
        """Establish connections to source and target databases."""
        try:
            if PROD_CLONE_DB_URI:
                self.source_engine = sa.create_engine(PROD_CLONE_DB_URI)
                self.log(f"Connected to source database: {self.job.source_db}", level="INFO")
            else:
                self.log("Source database URI not configured", level="ERROR")
                raise ValueError("Source database URI not configured")
                
            if TRAINING_DB_URI:
                self.target_engine = sa.create_engine(TRAINING_DB_URI)
                self.log(f"Connected to target database: {self.job.target_db}", level="INFO")
            else:
                self.log("Target database URI not configured", level="ERROR")
                raise ValueError("Target database URI not configured")
        
        except Exception as e:
            self.log(f"Error connecting to databases: {str(e)}", level="ERROR")
            self.job.status = 'failed'
            self.job.error_details = {'error': str(e), 'step': 'connection'}
            db.session.commit()
            raise
    
    def log(self, message: str, level: str = "INFO", component: str = None, 
            table_name: str = None, record_count: int = None, duration_ms: int = None):
        """Log a message to the sync log."""
        log_entry = SyncLog(
            job_id=self.job_id,
            level=level.upper(),
            message=message,
            component=component,
            table_name=table_name,
            record_count=record_count,
            duration_ms=duration_ms
        )
        db.session.add(log_entry)
        db.session.commit()
        
        # Also log to standard logger
        log_method = getattr(logger, level.lower(), logger.info)
        log_method(f"[{self.job_id}] {message}")
    
    def start_sync(self):
        """Start the synchronization process."""
        if not self.source_engine or not self.target_engine:
            self.log("Databases not connected. Cannot start sync.", level="ERROR")
            return False
        
        try:
            # Update job status
            self.job.status = 'running'
            self.job.start_time = datetime.datetime.utcnow()
            db.session.commit()
            
            self.log("Starting sync process", level="INFO", component="Main")
            
            # Get tables to synchronize
            tables = self._get_tables_to_sync()
            self.job.total_records = len(tables)
            db.session.commit()
            
            # Process each table
            for table in tables:
                self._sync_table(table)
                self.job.processed_records += 1
                db.session.commit()
            
            # Update global settings
            self._update_global_settings()
            
            # Complete the job
            self.job.status = 'completed'
            self.job.end_time = datetime.datetime.utcnow()
            db.session.commit()
            
            self.log("Sync process completed successfully", level="INFO", component="Main")
            return True
            
        except Exception as e:
            self.log(f"Error in sync process: {str(e)}", level="ERROR", component="Main")
            self.job.status = 'failed'
            self.job.end_time = datetime.datetime.utcnow()
            self.job.error_details = {
                'error': str(e),
                'step': 'sync',
                'table': getattr(locals().get('table', {}), 'name', None)
            }
            db.session.commit()
            return False
    
    def _get_tables_to_sync(self) -> List[TableConfiguration]:
        """Get the list of tables to synchronize based on configuration."""
        tables = TableConfiguration.query.order_by(TableConfiguration.order).all()
        self.log(f"Found {len(tables)} tables to synchronize", level="INFO", component="Extract")
        return tables
    
    def _sync_table(self, table: TableConfiguration):
        """Synchronize a single table."""
        start_time = datetime.datetime.utcnow()
        self.log(f"Starting sync for table: {table.name}", level="INFO", component="Extract", table_name=table.name)
        
        try:
            # Get primary key columns
            pk_columns = [pk.name for pk in table.primary_key_columns.order_by(PrimaryKeyColumn.order)]
            if not pk_columns:
                self.log(f"No primary key columns defined for table {table.name}", level="WARNING", component="Extract", table_name=table.name)
                pk_columns = ['id']  # Default to 'id' if no PK defined
            
            # Get field configurations
            fields = table.field_configurations.all()
            field_names = [field.name for field in fields]
            
            # Get field default values
            default_values = {fd.column_name: fd.default_value for fd in table.field_default_values.all()}
            
            # Determine last sync time
            last_sync = GlobalSetting.query.first()
            last_sync_time = last_sync.last_sync_time if last_sync else None
            
            # Extract data
            source_data = self._extract_data(table.name, pk_columns, field_names, last_sync_time)
            
            # Transform data
            transformed_data = self._transform_data(table.name, source_data, default_values)
            
            # Load data
            self._load_data(table.name, transformed_data, pk_columns)
            
            # Update table sync status
            table.current_page = table.total_pages
            db.session.commit()
            
            end_time = datetime.datetime.utcnow()
            duration = (end_time - start_time).total_seconds() * 1000  # milliseconds
            
            self.log(
                f"Completed sync for table {table.name}: {len(source_data)} records processed",
                level="INFO",
                component="Load",
                table_name=table.name,
                record_count=len(source_data),
                duration_ms=int(duration)
            )
            
        except Exception as e:
            self.log(f"Error syncing table {table.name}: {str(e)}", level="ERROR", component="Extract", table_name=table.name)
            self.job.error_records += 1
            if not self.job.error_details.get('tables'):
                self.job.error_details['tables'] = {}
            self.job.error_details['tables'][table.name] = str(e)
            db.session.commit()
            raise
    
    def _extract_data(self, table_name: str, pk_columns: List[str], field_names: List[str], 
                     last_sync_time: datetime.datetime = None) -> List[Dict[str, Any]]:
        """Extract data from the source database."""
        self.log(f"Extracting data from {table_name}", level="INFO", component="Extract", table_name=table_name)
        
        try:
            # Connect to source database
            with self.source_engine.connect() as conn:
                # Build query
                query = self._build_extract_query(table_name, pk_columns, field_names, last_sync_time)
                
                # Execute query
                result = conn.execute(text(query))
                
                # Fetch data
                data = [dict(row) for row in result]
                
                self.log(f"Extracted {len(data)} records from {table_name}", level="INFO", component="Extract", table_name=table_name, record_count=len(data))
                return data
                
        except Exception as e:
            self.log(f"Error extracting data from {table_name}: {str(e)}", level="ERROR", component="Extract", table_name=table_name)
            raise
    
    def _build_extract_query(self, table_name: str, pk_columns: List[str], field_names: List[str], 
                            last_sync_time: datetime.datetime = None) -> str:
        """Build the SQL query for extracting data."""
        # If field names is empty, select all columns
        fields_clause = ", ".join(field_names) if field_names else "*"
        
        # Basic query
        query = f"SELECT {fields_clause} FROM {table_name}"
        
        # Add filter for incremental sync
        # This is a simplified example - in a real system you'd need a more robust 
        # change detection mechanism based on your database capabilities
        if last_sync_time and 'updated_at' in field_names:
            query += f" WHERE updated_at >= '{last_sync_time.isoformat()}'"
        
        # Add order by
        pk_clause = ", ".join(pk_columns)
        query += f" ORDER BY {pk_clause}"
        
        # Add limit for batching
        query += f" LIMIT {BATCH_SIZE}"
        
        return query
    
    def _transform_data(self, table_name: str, source_data: List[Dict[str, Any]], 
                       default_values: Dict[str, str]) -> List[Dict[str, Any]]:
        """Transform extracted data according to rules."""
        self.log(f"Transforming {len(source_data)} records for {table_name}", 
                level="INFO", component="Transform", table_name=table_name, record_count=len(source_data))
        
        transformed_data = []
        
        for record in source_data:
            # Apply default values for missing fields
            for field, default in default_values.items():
                if field not in record or record[field] is None:
                    try:
                        # Try to convert default to the appropriate type
                        # This is a simplified version - in reality you'd use a schema to determine types
                        record[field] = eval(default) if default.lower() in ('true', 'false', 'none') or default.isdigit() else default
                    except:
                        record[field] = default
            
            transformed_data.append(record)
        
        return transformed_data
    
    def _load_data(self, table_name: str, data: List[Dict[str, Any]], pk_columns: List[str]):
        """Load transformed data into the target database."""
        self.log(f"Loading {len(data)} records into {table_name}", 
                level="INFO", component="Load", table_name=table_name, record_count=len(data))
        
        try:
            if not data:
                self.log(f"No data to load for {table_name}", level="INFO", component="Load", table_name=table_name)
                return
            
            # Connect to target database
            with self.target_engine.connect() as conn:
                # Begin transaction
                trans = conn.begin()
                
                try:
                    for record in data:
                        # Check if record exists
                        pk_conditions = " AND ".join([f"{pk} = :{pk}" for pk in pk_columns])
                        check_query = f"SELECT 1 FROM {table_name} WHERE {pk_conditions}"
                        exists = conn.execute(text(check_query), record).scalar() is not None
                        
                        if exists:
                            # Update existing record
                            set_clause = ", ".join([f"{k} = :{k}" for k in record.keys() if k not in pk_columns])
                            update_query = f"UPDATE {table_name} SET {set_clause} WHERE {pk_conditions}"
                            conn.execute(text(update_query), record)
                        else:
                            # Insert new record
                            columns = ", ".join(record.keys())
                            values = ", ".join([f":{k}" for k in record.keys()])
                            insert_query = f"INSERT INTO {table_name} ({columns}) VALUES ({values})"
                            conn.execute(text(insert_query), record)
                    
                    # Commit transaction
                    trans.commit()
                    
                except Exception as e:
                    # Roll back transaction
                    trans.rollback()
                    self.log(f"Error loading data into {table_name}: {str(e)}", level="ERROR", component="Load", table_name=table_name)
                    raise
                
        except Exception as e:
            self.log(f"Error connecting to target database for table {table_name}: {str(e)}", level="ERROR", component="Load", table_name=table_name)
            raise
    
    def _update_global_settings(self):
        """Update global settings after sync."""
        global_setting = GlobalSetting.query.first()
        
        if not global_setting:
            global_setting = GlobalSetting(
                cama_cloud_state="active",
                last_sync_job_id=self.job_id,
                last_sync_time=datetime.datetime.utcnow(),
                last_down_sync_time=datetime.datetime.utcnow(),
                total_tables=TableConfiguration.query.count(),
                current_table=TableConfiguration.query.count(),
                is_finalized=True
            )
            db.session.add(global_setting)
        else:
            global_setting.last_sync_job_id = self.job_id
            global_setting.last_sync_time = datetime.datetime.utcnow()
            global_setting.last_down_sync_time = datetime.datetime.utcnow()
            global_setting.current_table = TableConfiguration.query.count()
            global_setting.total_tables = TableConfiguration.query.count()
            global_setting.is_finalized = True
        
        db.session.commit()
        self.log("Updated global settings", level="INFO", component="Admin")


class PropertyExportEngine:
    """
    Engine for executing the existing ExportPropertyAccess stored procedure.
    
    This class provides a way to execute the True Automation ExportPropertyAccess
    stored procedure as-is, without any modifications, and integrate it with the
    Data Hub API Gateway.
    """
    
    def __init__(self, job_id: str = None, user_id: int = None, 
                 database_name: str = '', num_years: int = -1, min_bill_years: int = 2):
        """Initialize the property export engine.
        
        Args:
            job_id: Optional job ID for tracking. If None, a new UUID will be generated.
            user_id: Optional user ID who initiated the export.
            database_name: The name of the target database to create or update.
            num_years: Number of years to include in the export (-1 for all).
            min_bill_years: Minimum number of billing years to include.
        """
        self.job_id = job_id or str(uuid.uuid4())
        self.user_id = user_id
        self.database_name = database_name
        self.num_years = num_years
        self.min_bill_years = min_bill_years
        self.job = None
        self._initialize_job()
    
    def _initialize_job(self):
        """Initialize or retrieve the export job record."""
        self.job = SyncJob.query.filter_by(job_id=self.job_id).first()
        
        if not self.job:
            self.job = SyncJob(
                job_id=self.job_id,
                name=f"PropertyAccess Export to {self.database_name or 'default database'}",
                status='pending',
                start_time=None,
                end_time=None,
                total_records=1,  # Just one operation - running the stored procedure
                processed_records=0,
                error_records=0,
                error_details={},
                job_type='property_export',
                source_db='pacs_oltp',
                target_db=self.database_name or 'web_internet_benton_auto',
                initiated_by=self.user_id
            )
            db.session.add(self.job)
            db.session.commit()
            self.log("Property export job initialized", level="INFO")
    
    def log(self, message: str, level: str = "INFO", component: str = None, 
            table_name: str = None, record_count: int = None, duration_ms: int = None):
        """Log a message to the sync log."""
        log_entry = SyncLog(
            job_id=self.job_id,
            level=level.upper(),
            message=message,
            component=component or "PropertyExport",
            table_name=table_name,
            record_count=record_count,
            duration_ms=duration_ms
        )
        db.session.add(log_entry)
        db.session.commit()
        
        # Also log to standard logger
        log_method = getattr(logger, level.lower(), logger.info)
        log_method(f"[{self.job_id}] {message}")
    
    def start_export(self):
        """Start the property export process."""
        if not SQL_SERVER_CONNECTION_STRING:
            self.log("SQL Server connection string not configured. Cannot start export.", level="ERROR")
            self.job.status = 'failed'
            self.job.error_details = {'error': 'SQL Server connection string not configured', 'step': 'initialization'}
            db.session.commit()
            return False
        
        try:
            # Update job status
            self.job.status = 'running'
            self.job.start_time = datetime.datetime.utcnow()
            db.session.commit()
            
            self.log("Starting property export process", level="INFO")
            
            # Execute the ExportPropertyAccess stored procedure
            start_time = datetime.datetime.utcnow()
            success, result = self._execute_stored_procedure()
            end_time = datetime.datetime.utcnow()
            duration = (end_time - start_time).total_seconds() * 1000  # milliseconds
            
            if success:
                self.job.processed_records = 1
                self.job.status = 'completed'
                self.log(
                    f"Completed property export: {result}",
                    level="INFO",
                    duration_ms=int(duration)
                )
            else:
                self.job.error_records = 1
                self.job.status = 'failed'
                self.job.error_details = {'error': result, 'step': 'stored_procedure_execution'}
                self.log(
                    f"Failed property export: {result}",
                    level="ERROR",
                    duration_ms=int(duration)
                )
            
            self.job.end_time = datetime.datetime.utcnow()
            db.session.commit()
            
            return success
        
        except Exception as e:
            self.log(f"Error in property export process: {str(e)}", level="ERROR")
            self.job.status = 'failed'
            self.job.end_time = datetime.datetime.utcnow()
            self.job.error_details = {
                'error': str(e),
                'step': 'export'
            }
            db.session.commit()
            return False
    
    def _execute_stored_procedure(self) -> Tuple[bool, str]:
        """Execute the ExportPropertyAccess stored procedure.
        
        Returns:
            A tuple containing:
                - A boolean indicating success or failure
                - A result message or error message
        """
        self.log("Connecting to SQL Server database", level="INFO")
        
        try:
            # Connect to the SQL Server database
            conn = pyodbc.connect(SQL_SERVER_CONNECTION_STRING)
            cursor = conn.cursor()
            
            # Log the parameters we're using
            self.log(
                f"Executing ExportPropertyAccess with parameters: database_name='{self.database_name}', "
                f"num_years={self.num_years}, min_bill_years={self.min_bill_years}",
                level="INFO"
            )
            
            # Execute the stored procedure
            sql = """
            EXEC [dbo].[ExportPropertyAccess]
                @input_database_name = ?,
                @input_num_years = ?,
                @input_min_bill_years = ?
            """
            
            cursor.execute(sql, (self.database_name, self.num_years, self.min_bill_years))
            
            # Get the results (if any)
            rows = cursor.fetchall()
            result_message = f"ExportPropertyAccess executed successfully. Created/updated database '{self.database_name or 'default'}'"
            if rows:
                result_details = "\n".join([str(row) for row in rows])
                result_message += f" with results: {result_details}"
            
            conn.commit()
            conn.close()
            
            self.log("SQL Server connection closed", level="INFO")
            return True, result_message
            
        except Exception as e:
            self.log(f"Error executing stored procedure: {str(e)}", level="ERROR")
            return False, str(e)


class DataSynchronizer:
    """Utility class for performing different types of data synchronization operations."""
    
    @staticmethod
    def start_full_sync(user_id: int = None) -> str:
        """Start a full sync job.
        
        Args:
            user_id: Optional user ID who initiated the sync.
            
        Returns:
            The job ID of the created sync job.
        """
        job_id = str(uuid.uuid4())
        engine = SyncEngine(job_id, user_id)
        engine.job.job_type = 'full'
        db.session.commit()
        
        # Start in a separate thread or process
        # In a real application, you would use Celery, background workers, etc.
        import threading
        thread = threading.Thread(target=engine.start_sync)
        thread.daemon = True
        thread.start()
        
        return job_id
    
    @staticmethod
    def start_incremental_sync(user_id: int = None) -> str:
        """Start an incremental sync job.
        
        Args:
            user_id: Optional user ID who initiated the sync.
            
        Returns:
            The job ID of the created sync job.
        """
        job_id = str(uuid.uuid4())
        engine = SyncEngine(job_id, user_id)
        engine.job.job_type = 'incremental'
        db.session.commit()
        
        # Start in a separate thread or process
        import threading
        thread = threading.Thread(target=engine.start_sync)
        thread.daemon = True
        thread.start()
        
        return job_id
        
    @staticmethod
    def start_property_export(user_id: int = None, database_name: str = '', num_years: int = -1, min_bill_years: int = 2) -> str:
        """Start a property export job using the ExportPropertyAccess stored procedure.
        
        Args:
            user_id: Optional user ID who initiated the export.
            database_name: The name of the target database to create or update.
            num_years: Number of years to include in the export.
            min_bill_years: Minimum number of billing years to include.
            
        Returns:
            The job ID of the created export job.
        """
        job_id = str(uuid.uuid4())
        
        # Create a specialized export engine
        engine = PropertyExportEngine(job_id, user_id, database_name, num_years, min_bill_years)
        engine.job.job_type = 'property_export'
        engine.job.name = f"Property Export to {database_name or 'default'}"
        db.session.commit()
        
        # Start in a separate thread or process
        import threading
        thread = threading.Thread(target=engine.start_export)
        thread.daemon = True
        thread.start()
        
        return job_id
    
    @staticmethod
    def get_job_status(job_id: str) -> Dict[str, Any]:
        """Get the status of a sync job.
        
        Args:
            job_id: The ID of the job to check.
            
        Returns:
            A dictionary with the job status and details.
        """
        job = SyncJob.query.filter_by(job_id=job_id).first()
        
        if not job:
            return {'error': 'Job not found'}
        
        return {
            'job_id': job.job_id,
            'name': job.name,
            'status': job.status,
            'start_time': job.start_time.isoformat() if job.start_time else None,
            'end_time': job.end_time.isoformat() if job.end_time else None,
            'progress': f"{job.processed_records}/{job.total_records}" if job.total_records > 0 else "0/0",
            'progress_percent': round((job.processed_records / job.total_records) * 100, 2) if job.total_records > 0 else 0,
            'error_count': job.error_records,
            'has_errors': job.error_records > 0,
        }
    
    @staticmethod
    def get_job_logs(job_id: str, level: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get logs for a sync job.
        
        Args:
            job_id: The ID of the job.
            level: Optional filter for log level.
            limit: Maximum number of logs to return.
            
        Returns:
            A list of log entries.
        """
        query = SyncLog.query.filter_by(job_id=job_id)
        
        if level:
            query = query.filter_by(level=level.upper())
        
        logs = query.order_by(SyncLog.created_at.desc()).limit(limit).all()
        
        return [{
            'timestamp': log.created_at.isoformat(),
            'level': log.level,
            'message': log.message,
            'component': log.component,
            'table_name': log.table_name,
            'record_count': log.record_count,
            'duration_ms': log.duration_ms
        } for log in logs]
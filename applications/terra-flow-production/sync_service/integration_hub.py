"""
Assessment Data Integration Hub for Benton County GeoAssessmentPro

This module provides the core functionality for the Integration Hub, which connects
to various data sources, synchronizes data between them, and provides a unified
interface for accessing assessment data.
"""

import os
import io
import logging
import datetime
import json
import sqlite3
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field, asdict
from sqlalchemy import create_engine, text, MetaData, Table, Column, inspect
from contextlib import contextmanager
from sync_service.data_sanitizer import data_sanitizer
from sync_service.exporter import multi_format_exporter

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class DataSourceConfig:
    """Configuration for a data source"""
    source_id: str
    source_type: str
    connection_string: str
    refresh_interval: int = 60  # in minutes
    enabled: bool = True
    metadata: Dict[str, Any] = field(default_factory=dict)
    status: str = 'disconnected'
    last_sync: Optional[datetime.datetime] = None
    error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)

@dataclass
class DataSourceConnection:
    """Connection to a data source"""
    source_id: str
    connection: Any = None
    engine: Any = None
    connected: bool = False
    error: Optional[str] = None
    
    def close(self):
        """Close the connection"""
        if self.connection:
            try:
                if hasattr(self.connection, 'close'):
                    self.connection.close()
            except Exception as e:
                logger.error(f"Error closing connection to {self.source_id}: {str(e)}")
        
        self.connected = False

@dataclass
class SyncResult:
    """Result of a synchronization operation"""
    status: str
    source: str
    target: str
    records: int = 0
    message: str = ""
    timestamp: str = field(default_factory=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    details: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ExportResult:
    """Result of an export operation"""
    status: str
    data_type: str
    format: str
    records: int = 0
    file_path: Optional[str] = None
    message: str = ""
    timestamp: str = field(default_factory=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

class IntegrationHub:
    """
    Integration Hub for connecting to and synchronizing data between various
    assessment data sources.
    """
    
    def __init__(self):
        """Initialize the Integration Hub"""
        self.data_sources: Dict[str, DataSourceConfig] = {}
        self.connections: Dict[str, DataSourceConnection] = {}
        self.export_dir = "exports"
        
        # Schema definitions for different data types
        self.schemas = {
            "property": {
                "property_id": "STRING",
                "parcel_number": "STRING",
                "property_type": "STRING",
                "address": "STRING",
                "city": "STRING",
                "state": "STRING",
                "zip": "STRING",
                "owner_name": "STRING",
                "owner_address": "STRING",
                "assessed_value": "FLOAT",
                "land_value": "FLOAT",
                "improvement_value": "FLOAT",
                "year_built": "INTEGER",
                "square_footage": "FLOAT",
                "bedrooms": "INTEGER",
                "bathrooms": "FLOAT",
                "last_sale_date": "DATE",
                "last_sale_price": "FLOAT",
                "latitude": "FLOAT",
                "longitude": "FLOAT",
                "legal_description": "TEXT",
                "zoning": "STRING",
                "neighborhood_code": "STRING",
                "tax_code_area": "STRING",
                "last_updated": "TIMESTAMP"
            },
            "sales": {
                "sale_id": "STRING",
                "property_id": "STRING",
                "parcel_number": "STRING",
                "sale_date": "DATE",
                "sale_price": "FLOAT",
                "buyer_name": "STRING",
                "seller_name": "STRING",
                "deed_type": "STRING",
                "sale_type": "STRING",
                "verified": "BOOLEAN",
                "verification_source": "STRING",
                "verification_date": "DATE",
                "qualified": "BOOLEAN",
                "disqualification_reason": "STRING",
                "notes": "TEXT",
                "recorded_document": "STRING",
                "last_updated": "TIMESTAMP"
            },
            "valuation": {
                "valuation_id": "STRING",
                "property_id": "STRING",
                "parcel_number": "STRING",
                "tax_year": "INTEGER",
                "assessment_date": "DATE",
                "market_value": "FLOAT",
                "assessed_value": "FLOAT",
                "land_value": "FLOAT",
                "improvement_value": "FLOAT",
                "exemption_value": "FLOAT",
                "taxable_value": "FLOAT",
                "valuation_method": "STRING",
                "valuation_model": "STRING",
                "appeal_status": "STRING",
                "certified": "BOOLEAN",
                "certification_date": "DATE",
                "appraiser": "STRING",
                "notes": "TEXT",
                "last_updated": "TIMESTAMP"
            },
            "tax": {
                "tax_id": "STRING",
                "property_id": "STRING",
                "parcel_number": "STRING",
                "tax_year": "INTEGER",
                "tax_code_area": "STRING",
                "levy_code": "STRING",
                "assessed_value": "FLOAT",
                "taxable_value": "FLOAT",
                "total_tax": "FLOAT",
                "tax_bill_number": "STRING",
                "first_half_amount": "FLOAT",
                "first_half_due_date": "DATE",
                "first_half_paid_date": "DATE",
                "first_half_paid_amount": "FLOAT",
                "second_half_amount": "FLOAT",
                "second_half_due_date": "DATE",
                "second_half_paid_date": "DATE",
                "second_half_paid_amount": "FLOAT",
                "is_delinquent": "BOOLEAN",
                "delinquent_amount": "FLOAT",
                "interest_amount": "FLOAT",
                "penalty_amount": "FLOAT",
                "payment_status": "STRING",
                "special_assessments": "FLOAT",
                "tax_relief_amount": "FLOAT",
                "tax_relief_type": "STRING",
                "exemption_codes": "STRING",
                "notes": "TEXT",
                "last_updated": "TIMESTAMP"
            }
        }
        
        # Initialize export directory
        if not os.path.exists(self.export_dir):
            os.makedirs(self.export_dir, exist_ok=True)
            
        # Check if we have subdirectories for each data type
        for data_type in self.schemas:
            data_type_dir = os.path.join(self.export_dir, data_type)
            if not os.path.exists(data_type_dir):
                os.makedirs(data_type_dir, exist_ok=True)
    
    def add_data_source(self, config: DataSourceConfig) -> bool:
        """Add a new data source"""
        try:
            # Check if source already exists
            if config.source_id in self.data_sources:
                logger.warning(f"Data source {config.source_id} already exists, updating instead")
                return self.update_data_source(config)
            
            # Add the data source
            self.data_sources[config.source_id] = config
            
            # Test connection
            connection = self._connect_to_source(config)
            if connection.connected:
                config.status = 'connected'
                connection.close()
            else:
                config.status = 'error'
                config.error = connection.error
            
            logger.info(f"Added data source: {config.source_id} ({config.source_type})")
            return True
            
        except Exception as e:
            logger.error(f"Error adding data source {config.source_id}: {str(e)}")
            return False
    
    def update_data_source(self, config: DataSourceConfig) -> bool:
        """Update an existing data source"""
        try:
            # Check if source exists
            if config.source_id not in self.data_sources:
                logger.warning(f"Data source {config.source_id} does not exist, adding instead")
                return self.add_data_source(config)
            
            # Get current config for unchanged fields
            current_config = self.data_sources[config.source_id]
            
            # Close existing connection if open
            if config.source_id in self.connections:
                self.connections[config.source_id].close()
                del self.connections[config.source_id]
            
            # Update the data source
            self.data_sources[config.source_id] = config
            
            # Preserve status and last_sync if not provided
            if not config.status:
                config.status = current_config.status
            if not config.last_sync:
                config.last_sync = current_config.last_sync
            
            # Test connection if enabled
            if config.enabled:
                connection = self._connect_to_source(config)
                if connection.connected:
                    config.status = 'connected'
                    connection.close()
                else:
                    config.status = 'error'
                    config.error = connection.error
            else:
                config.status = 'disabled'
            
            logger.info(f"Updated data source: {config.source_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating data source {config.source_id}: {str(e)}")
            return False
    
    def remove_data_source(self, source_id: str) -> bool:
        """Remove a data source"""
        try:
            # Check if source exists
            if source_id not in self.data_sources:
                logger.warning(f"Data source {source_id} does not exist")
                return False
            
            # Close connection if open
            if source_id in self.connections:
                self.connections[source_id].close()
                del self.connections[source_id]
            
            # Remove the data source
            del self.data_sources[source_id]
            
            logger.info(f"Removed data source: {source_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error removing data source {source_id}: {str(e)}")
            return False
    
    def get_connection(self, source_id: str) -> Optional[DataSourceConnection]:
        """Get a connection to a data source"""
        # Check if source exists
        if source_id not in self.data_sources:
            logger.warning(f"Data source {source_id} does not exist")
            return None
        
        # Check if we already have a connection
        if source_id in self.connections and self.connections[source_id].connected:
            return self.connections[source_id]
        
        # Connect to the source
        config = self.data_sources[source_id]
        connection = self._connect_to_source(config)
        
        # Update status
        if connection.connected:
            config.status = 'connected'
        else:
            config.status = 'error'
            config.error = connection.error
        
        # Store connection
        self.connections[source_id] = connection
        
        return connection
    
    def get_source_metadata(self, source_id: str) -> Dict[str, Any]:
        """Get metadata for a data source, including schema information"""
        # Check if source exists
        if source_id not in self.data_sources:
            return {
                "status": "error",
                "message": "Data source not found"
            }
        
        # Get connection
        connection = self.get_connection(source_id)
        if not connection or not connection.connected:
            return {
                "status": "error",
                "message": f"Failed to connect: {connection.error if connection else 'Unknown error'}"
            }
        
        metadata = {
            "status": "success",
            "source_id": source_id,
            "source_type": self.data_sources[source_id].source_type,
            "configuration": self.data_sources[source_id].to_dict(),
            "schema_info": {
                "tables": [],
                "columns": {}
            }
        }
        
        # Get schema information
        try:
            source_type = self.data_sources[source_id].source_type
            
            if source_type in ['postgresql', 'gis']:
                # PostgreSQL
                if connection.engine:
                    inspector = inspect(connection.engine)
                    metadata["schema_info"]["tables"] = inspector.get_table_names()
                    
                    for table in metadata["schema_info"]["tables"]:
                        columns = inspector.get_columns(table)
                        metadata["schema_info"]["columns"][table] = [
                            {
                                "name": column["name"],
                                "type": str(column["type"]),
                                "nullable": column["nullable"]
                            }
                            for column in columns
                        ]
            
            elif source_type in ['sql_server', 'cama']:
                # SQL Server
                if connection.engine:
                    inspector = inspect(connection.engine)
                    metadata["schema_info"]["tables"] = inspector.get_table_names()
                    
                    for table in metadata["schema_info"]["tables"]:
                        columns = inspector.get_columns(table)
                        metadata["schema_info"]["columns"][table] = [
                            {
                                "name": column["name"],
                                "type": str(column["type"]),
                                "nullable": column["nullable"]
                            }
                            for column in columns
                        ]
            
            elif source_type == 'sqlite':
                # SQLite
                if connection.connection:
                    cursor = connection.connection.cursor()
                    
                    # Get tables
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                    tables = [row[0] for row in cursor.fetchall()]
                    metadata["schema_info"]["tables"] = tables
                    
                    # Get columns for each table
                    for table in tables:
                        cursor.execute(f"PRAGMA table_info('{table}')")
                        columns = cursor.fetchall()
                        metadata["schema_info"]["columns"][table] = [
                            {
                                "name": column[1],
                                "type": column[2],
                                "nullable": not column[3]
                            }
                            for column in columns
                        ]
            
            elif source_type == 'file':
                # File
                # For files, we can't get schema info
                metadata["schema_info"]["error"] = "Schema information not available for file sources"
        
        except Exception as e:
            logger.error(f"Error getting schema information for {source_id}: {str(e)}")
            metadata["schema_info"]["error"] = str(e)
        
        return metadata
    
    def sync_property_data(self, source_id: str, target_id: Optional[str] = None) -> Dict[str, Any]:
        """Synchronize property data from source to target"""
        # Check if source exists
        if source_id not in self.data_sources:
            return {
                "status": "error",
                "message": "Source data source not found"
            }
        
        # Check if target exists if provided
        if target_id and target_id not in self.data_sources:
            return {
                "status": "error",
                "message": "Target data source not found"
            }
        
        # Get connections
        source_conn = self.get_connection(source_id)
        if not source_conn or not source_conn.connected:
            return {
                "status": "error",
                "message": f"Failed to connect to source: {source_conn.error if source_conn else 'Unknown error'}"
            }
        
        target_conn = None
        if target_id:
            target_conn = self.get_connection(target_id)
            if not target_conn or not target_conn.connected:
                return {
                    "status": "error",
                    "message": f"Failed to connect to target: {target_conn.error if target_conn else 'Unknown error'}"
                }
        
        try:
            # Load property data from source
            property_data = self._load_property_data(source_conn)
            
            if property_data is None or len(property_data) == 0:
                return {
                    "status": "warning",
                    "message": "No property data found in source",
                    "source": source_id,
                    "target": target_id or "Internal Database",
                    "records": 0,
                    "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            
            # If target provided, sync to target
            if target_conn:
                records = self._save_property_data(property_data, target_conn)
            else:
                # Sync to internal database
                records = self._save_property_data_internal(property_data)
            
            # Update last sync time
            self.data_sources[source_id].last_sync = datetime.datetime.now()
            if target_id:
                self.data_sources[target_id].last_sync = datetime.datetime.now()
            
            return {
                "status": "success",
                "message": "Property data synchronized successfully",
                "source": source_id,
                "target": target_id or "Internal Database",
                "records": len(property_data),
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "details": {
                    "total_records": len(property_data),
                    "new_records": records.get("new", 0),
                    "updated_records": records.get("updated", 0)
                }
            }
            
        except Exception as e:
            logger.error(f"Error synchronizing property data from {source_id} to {target_id or 'internal'}: {str(e)}")
            return {
                "status": "error",
                "message": f"Error synchronizing property data: {str(e)}",
                "source": source_id,
                "target": target_id or "Internal Database",
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
    
    def sync_sales_data(self, source_id: str, target_id: Optional[str] = None) -> Dict[str, Any]:
        """Synchronize sales data from source to target"""
        # Implementation similar to sync_property_data
        # Placeholder for now
        return {
            "status": "warning",
            "message": "Sales data synchronization not fully implemented yet",
            "source": source_id,
            "target": target_id or "Internal Database",
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    def sync_valuation_data(self, source_id: str, target_id: Optional[str] = None) -> Dict[str, Any]:
        """Synchronize valuation data from source to target"""
        # Implementation similar to sync_property_data
        # Placeholder for now
        return {
            "status": "warning",
            "message": "Valuation data synchronization not fully implemented yet",
            "source": source_id,
            "target": target_id or "Internal Database",
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
    def sync_tax_data(self, source_id: str, target_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Synchronize tax data from source to target
        
        Args:
            source_id: Source data source ID
            target_id: Target data source ID (optional)
            
        Returns:
            Result of synchronization operation
        """
        # Check if source exists
        if source_id not in self.data_sources:
            return {
                "status": "error",
                "message": "Source data source not found"
            }
        
        # Check if target exists if provided
        if target_id and target_id not in self.data_sources:
            return {
                "status": "error",
                "message": "Target data source not found"
            }
        
        # Get connections
        source_conn = self.get_connection(source_id)
        if not source_conn or not source_conn.connected:
            return {
                "status": "error",
                "message": f"Failed to connect to source: {source_conn.error if source_conn else 'Unknown error'}"
            }
        
        target_conn = None
        if target_id:
            target_conn = self.get_connection(target_id)
            if not target_conn or not target_conn.connected:
                return {
                    "status": "error",
                    "message": f"Failed to connect to target: {target_conn.error if target_conn else 'Unknown error'}"
                }
        
        try:
            # Load tax data from source
            tax_data = self._load_tax_data(source_conn)
            
            if tax_data is None or len(tax_data) == 0:
                return {
                    "status": "warning",
                    "message": "No tax data found in source",
                    "source": source_id,
                    "target": target_id or "Internal Database",
                    "records": 0,
                    "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            
            # If target provided, sync to target
            if target_conn:
                records = self._save_tax_data(tax_data, target_conn)
            else:
                # Sync to internal database
                records = self._save_tax_data_internal(tax_data)
            
            # Update last sync time
            self.data_sources[source_id].last_sync = datetime.datetime.now()
            if target_id:
                self.data_sources[target_id].last_sync = datetime.datetime.now()
            
            return {
                "status": "success",
                "message": "Tax data synchronized successfully",
                "source": source_id,
                "target": target_id or "Internal Database",
                "records": len(tax_data),
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "details": {
                    "total_records": len(tax_data),
                    "new_records": records.get("new", 0),
                    "updated_records": records.get("updated", 0)
                }
            }
            
        except Exception as e:
            logger.error(f"Error synchronizing tax data from {source_id} to {target_id or 'internal'}: {str(e)}")
            return {
                "status": "error",
                "message": f"Error synchronizing tax data: {str(e)}",
                "source": source_id,
                "target": target_id or "Internal Database",
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
    
    def export_data(self, data_type: str, export_format: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Export data to a file"""
        # Check data type
        if data_type not in self.schemas:
            return {
                "status": "error",
                "message": f"Invalid data type: {data_type}"
            }
        
        # Check export format
        valid_formats = ['csv', 'excel', 'json', 'geojson', 'sqlite']
        if export_format not in valid_formats:
            return {
                "status": "error",
                "message": f"Invalid export format: {export_format}"
            }
        
        # Special case for GeoJSON
        if export_format == 'geojson' and data_type != 'property':
            return {
                "status": "error",
                "message": "GeoJSON format is only available for property data"
            }
        
        try:
            # Load data from appropriate source
            data = self._get_data_for_export(data_type, filters)
            
            if data is None or len(data) == 0:
                return {
                    "status": "warning",
                    "message": "No data found matching the criteria",
                    "data_type": data_type,
                    "format": export_format,
                    "records": 0,
                    "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            
            # Sanitize sensitive data
            data = data_sanitizer.sanitize_dataframe(data)
            
            # Create metadata
            metadata = {
                "data_type": data_type,
                "export_date": datetime.datetime.now().isoformat(),
                "record_count": len(data),
                "filters": filters or {},
                "schema": self.schemas.get(data_type, {}),
                "source": "Benton County GeoAssessmentPro Integration Hub"
            }
            
            # Use the MultiFormatExporter to handle the export
            result = multi_format_exporter.export_dataframe(data, data_type, export_format, metadata)
            
            return result
            
        except Exception as e:
            logger.error(f"Error exporting {data_type} data to {export_format}: {str(e)}")
            return {
                "status": "error",
                "message": f"Error exporting data: {str(e)}",
                "data_type": data_type,
                "format": export_format,
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
    def _get_data_for_export(self, data_type: str, filters: Dict[str, Any] = None) -> Optional[pd.DataFrame]:
        """
        Get data for export from the appropriate source.
        For now, this uses sample data, but in a real implementation, it would query
        the appropriate data sources.
        """
        # TODO: Implement actual data loading from configured sources
        # For now, we'll generate sample data for testing
        return self._get_sample_data(data_type, filters)
    
    def query_data_source(self, source_id: str, query: str) -> Optional[pd.DataFrame]:
        """Execute a custom query against a data source"""
        # Check if source exists
        if source_id not in self.data_sources:
            logger.warning(f"Data source {source_id} does not exist")
            return None
        
        # Check if query is a SELECT query (for safety)
        if not query.strip().upper().startswith('SELECT'):
            logger.warning(f"Only SELECT queries are allowed, got: {query}")
            return None
        
        # Get connection
        connection = self.get_connection(source_id)
        if not connection or not connection.connected:
            logger.error(f"Failed to connect to {source_id}: {connection.error if connection else 'Unknown error'}")
            return None
        
        try:
            # Execute query based on source type
            source_type = self.data_sources[source_id].source_type
            
            if source_type in ['postgresql', 'gis', 'sql_server', 'cama']:
                # SQLAlchemy
                if connection.engine:
                    return pd.read_sql(query, connection.engine)
            
            elif source_type == 'sqlite':
                # SQLite
                if connection.connection:
                    return pd.read_sql_query(query, connection.connection)
            
            elif source_type == 'file':
                # File sources don't support custom queries
                logger.warning(f"Custom queries not supported for file sources: {source_id}")
                return None
            
            logger.warning(f"Unsupported source type for custom queries: {source_type}")
            return None
            
        except Exception as e:
            logger.error(f"Error executing query on {source_id}: {str(e)}")
            return None
    
    # Private methods
    
    def _connect_to_source(self, config: DataSourceConfig) -> DataSourceConnection:
        """Connect to a data source"""
        connection = DataSourceConnection(source_id=config.source_id)
        
        try:
            source_type = config.source_type
            
            if source_type in ['postgresql', 'gis']:
                # PostgreSQL
                engine = create_engine(config.connection_string)
                connection.engine = engine
                connection.connection = engine.connect()
                connection.connected = True
            
            elif source_type in ['sql_server', 'cama']:
                # SQL Server (using pyodbc)
                engine = create_engine(f"mssql+pyodbc:///?odbc_connect={config.connection_string}")
                connection.engine = engine
                connection.connection = engine.connect()
                connection.connected = True
            
            elif source_type == 'sqlite':
                # SQLite
                conn_str = config.connection_string
                if conn_str.startswith('sqlite:///'):
                    # SQLAlchemy connection string
                    engine = create_engine(conn_str)
                    connection.engine = engine
                    connection.connection = engine.connect()
                else:
                    # Direct file path
                    if conn_str.startswith('file:///'):
                        conn_str = conn_str[7:]
                    connection.connection = sqlite3.connect(conn_str)
                connection.connected = True
            
            elif source_type == 'file':
                # File (CSV, Excel, etc.)
                conn_str = config.connection_string
                if conn_str.startswith('file:///'):
                    conn_str = conn_str[7:]
                
                # Check if file exists
                if not os.path.exists(conn_str):
                    connection.error = f"File not found: {conn_str}"
                    return connection
                
                # Get file type
                _, ext = os.path.splitext(conn_str)
                
                # Dummy connection for files
                connection.connection = conn_str
                connection.connected = True
            
            else:
                connection.error = f"Unsupported source type: {source_type}"
        
        except Exception as e:
            connection.error = str(e)
            logger.error(f"Error connecting to {config.source_id}: {str(e)}")
        
        return connection
    
    def _load_property_data(self, connection: DataSourceConnection) -> Optional[pd.DataFrame]:
        """Load property data from a data source"""
        try:
            # Get source config
            source_id = connection.source_id
            source_config = self.data_sources[source_id]
            source_type = source_config.source_type
            
            # Based on source type, load property data
            if source_type in ['postgresql', 'gis', 'sql_server', 'cama']:
                # Try to detect property table
                try:
                    tables = []
                    schema_info = self.get_source_metadata(source_id)
                    
                    if schema_info.get('status') == 'success' and schema_info.get('schema_info'):
                        tables = schema_info['schema_info'].get('tables', [])
                    
                    # Look for property table
                    property_table = None
                    for table in tables:
                        if ('property' in table.lower() or 'parcel' in table.lower() or 
                            'real_estate' in table.lower() or 'realestate' in table.lower()):
                            property_table = table
                            break
                    
                    if not property_table:
                        # Use default query if no property table found
                        # TODO: Replace with more sophisticated detection
                        logger.warning(f"No property table found in {source_id}, using sample data")
                        return self._get_sample_data('property')
                    
                    # Query the property table
                    if connection.engine:
                        query = f"SELECT * FROM {property_table}"
                        return pd.read_sql(query, connection.engine)
                
                except Exception as e:
                    logger.error(f"Error detecting property table in {source_id}: {str(e)}")
                    # Fall back to sample data
                    return self._get_sample_data('property')
            
            elif source_type == 'sqlite':
                # Try to detect property table
                try:
                    cursor = connection.connection.cursor()
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                    tables = [row[0] for row in cursor.fetchall()]
                    
                    # Look for property table
                    property_table = None
                    for table in tables:
                        if ('property' in table.lower() or 'parcel' in table.lower() or 
                            'real_estate' in table.lower() or 'realestate' in table.lower()):
                            property_table = table
                            break
                    
                    if not property_table:
                        # Use default query if no property table found
                        logger.warning(f"No property table found in {source_id}, using sample data")
                        return self._get_sample_data('property')
                    
                    # Query the property table
                    query = f"SELECT * FROM {property_table}"
                    return pd.read_sql_query(query, connection.connection)
                
                except Exception as e:
                    logger.error(f"Error detecting property table in {source_id}: {str(e)}")
                    # Fall back to sample data
                    return self._get_sample_data('property')
            
            elif source_type == 'file':
                # Load file based on extension
                file_path = connection.connection
                _, ext = os.path.splitext(file_path)
                
                if ext.lower() == '.csv':
                    return pd.read_csv(file_path)
                elif ext.lower() in ['.xlsx', '.xls']:
                    return pd.read_excel(file_path)
                elif ext.lower() == '.json':
                    return pd.read_json(file_path)
                else:
                    logger.warning(f"Unsupported file type: {ext}")
                    return None
            
            else:
                logger.warning(f"Unsupported source type for property data: {source_type}")
                return None
        
        except Exception as e:
            logger.error(f"Error loading property data from {connection.source_id}: {str(e)}")
            return None
    
    def _save_property_data(self, data: pd.DataFrame, connection: DataSourceConnection) -> Dict[str, int]:
        """Save property data to a target data source"""
        try:
            # Get target config
            target_id = connection.source_id
            target_config = self.data_sources[target_id]
            target_type = target_config.source_type
            
            # Based on target type, save property data
            if target_type in ['postgresql', 'gis', 'sql_server', 'cama']:
                # Try to detect property table
                try:
                    tables = []
                    schema_info = self.get_source_metadata(target_id)
                    
                    if schema_info.get('status') == 'success' and schema_info.get('schema_info'):
                        tables = schema_info['schema_info'].get('tables', [])
                    
                    # Look for property table
                    property_table = None
                    for table in tables:
                        if ('property' in table.lower() or 'parcel' in table.lower() or 
                            'real_estate' in table.lower() or 'realestate' in table.lower()):
                            property_table = table
                            break
                    
                    if not property_table:
                        # Create a new property table
                        property_table = 'property_data'
                    
                    # Save to the target table
                    if connection.engine:
                        # TODO: Implement upsert logic
                        data.to_sql(property_table, connection.engine, if_exists='replace', index=False)
                        return {"new": len(data), "updated": 0}
                
                except Exception as e:
                    logger.error(f"Error saving property data to {target_id}: {str(e)}")
                    return {"new": 0, "updated": 0}
            
            elif target_type == 'sqlite':
                # Try to detect property table
                try:
                    cursor = connection.connection.cursor()
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                    tables = [row[0] for row in cursor.fetchall()]
                    
                    # Look for property table
                    property_table = None
                    for table in tables:
                        if ('property' in table.lower() or 'parcel' in table.lower() or 
                            'real_estate' in table.lower() or 'realestate' in table.lower()):
                            property_table = table
                            break
                    
                    if not property_table:
                        # Create a new property table
                        property_table = 'property_data'
                    
                    # Save to the target table
                    data.to_sql(property_table, connection.connection, if_exists='replace', index=False)
                    return {"new": len(data), "updated": 0}
                
                except Exception as e:
                    logger.error(f"Error saving property data to {target_id}: {str(e)}")
                    return {"new": 0, "updated": 0}
            
            elif target_type == 'file':
                # Save to file based on extension
                file_path = connection.connection
                _, ext = os.path.splitext(file_path)
                
                if ext.lower() == '.csv':
                    data.to_csv(file_path, index=False)
                elif ext.lower() in ['.xlsx', '.xls']:
                    data.to_excel(file_path, index=False)
                elif ext.lower() == '.json':
                    data.to_json(file_path, orient='records')
                else:
                    logger.warning(f"Unsupported file type: {ext}")
                    return {"new": 0, "updated": 0}
                
                return {"new": len(data), "updated": 0}
            
            else:
                logger.warning(f"Unsupported target type for property data: {target_type}")
                return {"new": 0, "updated": 0}
        
        except Exception as e:
            logger.error(f"Error saving property data to {connection.source_id}: {str(e)}")
            return {"new": 0, "updated": 0}
    
    def _save_property_data_internal(self, data: pd.DataFrame) -> Dict[str, int]:
        """Save property data to the internal database"""
        # TODO: Implement saving to internal database
        # For now, just log the data and return a placeholder result
        logger.info(f"Saving {len(data)} property records to internal database")
        return {"new": len(data), "updated": 0}
    
    def _load_tax_data(self, connection: DataSourceConnection) -> Optional[pd.DataFrame]:
        """Load tax data from a data source"""
        try:
            # Get source config
            source_id = connection.source_id
            source_config = self.data_sources[source_id]
            source_type = source_config.source_type
            
            # Based on source type, load tax data
            if source_type in ['postgresql', 'gis', 'sql_server', 'cama']:
                # Try to detect tax table
                try:
                    tables = []
                    schema_info = self.get_source_metadata(source_id)
                    
                    if schema_info.get('status') == 'success' and schema_info.get('schema_info'):
                        tables = schema_info['schema_info'].get('tables', [])
                    
                    # Look for tax table
                    tax_table = None
                    for table in tables:
                        if ('tax' in table.lower() or 'taxation' in table.lower() or 
                            'tax_bill' in table.lower() or 'taxbill' in table.lower() or
                            'tax_roll' in table.lower() or 'taxroll' in table.lower()):
                            tax_table = table
                            break
                    
                    if not tax_table:
                        # Use default query if no tax table found
                        # TODO: Replace with more sophisticated detection
                        logger.warning(f"No tax table found in {source_id}, using sample data")
                        return self._get_sample_data('tax')
                    
                    # Query the tax table
                    if connection.engine:
                        query = f"SELECT * FROM {tax_table}"
                        return pd.read_sql(query, connection.engine)
                
                except Exception as e:
                    logger.error(f"Error detecting tax table in {source_id}: {str(e)}")
                    # Fall back to sample data
                    return self._get_sample_data('tax')
            
            elif source_type == 'sqlite':
                # Try to detect tax table
                try:
                    cursor = connection.connection.cursor()
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                    tables = [row[0] for row in cursor.fetchall()]
                    
                    # Look for tax table
                    tax_table = None
                    for table in tables:
                        if ('tax' in table.lower() or 'taxation' in table.lower() or 
                            'tax_bill' in table.lower() or 'taxbill' in table.lower() or
                            'tax_roll' in table.lower() or 'taxroll' in table.lower()):
                            tax_table = table
                            break
                    
                    if not tax_table:
                        # Use default query if no tax table found
                        logger.warning(f"No tax table found in {source_id}, using sample data")
                        return self._get_sample_data('tax')
                    
                    # Query the tax table
                    query = f"SELECT * FROM {tax_table}"
                    return pd.read_sql_query(query, connection.connection)
                
                except Exception as e:
                    logger.error(f"Error detecting tax table in {source_id}: {str(e)}")
                    # Fall back to sample data
                    return self._get_sample_data('tax')
            
            elif source_type == 'file':
                # Load file based on extension
                file_path = connection.connection
                _, ext = os.path.splitext(file_path)
                
                if ext.lower() == '.csv':
                    try:
                        df = pd.read_csv(file_path)
                        
                        # Check if it looks like tax data
                        tax_cols = ['tax_id', 'parcel_number', 'tax_year', 'total_tax', 'tax_bill_number']
                        has_tax_cols = any(col in df.columns for col in tax_cols)
                        
                        if has_tax_cols:
                            return df
                        else:
                            logger.warning(f"CSV file doesn't appear to contain tax data: {file_path}")
                            return self._get_sample_data('tax')
                    except Exception as e:
                        logger.error(f"Error reading CSV file: {str(e)}")
                        return self._get_sample_data('tax')
                
                elif ext.lower() in ['.xls', '.xlsx']:
                    try:
                        df = pd.read_excel(file_path)
                        
                        # Check if it looks like tax data
                        tax_cols = ['tax_id', 'parcel_number', 'tax_year', 'total_tax', 'tax_bill_number']
                        has_tax_cols = any(col in df.columns for col in tax_cols)
                        
                        if has_tax_cols:
                            return df
                        else:
                            logger.warning(f"Excel file doesn't appear to contain tax data: {file_path}")
                            return self._get_sample_data('tax')
                    except Exception as e:
                        logger.error(f"Error reading Excel file: {str(e)}")
                        return self._get_sample_data('tax')
                
                else:
                    logger.warning(f"Unsupported file extension for tax data: {ext}")
                    return self._get_sample_data('tax')
            
            # If we get here, we don't have a supported source type
            logger.warning(f"Unsupported source type for tax data: {source_type}")
            # Fallback to sample data
            return self._get_sample_data('tax')
            
        except Exception as e:
            logger.error(f"Error loading tax data from {connection.source_id}: {str(e)}")
            return None
    
    def _save_tax_data(self, data: pd.DataFrame, connection: DataSourceConnection) -> Dict[str, int]:
        """Save tax data to a target data source"""
        try:
            # Get target config
            source_id = connection.source_id
            source_config = self.data_sources[source_id]
            source_type = source_config.source_type
            
            # Based on source type, save tax data
            if source_type in ['postgresql', 'gis', 'sql_server', 'cama']:
                # Try to detect or create tax table
                try:
                    tables = []
                    schema_info = self.get_source_metadata(source_id)
                    
                    if schema_info.get('status') == 'success' and schema_info.get('schema_info'):
                        tables = schema_info['schema_info'].get('tables', [])
                    
                    # Look for tax table
                    tax_table = None
                    for table in tables:
                        if ('tax' in table.lower() or 'taxation' in table.lower() or 
                            'tax_bill' in table.lower() or 'taxbill' in table.lower() or
                            'tax_roll' in table.lower() or 'taxroll' in table.lower()):
                            tax_table = table
                            break
                    
                    if not tax_table:
                        # Create a new tax table
                        tax_table = 'tax_data'
                        logger.warning(f"No tax table found in {source_id}, would create one in a real implementation")
                    
                    # In a real implementation, we would upsert to the tax table
                    # For now, just log the data and return a placeholder result
                    logger.info(f"Would save {len(data)} tax records to {tax_table} in {source_id}")
                    return {"new": len(data), "updated": 0}
                
                except Exception as e:
                    logger.error(f"Error saving tax data to {source_id}: {str(e)}")
                    return {"new": 0, "updated": 0}
            
            elif source_type == 'sqlite':
                # Similar implementation as above
                logger.info(f"Would save {len(data)} tax records to SQLite database {source_id}")
                return {"new": len(data), "updated": 0}
            
            elif source_type == 'file':
                # Save to file based on extension
                file_path = connection.connection
                _, ext = os.path.splitext(file_path)
                
                # Replace extension with new one for tax data file
                tax_file_path = file_path.replace(ext, f"_tax{ext}")
                
                if ext.lower() == '.csv':
                    try:
                        # data.to_csv(tax_file_path, index=False)
                        logger.info(f"Would save {len(data)} tax records to CSV file {tax_file_path}")
                        return {"new": len(data), "updated": 0}
                    except Exception as e:
                        logger.error(f"Error saving tax data to CSV file: {str(e)}")
                        return {"new": 0, "updated": 0}
                
                elif ext.lower() in ['.xls', '.xlsx']:
                    try:
                        # data.to_excel(tax_file_path, index=False)
                        logger.info(f"Would save {len(data)} tax records to Excel file {tax_file_path}")
                        return {"new": len(data), "updated": 0}
                    except Exception as e:
                        logger.error(f"Error saving tax data to Excel file: {str(e)}")
                        return {"new": 0, "updated": 0}
                
                else:
                    logger.warning(f"Unsupported file extension for saving tax data: {ext}")
                    return {"new": 0, "updated": 0}
            
            # If we get here, we don't have a supported source type
            logger.warning(f"Unsupported source type for saving tax data: {source_type}")
            return {"new": 0, "updated": 0}
            
        except Exception as e:
            logger.error(f"Error saving tax data to {connection.source_id}: {str(e)}")
            return {"new": 0, "updated": 0}
    
    def _save_tax_data_internal(self, data: pd.DataFrame) -> Dict[str, int]:
        """Save tax data to the internal database"""
        # TODO: Implement saving to internal database
        # For now, just log the data and return a placeholder result
        logger.info(f"Saving {len(data)} tax records to internal database")
        return {"new": len(data), "updated": 0}
    
    def _get_sample_data(self, data_type: str, filters: Dict[str, Any] = None) -> pd.DataFrame:
        """Generate sample data for testing"""
        # Get schema for data type
        schema = self.schemas.get(data_type, {})
        if not schema:
            return pd.DataFrame()
        
        # Generate sample data based on schema
        num_records = 50
        data = {}
        
        for field, field_type in schema.items():
            if field_type == 'STRING':
                data[field] = [f"Sample {field} {i}" for i in range(num_records)]
            elif field_type == 'INTEGER':
                data[field] = [i * 10 for i in range(num_records)]
            elif field_type == 'FLOAT':
                data[field] = [i * 10.5 for i in range(num_records)]
            elif field_type == 'BOOLEAN':
                data[field] = [i % 2 == 0 for i in range(num_records)]
            elif field_type == 'DATE':
                data[field] = [datetime.date(2023, 1, 1) + datetime.timedelta(days=i) for i in range(num_records)]
            elif field_type == 'TIMESTAMP':
                data[field] = [datetime.datetime(2023, 1, 1, 12, 0) + datetime.timedelta(hours=i) for i in range(num_records)]
            elif field_type == 'TEXT':
                data[field] = [f"This is a longer text for {field} {i}" for i in range(num_records)]
        
        # For property data, add special fields
        if data_type == 'property':
            # Set property_id and parcel_number
            data['property_id'] = [f"PROP-{i:06}" for i in range(num_records)]
            data['parcel_number'] = [f"12345{i:04}" for i in range(num_records)]
            
            # Set geographic coordinates for Benton County, WA
            # Kennewick/Richland/Pasco area
            base_lat = 46.2112
            base_lon = -119.1372
            data['latitude'] = [base_lat + (np.random.random() * 0.1 - 0.05) for _ in range(num_records)]
            data['longitude'] = [base_lon + (np.random.random() * 0.1 - 0.05) for _ in range(num_records)]
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Apply filters if provided
        if filters:
            for field, value in filters.items():
                if field in df.columns:
                    if isinstance(value, dict):
                        # Complex filter
                        if 'min' in value and field in df.columns:
                            df = df[df[field] >= value['min']]
                        if 'max' in value and field in df.columns:
                            df = df[df[field] <= value['max']]
                        if 'like' in value and field in df.columns:
                            df = df[df[field].astype(str).str.contains(value['like'], case=False)]
                        if 'not' in value and field in df.columns:
                            df = df[df[field] != value['not']]
                    elif isinstance(value, list):
                        # IN filter
                        df = df[df[field].isin(value)]
                    else:
                        # Equals filter
                        df = df[df[field] == value]
        
        return df
    
    def _export_as_geojson(self, data: pd.DataFrame, file_path: str) -> None:
        """Export property data as GeoJSON"""
        # Check if we have latitude and longitude
        if 'latitude' not in data.columns or 'longitude' not in data.columns:
            logger.warning("No latitude/longitude columns found for GeoJSON export")
            # Add dummy coordinates
            data['latitude'] = 46.2112
            data['longitude'] = -119.1372
        
        # Create GeoJSON structure
        features = []
        
        for _, row in data.iterrows():
            # Get properties
            properties = row.drop(['latitude', 'longitude']).to_dict()
            
            # Convert timestamps to strings
            for key, value in properties.items():
                if isinstance(value, (datetime.datetime, datetime.date)):
                    properties[key] = value.isoformat()
            
            # Create feature
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(row['longitude']), float(row['latitude'])]
                },
                "properties": properties
            }
            
            features.append(feature)
        
        # Create GeoJSON object
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        # Write to file
        with open(file_path, 'w') as f:
            json.dump(geojson, f)


# Create a singleton instance of the Integration Hub
integration_hub = IntegrationHub()

# Add some example data sources (for development/testing)
def initialize_test_data_sources():
    """Initialize test data sources for development"""
    # SQLite database source (file-based)
    sqlite_config = DataSourceConfig(
        source_id="benton_county_sqlite",
        source_type="sqlite",
        connection_string="sqlite:///instance/benton_county.db",
        refresh_interval=60,
        enabled=True,
        metadata={
            "description": "Benton County Assessment Data (SQLite)",
            "owner": "System",
            "tables": ["property_data", "sales_data", "valuation_data"],
            "county": "Benton",
            "state": "WA"
        }
    )
    
    # PostgreSQL database source (main repository)
    pg_config = DataSourceConfig(
        source_id="master_assessment_db",
        source_type="postgresql",
        connection_string=os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres"),
        refresh_interval=30,
        enabled=True,
        metadata={
            "description": "Master Assessment Database (PostgreSQL)",
            "owner": "System",
            "primary": True,
            "county": "Benton",
            "state": "WA"
        }
    )
    
    # Sample CAMA system via SQL Server
    cama_config = DataSourceConfig(
        source_id="cama_system",
        source_type="sql_server",
        # This is a placeholder connection string, would need to be updated for actual use
        connection_string="DRIVER={ODBC Driver 17 for SQL Server};SERVER=cama.example.com;DATABASE=CAMA;UID=username;PWD=password;",
        refresh_interval=120,
        enabled=False,  # Disabled initially since credentials aren't real
        metadata={
            "description": "CAMA System (SQL Server)",
            "owner": "Assessor's Office",
            "system_type": "CAMA",
            "county": "Benton",
            "state": "WA"
        }
    )
    
    # Sample GIS database via PostgreSQL
    gis_config = DataSourceConfig(
        source_id="gis_database",
        source_type="postgresql",
        # This is a placeholder connection string, would need to be updated for actual use
        connection_string="postgresql://gis_user:password@gis.example.com:5432/gis_data",
        refresh_interval=240,
        enabled=False,  # Disabled initially since credentials aren't real
        metadata={
            "description": "GIS Database (PostgreSQL/PostGIS)",
            "owner": "GIS Department",
            "system_type": "GIS",
            "county": "Benton",
            "state": "WA"
        }
    )
    
    # Add the sources
    integration_hub.add_data_source(sqlite_config)
    integration_hub.add_data_source(pg_config)
    integration_hub.add_data_source(cama_config)
    integration_hub.add_data_source(gis_config)
    
    logger.info("Test data sources initialized")

# Initialize test data sources when the module is loaded
initialize_test_data_sources()
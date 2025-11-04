"""
Change Detector Component for TerraFusion Sync Service.

This module is responsible for detecting changes between source and target databases.
It identifies new records, modifications, and deletions using various change detection strategies.
"""

import logging
import datetime
from typing import Dict, List, Any, Tuple, Optional, Set, Union
import hashlib
import json

import sqlalchemy as sa
from sqlalchemy.sql import text
from sqlalchemy.engine import Engine, Connection
from sqlalchemy.exc import SQLAlchemyError

from sync_service.data_type_handlers import DataTypeHandler, get_handler_for_column

logger = logging.getLogger(__name__)


class ChangeDetector:
    """
    Detects changes between source and target databases using various strategies.
    
    Strategies include:
    - Primary key comparison (fastest, least accurate)
    - Timestamp-based detection (requires timestamp columns)
    - Full content comparison (slowest, most accurate)
    - CDC (Change Data Capture) log-based detection (requires CDC setup)
    - Hash-based comparison (good balance of speed and accuracy)
    """
    
    def __init__(self, 
                 source_engine: Engine = None,
                 target_engine: Engine = None,
                 batch_size: int = 1000,
                 detection_strategy: str = 'hash',
                 cdc_table_prefix: str = '_cdc',
                 cdc_enabled: bool = False):
        """
        Initialize the Change Detector.
        
        Args:
            source_engine: SQLAlchemy engine for source database
            target_engine: SQLAlchemy engine for target database
            batch_size: Number of records to process at once
            detection_strategy: Strategy to use for change detection
                               ('pk', 'timestamp', 'content', 'cdc', 'hash')
            cdc_table_prefix: Prefix for CDC tables if CDC detection is used
            cdc_enabled: Whether CDC is enabled in the database
        """
        self.source_engine = source_engine
        self.target_engine = target_engine
        self.batch_size = batch_size
        self.detection_strategy = detection_strategy
        self.cdc_table_prefix = cdc_table_prefix
        self.cdc_enabled = cdc_enabled
        
    def detect_changes(self, 
                       table_name: str, 
                       primary_keys: List[str], 
                       columns: List[str],
                       last_sync_time: Optional[datetime.datetime] = None) -> Dict[str, Any]:
        """
        Detect changes for a specific table.
        
        Args:
            table_name: Name of the table to check for changes
            primary_keys: List of primary key column names
            columns: List of column names to include in change detection
            last_sync_time: Timestamp of the last synchronization
            
        Returns:
            Dictionary with lists of new, modified, and deleted records
        """
        method = self._get_detection_method()
        return method(table_name, primary_keys, columns, last_sync_time)
    
    def _get_detection_method(self):
        """Get the appropriate detection method based on the strategy."""
        methods = {
            'pk': self._detect_changes_pk,
            'timestamp': self._detect_changes_timestamp,
            'content': self._detect_changes_content,
            'cdc': self._detect_changes_cdc,
            'hash': self._detect_changes_hash
        }
        return methods.get(self.detection_strategy, self._detect_changes_hash)
    
    def _detect_changes_pk(self, 
                          table_name: str, 
                          primary_keys: List[str], 
                          columns: List[str],
                          last_sync_time: Optional[datetime.datetime] = None) -> Dict[str, Any]:
        """
        Detect changes based on primary key comparison.
        
        This method compares primary keys between source and target to identify new and deleted records.
        It cannot detect modifications without additional checks.
        """
        changes = {
            'new': [],
            'modified': [],
            'deleted': []
        }
        
        try:
            # Get primary key values from source
            source_pks = self._get_primary_key_values(self.source_engine, table_name, primary_keys)
            
            # Get primary key values from target
            target_pks = self._get_primary_key_values(self.target_engine, table_name, primary_keys)
            
            # Find new records (in source but not in target)
            new_pks = source_pks - target_pks
            
            # Find deleted records (in target but not in source)
            deleted_pks = target_pks - source_pks
            
            # Get full record data for new records
            if new_pks:
                changes['new'] = self._get_records_by_pk(self.source_engine, table_name, primary_keys, columns, new_pks)
                
            # Get full record data for deleted records
            if deleted_pks:
                changes['deleted'] = self._get_records_by_pk(self.target_engine, table_name, primary_keys, columns, deleted_pks)
            
            # To detect modified records, we need to compare the content
            # of records that exist in both source and target
            common_pks = source_pks.intersection(target_pks)
            if common_pks:
                source_records = self._get_records_by_pk(self.source_engine, table_name, primary_keys, columns, common_pks)
                target_records = self._get_records_by_pk(self.target_engine, table_name, primary_keys, columns, common_pks)
                
                # Compare records with the same primary key
                source_dict = {self._pk_to_str(rec, primary_keys): rec for rec in source_records}
                target_dict = {self._pk_to_str(rec, primary_keys): rec for rec in target_records}
                
                for pk, source_record in source_dict.items():
                    if pk in target_dict and self._records_differ(source_record, target_dict[pk]):
                        changes['modified'].append(source_record)
            
            return changes
            
        except Exception as e:
            logger.error(f"Error detecting changes for table {table_name}: {str(e)}")
            raise
    
    def _detect_changes_timestamp(self, 
                                table_name: str, 
                                primary_keys: List[str], 
                                columns: List[str],
                                last_sync_time: Optional[datetime.datetime] = None) -> Dict[str, Any]:
        """
        Detect changes based on timestamp columns.
        
        This method uses 'created_at' and 'updated_at' columns to identify new and modified records.
        Deletion detection still requires primary key comparison.
        """
        if not last_sync_time:
            # Fall back to PK comparison if no last sync time
            return self._detect_changes_pk(table_name, primary_keys, columns, last_sync_time)
        
        changes = {
            'new': [],
            'modified': [],
            'deleted': []
        }
        
        try:
            # Check if timestamp columns exist
            source_columns = self._get_table_columns(self.source_engine, table_name)
            if 'created_at' not in source_columns or 'updated_at' not in source_columns:
                logger.warning(f"Table {table_name} doesn't have timestamp columns, falling back to PK comparison")
                return self._detect_changes_pk(table_name, primary_keys, columns, last_sync_time)
            
            # Get new records (created after last sync)
            new_records_query = text(f"""
                SELECT {', '.join(columns)}
                FROM {table_name}
                WHERE created_at > :last_sync_time
            """)
            
            with self.source_engine.connect() as conn:
                result = conn.execute(new_records_query, {'last_sync_time': last_sync_time})
                changes['new'] = [dict(row) for row in result]
            
            # Get modified records (updated after last sync but created before)
            modified_records_query = text(f"""
                SELECT {', '.join(columns)}
                FROM {table_name}
                WHERE updated_at > :last_sync_time
                AND created_at <= :last_sync_time
            """)
            
            with self.source_engine.connect() as conn:
                result = conn.execute(modified_records_query, {'last_sync_time': last_sync_time})
                changes['modified'] = [dict(row) for row in result]
            
            # For deleted records, still need to use PK comparison
            source_pks = self._get_primary_key_values(self.source_engine, table_name, primary_keys)
            target_pks = self._get_primary_key_values(self.target_engine, table_name, primary_keys)
            deleted_pks = target_pks - source_pks
            
            if deleted_pks:
                changes['deleted'] = self._get_records_by_pk(self.target_engine, table_name, primary_keys, columns, deleted_pks)
                
            return changes
            
        except Exception as e:
            logger.error(f"Error detecting changes using timestamp strategy for table {table_name}: {str(e)}")
            raise
    
    def _detect_changes_content(self, 
                              table_name: str, 
                              primary_keys: List[str], 
                              columns: List[str],
                              last_sync_time: Optional[datetime.datetime] = None) -> Dict[str, Any]:
        """
        Detect changes by comparing the full content of all records.
        
        This is the most accurate but slowest method, comparing each record field by field.
        """
        changes = {
            'new': [],
            'modified': [],
            'deleted': []
        }
        
        try:
            # Get all records from source
            source_records = self._get_all_records(self.source_engine, table_name, columns)
            
            # Get all records from target
            target_records = self._get_all_records(self.target_engine, table_name, columns)
            
            # Index records by primary key
            source_dict = {self._pk_to_str(rec, primary_keys): rec for rec in source_records}
            target_dict = {self._pk_to_str(rec, primary_keys): rec for rec in target_records}
            
            # Find new records (in source but not in target)
            new_pks = set(source_dict.keys()) - set(target_dict.keys())
            changes['new'] = [source_dict[pk] for pk in new_pks]
            
            # Find deleted records (in target but not in source)
            deleted_pks = set(target_dict.keys()) - set(source_dict.keys())
            changes['deleted'] = [target_dict[pk] for pk in deleted_pks]
            
            # Find modified records (different content for same PK)
            common_pks = set(source_dict.keys()).intersection(set(target_dict.keys()))
            for pk in common_pks:
                if self._records_differ(source_dict[pk], target_dict[pk]):
                    changes['modified'].append(source_dict[pk])
                    
            return changes
            
        except Exception as e:
            logger.error(f"Error detecting changes using content strategy for table {table_name}: {str(e)}")
            raise
    
    def _detect_changes_cdc(self, 
                          table_name: str, 
                          primary_keys: List[str], 
                          columns: List[str],
                          last_sync_time: Optional[datetime.datetime] = None) -> Dict[str, Any]:
        """
        Detect changes using Change Data Capture (CDC) logs.
        
        This method requires CDC to be set up in the database and specific CDC tables to exist.
        It reads change logs directly rather than comparing data.
        """
        if not self.cdc_enabled:
            logger.warning(f"CDC not enabled, falling back to hash comparison for table {table_name}")
            return self._detect_changes_hash(table_name, primary_keys, columns, last_sync_time)
        
        changes = {
            'new': [],
            'modified': [],
            'deleted': []
        }
        
        try:
            cdc_table = f"{self.cdc_table_prefix}_{table_name}"
            
            # Check if CDC table exists
            if not self._table_exists(self.source_engine, cdc_table):
                logger.warning(f"CDC table {cdc_table} not found, falling back to hash comparison")
                return self._detect_changes_hash(table_name, primary_keys, columns, last_sync_time)
            
            # Get changes from CDC table
            cdc_query = text(f"""
                SELECT operation_type, record_data
                FROM {cdc_table}
                WHERE operation_timestamp > :last_sync_time
                ORDER BY operation_timestamp
            """)
            
            with self.source_engine.connect() as conn:
                result = conn.execute(cdc_query, {'last_sync_time': last_sync_time or datetime.datetime.min})
                
                for row in result:
                    operation = row['operation_type']
                    record = json.loads(row['record_data'])
                    
                    if operation == 'INSERT':
                        changes['new'].append(record)
                    elif operation == 'UPDATE':
                        changes['modified'].append(record)
                    elif operation == 'DELETE':
                        changes['deleted'].append(record)
                        
            return changes
            
        except Exception as e:
            logger.error(f"Error detecting changes using CDC strategy for table {table_name}: {str(e)}")
            # Fall back to hash comparison
            return self._detect_changes_hash(table_name, primary_keys, columns, last_sync_time)
    
    def _detect_changes_hash(self, 
                           table_name: str, 
                           primary_keys: List[str], 
                           columns: List[str],
                           last_sync_time: Optional[datetime.datetime] = None) -> Dict[str, Any]:
        """
        Detect changes using hash-based comparison.
        
        This method creates content hashes for records and compares them,
        providing a good balance between speed and accuracy.
        """
        changes = {
            'new': [],
            'modified': [],
            'deleted': []
        }
        
        try:
            # Get all records and their hashes from source
            source_records, source_hashes = self._get_records_with_hashes(
                self.source_engine, table_name, primary_keys, columns)
            
            # Get all records and their hashes from target
            target_records, target_hashes = self._get_records_with_hashes(
                self.target_engine, table_name, primary_keys, columns)
            
            # Find new records (in source but not in target)
            new_pks = set(source_hashes.keys()) - set(target_hashes.keys())
            changes['new'] = [source_records[pk] for pk in new_pks]
            
            # Find deleted records (in target but not in source)
            deleted_pks = set(target_hashes.keys()) - set(source_hashes.keys())
            changes['deleted'] = [target_records[pk] for pk in deleted_pks]
            
            # Find modified records (different hashes for same PK)
            common_pks = set(source_hashes.keys()).intersection(set(target_hashes.keys()))
            for pk in common_pks:
                if source_hashes[pk] != target_hashes[pk]:
                    changes['modified'].append(source_records[pk])
                    
            return changes
            
        except Exception as e:
            logger.error(f"Error detecting changes using hash strategy for table {table_name}: {str(e)}")
            # Fall back to primary key comparison as a last resort
            return self._detect_changes_pk(table_name, primary_keys, columns, last_sync_time)
    
    def _get_primary_key_values(self, engine: Engine, table_name: str, primary_keys: List[str]) -> Set[str]:
        """Get all primary key values from a table as a set of strings."""
        pk_select = ", ".join(primary_keys)
        query = text(f"SELECT {pk_select} FROM {table_name}")
        
        result_set = set()
        with engine.connect() as conn:
            result = conn.execute(query)
            for row in result:
                # Create a string representation of the composite primary key
                pk_values = tuple(row[key] for key in primary_keys)
                result_set.add(str(pk_values))
                
        return result_set
    
    def _get_records_by_pk(self, engine: Engine, table_name: str, 
                         primary_keys: List[str], columns: List[str], 
                         pk_values: Set[str]) -> List[Dict[str, Any]]:
        """Get full records for a set of primary key values."""
        result_records = []
        
        # Convert string representations back to actual values
        actual_pk_values = []
        for pk_str in pk_values:
            # Remove parentheses and split by comma
            pk_str = pk_str.strip('()')
            if ',' in pk_str:
                parts = [p.strip().strip("'\"") for p in pk_str.split(',')]
                actual_pk_values.append(tuple(parts))
            else:
                actual_pk_values.append((pk_str.strip("'\""),))
        
        # Process in batches to avoid huge SQL queries
        batch_size = 500
        for i in range(0, len(actual_pk_values), batch_size):
            batch = actual_pk_values[i:i+batch_size]
            
            # Build WHERE clause for the batch
            if len(primary_keys) == 1:
                # Single primary key
                pk_placeholders = ", ".join([f":pk{j}" for j in range(len(batch))])
                where_clause = f"{primary_keys[0]} IN ({pk_placeholders})"
                params = {f"pk{j}": batch[j][0] for j in range(len(batch))}
            else:
                # Composite primary key
                conditions = []
                params = {}
                for j, pk_tuple in enumerate(batch):
                    condition_parts = []
                    for k, key in enumerate(primary_keys):
                        param_name = f"pk{j}_{k}"
                        condition_parts.append(f"{key} = :{param_name}")
                        params[param_name] = pk_tuple[k] if k < len(pk_tuple) else None
                    conditions.append(f"({' AND '.join(condition_parts)})")
                where_clause = " OR ".join(conditions)
            
            # Execute query for this batch
            query = text(f"SELECT {', '.join(columns)} FROM {table_name} WHERE {where_clause}")
            with engine.connect() as conn:
                result = conn.execute(query, params)
                batch_records = [dict(row) for row in result]
                result_records.extend(batch_records)
        
        return result_records
    
    def _get_all_records(self, engine: Engine, table_name: str, columns: List[str]) -> List[Dict[str, Any]]:
        """Get all records from a table."""
        query = text(f"SELECT {', '.join(columns)} FROM {table_name}")
        with engine.connect() as conn:
            result = conn.execute(query)
            return [dict(row) for row in result]
    
    def _get_records_with_hashes(self, engine: Engine, table_name: str, 
                               primary_keys: List[str], columns: List[str]) -> Tuple[Dict[str, Dict[str, Any]], Dict[str, str]]:
        """
        Get all records from a table along with their content hashes.
        
        Returns a tuple of (records_dict, hashes_dict) where:
            - records_dict: Dictionary mapping PK string to record
            - hashes_dict: Dictionary mapping PK string to content hash
        """
        records = self._get_all_records(engine, table_name, columns)
        
        records_dict = {}
        hashes_dict = {}
        
        for record in records:
            pk_str = self._pk_to_str(record, primary_keys)
            records_dict[pk_str] = record
            hashes_dict[pk_str] = self._calculate_record_hash(record)
            
        return records_dict, hashes_dict
    
    def _pk_to_str(self, record: Dict[str, Any], primary_keys: List[str]) -> str:
        """Convert a record's primary key values to a string representation."""
        if len(primary_keys) == 1:
            return str(record[primary_keys[0]])
        else:
            return str(tuple(record[key] for key in primary_keys))
    
    def _calculate_record_hash(self, record: Dict[str, Any]) -> str:
        """Calculate a hash of the record's content for comparison."""
        # Sort keys to ensure consistent hashing
        sorted_items = sorted(record.items())
        
        # Convert values to strings for hashing
        str_items = []
        for key, value in sorted_items:
            if hasattr(value, 'isoformat') and callable(getattr(value, 'isoformat')):
                # Handle datetime objects
                str_value = value.isoformat()
            elif isinstance(value, (dict, list)):
                # Handle nested structures
                str_value = json.dumps(value, sort_keys=True)
            else:
                str_value = str(value)
            str_items.append(f"{key}:{str_value}")
        
        # Join with a separator and hash
        content_str = "|".join(str_items)
        return hashlib.md5(content_str.encode('utf-8')).hexdigest()
    
    def _get_table_columns(self, engine: Engine, table_name: str) -> List[str]:
        """Get all column names for a table."""
        query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = :table_name
        """)
        with engine.connect() as conn:
            result = conn.execute(query, {'table_name': table_name})
            return [row[0] for row in result]
    
    def _table_exists(self, engine: Engine, table_name: str) -> bool:
        """Check if a table exists in the database."""
        query = text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = :table_name
            )
        """)
        with engine.connect() as conn:
            result = conn.execute(query, {'table_name': table_name})
            return result.scalar()
    
    def _records_differ(self, record1: Dict[str, Any], record2: Dict[str, Any]) -> bool:
        """
        Compare two records to see if they differ in content.
        
        Uses data type handlers for specialized comparisons when available.
        """
        if set(record1.keys()) != set(record2.keys()):
            return True
            
        for key in record1:
            value1 = record1[key]
            value2 = record2[key]
            
            # Try to get a data type handler for this field
            handler = get_handler_for_column(key)
            
            if handler:
                # Use handler for comparison
                if handler.values_differ(value1, value2):
                    return True
            else:
                # Standard comparison
                if value1 != value2:
                    # Special handling for floating point values
                    if isinstance(value1, float) and isinstance(value2, float):
                        if abs(value1 - value2) < 1e-10:
                            continue
                    return True
                    
        return False
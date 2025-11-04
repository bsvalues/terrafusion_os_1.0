"""
Incremental Sync Module for the CountyDataSync ETL Process.

This module provides functionality for implementing incremental updates to the ETL process
by tracking the last sync timestamp and processing only records that have changed since.
"""
import os
import json
import logging
import datetime
import pandas as pd
from typing import Dict, Any, Optional, List, Tuple

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class IncrementalSyncManager:
    """Class for managing incremental synchronization."""
    
    def __init__(self, sync_metadata_path: str = 'sync_metadata.json'):
        """Initialize the incremental sync manager.
        
        Args:
            sync_metadata_path: Path to the metadata file that stores the last sync time.
        """
        self.sync_metadata_path = sync_metadata_path
        self.metadata = self._load_metadata()
    
    def _load_metadata(self) -> Dict[str, Any]:
        """Load sync metadata from file or initialize if it doesn't exist."""
        if os.path.exists(self.sync_metadata_path):
            try:
                with open(self.sync_metadata_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading sync metadata: {str(e)}")
                # If there's an error loading the file, initialize with defaults
                return self._initialize_metadata()
        else:
            return self._initialize_metadata()
    
    def _initialize_metadata(self) -> Dict[str, Any]:
        """Initialize metadata with default values."""
        metadata = {
            'last_sync_time': None,
            'last_successful_job_id': None,
            'tables_synced': {},
            'record_counts': {
                'total_processed': 0,
                'total_updated': 0,
                'total_inserted': 0
            }
        }
        self._save_metadata(metadata)
        return metadata
    
    def _save_metadata(self, metadata: Dict[str, Any]) -> None:
        """Save metadata to file."""
        # Create a copy of the metadata to avoid modifying the original
        metadata_copy = metadata.copy()
        
        # Convert all datetime objects to ISO format strings for JSON serialization
        metadata_copy = self._convert_datetimes_to_strings(metadata_copy)
        
        with open(self.sync_metadata_path, 'w') as f:
            json.dump(metadata_copy, f, indent=2)
    
    def _convert_datetimes_to_strings(self, obj):
        """Recursively convert all datetime objects in a nested structure to strings."""
        if isinstance(obj, dict):
            return {k: self._convert_datetimes_to_strings(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_datetimes_to_strings(item) for item in obj]
        elif isinstance(obj, datetime.datetime):
            return obj.isoformat()
        else:
            return obj
    
    def get_last_sync_time(self, table_name: Optional[str] = None) -> Optional[datetime.datetime]:
        """Get the timestamp of the last successful sync.
        
        Args:
            table_name: Optional table name to get specific last sync time.
                        If None, returns the global last sync time.
        
        Returns:
            Datetime object of the last sync, or None if no sync has been performed.
        """
        if table_name:
            # Get table-specific sync time
            tables_info = self.metadata.get('tables_synced', {})
            table_sync_time = tables_info.get(table_name, {}).get('last_sync_time')
            
            if table_sync_time:
                if isinstance(table_sync_time, str):
                    return datetime.datetime.fromisoformat(table_sync_time)
                return table_sync_time
            
        # Fall back to global sync time
        last_sync_time = self.metadata.get('last_sync_time')
        
        if last_sync_time:
            if isinstance(last_sync_time, str):
                return datetime.datetime.fromisoformat(last_sync_time)
            return last_sync_time
            
        return None
    
    def update_sync_time(self, table_name: Optional[str] = None, job_id: Optional[str] = None) -> None:
        """Update the last sync timestamp.
        
        Args:
            table_name: Optional table name to update specific sync time.
                        If None, updates the global sync time.
            job_id: Optional job ID that performed the sync.
        """
        now = datetime.datetime.utcnow()
        
        if table_name:
            # Update table-specific sync time
            if 'tables_synced' not in self.metadata:
                self.metadata['tables_synced'] = {}
                
            if table_name not in self.metadata['tables_synced']:
                self.metadata['tables_synced'][table_name] = {}
                
            self.metadata['tables_synced'][table_name]['last_sync_time'] = now
            if job_id:
                self.metadata['tables_synced'][table_name]['last_job_id'] = job_id
        
        # Always update global sync time
        self.metadata['last_sync_time'] = now
        if job_id:
            self.metadata['last_successful_job_id'] = job_id
            
        self._save_metadata(self.metadata)
        logger.info(f"Updated sync time to {now.isoformat()}" + 
                   (f" for table {table_name}" if table_name else ""))
    
    def filter_changed_records(self, df: pd.DataFrame, timestamp_column: str, 
                              table_name: str) -> pd.DataFrame:
        """Filter a DataFrame to include only records that changed since the last sync.
        
        Args:
            df: Source DataFrame.
            timestamp_column: Name of the column containing last update timestamp.
            table_name: Table name to get the specific last sync time.
            
        Returns:
            Filtered DataFrame with only changed records.
        """
        last_sync = self.get_last_sync_time(table_name)
        
        if last_sync is None:
            logger.info(f"No previous sync found for {table_name}, processing all records")
            return df
        
        # Convert timestamp column to datetime if it's not already
        if df[timestamp_column].dtype != 'datetime64[ns]':
            df[timestamp_column] = pd.to_datetime(df[timestamp_column])
        
        # Filter records updated since last sync
        filtered_df = df[df[timestamp_column] > last_sync]
        
        logger.info(f"Filtered {len(filtered_df)} of {len(df)} records that changed since {last_sync}")
        
        return filtered_df
    
    def get_changed_record_ids(self, df: pd.DataFrame, timestamp_column: str, 
                              id_column: str, table_name: str) -> List[Any]:
        """Get a list of IDs for records that changed since the last sync.
        
        This is useful when you need to fetch related data based on changed records.
        
        Args:
            df: Source DataFrame.
            timestamp_column: Name of the column containing last update timestamp.
            id_column: Name of the column containing record IDs.
            table_name: Table name to get the specific last sync time.
            
        Returns:
            List of record IDs that have changed.
        """
        filtered_df = self.filter_changed_records(df, timestamp_column, table_name)
        return filtered_df[id_column].tolist()
    
    def update_record_counts(self, inserted: int = 0, updated: int = 0, 
                            table_name: Optional[str] = None) -> None:
        """Update the record counts in the metadata.
        
        Args:
            inserted: Number of inserted records.
            updated: Number of updated records.
            table_name: Optional table name to update specific record counts.
        """
        # Update global counts
        if 'record_counts' not in self.metadata:
            self.metadata['record_counts'] = {
                'total_processed': 0,
                'total_updated': 0,
                'total_inserted': 0
            }
            
        self.metadata['record_counts']['total_processed'] += (inserted + updated)
        self.metadata['record_counts']['total_updated'] += updated
        self.metadata['record_counts']['total_inserted'] += inserted
        
        # Update table-specific counts if provided
        if table_name:
            if 'tables_synced' not in self.metadata:
                self.metadata['tables_synced'] = {}
                
            if table_name not in self.metadata['tables_synced']:
                self.metadata['tables_synced'][table_name] = {}
                
            if 'record_counts' not in self.metadata['tables_synced'][table_name]:
                self.metadata['tables_synced'][table_name]['record_counts'] = {
                    'processed': 0,
                    'updated': 0,
                    'inserted': 0
                }
                
            table_counts = self.metadata['tables_synced'][table_name]['record_counts']
            table_counts['processed'] += (inserted + updated)
            table_counts['updated'] += updated
            table_counts['inserted'] += inserted
        
        self._save_metadata(self.metadata)
        
    def get_sync_statistics(self) -> Dict[str, Any]:
        """Get statistics about sync operations.
        
        Returns:
            Dictionary containing sync statistics.
        """
        return {
            'last_sync_time': self.metadata.get('last_sync_time'),
            'last_successful_job_id': self.metadata.get('last_successful_job_id'),
            'total_tables_synced': len(self.metadata.get('tables_synced', {})),
            'record_counts': self.metadata.get('record_counts', {})
        }
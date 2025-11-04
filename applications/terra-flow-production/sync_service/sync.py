"""
Main ETL module for the CountyDataSync project.

This module implements the Extract, Transform, Load (ETL) workflow with enhanced
export mechanisms using SQLite databases and incremental updates.
"""
import os
import logging
import datetime
import pandas as pd
from typing import Dict, Any, Optional, List, Tuple, Union, cast

from sync_service.sqlite_export import SQLiteExporter
from sync_service.multi_format_exporter import MultiFormatExporter, ExportFormat
from sync_service.incremental_sync import IncrementalSyncManager

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class CountyDataSyncETL:
    """Main ETL class for the CountyDataSync project."""
    
    def __init__(self, 
                 export_dir: str = 'exports',
                 sync_metadata_path: str = 'sync_metadata.json'):
        """Initialize the ETL process.
        
        Args:
            export_dir: Directory where export files will be stored.
            sync_metadata_path: Path to the metadata file that stores the last sync time.
        """
        self.sqlite_exporter = SQLiteExporter(export_dir)
        self.multi_exporter = MultiFormatExporter(export_dir)
        self.sync_manager = IncrementalSyncManager(sync_metadata_path)
        self.job_id = None
        
    def set_job_id(self, job_id: str) -> None:
        """Set the job ID for the current ETL run.
        
        Args:
            job_id: Job ID for tracking.
        """
        self.job_id = job_id
        logger.info(f"Set job ID to {job_id}")
    
    def extract_data(self, source_connection, 
                    query: str, 
                    timestamp_column: str = 'updated_at',
                    table_name: Optional[str] = None) -> pd.DataFrame:
        """Extract data from source database.
        
        Args:
            source_connection: Database connection or connection string.
            query: SQL query to execute.
            timestamp_column: Column to use for incremental filtering.
            table_name: Optional table name for tracking specific sync times.
            
        Returns:
            DataFrame containing extracted data.
        """
        logger.info(f"Extracting data for {table_name or 'unknown table'}")
        
        # Get the last sync time
        last_sync_time = self.sync_manager.get_last_sync_time(table_name)
        
        # If we have a last sync time, modify the query to filter by it
        if last_sync_time is not None:
            # Format the datetime for SQL
            formatted_time = last_sync_time.strftime('%Y-%m-%d %H:%M:%S')
            
            # Add WHERE clause if not already present
            if ' WHERE ' in query.upper():
                query = query.replace(' WHERE ', f' WHERE {timestamp_column} > \'{formatted_time}\' AND ')
            else:
                # Check if query has GROUP BY, ORDER BY, or LIMIT clauses
                lower_query = query.lower()
                insert_pos = len(query)
                
                for clause in [' group by ', ' order by ', ' limit ']:
                    pos = lower_query.find(clause)
                    if pos != -1 and pos < insert_pos:
                        insert_pos = pos
                
                # Insert the WHERE clause at the appropriate position
                query = query[:insert_pos] + f' WHERE {timestamp_column} > \'{formatted_time}\'' + query[insert_pos:]
            
            logger.info(f"Modified query to filter by last sync time: {formatted_time}")
        
        # Execute the query
        try:
            df = pd.read_sql(query, source_connection)
            logger.info(f"Extracted {len(df)} records")
            return df
        except Exception as e:
            logger.error(f"Error extracting data: {str(e)}")
            raise
    
    def transform_data(self, df: pd.DataFrame, 
                      transformations: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
        """Transform extracted data.
        
        Args:
            df: DataFrame containing extracted data.
            transformations: Dictionary of transformation functions to apply.
            
        Returns:
            Transformed DataFrame.
        """
        logger.info(f"Transforming {len(df)} records")
        
        if df.empty:
            logger.info("No data to transform")
            return df
        
        # Apply transformations if provided
        if transformations:
            for column, transform_func in transformations.items():
                if column in df.columns:
                    logger.info(f"Applying transformation to column {column}")
                    try:
                        df[column] = df[column].apply(transform_func)
                    except Exception as e:
                        logger.error(f"Error transforming column {column}: {str(e)}")
        
        # Always add a timestamp column for tracking changes
        df['etl_timestamp'] = datetime.datetime.utcnow()
        
        logger.info(f"Transformation complete, returning {len(df)} records")
        return df
    
    def load_stats_data(self, df: pd.DataFrame, 
                       incremental: bool = True,
                       key_columns: Optional[List[str]] = None,
                       formats: Optional[List[str]] = None) -> Dict[str, Any]:
        """Load statistics data into multiple formats.
        
        Args:
            df: DataFrame containing statistics data.
            incremental: Whether to perform an incremental update.
            key_columns: List of column names that form the unique key (for merging).
            formats: List of export formats to use. Defaults to ['sqlite'].
            
        Returns:
            Dictionary with export paths by format.
        """
        if df.empty:
            logger.info("No stats data to load")
            return {'sqlite': None}
            
        logger.info(f"Loading {len(df)} records to stats database")
        
        # Default to SQLite if no formats specified
        if formats is None:
            formats = ['sqlite']
        
        results = {}
        
        # For backward compatibility, still use SQLite exporter for SQLite format
        if 'sqlite' in formats:
            if incremental and key_columns:
                # Use merge for incremental update with key columns
                results['sqlite'] = self.sqlite_exporter.merge_with_stats_db(df, key_columns)
            elif incremental:
                # Use append for incremental update without key columns
                results['sqlite'] = self.sqlite_exporter.append_to_stats_db(df)
            else:
                # Create a new database for full refresh
                results['sqlite'] = self.sqlite_exporter.create_and_load_stats_db(df)
            
            # Remove 'sqlite' from formats to avoid processing it twice
            formats = [fmt for fmt in formats if fmt != 'sqlite']
        
        # Process other formats using the multi-format exporter
        if formats:
            for fmt in formats:
                if incremental and key_columns:
                    # Use merge for incremental update with key columns
                    results[fmt] = self.multi_exporter.merge_data(df, 'stats', cast(ExportFormat, fmt), key_columns)
                else:
                    # Export to the specified format
                    results[fmt] = self.multi_exporter.export_data(df, 'stats', cast(ExportFormat, fmt))
        
        return results
    
    def load_working_data(self, df: pd.DataFrame, 
                         incremental: bool = True,
                         key_columns: Optional[List[str]] = None,
                         formats: Optional[List[str]] = None) -> Dict[str, Any]:
        """Load working data into multiple formats.
        
        Args:
            df: DataFrame containing working data.
            incremental: Whether to perform an incremental update.
            key_columns: List of column names that form the unique key (for merging).
            formats: List of export formats to use. Defaults to ['sqlite'].
            
        Returns:
            Dictionary with export paths by format.
        """
        if df.empty:
            logger.info("No working data to load")
            return {'sqlite': None}
            
        logger.info(f"Loading {len(df)} records to working database")
        
        # Default to SQLite if no formats specified
        if formats is None:
            formats = ['sqlite']
        
        results = {}
        
        # For backward compatibility, still use SQLite exporter for SQLite format
        if 'sqlite' in formats:
            if incremental and key_columns:
                # Use merge for incremental update with key columns
                results['sqlite'] = self.sqlite_exporter.merge_with_working_db(df, key_columns)
            elif incremental:
                # Use append for incremental update without key columns
                results['sqlite'] = self.sqlite_exporter.append_to_working_db(df)
            else:
                # Create a new database for full refresh
                results['sqlite'] = self.sqlite_exporter.create_and_load_working_db(df)
            
            # Remove 'sqlite' from formats to avoid processing it twice
            formats = [fmt for fmt in formats if fmt != 'sqlite']
        
        # Process other formats using the multi-format exporter
        if formats:
            for fmt in formats:
                if incremental and key_columns:
                    # Use merge for incremental update with key columns
                    results[fmt] = self.multi_exporter.merge_data(df, 'working', cast(ExportFormat, fmt), key_columns)
                else:
                    # Export to the specified format
                    results[fmt] = self.multi_exporter.export_data(df, 'working', cast(ExportFormat, fmt))
        
        return results
    
    def run_etl_workflow(self, 
                        source_connection,
                        stats_query: str,
                        working_query: str,
                        stats_timestamp_column: str = 'updated_at',
                        working_timestamp_column: str = 'updated_at',
                        stats_table_name: str = 'stats_data',
                        working_table_name: str = 'working_data',
                        stats_key_columns: Optional[List[str]] = None,
                        working_key_columns: Optional[List[str]] = None,
                        stats_transformations: Optional[Dict[str, Any]] = None,
                        working_transformations: Optional[Dict[str, Any]] = None,
                        incremental: bool = True,
                        export_formats: Optional[List[str]] = None) -> Dict[str, Any]:
        """Run the complete ETL workflow.
        
        Args:
            source_connection: Database connection or connection string.
            stats_query: SQL query to extract statistics data.
            working_query: SQL query to extract working data.
            stats_timestamp_column: Column to use for incremental filtering of stats data.
            working_timestamp_column: Column to use for incremental filtering of working data.
            stats_table_name: Table name for tracking statistics sync times.
            working_table_name: Table name for tracking working data sync times.
            stats_key_columns: List of column names that form the unique key for stats data.
            working_key_columns: List of column names that form the unique key for working data.
            stats_transformations: Dictionary of transformation functions for stats data.
            working_transformations: Dictionary of transformation functions for working data.
            incremental: Whether to perform an incremental update.
            export_formats: List of export formats to use. Defaults to ['sqlite'].
                           Supported formats are 'sqlite', 'csv', 'json', and 'geojson'.
            
        Returns:
            Dictionary containing results of the ETL process.
        """
        start_time = datetime.datetime.utcnow()
        job_id = self.job_id or f"etl_{start_time.strftime('%Y%m%d_%H%M%S')}"
        
        logger.info(f"Starting ETL workflow (Job ID: {job_id})")
        logger.info(f"Incremental mode: {incremental}")
        
        results = {
            'job_id': job_id,
            'start_time': start_time,
            'end_time': None,
            'success': False,
            'stats': {
                'records_processed': 0,
                'stats_records': 0,
                'working_records': 0,
                'duration_seconds': 0
            },
            'stats_db_path': None,
            'working_db_path': None,
            'errors': []
        }
        
        try:
            # Extract and process stats data
            logger.info("Processing stats data")
            stats_df = self.extract_data(
                source_connection, 
                stats_query, 
                timestamp_column=stats_timestamp_column,
                table_name=stats_table_name if incremental else None
            )
            
            stats_transformed_df = self.transform_data(stats_df, stats_transformations)
            
            stats_export_results = self.load_stats_data(
                stats_transformed_df, 
                incremental=incremental,
                key_columns=stats_key_columns,
                formats=export_formats
            )
            
            results['stats']['stats_records'] = len(stats_df)
            results['stats_db_path'] = stats_export_results.get('sqlite')
            results['stats_export_paths'] = stats_export_results
            
            # Log exports
            for fmt, path in stats_export_results.items():
                if path:
                    logger.info(f"Stats data exported to {fmt} format: {path}")
            
            # Extract and process working data
            logger.info("Processing working data")
            working_df = self.extract_data(
                source_connection, 
                working_query, 
                timestamp_column=working_timestamp_column,
                table_name=working_table_name if incremental else None
            )
            
            working_transformed_df = self.transform_data(working_df, working_transformations)
            
            working_export_results = self.load_working_data(
                working_transformed_df, 
                incremental=incremental,
                key_columns=working_key_columns,
                formats=export_formats
            )
            
            results['stats']['working_records'] = len(working_df)
            results['working_db_path'] = working_export_results.get('sqlite')
            results['working_export_paths'] = working_export_results
            
            # Log exports
            for fmt, path in working_export_results.items():
                if path:
                    logger.info(f"Working data exported to {fmt} format: {path}")
            
            # Update sync times
            if incremental:
                self.sync_manager.update_sync_time(stats_table_name, job_id)
                self.sync_manager.update_sync_time(working_table_name, job_id)
                
                # Also update insert/update counts
                inserted = len(stats_df) if stats_key_columns is None else 0
                updated = 0 if stats_key_columns is None else len(stats_df)
                self.sync_manager.update_record_counts(inserted, updated, stats_table_name)
                
                inserted = len(working_df) if working_key_columns is None else 0
                updated = 0 if working_key_columns is None else len(working_df)
                self.sync_manager.update_record_counts(inserted, updated, working_table_name)
            
            # Update results
            results['success'] = True
            results['stats']['records_processed'] = len(stats_df) + len(working_df)
            
        except Exception as e:
            logger.error(f"Error in ETL workflow: {str(e)}")
            results['errors'].append(str(e))
        finally:
            # Calculate duration and set end time
            end_time = datetime.datetime.utcnow()
            results['end_time'] = end_time
            results['stats']['duration_seconds'] = (end_time - start_time).total_seconds()
            
            # Log results
            if results['success']:
                logger.info(f"ETL workflow completed successfully in {results['stats']['duration_seconds']} seconds")
                logger.info(f"Processed {results['stats']['records_processed']} records")
            else:
                logger.error(f"ETL workflow failed after {results['stats']['duration_seconds']} seconds")
                for error in results['errors']:
                    logger.error(f"Error: {error}")
            
        return results
"""
Chunked ETL Processing Module

This module provides enhanced ETL functionality with chunking support for large datasets.
It extends the basic ETL functionality with batch processing capabilities to handle timeouts
and memory limitations when processing large files.
"""

import os
import logging
import time
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Union, Tuple, Callable
from sqlalchemy import create_engine, types, text
from sqlalchemy.orm import Session

from sync_service.mapping_loader import get_mapping_loader
from sync_service.enhanced_etl import get_enhanced_etl

# Setup logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Chunked ETL Processor
class ChunkedETLProcessor:
    """
    Chunked ETL Processor for handling large datasets
    
    This class provides enhanced ETL functionality with chunking support for large datasets.
    It processes data in smaller chunks to avoid memory issues and timeouts.
    """
    
    def __init__(self, chunk_size: int = 5000, max_workers: int = 4):
        """
        Initialize the chunked ETL processor
        
        Args:
            chunk_size: Number of records to process in each chunk
            max_workers: Maximum number of concurrent workers for parallel processing
        """
        self.chunk_size = chunk_size
        self.max_workers = max_workers
        self.etl = get_enhanced_etl()
        self.mapping_loader = get_mapping_loader()
        
        logger.info(f"Chunked ETL Processor initialized with chunk_size={chunk_size}, max_workers={max_workers}")
    
    def execute_chunked_etl(
        self,
        source_connection: str,
        source_query: str,
        data_type: str,
        source_type: str = 'file',
        mapping_name: Optional[str] = None,
        target_table: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute ETL pipeline with chunking for large datasets
        
        Args:
            source_connection: Connection string or file path
            source_query: SQL query or empty string for file
            data_type: Type of data (property, sales, valuation, tax)
            source_type: Type of source (file, database, api)
            mapping_name: Name of the field mapping to use
            target_table: Target table name (overrides default)
            options: Additional options for processing
            
        Returns:
            Dictionary with ETL results
        """
        start_time = time.time()
        
        logger.info(f"Starting chunked ETL process for {data_type} data from {source_type}")
        
        options = options or {}
        
        # Extract data or get dataframe iterator
        if source_type == 'file':
            try:
                # Determine the file type and use appropriate chunking method
                file_ext = os.path.splitext(source_connection)[1].lower()
                
                if file_ext == '.csv':
                    # For CSV files, use chunksize parameter in read_csv
                    chunked_data = pd.read_csv(source_connection, chunksize=self.chunk_size)
                    total_rows = sum(1 for _ in open(source_connection)) - 1  # Subtract header row
                elif file_ext in ('.xlsx', '.xls'):
                    # For Excel files, we need to load it all and then chunk it
                    # Note: This could still cause memory issues with very large Excel files
                    df = pd.read_excel(source_connection)
                    total_rows = len(df)
                    chunked_data = [df[i:i + self.chunk_size] for i in range(0, len(df), self.chunk_size)]
                elif file_ext == '.json':
                    # For JSON files, load in chunks
                    # This is a simplified approach - for very large JSON files, a streaming JSON parser would be better
                    df = pd.read_json(source_connection)
                    total_rows = len(df)
                    chunked_data = [df[i:i + self.chunk_size] for i in range(0, len(df), self.chunk_size)]
                elif file_ext == '.parquet':
                    # For Parquet files, use a chunked reader
                    import pyarrow.parquet as pq
                    table = pq.read_table(source_connection)
                    total_rows = table.num_rows
                    chunked_data = [table.slice(i, min(self.chunk_size, total_rows - i)).to_pandas() 
                                   for i in range(0, total_rows, self.chunk_size)]
                else:
                    logger.error(f"Unsupported file type: {file_ext}")
                    return {
                        'status': 'error',
                        'message': f'Unsupported file type: {file_ext}',
                        'extract': {'success': False, 'records': 0, 'message': 'Unsupported file type'},
                        'transform': {'success': False, 'records': 0, 'message': 'Not attempted'},
                        'validate': {'success': False, 'valid_records': 0, 'invalid_records': 0, 'message': 'Not attempted'},
                        'load': {'success': False, 'records': 0, 'message': 'Not attempted'}
                    }
                
                logger.info(f"Extracted {total_rows} total records from file, processing in chunks of {self.chunk_size}")
                
            except Exception as e:
                logger.error(f"Error extracting data from file: {str(e)}")
                return {
                    'status': 'error',
                    'message': f'Error extracting data: {str(e)}',
                    'extract': {'success': False, 'records': 0, 'message': str(e)},
                    'transform': {'success': False, 'records': 0, 'message': 'Not attempted'},
                    'validate': {'success': False, 'valid_records': 0, 'invalid_records': 0, 'message': 'Not attempted'},
                    'load': {'success': False, 'records': 0, 'message': 'Not attempted'}
                }
                
        elif source_type == 'database':
            try:
                # Create database engine and execute query with chunking
                engine = create_engine(source_connection)
                
                # First, get the total row count for the query
                count_query = f"SELECT COUNT(*) FROM ({source_query}) as sq"
                with engine.connect() as conn:
                    total_rows = conn.execute(text(count_query)).scalar()
                
                # Modify the query to support pagination
                # Note: This assumes the source database supports LIMIT and OFFSET
                # For SQL Server, Oracle, etc., different pagination syntax would be needed
                chunked_data = []
                for offset in range(0, total_rows, self.chunk_size):
                    paginated_query = f"{source_query} LIMIT {self.chunk_size} OFFSET {offset}"
                    chunk_df = pd.read_sql(paginated_query, engine)
                    chunked_data.append(chunk_df)
                
                logger.info(f"Extracted {total_rows} total records from database, processing in chunks of {self.chunk_size}")
                
            except Exception as e:
                logger.error(f"Error extracting data from database: {str(e)}")
                return {
                    'status': 'error',
                    'message': f'Error extracting data: {str(e)}',
                    'extract': {'success': False, 'records': 0, 'message': str(e)},
                    'transform': {'success': False, 'records': 0, 'message': 'Not attempted'},
                    'validate': {'success': False, 'valid_records': 0, 'invalid_records': 0, 'message': 'Not attempted'},
                    'load': {'success': False, 'records': 0, 'message': 'Not attempted'}
                }
        else:
            logger.error(f"Unsupported source type: {source_type}")
            return {
                'status': 'error',
                'message': f'Unsupported source type: {source_type}',
                'extract': {'success': False, 'records': 0, 'message': 'Unsupported source type'},
                'transform': {'success': False, 'records': 0, 'message': 'Not attempted'},
                'validate': {'success': False, 'valid_records': 0, 'invalid_records': 0, 'message': 'Not attempted'},
                'load': {'success': False, 'records': 0, 'message': 'Not attempted'}
            }
        
        # Initialize counters and result tracking
        processed_chunks = 0
        total_chunks = total_rows // self.chunk_size + (1 if total_rows % self.chunk_size > 0 else 0)
        total_processed = 0
        total_loaded = 0
        total_valid = 0
        total_invalid = 0
        error_messages = []
        
        # Get field mapping if specified
        mapping = None
        if mapping_name:
            mapping = self.mapping_loader.get_mapping(data_type, mapping_name)
            if not mapping:
                logger.warning(f"Mapping '{mapping_name}' not found for {data_type}, will use auto-detection")
        
        # Process each chunk
        for chunk_index, chunk_df in enumerate(chunked_data):
            logger.info(f"Processing chunk {chunk_index + 1}/{total_chunks} with {len(chunk_df)} records")
            
            try:
                # Transform data
                transformed_df = self.transform_chunk(chunk_df, data_type, mapping)
                if transformed_df is None or transformed_df.empty:
                    logger.warning(f"No data transformed in chunk {chunk_index + 1}")
                    continue
                
                # Validate data
                validation_result = self.validate_chunk(transformed_df, data_type)
                valid_df = validation_result.get('valid_data')
                
                # Update counters
                total_processed += len(chunk_df)
                total_valid += validation_result.get('valid_count', 0)
                total_invalid += validation_result.get('invalid_count', 0)
                
                # Load data if validation succeeded and valid data exists
                if valid_df is not None and not valid_df.empty:
                    load_result = self.load_chunk(valid_df, data_type, target_table)
                    total_loaded += load_result.get('records', 0)
                    
                    if not load_result.get('success', False):
                        error_messages.append(f"Chunk {chunk_index + 1}: {load_result.get('message', 'Unknown error')}")
                
                processed_chunks += 1
                
            except Exception as e:
                logger.error(f"Error processing chunk {chunk_index + 1}: {str(e)}")
                error_messages.append(f"Chunk {chunk_index + 1}: {str(e)}")
        
        # Prepare final result
        end_time = time.time()
        duration = end_time - start_time
        
        result = {
            'status': 'success' if not error_messages else 'partial' if processed_chunks > 0 else 'error',
            'message': 'Processing completed successfully' if not error_messages else f'Completed with errors: {"; ".join(error_messages)}',
            'duration': duration,
            'extract': {
                'success': True,
                'records': total_rows,
                'message': f'Extracted {total_rows} records from {source_type}'
            },
            'transform': {
                'success': total_processed > 0,
                'records': total_processed,
                'message': f'Transformed {total_processed} records'
            },
            'validate': {
                'success': total_valid > 0,
                'valid_records': total_valid,
                'invalid_records': total_invalid,
                'message': f'Validated {total_valid + total_invalid} records, {total_valid} valid, {total_invalid} invalid'
            },
            'load': {
                'success': total_loaded > 0,
                'records': total_loaded,
                'message': f'Loaded {total_loaded} records to database'
            },
            'chunking': {
                'total_chunks': total_chunks,
                'processed_chunks': processed_chunks,
                'chunk_size': self.chunk_size
            }
        }
        
        logger.info(f"Chunked ETL process completed in {duration:.2f} seconds: {result['message']}")
        return result
    
    def transform_chunk(
        self, 
        chunk_df: pd.DataFrame, 
        data_type: str, 
        mapping: Optional[Dict[str, str]] = None
    ) -> pd.DataFrame:
        """
        Transform a chunk of data using field mapping
        
        Args:
            chunk_df: DataFrame with chunk data
            data_type: Type of data (property, sales, valuation, tax)
            mapping: Field mapping dictionary
            
        Returns:
            Transformed DataFrame
        """
        try:
            # If mapping is provided, use it
            if mapping:
                # Create a new DataFrame with mapped columns
                transformed_df = pd.DataFrame()
                
                # Apply mapping
                for target_field, source_field in mapping.items():
                    if source_field in chunk_df.columns:
                        transformed_df[target_field] = chunk_df[source_field]
                
                return transformed_df
            else:
                # Use auto-detection with the ETL engine
                return self.etl.transform_data(chunk_df, data_type)
                
        except Exception as e:
            logger.error(f"Error transforming chunk: {str(e)}")
            return pd.DataFrame()
    
    def validate_chunk(
        self, 
        chunk_df: pd.DataFrame, 
        data_type: str
    ) -> Dict[str, Any]:
        """
        Validate a chunk of data
        
        Args:
            chunk_df: DataFrame with chunk data
            data_type: Type of data (property, sales, valuation, tax)
            
        Returns:
            Dictionary with validation results
        """
        try:
            # Get the schema for this data type
            schema = self.etl.get_schema(data_type)
            if not schema:
                logger.warning(f"No schema found for {data_type}, skipping validation")
                return {
                    'success': True,
                    'valid_count': len(chunk_df),
                    'invalid_count': 0,
                    'valid_data': chunk_df,
                    'invalid_data': pd.DataFrame(),
                    'message': 'No schema found, all data treated as valid'
                }
            
            # Initialize valid and invalid DataFrames
            valid_data = pd.DataFrame()
            invalid_data = pd.DataFrame()
            
            # Add validation result column
            chunk_df['_validation_errors'] = ''
            
            # Validate each row
            for index, row in chunk_df.iterrows():
                errors = []
                
                # Check required fields
                for field, field_schema in schema.items():
                    if field_schema.get('required', False) and (field not in row or pd.isna(row[field])):
                        errors.append(f"Missing required field: {field}")
                
                # Store validation result
                if errors:
                    chunk_df.at[index, '_validation_errors'] = '; '.join(errors)
            
            # Split into valid and invalid based on validation errors
            valid_mask = chunk_df['_validation_errors'] == ''
            valid_data = chunk_df[valid_mask].drop('_validation_errors', axis=1).reset_index(drop=True)
            invalid_data = chunk_df[~valid_mask].reset_index(drop=True)
            
            valid_count = len(valid_data)
            invalid_count = len(invalid_data)
            
            return {
                'success': valid_count > 0,
                'valid_count': valid_count,
                'invalid_count': invalid_count,
                'valid_data': valid_data,
                'invalid_data': invalid_data,
                'message': f'Validated {valid_count + invalid_count} records, {valid_count} valid, {invalid_count} invalid'
            }
            
        except Exception as e:
            logger.error(f"Error validating chunk: {str(e)}")
            return {
                'success': False,
                'valid_count': 0,
                'invalid_count': len(chunk_df),
                'valid_data': pd.DataFrame(),
                'invalid_data': chunk_df,
                'message': f'Validation error: {str(e)}'
            }
    
    def load_chunk(
        self, 
        chunk_df: pd.DataFrame, 
        data_type: str,
        target_table: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Load a chunk of data to the database
        
        Args:
            chunk_df: DataFrame with chunk data
            data_type: Type of data (property, sales, valuation, tax)
            target_table: Target table name (overrides default)
            
        Returns:
            Dictionary with load results
        """
        try:
            if chunk_df.empty:
                return {
                    'success': False,
                    'records': 0,
                    'message': 'No valid data to load'
                }
            
            # Get the database engine from the ETL engine
            engine = self.etl.get_database_engine()
            if not engine:
                return {
                    'success': False,
                    'records': 0,
                    'message': 'Database engine not available'
                }
            
            # Determine the target table
            if not target_table:
                target_table = f"{data_type}_data"
            
            # Get database data types based on the schema
            schema = self.etl.get_schema(data_type)
            dtype = {}
            
            if schema:
                for field, field_schema in schema.items():
                    if field in chunk_df.columns:
                        field_type = field_schema.get('type', 'string')
                        if field_type == 'string':
                            dtype[field] = types.String
                        elif field_type == 'integer':
                            dtype[field] = types.Integer
                        elif field_type == 'float':
                            dtype[field] = types.Float
                        elif field_type == 'date':
                            dtype[field] = types.Date
                        elif field_type == 'datetime':
                            dtype[field] = types.DateTime
                        elif field_type == 'boolean':
                            dtype[field] = types.Boolean
            
            # Import to database
            chunk_df.to_sql(
                target_table,
                engine,
                if_exists='append',
                index=False,
                dtype=dtype
            )
            
            return {
                'success': True,
                'records': len(chunk_df),
                'message': f'Successfully loaded {len(chunk_df)} records to {target_table}'
            }
            
        except Exception as e:
            logger.error(f"Error loading chunk: {str(e)}")
            return {
                'success': False,
                'records': 0,
                'message': f'Load error: {str(e)}'
            }

# Chunked ETL processor instance
_chunked_etl_processor = None

def get_chunked_etl_processor(chunk_size: int = 5000, max_workers: int = 4) -> ChunkedETLProcessor:
    """
    Get a chunked ETL processor instance
    
    Args:
        chunk_size: Number of records to process in each chunk
        max_workers: Maximum number of concurrent workers for parallel processing
        
    Returns:
        ChunkedETLProcessor instance
    """
    global _chunked_etl_processor
    
    if _chunked_etl_processor is None:
        _chunked_etl_processor = ChunkedETLProcessor(chunk_size, max_workers)
    
    return _chunked_etl_processor
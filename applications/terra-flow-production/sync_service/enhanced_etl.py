"""
Enhanced ETL Utility for GeoAssessmentPro

This module provides enhanced Extract-Transform-Load functionality
for importing data from production sources into the system.

It supports more robust data mapping, validation, and transformation
than the basic integration hub functions.
"""

import os
import io
import logging
import datetime
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Union, Callable
from pathlib import Path
from sqlalchemy import create_engine, text, inspect, Table, Column, MetaData
from sqlalchemy.types import String, Float, Integer, Boolean, DateTime, Date, Text
from sqlalchemy.orm import Session
from contextlib import contextmanager

# Import the mapping loader
from sync_service.mapping_loader import get_mapping_loader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataMapper:
    """Maps data from source format to target schema"""
    
    def __init__(self, source_schema: Dict[str, str], target_schema: Dict[str, str]):
        """
        Initialize the data mapper
        
        Args:
            source_schema: Dictionary mapping source field names to types
            target_schema: Dictionary mapping target field names to types
        """
        self.source_schema = source_schema
        self.target_schema = target_schema
        self.mapping = {}
        self.transformers = {}
        
        # Auto-generate mapping for identical field names
        for target_field in target_schema:
            if target_field in source_schema:
                self.mapping[target_field] = target_field
    
    def add_field_mapping(self, target_field: str, source_field: str, 
                         transformer: Optional[Callable] = None):
        """
        Add a field mapping
        
        Args:
            target_field: Field name in target schema
            source_field: Field name in source schema
            transformer: Optional function to transform the data
        """
        if target_field not in self.target_schema:
            logger.warning(f"Target field {target_field} not in target schema")
            return False
            
        if source_field not in self.source_schema:
            logger.warning(f"Source field {source_field} not in source schema")
            return False
            
        self.mapping[target_field] = source_field
        
        if transformer:
            self.transformers[target_field] = transformer
            
        return True
    
    def map_data(self, source_data: pd.DataFrame) -> pd.DataFrame:
        """
        Map data from source format to target schema
        
        Args:
            source_data: DataFrame with source data
            
        Returns:
            DataFrame with mapped data
        """
        if source_data.empty:
            return pd.DataFrame(columns=list(self.target_schema.keys()))
            
        # Create empty dataframe with target schema
        result = pd.DataFrame(columns=list(self.target_schema.keys()))
        
        # Process each target field
        for target_field, field_type in self.target_schema.items():
            if target_field in self.mapping:
                source_field = self.mapping[target_field]
                
                if source_field in source_data.columns:
                    # Apply transformer if available
                    if target_field in self.transformers:
                        result[target_field] = source_data[source_field].apply(self.transformers[target_field])
                    else:
                        # Copy data directly
                        result[target_field] = source_data[source_field]
                else:
                    # Source field not in data, add empty column
                    result[target_field] = np.nan
            else:
                # No mapping for this field, add empty column
                result[target_field] = np.nan
                
        return result

class DataValidator:
    """Validates data against schema and constraints"""
    
    def __init__(self, schema: Dict[str, str], constraints: Optional[Dict[str, Dict[str, Any]]] = None):
        """
        Initialize the data validator
        
        Args:
            schema: Dictionary mapping field names to types
            constraints: Dictionary mapping field names to constraints
        """
        self.schema = schema
        self.constraints = constraints or {}
        
    def validate(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Validate data against schema and constraints
        
        Args:
            data: DataFrame to validate
            
        Returns:
            Dictionary with validation results
        """
        if data.empty:
            return {
                "valid": False,
                "errors": ["Empty dataset"],
                "field_errors": {},
                "records_processed": 0,
                "records_valid": 0,
                "records_invalid": 0
            }
            
        records_processed = len(data)
        field_errors = {}
        invalid_records = 0
        
        # Check schema
        for field, field_type in self.schema.items():
            if field not in data.columns:
                field_errors[field] = ["Field missing in dataset"]
            else:
                errors = []
                
                # Check constraints
                if field in self.constraints:
                    for constraint, value in self.constraints[field].items():
                        if constraint == 'required' and value:
                            missing = data[data[field].isna()].index.tolist()
                            if missing:
                                errors.append(f"Required field has {len(missing)} missing values")
                                invalid_records += len(missing)
                                
                        elif constraint == 'min' and value is not None:
                            invalid = data[data[field] < value].index.tolist()
                            if invalid:
                                errors.append(f"{len(invalid)} values below minimum {value}")
                                invalid_records += len(invalid)
                                
                        elif constraint == 'max' and value is not None:
                            invalid = data[data[field] > value].index.tolist()
                            if invalid:
                                errors.append(f"{len(invalid)} values above maximum {value}")
                                invalid_records += len(invalid)
                                
                        elif constraint == 'unique' and value:
                            duplicates = data[data.duplicated(subset=[field])].index.tolist()
                            if duplicates:
                                errors.append(f"{len(duplicates)} duplicate values found")
                                invalid_records += len(duplicates)
                                
                        elif constraint == 'format' and value:
                            # Check format with regex
                            import re
                            pattern = re.compile(value)
                            invalid = data[~data[field].astype(str).str.match(pattern)].index.tolist()
                            if invalid:
                                errors.append(f"{len(invalid)} values don't match format {value}")
                                invalid_records += len(invalid)
                
                if errors:
                    field_errors[field] = errors
        
        return {
            "valid": len(field_errors) == 0,
            "errors": [f"Validation errors in {len(field_errors)} fields"] if field_errors else [],
            "field_errors": field_errors,
            "records_processed": records_processed,
            "records_valid": records_processed - invalid_records,
            "records_invalid": invalid_records
        }

class EnhancedETL:
    """Enhanced ETL functionality"""
    
    def __init__(self, db_engine=None):
        """
        Initialize the ETL utility
        
        Args:
            db_engine: SQLAlchemy engine for database operations
        """
        self.db_engine = db_engine
        
        # Standard schemas for different data types
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
        
        # Default constraints
        self.default_constraints = {
            "property": {
                "property_id": {"required": True, "unique": True},
                "parcel_number": {"required": True},
                "property_type": {"required": True},
                "address": {"required": True},
                "city": {"required": True},
                "state": {"required": True},
                "zip": {"required": True}
            },
            "sales": {
                "sale_id": {"required": True, "unique": True},
                "property_id": {"required": True},
                "sale_date": {"required": True},
                "sale_price": {"required": True, "min": 0}
            },
            "valuation": {
                "valuation_id": {"required": True, "unique": True},
                "property_id": {"required": True},
                "tax_year": {"required": True},
                "assessment_date": {"required": True}
            },
            "tax": {
                "tax_id": {"required": True, "unique": True},
                "property_id": {"required": True},
                "tax_year": {"required": True}
            }
        }
        
        # SQL type mapping
        self.sql_type_map = {
            "STRING": String(256),
            "INTEGER": Integer,
            "FLOAT": Float,
            "BOOLEAN": Boolean,
            "DATE": Date,
            "TIMESTAMP": DateTime,
            "TEXT": Text
        }
    
    def create_sql_table(self, table_name: str, schema: Dict[str, str], 
                         if_exists: str = 'replace') -> bool:
        """
        Create a SQL table from schema
        
        Args:
            table_name: Name of the table to create
            schema: Dictionary mapping field names to types
            if_exists: What to do if the table exists ('fail', 'replace', or 'append')
            
        Returns:
            True if successful, False otherwise
        """
        if not self.db_engine:
            logger.error("No database engine provided")
            return False
            
        try:
            metadata = MetaData()
            columns = []
            
            for field, field_type in schema.items():
                sql_type = self.sql_type_map.get(field_type, String(256))
                columns.append(Column(field, sql_type))
                
            table = Table(table_name, metadata, *columns)
            
            if if_exists == 'replace':
                # Drop table if it exists
                table.drop(self.db_engine, checkfirst=True)
                
            # Create table
            table.create(self.db_engine, checkfirst=True)
            return True
            
        except Exception as e:
            logger.error(f"Error creating table {table_name}: {str(e)}")
            return False
    
    def import_data(self, data: pd.DataFrame, table_name: str, 
                   if_exists: str = 'replace') -> bool:
        """
        Import data into a SQL table
        
        Args:
            data: DataFrame with data to import
            table_name: Name of the table to import into
            if_exists: What to do if the table exists ('fail', 'replace', or 'append')
            
        Returns:
            True if successful, False otherwise
        """
        if not self.db_engine:
            logger.error("No database engine provided")
            return False
            
        try:
            data.to_sql(table_name, self.db_engine, if_exists=if_exists, index=False)
            return True
            
        except Exception as e:
            logger.error(f"Error importing data to {table_name}: {str(e)}")
            return False
    
    def extract_from_database(self, connection_string: str, query: str) -> pd.DataFrame:
        """
        Extract data from a database using SQL
        
        Args:
            connection_string: Database connection string
            query: SQL query to execute
            
        Returns:
            DataFrame with extracted data
        """
        try:
            engine = create_engine(connection_string)
            data = pd.read_sql(query, engine)
            return data
            
        except Exception as e:
            logger.error(f"Error extracting data: {str(e)}")
            return pd.DataFrame()
    
    def extract_from_file(self, file_path: str) -> pd.DataFrame:
        """
        Extract data from a file
        
        Args:
            file_path: Path to the file
            
        Returns:
            DataFrame with extracted data
        """
        try:
            from pathlib import Path
            path_obj = Path(file_path)
            ext = path_obj.suffix.lower()
            
            if ext == '.csv':
                return pd.read_csv(file_path)
            elif ext in ['.xlsx', '.xls']:
                return pd.read_excel(file_path)
            elif ext == '.json':
                return pd.read_json(file_path)
            elif ext == '.parquet':
                return pd.read_parquet(file_path)
            else:
                logger.error(f"Unsupported file extension: {ext}")
                return pd.DataFrame()
                
        except Exception as e:
            logger.error(f"Error extracting data from {file_path}: {str(e)}")
            return pd.DataFrame()
    
    def extract_from_api(self, api_url: str, params: Optional[Dict[str, Any]] = None,
                        headers: Optional[Dict[str, str]] = None) -> pd.DataFrame:
        """
        Extract data from an API
        
        Args:
            api_url: URL of the API
            params: Parameters to pass to the API
            headers: Headers to pass to the API
            
        Returns:
            DataFrame with extracted data
        """
        try:
            import requests
            response = requests.get(api_url, params=params, headers=headers)
            
            if response.status_code == 200:
                # Try to parse as JSON
                data = response.json()
                
                # Handle different JSON structures
                if isinstance(data, list):
                    return pd.DataFrame(data)
                elif isinstance(data, dict):
                    if 'results' in data:
                        return pd.DataFrame(data['results'])
                    elif 'data' in data:
                        return pd.DataFrame(data['data'])
                    else:
                        # Try to convert single object to DataFrame
                        return pd.DataFrame([data])
                else:
                    logger.error(f"Unexpected API response format")
                    return pd.DataFrame()
            else:
                logger.error(f"API request failed with status code {response.status_code}")
                return pd.DataFrame()
                
        except Exception as e:
            logger.error(f"Error extracting data from API {api_url}: {str(e)}")
            return pd.DataFrame()
    
    def transform_data(self, source_data: pd.DataFrame, target_schema: Dict[str, str],
                      source_schema: Optional[Dict[str, str]] = None,
                      field_mapping: Optional[Dict[str, str]] = None,
                      transformers: Optional[Dict[str, Callable]] = None,
                      mapping_name: str = 'default',
                      data_type: Optional[str] = None) -> pd.DataFrame:
        """
        Transform data from source format to target schema
        
        Args:
            source_data: DataFrame with source data
            target_schema: Dictionary mapping target field names to types
            source_schema: Dictionary mapping source field names to types (inferred if not provided)
            field_mapping: Dictionary mapping target field names to source field names
            transformers: Dictionary mapping field names to transformer functions
            
        Returns:
            DataFrame with transformed data
        """
        if source_data.empty:
            logger.warning("Source data is empty")
            return pd.DataFrame(columns=list(target_schema.keys()))
            
        # Infer source schema if not provided
        if not source_schema:
            source_schema = {}
            for column in source_data.columns:
                dtype = source_data[column].dtype
                if pd.api.types.is_integer_dtype(dtype):
                    source_schema[column] = "INTEGER"
                elif pd.api.types.is_float_dtype(dtype):
                    source_schema[column] = "FLOAT"
                elif pd.api.types.is_bool_dtype(dtype):
                    source_schema[column] = "BOOLEAN"
                elif pd.api.types.is_datetime64_dtype(dtype):
                    source_schema[column] = "TIMESTAMP"
                else:
                    source_schema[column] = "STRING"
        
        # Create data mapper
        mapper = DataMapper(source_schema, target_schema)
        
        # If no field mapping provided, try to load from mapping loader
        if not field_mapping and data_type:
            try:
                # Get mapping loader
                mapping_loader = get_mapping_loader()
                
                # Try to get mapping for the specified data type and mapping name
                loaded_mapping = mapping_loader.get_mapping(data_type, mapping_name)
                
                if loaded_mapping:
                    logger.info(f"Using field mapping from {data_type}/{mapping_name}")
                    field_mapping = loaded_mapping
                else:
                    logger.warning(f"No field mapping found for {data_type}/{mapping_name}")
            except Exception as e:
                logger.error(f"Error loading field mapping: {str(e)}")
        
        # Add field mappings
        if field_mapping:
            for target_field, source_field in field_mapping.items():
                mapper.add_field_mapping(target_field, source_field)
                
        # Add transformers
        if transformers:
            for field, transformer in transformers.items():
                if field in mapper.mapping:
                    source_field = mapper.mapping[field]
                    mapper.add_field_mapping(field, source_field, transformer)
        
        # Map data
        return mapper.map_data(source_data)
    
    def validate_data(self, data: pd.DataFrame, data_type: str) -> Dict[str, Any]:
        """
        Validate data against standard schema and constraints
        
        Args:
            data: DataFrame to validate
            data_type: Type of data ('property', 'sales', 'valuation', 'tax')
            
        Returns:
            Dictionary with validation results
        """
        # Get schema and constraints
        schema = self.schemas.get(data_type, {})
        constraints = self.default_constraints.get(data_type, {})
        
        if not schema:
            return {
                "valid": False,
                "errors": [f"Unknown data type: {data_type}"],
                "field_errors": {},
                "records_processed": 0,
                "records_valid": 0,
                "records_invalid": 0
            }
        
        # Create validator
        validator = DataValidator(schema, constraints)
        
        # Validate data
        return validator.validate(data)
    
    def load_data(self, data: pd.DataFrame, data_type: str, 
                 if_exists: str = 'replace') -> bool:
        """
        Load data into the database
        
        Args:
            data: DataFrame with data to load
            data_type: Type of data ('property', 'sales', 'valuation', 'tax')
            if_exists: What to do if the table exists ('fail', 'replace', or 'append')
            
        Returns:
            True if successful, False otherwise
        """
        if not self.db_engine:
            logger.error("No database engine provided")
            return False
            
        # Get schema
        schema = self.schemas.get(data_type, {})
        
        if not schema:
            logger.error(f"Unknown data type: {data_type}")
            return False
            
        # Create table if needed
        table_name = f"{data_type}_data"
        if if_exists == 'replace':
            success = self.create_sql_table(table_name, schema, if_exists)
            if not success:
                return False
        
        # Import data
        return self.import_data(data, table_name, if_exists)
    
    def execute_etl_pipeline(self, source_connection: str, source_query: str,
                           data_type: str, source_type: str = 'database',
                           if_exists: str = 'replace', field_mapping: Optional[Dict[str, str]] = None,
                           mapping_name: str = 'default') -> Dict[str, Any]:
        """
        Execute a complete ETL pipeline
        
        Args:
            source_connection: Connection string or file path
            source_query: SQL query or None for file source
            data_type: Type of data ('property', 'sales', 'valuation', 'tax')
            source_type: Type of source ('database', 'file', 'api')
            if_exists: What to do if the table exists ('fail', 'replace', or 'append')
            
        Returns:
            Dictionary with pipeline results
        """
        results = {
            "status": "failed",
            "message": "",
            "extract": {
                "success": False,
                "records": 0,
                "message": ""
            },
            "transform": {
                "success": False,
                "records": 0,
                "message": ""
            },
            "validate": {
                "success": False,
                "valid_records": 0,
                "invalid_records": 0,
                "message": ""
            },
            "load": {
                "success": False,
                "records": 0,
                "message": ""
            }
        }
        
        # Get schema
        target_schema = self.schemas.get(data_type, {})
        
        if not target_schema:
            results["message"] = f"Unknown data type: {data_type}"
            return results
        
        # Extract
        source_data = None
        
        try:
            if source_type == 'database':
                source_data = self.extract_from_database(source_connection, source_query)
                results["extract"]["success"] = not source_data.empty
                results["extract"]["records"] = len(source_data)
                if source_data.empty:
                    results["extract"]["message"] = "No data extracted from database"
                else:
                    results["extract"]["message"] = f"Extracted {len(source_data)} records from database"
            elif source_type == 'file':
                source_data = self.extract_from_file(source_connection)
                results["extract"]["success"] = not source_data.empty
                results["extract"]["records"] = len(source_data)
                if source_data.empty:
                    results["extract"]["message"] = "No data extracted from file"
                else:
                    results["extract"]["message"] = f"Extracted {len(source_data)} records from file"
            elif source_type == 'api':
                source_data = self.extract_from_api(source_connection)
                results["extract"]["success"] = not source_data.empty
                results["extract"]["records"] = len(source_data)
                if source_data.empty:
                    results["extract"]["message"] = "No data extracted from API"
                else:
                    results["extract"]["message"] = f"Extracted {len(source_data)} records from API"
            else:
                results["extract"]["message"] = f"Unknown source type: {source_type}"
                return results
        except Exception as e:
            results["extract"]["message"] = f"Error during extraction: {str(e)}"
            return results
            
        if source_data is None or source_data.empty:
            return results
            
        # Transform
        try:
            # Use field mapping if provided
            transformed_data = self.transform_data(
                source_data=source_data, 
                target_schema=target_schema,
                field_mapping=field_mapping,
                data_type=data_type,
                mapping_name=mapping_name
            )
            
            # Update the results
            results["transform"]["success"] = not transformed_data.empty
            results["transform"]["records"] = len(transformed_data)
            
            if transformed_data.empty:
                results["transform"]["message"] = "Transformation resulted in empty dataset"
            else:
                results["transform"]["message"] = f"Transformed {len(transformed_data)} records"
        except Exception as e:
            results["transform"]["message"] = f"Error during transformation: {str(e)}"
            logger.error(f"Transform error: {str(e)}")
            return results
            
        if transformed_data.empty:
            return results
            
        # Validate
        try:
            validation = self.validate_data(transformed_data, data_type)
            results["validate"]["success"] = validation["valid"]
            results["validate"]["valid_records"] = validation["records_valid"]
            results["validate"]["invalid_records"] = validation["records_invalid"]
            
            if validation["valid"]:
                results["validate"]["message"] = f"Validated {validation['records_valid']} records successfully"
            else:
                error_fields = len(validation.get("field_errors", {}))
                results["validate"]["message"] = f"Validation failed with errors in {error_fields} fields"
        except Exception as e:
            results["validate"]["message"] = f"Error during validation: {str(e)}"
            return results
            
        # Load
        try:
            load_success = self.load_data(transformed_data, data_type, if_exists)
            results["load"]["success"] = load_success
            results["load"]["records"] = len(transformed_data)
            
            if load_success:
                results["load"]["message"] = f"Loaded {len(transformed_data)} records into {data_type}_data table"
                results["status"] = "success"
                results["message"] = f"ETL pipeline completed successfully for {data_type} data"
            else:
                results["load"]["message"] = "Failed to load data into database"
        except Exception as e:
            results["load"]["message"] = f"Error during load: {str(e)}"
            
        return results

def get_enhanced_etl(db_connection_string: Optional[str] = None) -> EnhancedETL:
    """
    Factory function to create an EnhancedETL instance
    
    Args:
        db_connection_string: Database connection string
        
    Returns:
        EnhancedETL instance
    """
    if db_connection_string:
        engine = create_engine(db_connection_string)
        return EnhancedETL(db_engine=engine)
    else:
        # Check if app is available in context
        try:
            from app import db
            return EnhancedETL(db_engine=db.engine)
        except ImportError:
            # No database engine available
            logger.warning("No database engine provided, some ETL operations will be unavailable")
            return EnhancedETL()
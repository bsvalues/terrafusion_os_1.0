#!/usr/bin/env python3
"""
Cost Matrix ETL Processor for CostForge AI Champion

Advanced ETL pipeline for processing cost matrix data from various sources
including Excel files, CSV data, and legacy databases.

Features:
- Multi-format data ingestion (Excel, CSV, JSON)
- Data validation and cleansing
- Regional cost adjustments
- Quality level standardization
- Database integration
- Error logging and reporting
"""

import os
import sys
import json
import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
import argparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('etl_processing.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class CostMatrixProcessor:
    """Main ETL processor for cost matrix data."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize the processor with configuration."""
        self.config = self._load_config(config_path)
        self.db_connection = None
        self.processed_data = []
        self.validation_errors = []
        
    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load configuration from file or use defaults."""
        default_config = {
            "database": {
                "type": "sqlite",
                "path": "cost_matrix.db",
                "postgres": {
                    "host": "localhost",
                    "port": 5432,
                    "database": "costforge",
                    "user": "costforge",
                    "password": ""
                }
            },
            "validation": {
                "min_cost_per_sqft": 50,
                "max_cost_per_sqft": 1000,
                "required_columns": ["region", "building_type", "cost_per_sqft", "quality_level"],
                "valid_building_types": ["Residential", "Commercial", "Industrial", "Agricultural"],
                "valid_quality_levels": ["Excellent", "Good", "Average", "Fair", "Poor"],
                "valid_regions": ["Benton", "Urban", "Rural"]
            },
            "processing": {
                "regional_adjustments": {
                    "Benton": 1.0,
                    "Urban": 1.2,
                    "Rural": 0.8
                },
                "quality_multipliers": {
                    "Excellent": 1.3,
                    "Good": 1.0,
                    "Average": 0.9,
                    "Fair": 0.8,
                    "Poor": 0.6
                }
            }
        }
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    user_config = json.load(f)
                    default_config.update(user_config)
            except Exception as e:
                logger.warning(f"Failed to load config from {config_path}: {e}")
        
        return default_config
    
    def connect_database(self) -> bool:
        """Establish database connection."""
        try:
            db_config = self.config["database"]
            
            if db_config["type"] == "postgres":
                pg_config = db_config["postgres"]
                self.db_connection = psycopg2.connect(
                    host=pg_config["host"],
                    port=pg_config["port"],
                    database=pg_config["database"],
                    user=pg_config["user"],
                    password=pg_config.get("password", "")
                )
                logger.info("Connected to PostgreSQL database")
            else:
                # SQLite fallback
                self.db_connection = sqlite3.connect(db_config["path"])
                self.db_connection.row_factory = sqlite3.Row
                logger.info(f"Connected to SQLite database: {db_config['path']}")
            
            self._initialize_tables()
            return True
            
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return False
    
    def _initialize_tables(self):
        """Create necessary database tables if they don't exist."""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS cost_matrices (
            id SERIAL PRIMARY KEY,
            region VARCHAR(100) NOT NULL,
            building_type VARCHAR(100) NOT NULL,
            cost_per_sqft DECIMAL(10,2) NOT NULL,
            quality_level VARCHAR(50) NOT NULL,
            effective_date DATE DEFAULT CURRENT_DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata JSONB,
            source_file VARCHAR(255),
            UNIQUE(region, building_type, quality_level, effective_date)
        );
        """
        
        # Adjust for SQLite
        if isinstance(self.db_connection, sqlite3.Connection):
            create_table_sql = create_table_sql.replace("SERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
            create_table_sql = create_table_sql.replace("JSONB", "TEXT")
            create_table_sql = create_table_sql.replace("CURRENT_TIMESTAMP", "datetime('now')")
            create_table_sql = create_table_sql.replace("CURRENT_DATE", "date('now')")
        
        cursor = self.db_connection.cursor()
        cursor.execute(create_table_sql)
        self.db_connection.commit()
        logger.info("Database tables initialized")
    
    def process_file(self, file_path: str) -> bool:
        """Process a single file and extract cost matrix data."""
        try:
            file_path = Path(file_path)
            logger.info(f"Processing file: {file_path}")
            
            if not file_path.exists():
                logger.error(f"File not found: {file_path}")
                return False
            
            # Determine file type and process accordingly
            if file_path.suffix.lower() in ['.xlsx', '.xls']:
                data = self._process_excel_file(file_path)
            elif file_path.suffix.lower() == '.csv':
                data = self._process_csv_file(file_path)
            elif file_path.suffix.lower() == '.json':
                data = self._process_json_file(file_path)
            else:
                logger.error(f"Unsupported file type: {file_path.suffix}")
                return False
            
            if data is not None and not data.empty:
                # Validate and process the data
                validated_data = self._validate_data(data, str(file_path))
                if not validated_data.empty:
                    processed_data = self._process_data(validated_data, str(file_path))
                    self.processed_data.extend(processed_data)
                    logger.info(f"Successfully processed {len(processed_data)} records from {file_path}")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")
            return False
    
    def _process_excel_file(self, file_path: Path) -> pd.DataFrame:
        """Process Excel file and extract cost matrix data."""
        try:
            # Try to read all sheets first
            excel_file = pd.ExcelFile(file_path)
            logger.info(f"Excel sheets found: {excel_file.sheet_names}")
            
            all_data = []
            
            for sheet_name in excel_file.sheet_names:
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet_name)
                    
                    # Look for cost matrix patterns in headers
                    if self._is_cost_matrix_sheet(df):
                        logger.info(f"Processing cost matrix sheet: {sheet_name}")
                        matrix_data = self._extract_matrix_data(df, sheet_name)
                        if not matrix_data.empty:
                            all_data.append(matrix_data)
                    
                except Exception as e:
                    logger.warning(f"Error processing sheet {sheet_name}: {e}")
                    continue
            
            if all_data:
                return pd.concat(all_data, ignore_index=True)
            else:
                logger.warning("No cost matrix data found in Excel file")
                return pd.DataFrame()
                
        except Exception as e:
            logger.error(f"Error reading Excel file {file_path}: {e}")
            return pd.DataFrame()
    
    def _is_cost_matrix_sheet(self, df: pd.DataFrame) -> bool:
        """Check if a sheet contains cost matrix data."""
        if df.empty:
            return False
        
        # Look for typical cost matrix column patterns
        columns_lower = [col.lower() if isinstance(col, str) else str(col).lower() for col in df.columns]
        
        cost_indicators = ['cost', 'price', 'rate', 'sqft', 'square', 'foot']
        type_indicators = ['type', 'category', 'class']
        region_indicators = ['region', 'area', 'zone', 'location']
        
        has_cost = any(indicator in ' '.join(columns_lower) for indicator in cost_indicators)
        has_type = any(indicator in ' '.join(columns_lower) for indicator in type_indicators)
        has_region = any(indicator in ' '.join(columns_lower) for indicator in region_indicators)
        
        return has_cost and (has_type or has_region)
    
    def _extract_matrix_data(self, df: pd.DataFrame, sheet_name: str) -> pd.DataFrame:
        """Extract and normalize cost matrix data from a DataFrame."""
        try:
            # Common column mapping patterns
            column_mappings = {
                'region': ['region', 'area', 'zone', 'location', 'county'],
                'building_type': ['type', 'building_type', 'property_type', 'category', 'class'],
                'cost_per_sqft': ['cost_per_sqft', 'cost/sqft', 'rate', 'price_per_sqft', 'unit_cost'],
                'quality_level': ['quality', 'grade', 'quality_level', 'condition']
            }
            
            # Normalize column names
            df_normalized = df.copy()
            df_normalized.columns = [col.lower().strip().replace(' ', '_') if isinstance(col, str) else str(col).lower().strip().replace(' ', '_') for col in df.columns]
            
            extracted_data = []
            
            # Try to map columns automatically
            mapped_columns = {}
            for target_col, possible_names in column_mappings.items():
                for col_name in df_normalized.columns:
                    if any(name in col_name for name in possible_names):
                        mapped_columns[target_col] = col_name
                        break
            
            logger.info(f"Column mappings found: {mapped_columns}")
            
            if len(mapped_columns) >= 2:  # At least cost and one identifier
                # Extract mapped data
                for _, row in df_normalized.iterrows():
                    try:
                        record = {
                            'region': row.get(mapped_columns.get('region', ''), 'Benton'),
                            'building_type': row.get(mapped_columns.get('building_type', ''), 'Residential'),
                            'cost_per_sqft': self._parse_cost(row.get(mapped_columns.get('cost_per_sqft', ''), 0)),
                            'quality_level': row.get(mapped_columns.get('quality_level', ''), 'Average'),
                            'source_sheet': sheet_name,
                            'metadata': {
                                'source_sheet': sheet_name,
                                'extraction_method': 'automatic_mapping'
                            }
                        }
                        
                        # Validate basic data
                        if record['cost_per_sqft'] > 0:
                            extracted_data.append(record)
                    
                    except Exception as e:
                        logger.warning(f"Error processing row: {e}")
                        continue
            
            return pd.DataFrame(extracted_data)
            
        except Exception as e:
            logger.error(f"Error extracting matrix data from sheet {sheet_name}: {e}")
            return pd.DataFrame()
    
    def _parse_cost(self, value: Any) -> float:
        """Parse cost value from various formats."""
        if pd.isna(value):
            return 0.0
        
        if isinstance(value, (int, float)):
            return float(value)
        
        if isinstance(value, str):
            # Remove common formatting characters
            cleaned = value.replace('$', '').replace(',', '').replace(' ', '').strip()
            try:
                return float(cleaned)
            except ValueError:
                return 0.0
        
        return 0.0
    
    def _process_csv_file(self, file_path: Path) -> pd.DataFrame:
        """Process CSV file."""
        try:
            df = pd.read_csv(file_path)
            logger.info(f"Loaded CSV with {len(df)} rows and columns: {list(df.columns)}")
            return df
        except Exception as e:
            logger.error(f"Error reading CSV file {file_path}: {e}")
            return pd.DataFrame()
    
    def _process_json_file(self, file_path: Path) -> pd.DataFrame:
        """Process JSON file."""
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            if isinstance(data, list):
                df = pd.DataFrame(data)
            elif isinstance(data, dict):
                # Try to extract array data from common structures
                for key in ['data', 'records', 'items', 'cost_matrices']:
                    if key in data and isinstance(data[key], list):
                        df = pd.DataFrame(data[key])
                        break
                else:
                    df = pd.DataFrame([data])
            else:
                logger.error(f"Unsupported JSON structure in {file_path}")
                return pd.DataFrame()
            
            logger.info(f"Loaded JSON with {len(df)} records")
            return df
            
        except Exception as e:
            logger.error(f"Error reading JSON file {file_path}: {e}")
            return pd.DataFrame()
    
    def _validate_data(self, data: pd.DataFrame, source_file: str) -> pd.DataFrame:
        """Validate and clean the data."""
        try:
            validation_config = self.config["validation"]
            errors_for_file = []
            
            # Check required columns
            required_cols = validation_config["required_columns"]
            missing_cols = [col for col in required_cols if col not in data.columns]
            
            if missing_cols:
                # Try to add missing columns with defaults
                for col in missing_cols:
                    if col == 'region':
                        data[col] = 'Benton'
                    elif col == 'building_type':
                        data[col] = 'Residential'
                    elif col == 'quality_level':
                        data[col] = 'Average'
                    else:
                        data[col] = None
                
                logger.warning(f"Added missing columns with defaults: {missing_cols}")
            
            # Validate cost ranges
            invalid_costs = (
                (data['cost_per_sqft'] < validation_config["min_cost_per_sqft"]) |
                (data['cost_per_sqft'] > validation_config["max_cost_per_sqft"])
            )
            
            if invalid_costs.any():
                error_count = invalid_costs.sum()
                errors_for_file.append(f"Found {error_count} records with invalid cost ranges")
                # Remove invalid records
                data = data[~invalid_costs]
            
            # Standardize building types
            valid_types = validation_config["valid_building_types"]
            data['building_type'] = data['building_type'].apply(
                lambda x: self._standardize_building_type(x, valid_types)
            )
            
            # Standardize quality levels
            valid_quality = validation_config["valid_quality_levels"]
            data['quality_level'] = data['quality_level'].apply(
                lambda x: self._standardize_quality_level(x, valid_quality)
            )
            
            # Standardize regions
            valid_regions = validation_config["valid_regions"]
            data['region'] = data['region'].apply(
                lambda x: self._standardize_region(x, valid_regions)
            )
            
            # Remove duplicates
            initial_count = len(data)
            data = data.drop_duplicates(subset=['region', 'building_type', 'quality_level'])
            duplicate_count = initial_count - len(data)
            
            if duplicate_count > 0:
                logger.info(f"Removed {duplicate_count} duplicate records")
            
            if errors_for_file:
                self.validation_errors.extend([f"{source_file}: {error}" for error in errors_for_file])
            
            logger.info(f"Validated {len(data)} records from {source_file}")
            return data
            
        except Exception as e:
            logger.error(f"Error validating data from {source_file}: {e}")
            return pd.DataFrame()
    
    def _standardize_building_type(self, value: str, valid_types: List[str]) -> str:
        """Standardize building type values."""
        if pd.isna(value):
            return 'Residential'
        
        value_lower = str(value).lower().strip()
        
        # Mapping common variations
        type_mappings = {
            'residential': 'Residential',
            'house': 'Residential',
            'home': 'Residential',
            'single family': 'Residential',
            'commercial': 'Commercial',
            'office': 'Commercial',
            'retail': 'Commercial',
            'store': 'Commercial',
            'industrial': 'Industrial',
            'factory': 'Industrial',
            'warehouse': 'Industrial',
            'manufacturing': 'Industrial',
            'agricultural': 'Agricultural',
            'farm': 'Agricultural',
            'barn': 'Agricultural'
        }
        
        for pattern, standard_type in type_mappings.items():
            if pattern in value_lower:
                return standard_type
        
        # Default fallback
        return 'Residential'
    
    def _standardize_quality_level(self, value: str, valid_levels: List[str]) -> str:
        """Standardize quality level values."""
        if pd.isna(value):
            return 'Average'
        
        value_lower = str(value).lower().strip()
        
        # Mapping common variations
        quality_mappings = {
            'excellent': 'Excellent',
            'superior': 'Excellent',
            'high': 'Excellent',
            'premium': 'Excellent',
            'good': 'Good',
            'fine': 'Good',
            'above average': 'Good',
            'average': 'Average',
            'standard': 'Average',
            'typical': 'Average',
            'normal': 'Average',
            'fair': 'Fair',
            'below average': 'Fair',
            'poor': 'Poor',
            'low': 'Poor',
            'substandard': 'Poor'
        }
        
        for pattern, standard_quality in quality_mappings.items():
            if pattern in value_lower:
                return standard_quality
        
        return 'Average'
    
    def _standardize_region(self, value: str, valid_regions: List[str]) -> str:
        """Standardize region values."""
        if pd.isna(value):
            return 'Benton'
        
        value_lower = str(value).lower().strip()
        
        # Common region patterns
        if 'benton' in value_lower:
            return 'Benton'
        elif any(term in value_lower for term in ['urban', 'city', 'metro']):
            return 'Urban'
        elif any(term in value_lower for term in ['rural', 'country', 'farm']):
            return 'Rural'
        
        return 'Benton'  # Default
    
    def _process_data(self, data: pd.DataFrame, source_file: str) -> List[Dict[str, Any]]:
        """Process and enhance validated data."""
        try:
            processing_config = self.config["processing"]
            processed_records = []
            
            for _, row in data.iterrows():
                try:
                    # Apply regional adjustments
                    base_cost = row['cost_per_sqft']
                    region_adjustment = processing_config["regional_adjustments"].get(row['region'], 1.0)
                    quality_multiplier = processing_config["quality_multipliers"].get(row['quality_level'], 1.0)
                    
                    adjusted_cost = base_cost * region_adjustment * quality_multiplier
                    
                    record = {
                        'region': row['region'],
                        'building_type': row['building_type'],
                        'cost_per_sqft': round(adjusted_cost, 2),
                        'base_cost_per_sqft': round(base_cost, 2),
                        'quality_level': row['quality_level'],
                        'effective_date': datetime.now().date(),
                        'source_file': Path(source_file).name,
                        'metadata': {
                            'source_file': source_file,
                            'region_adjustment': region_adjustment,
                            'quality_multiplier': quality_multiplier,
                            'original_cost': base_cost,
                            'processing_date': datetime.now().isoformat(),
                            **row.get('metadata', {})
                        }
                    }
                    
                    processed_records.append(record)
                    
                except Exception as e:
                    logger.warning(f"Error processing record: {e}")
                    continue
            
            logger.info(f"Processed {len(processed_records)} records with adjustments")
            return processed_records
            
        except Exception as e:
            logger.error(f"Error processing data: {e}")
            return []
    
    def save_to_database(self) -> bool:
        """Save processed data to database."""
        if not self.processed_data:
            logger.warning("No processed data to save")
            return False
        
        if not self.db_connection:
            logger.error("No database connection available")
            return False
        
        try:
            cursor = self.db_connection.cursor()
            
            insert_sql = """
            INSERT INTO cost_matrices 
            (region, building_type, cost_per_sqft, quality_level, effective_date, metadata, source_file)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (region, building_type, quality_level, effective_date) 
            DO UPDATE SET 
                cost_per_sqft = EXCLUDED.cost_per_sqft,
                metadata = EXCLUDED.metadata,
                updated_at = CURRENT_TIMESTAMP
            """
            
            # Adjust for SQLite
            if isinstance(self.db_connection, sqlite3.Connection):
                insert_sql = """
                INSERT OR REPLACE INTO cost_matrices 
                (region, building_type, cost_per_sqft, quality_level, effective_date, metadata, source_file)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """
            
            records_saved = 0
            for record in self.processed_data:
                try:
                    values = (
                        record['region'],
                        record['building_type'],
                        record['cost_per_sqft'],
                        record['quality_level'],
                        record['effective_date'],
                        json.dumps(record['metadata']),
                        record['source_file']
                    )
                    
                    cursor.execute(insert_sql, values)
                    records_saved += 1
                    
                except Exception as e:
                    logger.warning(f"Error saving record: {e}")
                    continue
            
            self.db_connection.commit()
            logger.info(f"Successfully saved {records_saved} records to database")
            return True
            
        except Exception as e:
            logger.error(f"Error saving to database: {e}")
            self.db_connection.rollback()
            return False
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate processing report."""
        return {
            'timestamp': datetime.now().isoformat(),
            'records_processed': len(self.processed_data),
            'validation_errors': self.validation_errors,
            'summary': {
                'regions': list(set(record['region'] for record in self.processed_data)),
                'building_types': list(set(record['building_type'] for record in self.processed_data)),
                'quality_levels': list(set(record['quality_level'] for record in self.processed_data)),
                'cost_range': {
                    'min': min(record['cost_per_sqft'] for record in self.processed_data) if self.processed_data else 0,
                    'max': max(record['cost_per_sqft'] for record in self.processed_data) if self.processed_data else 0,
                    'avg': sum(record['cost_per_sqft'] for record in self.processed_data) / len(self.processed_data) if self.processed_data else 0
                }
            }
        }

def main():
    """Main CLI interface."""
    parser = argparse.ArgumentParser(description='Process cost matrix data files')
    parser.add_argument('files', nargs='+', help='Input files to process')
    parser.add_argument('--config', help='Configuration file path')
    parser.add_argument('--output-report', help='Output report file path')
    parser.add_argument('--no-database', action='store_true', help='Skip database operations')
    
    args = parser.parse_args()
    
    # Initialize processor
    processor = CostMatrixProcessor(args.config)
    
    # Connect to database unless skipped
    if not args.no_database:
        if not processor.connect_database():
            logger.error("Failed to connect to database")
            sys.exit(1)
    
    # Process files
    success_count = 0
    for file_path in args.files:
        if processor.process_file(file_path):
            success_count += 1
        else:
            logger.error(f"Failed to process {file_path}")
    
    logger.info(f"Successfully processed {success_count}/{len(args.files)} files")
    
    # Save to database
    if not args.no_database and processor.processed_data:
        if processor.save_to_database():
            logger.info("Data successfully saved to database")
        else:
            logger.error("Failed to save data to database")
    
    # Generate and save report
    report = processor.generate_report()
    
    if args.output_report:
        with open(args.output_report, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        logger.info(f"Report saved to {args.output_report}")
    else:
        print(json.dumps(report, indent=2, default=str))

if __name__ == '__main__':
    main()
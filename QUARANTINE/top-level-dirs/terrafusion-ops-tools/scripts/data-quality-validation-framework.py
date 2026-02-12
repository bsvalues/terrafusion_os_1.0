#!/usr/bin/env python3

"""
TerraFusion Data Quality Validation Framework
Advanced data quality assessment with automated validation rules and data profiling
Features: Data profiling, quality rules, anomaly detection, data lineage, quality scoring
"""

import os
import json
import asyncio
import time
import psycopg2
import redis
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple, Set, Union
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import great_expectations as ge
from great_expectations.core.batch import RuntimeBatchRequest
from great_expectations.data_context import DataContext
import pandera as pa
from pandera import Column, DataFrameSchema, Check
import pydantic
from pydantic import BaseModel, Field, validator
import sqlalchemy
from sqlalchemy import create_engine, text
import hashlib
import re
from collections import defaultdict
import matplotlib.pyplot as plt
import seaborn as sns

class DataQualityDimension(Enum):
    COMPLETENESS = "completeness"
    ACCURACY = "accuracy"
    CONSISTENCY = "consistency"
    VALIDITY = "validity"
    UNIQUENESS = "uniqueness"
    TIMELINESS = "timeliness"
    RELEVANCE = "relevance"
    INTEGRITY = "integrity"

class ValidationSeverity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class DataType(Enum):
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    DATE = "date"
    TIMESTAMP = "timestamp"
    JSON = "json"
    UUID = "uuid"

@dataclass
class DataQualityRule:
    rule_id: str
    name: str
    description: str
    dimension: DataQualityDimension
    severity: ValidationSeverity
    rule_type: str
    rule_expression: str
    target_table: str
    target_columns: List[str]
    threshold: Optional[float]
    is_active: bool
    created_at: datetime

@dataclass
class DataQualityIssue:
    issue_id: str
    rule_id: str
    table_name: str
    column_name: Optional[str]
    issue_type: str
    severity: ValidationSeverity
    description: str
    affected_rows: int
    total_rows: int
    failure_rate: float
    sample_data: List[Any]
    detected_at: datetime

@dataclass
class DataProfileResult:
    table_name: str
    column_name: str
    data_type: DataType
    row_count: int
    null_count: int
    unique_count: int
    completeness_ratio: float
    uniqueness_ratio: float
    min_value: Any
    max_value: Any
    mean_value: Any
    std_deviation: Any
    most_common_values: List[Tuple[Any, int]]
    data_distribution: Dict[str, Any]
    profiled_at: datetime

@dataclass
class DataLineageEntry:
    entry_id: str
    source_table: str
    source_column: str
    target_table: str
    target_column: str
    transformation_logic: str
    dependency_type: str
    created_at: datetime

class DataQualityValidationFramework:
    def __init__(self):
        self.session_id = f"data_quality_{int(time.time())}"
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        
        # Data quality configuration
        self.quality_rules = {}
        self.validation_results = {}
        self.data_profiles = {}
        self.data_lineage = {}
        
        # Great Expectations context
        self.ge_context = None
        self.setup_great_expectations()
        
        # SQLAlchemy engine for data operations
        self.engine = create_engine('postgresql://postgres@localhost/terrafusion')
        
        # Anomaly detection model
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
        
        # Configure logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Initialize data quality tables
        self.init_data_quality_tables()
        
        # Load default quality rules
        asyncio.create_task(self.load_default_quality_rules())
        
    def setup_great_expectations(self):
        """Setup Great Expectations data context"""
        try:
            # Create GE context
            context_root_dir = Path("./great_expectations")
            context_root_dir.mkdir(exist_ok=True)
            
            self.ge_context = DataContext.create(context_root_dir)
            self.logger.info("Great Expectations context initialized")
            
        except Exception as e:
            self.logger.warning(f"Failed to initialize Great Expectations: {e}")
            self.ge_context = None
            
    def init_data_quality_tables(self):
        """Initialize data quality validation database tables"""
        cur = self.db_conn.cursor()
        
        # Data quality rules table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS data_quality_rules (
                id SERIAL PRIMARY KEY,
                rule_id VARCHAR(100) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                dimension VARCHAR(50) NOT NULL,
                severity VARCHAR(20) NOT NULL,
                rule_type VARCHAR(50) NOT NULL,
                rule_expression TEXT NOT NULL,
                target_table VARCHAR(100) NOT NULL,
                target_columns JSONB,
                threshold FLOAT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Data quality issues table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS data_quality_issues (
                id SERIAL PRIMARY KEY,
                issue_id VARCHAR(100) UNIQUE NOT NULL,
                rule_id VARCHAR(100) REFERENCES data_quality_rules(rule_id),
                table_name VARCHAR(100) NOT NULL,
                column_name VARCHAR(100),
                issue_type VARCHAR(50) NOT NULL,
                severity VARCHAR(20) NOT NULL,
                description TEXT,
                affected_rows INTEGER,
                total_rows INTEGER,
                failure_rate FLOAT,
                sample_data JSONB,
                status VARCHAR(20) DEFAULT 'open',
                detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Data profiles table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS data_profiles (
                id SERIAL PRIMARY KEY,
                profile_id VARCHAR(100) UNIQUE NOT NULL,
                table_name VARCHAR(100) NOT NULL,
                column_name VARCHAR(100) NOT NULL,
                data_type VARCHAR(50),
                row_count INTEGER,
                null_count INTEGER,
                unique_count INTEGER,
                completeness_ratio FLOAT,
                uniqueness_ratio FLOAT,
                min_value TEXT,
                max_value TEXT,
                mean_value FLOAT,
                std_deviation FLOAT,
                most_common_values JSONB,
                data_distribution JSONB,
                profiled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (table_name, column_name),
                INDEX (profiled_at)
            )
        """)
        
        # Data lineage table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS data_lineage (
                id SERIAL PRIMARY KEY,
                entry_id VARCHAR(100) UNIQUE NOT NULL,
                source_table VARCHAR(100) NOT NULL,
                source_column VARCHAR(100),
                target_table VARCHAR(100) NOT NULL,
                target_column VARCHAR(100),
                transformation_logic TEXT,
                dependency_type VARCHAR(50),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Data quality metrics table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS data_quality_metrics (
                id SERIAL PRIMARY KEY,
                metric_id VARCHAR(100) UNIQUE NOT NULL,
                table_name VARCHAR(100) NOT NULL,
                dimension VARCHAR(50) NOT NULL,
                metric_value FLOAT NOT NULL,
                threshold_value FLOAT,
                status VARCHAR(20),
                measurement_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (table_name, dimension),
                INDEX (measurement_timestamp)
            )
        """)
        
        self.db_conn.commit()
        self.logger.info("Data quality validation database tables initialized")
        
    async def start_data_quality_system(self):
        """Start data quality validation framework"""
        self.logger.info("🔍 Starting Data Quality Validation Framework...")
        
        tasks = [
            asyncio.create_task(self.continuous_data_profiling()),
            asyncio.create_task(self.automated_quality_validation()),
            asyncio.create_task(self.data_anomaly_detection()),
            asyncio.create_task(self.data_lineage_tracking()),
            asyncio.create_task(self.quality_metrics_calculation()),
            asyncio.create_task(self.quality_issue_monitoring()),
            asyncio.create_task(self.data_drift_detection()),
            asyncio.create_task(self.quality_reporting_engine())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            self.logger.info("🛑 Stopping data quality validation framework...")
            for task in tasks:
                task.cancel()
                
    async def continuous_data_profiling(self):
        """Continuously profile data quality across all tables"""
        while True:
            try:
                await self.run_comprehensive_data_profiling()
                await asyncio.sleep(3600)  # Profile every hour
                
            except Exception as e:
                self.logger.error(f"Error in data profiling: {e}")
                await asyncio.sleep(3600)
                
    async def run_comprehensive_data_profiling(self):
        """Run comprehensive data profiling for all tables"""
        try:
            self.logger.info("📊 Running comprehensive data profiling...")
            
            # Get list of tables to profile
            tables_to_profile = await self.get_tables_for_profiling()
            
            for table_name in tables_to_profile:
                try:
                    await self.profile_table_data(table_name)
                except Exception as e:
                    self.logger.error(f"Error profiling table {table_name}: {e}")
                    
            self.logger.info(f"Data profiling completed for {len(tables_to_profile)} tables")
            
        except Exception as e:
            self.logger.error(f"Error in comprehensive data profiling: {e}")
            
    async def get_tables_for_profiling(self) -> List[str]:
        """Get list of tables that need profiling"""
        try:
            cur = self.db_conn.cursor()
            
            # Get all user tables
            cur.execute("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
                AND tablename NOT LIKE 'pg_%'
                AND tablename NOT LIKE 'sql_%'
                ORDER BY tablename
            """)
            
            tables = [row[0] for row in cur.fetchall()]
            
            # Filter out system tables and temporary tables
            filtered_tables = [
                table for table in tables 
                if not table.startswith('temp_') and not table.startswith('tmp_')
            ]
            
            return filtered_tables
            
        except Exception as e:
            self.logger.error(f"Error getting tables for profiling: {e}")
            return []
            
    async def profile_table_data(self, table_name: str):
        """Profile data quality for a specific table"""
        try:
            self.logger.info(f"📊 Profiling table: {table_name}")
            
            # Get table column information
            columns_info = await self.get_table_columns(table_name)
            
            if not columns_info:
                return
                
            # Profile each column
            for column_info in columns_info:
                column_name = column_info['column_name']
                data_type = column_info['data_type']
                
                try:
                    profile_result = await self.profile_column_data(table_name, column_name, data_type)
                    if profile_result:
                        await self.store_data_profile(profile_result)
                        
                except Exception as e:
                    self.logger.error(f"Error profiling column {table_name}.{column_name}: {e}")
                    
        except Exception as e:
            self.logger.error(f"Error profiling table {table_name}: {e}")
            
    async def get_table_columns(self, table_name: str) -> List[Dict[str, Any]]:
        """Get column information for a table"""
        try:
            cur = self.db_conn.cursor()
            
            cur.execute("""
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns 
                WHERE table_name = %s 
                AND table_schema = 'public'
                ORDER BY ordinal_position
            """, (table_name,))
            
            columns = []
            for row in cur.fetchall():
                columns.append({
                    'column_name': row[0],
                    'data_type': row[1],
                    'is_nullable': row[2] == 'YES',
                    'column_default': row[3]
                })
                
            return columns
            
        except Exception as e:
            self.logger.error(f"Error getting columns for table {table_name}: {e}")
            return []
            
    async def profile_column_data(self, table_name: str, column_name: str, data_type: str) -> Optional[DataProfileResult]:
        """Profile data quality for a specific column"""
        try:
            cur = self.db_conn.cursor()
            
            # Get basic statistics
            cur.execute(f"""
                SELECT 
                    COUNT(*) as total_rows,
                    COUNT("{column_name}") as non_null_count,
                    COUNT(DISTINCT "{column_name}") as unique_count
                FROM "{table_name}"
            """)
            
            basic_stats = cur.fetchone()
            total_rows = basic_stats[0]
            non_null_count = basic_stats[1]
            unique_count = basic_stats[2]
            
            if total_rows == 0:
                return None
                
            null_count = total_rows - non_null_count
            completeness_ratio = non_null_count / total_rows
            uniqueness_ratio = unique_count / total_rows if total_rows > 0 else 0
            
            # Get min/max values
            min_value = None
            max_value = None
            mean_value = None
            std_deviation = None
            
            try:
                if data_type in ['integer', 'bigint', 'numeric', 'real', 'double precision']:
                    cur.execute(f"""
                        SELECT 
                            MIN("{column_name}"),
                            MAX("{column_name}"),
                            AVG("{column_name}"::numeric),
                            STDDEV("{column_name}"::numeric)
                        FROM "{table_name}"
                        WHERE "{column_name}" IS NOT NULL
                    """)
                    
                    numeric_stats = cur.fetchone()
                    if numeric_stats:
                        min_value = float(numeric_stats[0]) if numeric_stats[0] is not None else None
                        max_value = float(numeric_stats[1]) if numeric_stats[1] is not None else None
                        mean_value = float(numeric_stats[2]) if numeric_stats[2] is not None else None
                        std_deviation = float(numeric_stats[3]) if numeric_stats[3] is not None else None
                        
                elif data_type in ['character varying', 'text', 'character']:
                    cur.execute(f"""
                        SELECT 
                            MIN(LENGTH("{column_name}")) as min_length,
                            MAX(LENGTH("{column_name}")) as max_length,
                            AVG(LENGTH("{column_name}")) as avg_length
                        FROM "{table_name}"
                        WHERE "{column_name}" IS NOT NULL
                    """)
                    
                    string_stats = cur.fetchone()
                    if string_stats:
                        min_value = string_stats[0]
                        max_value = string_stats[1]
                        mean_value = float(string_stats[2]) if string_stats[2] is not None else None
                        
                elif data_type in ['date', 'timestamp', 'timestamp with time zone']:
                    cur.execute(f"""
                        SELECT 
                            MIN("{column_name}"),
                            MAX("{column_name}")
                        FROM "{table_name}"
                        WHERE "{column_name}" IS NOT NULL
                    """)
                    
                    date_stats = cur.fetchone()
                    if date_stats:
                        min_value = str(date_stats[0]) if date_stats[0] is not None else None
                        max_value = str(date_stats[1]) if date_stats[1] is not None else None
                        
            except Exception as e:
                self.logger.debug(f"Error getting min/max for {table_name}.{column_name}: {e}")
                
            # Get most common values
            most_common_values = []
            try:
                cur.execute(f"""
                    SELECT 
                        "{column_name}",
                        COUNT(*) as frequency
                    FROM "{table_name}"
                    WHERE "{column_name}" IS NOT NULL
                    GROUP BY "{column_name}"
                    ORDER BY frequency DESC
                    LIMIT 10
                """)
                
                most_common_values = [(row[0], row[1]) for row in cur.fetchall()]
                
            except Exception as e:
                self.logger.debug(f"Error getting most common values for {table_name}.{column_name}: {e}")
                
            # Create data distribution info
            data_distribution = {
                'type': data_type,
                'total_rows': total_rows,
                'null_percentage': (null_count / total_rows) * 100 if total_rows > 0 else 0,
                'unique_percentage': (unique_count / total_rows) * 100 if total_rows > 0 else 0
            }
            
            # Determine data type enum
            data_type_enum = self.map_db_type_to_enum(data_type)
            
            profile_result = DataProfileResult(
                table_name=table_name,
                column_name=column_name,
                data_type=data_type_enum,
                row_count=total_rows,
                null_count=null_count,
                unique_count=unique_count,
                completeness_ratio=completeness_ratio,
                uniqueness_ratio=uniqueness_ratio,
                min_value=min_value,
                max_value=max_value,
                mean_value=mean_value,
                std_deviation=std_deviation,
                most_common_values=most_common_values,
                data_distribution=data_distribution,
                profiled_at=datetime.now()
            )
            
            return profile_result
            
        except Exception as e:
            self.logger.error(f"Error profiling column {table_name}.{column_name}: {e}")
            return None
            
    def map_db_type_to_enum(self, db_type: str) -> DataType:
        """Map database type to DataType enum"""
        type_mapping = {
            'integer': DataType.INTEGER,
            'bigint': DataType.INTEGER,
            'smallint': DataType.INTEGER,
            'numeric': DataType.FLOAT,
            'real': DataType.FLOAT,
            'double precision': DataType.FLOAT,
            'character varying': DataType.STRING,
            'text': DataType.STRING,
            'character': DataType.STRING,
            'boolean': DataType.BOOLEAN,
            'date': DataType.DATE,
            'timestamp': DataType.TIMESTAMP,
            'timestamp with time zone': DataType.TIMESTAMP,
            'uuid': DataType.UUID,
            'json': DataType.JSON,
            'jsonb': DataType.JSON
        }
        
        return type_mapping.get(db_type.lower(), DataType.STRING)
        
    async def store_data_profile(self, profile: DataProfileResult):
        """Store data profile results in database"""
        try:
            cur = self.db_conn.cursor()
            
            profile_id = f"profile_{profile.table_name}_{profile.column_name}_{int(time.time())}"
            
            cur.execute("""
                INSERT INTO data_profiles 
                (profile_id, table_name, column_name, data_type, row_count, null_count, 
                 unique_count, completeness_ratio, uniqueness_ratio, min_value, max_value,
                 mean_value, std_deviation, most_common_values, data_distribution, profiled_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                profile_id,
                profile.table_name,
                profile.column_name,
                profile.data_type.value,
                profile.row_count,
                profile.null_count,
                profile.unique_count,
                profile.completeness_ratio,
                profile.uniqueness_ratio,
                str(profile.min_value) if profile.min_value is not None else None,
                str(profile.max_value) if profile.max_value is not None else None,
                profile.mean_value,
                profile.std_deviation,
                json.dumps(profile.most_common_values),
                json.dumps(profile.data_distribution),
                profile.profiled_at
            ))
            
            self.db_conn.commit()
            
        except Exception as e:
            self.logger.error(f"Error storing data profile: {e}")

async def main():
    """Main function to start data quality validation framework"""
    print("🔍 Starting TerraFusion Data Quality Validation Framework...")
    print("=" * 70)
    print("Capabilities:")
    print("  • Comprehensive data profiling")
    print("  • Automated quality validation rules")
    print("  • Data anomaly detection")
    print("  • Data lineage tracking")
    print("  • Quality metrics calculation")
    print("  • Data drift detection")
    print("  • Quality issue monitoring")
    print("  • Automated quality reporting")
    print("=" * 70)
    
    quality_framework = DataQualityValidationFramework()
    
    try:
        # Demo: Run initial data profiling
        print("\n📊 Running initial data profiling...")
        await quality_framework.run_comprehensive_data_profiling()
        
        # Start data quality system
        await quality_framework.start_data_quality_system()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down data quality framework...")
    except Exception as e:
        print(f"\n❌ Error in data quality framework: {e}")
        raise

if __name__ == '__main__':
    asyncio.run(main())
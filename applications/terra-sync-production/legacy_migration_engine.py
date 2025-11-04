import os
import json
import logging
import sqlite3
import psycopg2
import pymssql
import cx_Oracle
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from abc import ABC, abstractmethod
import pandas as pd
import sqlalchemy as sa
from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.dialects import postgresql, mssql, oracle, mysql
import hashlib
import traceback

@dataclass
class DatabaseSchema:
    table_name: str
    columns: List[Dict[str, Any]]
    primary_key: List[str]
    foreign_keys: List[Dict[str, Any]]
    indexes: List[Dict[str, Any]]
    constraints: List[Dict[str, Any]]
    row_count: int = 0
    data_types: Dict[str, str] = None

@dataclass
class MigrationJob:
    job_id: str
    source_database: str
    target_database: str
    tables_to_migrate: List[str]
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_log: List[str] = None
    validation_results: Dict[str, Any] = None
    rollback_plan: Dict[str, Any] = None

class DatabaseConnector(ABC):
    """Abstract base class for database connections"""
    
    @abstractmethod
    def connect(self) -> Any:
        pass
    
    @abstractmethod
    def get_schema(self, table_name: str = None) -> List[DatabaseSchema]:
        pass
    
    @abstractmethod
    def extract_data(self, table_name: str, batch_size: int = 10000) -> pd.DataFrame:
        pass
    
    @abstractmethod
    def validate_connection(self) -> bool:
        pass

class LegacyPACSConnector(DatabaseConnector):
    """Connector for legacy PACS systems (typically AS/400, Oracle, SQL Server)"""
    
    def __init__(self, connection_string: str, database_type: str):
        self.connection_string = connection_string
        self.database_type = database_type.lower()
        self.connection = None
        self.logger = logging.getLogger(__name__)
        
    def connect(self):
        try:
            if self.database_type == 'oracle':
                self.connection = cx_Oracle.connect(self.connection_string)
            elif self.database_type == 'sqlserver':
                self.connection = pymssql.connect(self.connection_string)
            elif self.database_type == 'db2':
                import ibm_db_dbi
                self.connection = ibm_db_dbi.connect(self.connection_string)
            else:
                self.connection = create_engine(self.connection_string)
            return self.connection
        except Exception as e:
            self.logger.error(f"Failed to connect to {self.database_type}: {e}")
            raise
    
    def validate_connection(self) -> bool:
        try:
            if not self.connection:
                self.connect()
            
            if self.database_type == 'oracle':
                cursor = self.connection.cursor()
                cursor.execute("SELECT 1 FROM DUAL")
                result = cursor.fetchone()
                return result[0] == 1
            elif self.database_type == 'sqlserver':
                cursor = self.connection.cursor()
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                return result[0] == 1
            else:
                with self.connection.connect() as conn:
                    result = conn.execute(sa.text("SELECT 1"))
                    return result.scalar() == 1
        except Exception as e:
            self.logger.error(f"Connection validation failed: {e}")
            return False
    
    def get_schema(self, table_name: str = None) -> List[DatabaseSchema]:
        schemas = []
        try:
            if self.database_type == 'oracle':
                schemas = self._get_oracle_schema(table_name)
            elif self.database_type == 'sqlserver':
                schemas = self._get_sqlserver_schema(table_name)
            elif self.database_type == 'db2':
                schemas = self._get_db2_schema(table_name)
            else:
                schemas = self._get_generic_schema(table_name)
        except Exception as e:
            self.logger.error(f"Schema extraction failed: {e}")
            raise
        return schemas
    
    def _get_oracle_schema(self, table_name: str = None) -> List[DatabaseSchema]:
        cursor = self.connection.cursor()
        schemas = []
        
        table_query = """
        SELECT table_name FROM user_tables
        """
        if table_name:
            table_query += f" WHERE table_name = '{table_name.upper()}'"
        
        cursor.execute(table_query)
        tables = cursor.fetchall()
        
        for (table,) in tables:
            cursor.execute(f"""
                SELECT column_name, data_type, data_length, nullable, data_default
                FROM user_tab_columns 
                WHERE table_name = '{table}'
                ORDER BY column_id
            """)
            columns = []
            for col_name, data_type, length, nullable, default in cursor.fetchall():
                columns.append({
                    'name': col_name,
                    'type': data_type,
                    'length': length,
                    'nullable': nullable == 'Y',
                    'default': default
                })
            
            cursor.execute(f"""
                SELECT constraint_name, constraint_type, column_name
                FROM user_cons_columns ucc
                JOIN user_constraints uc ON ucc.constraint_name = uc.constraint_name
                WHERE ucc.table_name = '{table}'
            """)
            constraints = cursor.fetchall()
            
            primary_keys = [col for name, ctype, col in constraints if ctype == 'P']
            foreign_keys = [{'column': col, 'constraint': name} for name, ctype, col in constraints if ctype == 'R']
            
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            row_count = cursor.fetchone()[0]
            
            schema = DatabaseSchema(
                table_name=table,
                columns=columns,
                primary_key=primary_keys,
                foreign_keys=foreign_keys,
                indexes=[],
                constraints=[],
                row_count=row_count
            )
            schemas.append(schema)
        
        return schemas
    
    def _get_sqlserver_schema(self, table_name: str = None) -> List[DatabaseSchema]:
        cursor = self.connection.cursor()
        schemas = []
        
        table_query = """
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        """
        if table_name:
            table_query += f" AND TABLE_NAME = '{table_name}'"
        
        cursor.execute(table_query)
        tables = cursor.fetchall()
        
        for (table,) in tables:
            cursor.execute(f"""
                SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, 
                       IS_NULLABLE, COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '{table}'
                ORDER BY ORDINAL_POSITION
            """)
            columns = []
            for col_name, data_type, length, nullable, default in cursor.fetchall():
                columns.append({
                    'name': col_name,
                    'type': data_type,
                    'length': length,
                    'nullable': nullable == 'YES',
                    'default': default
                })
            
            cursor.execute(f"""
                SELECT kcu.COLUMN_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
                WHERE tc.TABLE_NAME = '{table}' AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
            """)
            primary_keys = [row[0] for row in cursor.fetchall()]
            
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            row_count = cursor.fetchone()[0]
            
            schema = DatabaseSchema(
                table_name=table,
                columns=columns,
                primary_key=primary_keys,
                foreign_keys=[],
                indexes=[],
                constraints=[],
                row_count=row_count
            )
            schemas.append(schema)
        
        return schemas
    
    def extract_data(self, table_name: str, batch_size: int = 10000) -> pd.DataFrame:
        try:
            if self.database_type in ['oracle', 'sqlserver', 'db2']:
                query = f"SELECT * FROM {table_name}"
                return pd.read_sql(query, self.connection, chunksize=batch_size)
            else:
                query = f"SELECT * FROM {table_name}"
                return pd.read_sql(query, self.connection, chunksize=batch_size)
        except Exception as e:
            self.logger.error(f"Data extraction failed for {table_name}: {e}")
            raise

class ModernDatabaseConnector(DatabaseConnector):
    """Connector for modern databases (PostgreSQL, etc.)"""
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.engine = create_engine(connection_string)
        self.logger = logging.getLogger(__name__)
    
    def connect(self):
        return self.engine.connect()
    
    def validate_connection(self) -> bool:
        try:
            with self.engine.connect() as conn:
                result = conn.execute(sa.text("SELECT 1"))
                return result.scalar() == 1
        except Exception as e:
            self.logger.error(f"Modern DB connection validation failed: {e}")
            return False
    
    def get_schema(self, table_name: str = None) -> List[DatabaseSchema]:
        metadata = MetaData()
        metadata.reflect(bind=self.engine)
        schemas = []
        
        tables_to_process = [table_name] if table_name else metadata.tables.keys()
        
        for table_name in tables_to_process:
            if table_name in metadata.tables:
                table = metadata.tables[table_name]
                columns = []
                for column in table.columns:
                    columns.append({
                        'name': column.name,
                        'type': str(column.type),
                        'nullable': column.nullable,
                        'default': str(column.default) if column.default else None
                    })
                
                primary_keys = [col.name for col in table.primary_key]
                foreign_keys = [
                    {
                        'column': fk.parent.name,
                        'referenced_table': fk.column.table.name,
                        'referenced_column': fk.column.name
                    }
                    for fk in table.foreign_keys
                ]
                
                with self.engine.connect() as conn:
                    result = conn.execute(sa.text(f"SELECT COUNT(*) FROM {table_name}"))
                    row_count = result.scalar()
                
                schema = DatabaseSchema(
                    table_name=table_name,
                    columns=columns,
                    primary_key=primary_keys,
                    foreign_keys=foreign_keys,
                    indexes=[],
                    constraints=[],
                    row_count=row_count
                )
                schemas.append(schema)
        
        return schemas
    
    def extract_data(self, table_name: str, batch_size: int = 10000) -> pd.DataFrame:
        try:
            query = f"SELECT * FROM {table_name}"
            return pd.read_sql(query, self.engine, chunksize=batch_size)
        except Exception as e:
            self.logger.error(f"Data extraction failed for {table_name}: {e}")
            raise

class DataTypeMapper:
    """Maps legacy database types to modern PostgreSQL types"""
    
    def __init__(self):
        self.type_mappings = {
            'oracle': {
                'VARCHAR2': 'VARCHAR',
                'NUMBER': 'NUMERIC',
                'DATE': 'TIMESTAMP',
                'CHAR': 'CHAR',
                'CLOB': 'TEXT',
                'BLOB': 'BYTEA',
                'LONG': 'TEXT',
                'RAW': 'BYTEA'
            },
            'sqlserver': {
                'nvarchar': 'VARCHAR',
                'varchar': 'VARCHAR',
                'int': 'INTEGER',
                'bigint': 'BIGINT',
                'smallint': 'SMALLINT',
                'tinyint': 'SMALLINT',
                'decimal': 'NUMERIC',
                'money': 'NUMERIC(19,4)',
                'datetime': 'TIMESTAMP',
                'smalldatetime': 'TIMESTAMP',
                'text': 'TEXT',
                'ntext': 'TEXT',
                'image': 'BYTEA',
                'varbinary': 'BYTEA'
            },
            'db2': {
                'VARCHAR': 'VARCHAR',
                'INTEGER': 'INTEGER',
                'DECIMAL': 'NUMERIC',
                'DATE': 'DATE',
                'TIME': 'TIME',
                'TIMESTAMP': 'TIMESTAMP',
                'CHAR': 'CHAR',
                'CLOB': 'TEXT',
                'BLOB': 'BYTEA'
            }
        }
    
    def map_type(self, source_type: str, source_db: str, length: int = None) -> str:
        if source_db.lower() not in self.type_mappings:
            return source_type
        
        mapping = self.type_mappings[source_db.lower()]
        mapped_type = mapping.get(source_type.upper(), source_type)
        
        if length and mapped_type in ['VARCHAR', 'CHAR']:
            return f"{mapped_type}({length})"
        
        return mapped_type

class ValidationEngine:
    """Comprehensive data validation for migrations"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def validate_schema_compatibility(self, source_schema: DatabaseSchema, 
                                    target_schema: DatabaseSchema) -> Dict[str, Any]:
        validation_results = {
            'compatible': True,
            'warnings': [],
            'errors': [],
            'column_mappings': {}
        }
        
        source_cols = {col['name']: col for col in source_schema.columns}
        target_cols = {col['name']: col for col in target_schema.columns}
        
        for col_name, col_info in source_cols.items():
            if col_name not in target_cols:
                validation_results['errors'].append(f"Column {col_name} missing in target")
                validation_results['compatible'] = False
            else:
                target_col = target_cols[col_name]
                if col_info['type'] != target_col['type']:
                    validation_results['warnings'].append(
                        f"Type mismatch for {col_name}: {col_info['type']} -> {target_col['type']}"
                    )
                validation_results['column_mappings'][col_name] = target_col['name']
        
        if source_schema.row_count > 0:
            validation_results['row_count_source'] = source_schema.row_count
        
        return validation_results
    
    def validate_data_integrity(self, source_data: pd.DataFrame, 
                              target_data: pd.DataFrame) -> Dict[str, Any]:
        integrity_results = {
            'row_count_match': len(source_data) == len(target_data),
            'source_rows': len(source_data),
            'target_rows': len(target_data),
            'column_checksums': {},
            'null_count_comparison': {},
            'data_type_validation': {}
        }
        
        for column in source_data.columns:
            if column in target_data.columns:
                source_checksum = hashlib.md5(
                    source_data[column].astype(str).str.cat().encode()
                ).hexdigest()
                target_checksum = hashlib.md5(
                    target_data[column].astype(str).str.cat().encode()
                ).hexdigest()
                
                integrity_results['column_checksums'][column] = {
                    'source': source_checksum,
                    'target': target_checksum,
                    'match': source_checksum == target_checksum
                }
                
                integrity_results['null_count_comparison'][column] = {
                    'source_nulls': source_data[column].isnull().sum(),
                    'target_nulls': target_data[column].isnull().sum()
                }
        
        return integrity_results

class RollbackManager:
    """Manages rollback operations for failed migrations"""
    
    def __init__(self, target_connector: DatabaseConnector):
        self.target_connector = target_connector
        self.logger = logging.getLogger(__name__)
    
    def create_rollback_plan(self, migration_job: MigrationJob) -> Dict[str, Any]:
        rollback_plan = {
            'job_id': migration_job.job_id,
            'backup_tables': [],
            'drop_statements': [],
            'restore_statements': [],
            'created_at': datetime.now().isoformat()
        }
        
        for table_name in migration_job.tables_to_migrate:
            backup_table = f"{table_name}_backup_{migration_job.job_id}"
            rollback_plan['backup_tables'].append(backup_table)
            rollback_plan['drop_statements'].append(f"DROP TABLE IF EXISTS {table_name}")
            rollback_plan['restore_statements'].append(
                f"ALTER TABLE {backup_table} RENAME TO {table_name}"
            )
        
        return rollback_plan
    
    def execute_rollback(self, rollback_plan: Dict[str, Any]) -> bool:
        try:
            with self.target_connector.connect() as conn:
                for statement in rollback_plan['drop_statements']:
                    conn.execute(sa.text(statement))
                
                for statement in rollback_plan['restore_statements']:
                    conn.execute(sa.text(statement))
                
                conn.commit()
            
            self.logger.info(f"Rollback completed for job {rollback_plan['job_id']}")
            return True
        except Exception as e:
            self.logger.error(f"Rollback failed: {e}")
            return False

class LegacyMigrationEngine:
    """Main migration engine that orchestrates the entire process"""
    
    def __init__(self, config_path: str = "migration_config.json"):
        self.config = self._load_config(config_path)
        self.logger = self._setup_logging()
        self.data_mapper = DataTypeMapper()
        self.validator = ValidationEngine()
        self.rollback_manager = None
        self.active_jobs = {}
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        default_config = {
            "batch_size": 10000,
            "validation_enabled": True,
            "rollback_enabled": True,
            "max_retry_attempts": 3,
            "timeout_seconds": 3600,
            "log_level": "INFO"
        }
        
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return {**default_config, **json.load(f)}
        return default_config
    
    def _setup_logging(self) -> logging.Logger:
        logging.basicConfig(
            level=getattr(logging, self.config.get('log_level', 'INFO')),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('migration.log'),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)
    
    def create_migration_job(self, source_config: Dict[str, str], 
                           target_config: Dict[str, str],
                           tables: List[str] = None) -> MigrationJob:
        job_id = f"migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        job = MigrationJob(
            job_id=job_id,
            source_database=source_config.get('type', 'unknown'),
            target_database=target_config.get('type', 'postgresql'),
            tables_to_migrate=tables or [],
            status='CREATED',
            created_at=datetime.now(),
            error_log=[],
            validation_results={},
            rollback_plan={}
        )
        
        self.active_jobs[job_id] = job
        self.logger.info(f"Created migration job {job_id}")
        return job
    
    def execute_migration(self, job: MigrationJob, source_config: Dict[str, str],
                         target_config: Dict[str, str]) -> bool:
        try:
            job.status = 'RUNNING'
            job.started_at = datetime.now()
            
            source_connector = LegacyPACSConnector(
                source_config['connection_string'],
                source_config['type']
            )
            target_connector = ModernDatabaseConnector(
                target_config['connection_string']
            )
            
            self.rollback_manager = RollbackManager(target_connector)
            
            if not source_connector.validate_connection():
                raise Exception("Source database connection failed")
            
            if not target_connector.validate_connection():
                raise Exception("Target database connection failed")
            
            source_schemas = source_connector.get_schema()
            if job.tables_to_migrate:
                source_schemas = [s for s in source_schemas if s.table_name in job.tables_to_migrate]
            else:
                job.tables_to_migrate = [s.table_name for s in source_schemas]
            
            job.rollback_plan = self.rollback_manager.create_rollback_plan(job)
            
            self._create_target_tables(source_schemas, target_connector, source_config['type'])
            
            for schema in source_schemas:
                self._migrate_table_data(schema, source_connector, target_connector, job)
            
            if self.config['validation_enabled']:
                validation_results = self._validate_migration(
                    source_schemas, source_connector, target_connector
                )
                job.validation_results = validation_results
                
                if not all(r.get('passed', False) for r in validation_results.values()):
                    raise Exception("Migration validation failed")
            
            job.status = 'COMPLETED'
            job.completed_at = datetime.now()
            self.logger.info(f"Migration job {job.job_id} completed successfully")
            return True
            
        except Exception as e:
            job.status = 'FAILED'
            job.error_log.append(str(e))
            job.error_log.append(traceback.format_exc())
            
            if self.config['rollback_enabled'] and job.rollback_plan:
                self.rollback_manager.execute_rollback(job.rollback_plan)
            
            self.logger.error(f"Migration job {job.job_id} failed: {e}")
            return False
    
    def _create_target_tables(self, schemas: List[DatabaseSchema], 
                            target_connector: DatabaseConnector, source_type: str):
        with target_connector.connect() as conn:
            for schema in schemas:
                create_sql = self._generate_create_table_sql(schema, source_type)
                conn.execute(sa.text(create_sql))
                conn.commit()
                self.logger.info(f"Created target table {schema.table_name}")
    
    def _generate_create_table_sql(self, schema: DatabaseSchema, source_type: str) -> str:
        columns_sql = []
        
        for col in schema.columns:
            mapped_type = self.data_mapper.map_type(
                col['type'], source_type, col.get('length')
            )
            
            nullable = "NULL" if col.get('nullable', True) else "NOT NULL"
            default = f"DEFAULT {col['default']}" if col.get('default') else ""
            
            columns_sql.append(f"{col['name']} {mapped_type} {nullable} {default}".strip())
        
        if schema.primary_key:
            pk_constraint = f"PRIMARY KEY ({', '.join(schema.primary_key)})"
            columns_sql.append(pk_constraint)
        
        columns_joined = ',\n  '.join(columns_sql)
        return f"CREATE TABLE {schema.table_name} (\n  {columns_joined}\n)"
    
    def _migrate_table_data(self, schema: DatabaseSchema, source_connector: DatabaseConnector,
                          target_connector: DatabaseConnector, job: MigrationJob):
        try:
            batch_size = self.config['batch_size']
            total_rows = 0
            
            for batch_df in source_connector.extract_data(schema.table_name, batch_size):
                batch_df.to_sql(
                    schema.table_name,
                    target_connector.engine,
                    if_exists='append',
                    index=False,
                    method='multi'
                )
                total_rows += len(batch_df)
                self.logger.info(f"Migrated {total_rows} rows for {schema.table_name}")
            
            self.logger.info(f"Completed migration of {schema.table_name}: {total_rows} total rows")
            
        except Exception as e:
            error_msg = f"Failed to migrate {schema.table_name}: {e}"
            job.error_log.append(error_msg)
            raise Exception(error_msg)
    
    def _validate_migration(self, schemas: List[DatabaseSchema], 
                          source_connector: DatabaseConnector,
                          target_connector: DatabaseConnector) -> Dict[str, Any]:
        validation_results = {}
        
        for schema in schemas:
            try:
                source_sample = next(source_connector.extract_data(schema.table_name, 1000))
                target_sample = next(target_connector.extract_data(schema.table_name, 1000))
                
                integrity_results = self.validator.validate_data_integrity(
                    source_sample, target_sample
                )
                
                validation_results[schema.table_name] = {
                    'passed': integrity_results['row_count_match'],
                    'details': integrity_results
                }
                
            except Exception as e:
                validation_results[schema.table_name] = {
                    'passed': False,
                    'error': str(e)
                }
        
        return validation_results
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        if job_id not in self.active_jobs:
            return {'error': 'Job not found'}
        
        job = self.active_jobs[job_id]
        return asdict(job)

def create_migration_config_template():
    """Creates a configuration template for legacy migrations"""
    config_template = {
        "source_databases": {
            "oracle_pacs": {
                "type": "oracle",
                "connection_string": "oracle://username:password@host:port/service_name",
                "tables_to_migrate": ["parcels", "owners", "assessments", "exemptions"]
            },
            "sqlserver_pacs": {
                "type": "sqlserver",
                "connection_string": "mssql+pymssql://username:password@host:port/database",
                "tables_to_migrate": ["property_data", "tax_records", "ownership"]
            },
            "db2_legacy": {
                "type": "db2",
                "connection_string": "db2://username:password@host:port/database",
                "tables_to_migrate": ["legacy_parcels", "assessment_history"]
            }
        },
        "target_database": {
            "type": "postgresql",
            "connection_string": "postgresql://username:password@localhost:5432/terrafusion"
        },
        "migration_settings": {
            "batch_size": 10000,
            "validation_enabled": True,
            "rollback_enabled": True,
            "max_retry_attempts": 3,
            "timeout_seconds": 3600,
            "parallel_tables": 4
        },
        "data_transformations": {
            "date_formats": {
                "source_format": "MM/DD/YYYY",
                "target_format": "YYYY-MM-DD"
            },
            "null_value_handling": {
                "convert_empty_strings": True,
                "default_values": {
                    "assessment_date": "1900-01-01",
                    "owner_name": "UNKNOWN"
                }
            }
        }
    }
    
    with open('migration_config_template.json', 'w') as f:
        json.dump(config_template, f, indent=2)
    
    return config_template

if __name__ == "__main__":
    create_migration_config_template()
    print("Legacy migration engine initialized with configuration template")
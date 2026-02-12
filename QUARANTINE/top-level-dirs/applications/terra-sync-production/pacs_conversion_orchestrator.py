import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import pandas as pd
from sqlalchemy import create_engine, text
from legacy_migration_engine import LegacyMigrationEngine, LegacyPACSConnector, ModernDatabaseConnector
from data_transformation_engine import PACSDataTransformer, PACSDataValidator

@dataclass
class ConversionJob:
    job_id: str
    county_name: str
    source_system_type: str
    conversion_status: str
    started_at: datetime
    estimated_completion: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    records_processed: int = 0
    records_total: int = 0
    quality_score: float = 0.0
    validation_results: Dict[str, Any] = None
    error_log: List[str] = None

class PACSConversionOrchestrator:
    
    def __init__(self, config_path: str = "conversion_config.json"):
        self.config = self._load_conversion_config(config_path)
        self.logger = self._setup_logging()
        self.migration_engine = LegacyMigrationEngine()
        self.data_transformer = PACSDataTransformer()
        self.data_validator = PACSDataValidator()
        self.active_conversions = {}
        self.conversion_templates = self._load_conversion_templates()
    
    def _load_conversion_config(self, config_path: str) -> Dict[str, Any]:
        default_config = {
            "target_database": {
                "connection_string": os.environ.get("DATABASE_URL", "postgresql://localhost:5432/terrafusion"),
                "schema": "public",
                "table_prefix": "pacs_"
            },
            "conversion_settings": {
                "batch_size": 5000,
                "validation_threshold": 95.0,
                "auto_rollback": True,
                "backup_enabled": True,
                "parallel_processing": True,
                "retry_attempts": 3
            },
            "data_quality": {
                "required_fields": ["parcel_id", "owner_name", "property_address"],
                "duplicate_detection": True,
                "address_standardization": True,
                "phone_validation": True,
                "email_validation": True
            },
            "notification_settings": {
                "progress_updates": True,
                "completion_notifications": True,
                "error_alerts": True
            }
        }
        
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return {**default_config, **json.load(f)}
        return default_config
    
    def _setup_logging(self) -> logging.Logger:
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('pacs_conversion.log'),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)
    
    def _load_conversion_templates(self) -> Dict[str, Any]:
        templates = {
            "oracle_pacs": {
                "description": "Oracle-based PACS systems (common in larger counties)",
                "typical_tables": ["PARCELS", "OWNERS", "ASSESSMENTS", "EXEMPTIONS", "TAX_BILLS"],
                "field_mappings": {
                    "PARCEL_NUMBER": "parcel_id",
                    "OWNER_NAME": "owner_name",
                    "SITUS_ADDRESS": "property_address",
                    "ASSESSED_VALUE": "assessment_value",
                    "LAND_VALUE": "land_value",
                    "IMPROVEMENT_VALUE": "improvement_value",
                    "EXEMPTION_CODE": "exemption_code",
                    "EXEMPTION_AMOUNT": "exemption_amount",
                    "TAX_AMOUNT": "tax_amount"
                },
                "data_transformations": {
                    "date_format": "MM/DD/YYYY",
                    "currency_format": "numeric",
                    "address_parsing": True,
                    "name_standardization": True
                }
            },
            "sqlserver_pacs": {
                "description": "SQL Server PACS systems (medium-sized counties)",
                "typical_tables": ["PropertyData", "OwnerInfo", "TaxRecords", "Exemptions"],
                "field_mappings": {
                    "ParcelID": "parcel_id",
                    "OwnerName": "owner_name",
                    "PropertyAddress": "property_address",
                    "AssessedVal": "assessment_value",
                    "LandVal": "land_value",
                    "ImproveVal": "improvement_value",
                    "ExemptCode": "exemption_code",
                    "ExemptAmt": "exemption_amount",
                    "TaxAmt": "tax_amount"
                },
                "data_transformations": {
                    "date_format": "YYYY-MM-DD",
                    "currency_format": "money",
                    "address_parsing": True,
                    "name_standardization": True
                }
            },
            "access_pacs": {
                "description": "Microsoft Access PACS systems (smaller counties)",
                "typical_tables": ["tblParcels", "tblOwners", "tblAssessments"],
                "field_mappings": {
                    "ParcelNo": "parcel_id",
                    "Owner": "owner_name",
                    "Address": "property_address",
                    "Value": "assessment_value",
                    "LandValue": "land_value",
                    "BuildingValue": "improvement_value"
                },
                "data_transformations": {
                    "date_format": "M/D/YYYY",
                    "currency_format": "currency",
                    "address_parsing": True,
                    "name_standardization": True
                }
            },
            "as400_pacs": {
                "description": "AS/400 legacy systems (older counties)",
                "typical_tables": ["PRCLMST", "OWNRMST", "ASSMST", "EXMPMST"],
                "field_mappings": {
                    "PRCL_NO": "parcel_id",
                    "OWNR_NM": "owner_name",
                    "PROP_ADDR": "property_address",
                    "ASSD_VAL": "assessment_value",
                    "LAND_VAL": "land_value",
                    "IMPR_VAL": "improvement_value",
                    "EXMP_CD": "exemption_code",
                    "EXMP_AMT": "exemption_amount"
                },
                "data_transformations": {
                    "date_format": "YYMMDD",
                    "currency_format": "packed_decimal",
                    "address_parsing": True,
                    "name_standardization": True,
                    "field_trimming": True
                }
            }
        }
        return templates
    
    def create_conversion_job(self, county_name: str, source_config: Dict[str, Any],
                            template_type: str = None) -> ConversionJob:
        job_id = f"pacs_conversion_{county_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if template_type and template_type in self.conversion_templates:
            source_config = {**source_config, **self.conversion_templates[template_type]}
        
        job = ConversionJob(
            job_id=job_id,
            county_name=county_name,
            source_system_type=source_config.get('type', 'unknown'),
            conversion_status='CREATED',
            started_at=datetime.now(),
            error_log=[]
        )
        
        self.active_conversions[job_id] = job
        self.logger.info(f"Created PACS conversion job {job_id} for {county_name}")
        return job
    
    async def execute_full_conversion(self, job: ConversionJob, 
                                    source_config: Dict[str, Any]) -> bool:
        try:
            job.conversion_status = 'ANALYZING_SOURCE'
            await self._analyze_source_system(job, source_config)
            
            job.conversion_status = 'EXTRACTING_DATA'
            raw_data = await self._extract_source_data(job, source_config)
            
            job.conversion_status = 'TRANSFORMING_DATA'
            transformed_data = await self._transform_data(job, raw_data, source_config)
            
            job.conversion_status = 'VALIDATING_DATA'
            validation_results = await self._validate_transformed_data(job, transformed_data)
            
            if validation_results['data_quality_score'] < self.config['conversion_settings']['validation_threshold']:
                raise Exception(f"Data quality score {validation_results['data_quality_score']} below threshold")
            
            job.conversion_status = 'LOADING_DATA'
            await self._load_data_to_target(job, transformed_data)
            
            job.conversion_status = 'VERIFYING_CONVERSION'
            await self._verify_conversion_integrity(job)
            
            job.conversion_status = 'COMPLETED'
            job.completed_at = datetime.now()
            job.quality_score = validation_results['data_quality_score']
            
            self.logger.info(f"PACS conversion {job.job_id} completed successfully")
            return True
            
        except Exception as e:
            job.conversion_status = 'FAILED'
            job.error_log.append(f"Conversion failed: {str(e)}")
            
            if self.config['conversion_settings']['auto_rollback']:
                await self._rollback_conversion(job)
            
            self.logger.error(f"PACS conversion {job.job_id} failed: {e}")
            return False
    
    async def _analyze_source_system(self, job: ConversionJob, source_config: Dict[str, Any]):
        self.logger.info(f"Analyzing source system for {job.job_id}")
        
        source_connector = LegacyPACSConnector(
            source_config['connection_string'],
            source_config['type']
        )
        
        if not source_connector.validate_connection():
            raise Exception("Cannot connect to source PACS system")
        
        schemas = source_connector.get_schema()
        total_records = sum(schema.row_count for schema in schemas)
        
        job.records_total = total_records
        
        estimated_hours = max(1, total_records / 50000)
        job.estimated_completion = datetime.now().replace(
            hour=datetime.now().hour + int(estimated_hours),
            minute=datetime.now().minute + int((estimated_hours % 1) * 60)
        )
        
        self.logger.info(f"Source analysis complete: {len(schemas)} tables, {total_records} total records")
    
    async def _extract_source_data(self, job: ConversionJob, 
                                 source_config: Dict[str, Any]) -> Dict[str, pd.DataFrame]:
        self.logger.info(f"Extracting data for {job.job_id}")
        
        source_connector = LegacyPACSConnector(
            source_config['connection_string'],
            source_config['type']
        )
        
        extracted_data = {}
        schemas = source_connector.get_schema()
        
        for schema in schemas:
            table_name = schema.table_name
            self.logger.info(f"Extracting table {table_name} ({schema.row_count} records)")
            
            try:
                table_data_chunks = source_connector.extract_data(
                    table_name, 
                    self.config['conversion_settings']['batch_size']
                )
                
                table_data = pd.concat(table_data_chunks, ignore_index=True)
                extracted_data[table_name] = table_data
                
                job.records_processed += len(table_data)
                self.logger.info(f"Extracted {len(table_data)} records from {table_name}")
                
            except Exception as e:
                error_msg = f"Failed to extract {table_name}: {str(e)}"
                job.error_log.append(error_msg)
                self.logger.error(error_msg)
        
        return extracted_data
    
    async def _transform_data(self, job: ConversionJob, raw_data: Dict[str, pd.DataFrame],
                            source_config: Dict[str, Any]) -> Dict[str, pd.DataFrame]:
        self.logger.info(f"Transforming data for {job.job_id}")
        
        transformed_data = {}
        field_mappings = source_config.get('field_mappings', {})
        
        for table_name, df in raw_data.items():
            self.logger.info(f"Transforming table {table_name}")
            
            try:
                transformed_df = self.data_transformer.transform_dataframe(df, field_mappings)
                
                if self.config['data_quality']['duplicate_detection']:
                    initial_count = len(transformed_df)
                    transformed_df = transformed_df.drop_duplicates()
                    if len(transformed_df) < initial_count:
                        duplicates_removed = initial_count - len(transformed_df)
                        self.logger.warning(f"Removed {duplicates_removed} duplicate records from {table_name}")
                
                transformed_data[table_name] = transformed_df
                self.logger.info(f"Transformed {table_name}: {len(transformed_df)} records")
                
            except Exception as e:
                error_msg = f"Failed to transform {table_name}: {str(e)}"
                job.error_log.append(error_msg)
                self.logger.error(error_msg)
        
        return transformed_data
    
    async def _validate_transformed_data(self, job: ConversionJob,
                                       transformed_data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        self.logger.info(f"Validating transformed data for {job.job_id}")
        
        validation_results = {
            'tables_validated': 0,
            'total_records': 0,
            'valid_records': 0,
            'validation_errors': [],
            'data_quality_score': 0.0,
            'table_results': {}
        }
        
        for table_name, df in transformed_data.items():
            table_validation = self.data_validator.validate_dataframe(df)
            validation_results['table_results'][table_name] = table_validation
            
            validation_results['tables_validated'] += 1
            validation_results['total_records'] += table_validation['total_records']
            validation_results['valid_records'] += table_validation['valid_records']
            
            if table_validation['validity_rate'] < 90:
                validation_results['validation_errors'].append(
                    f"Table {table_name} has low validity rate: {table_validation['validity_rate']}%"
                )
        
        if validation_results['total_records'] > 0:
            validation_results['data_quality_score'] = (
                validation_results['valid_records'] / validation_results['total_records'] * 100
            )
        
        job.validation_results = validation_results
        self.logger.info(f"Validation complete: {validation_results['data_quality_score']:.1f}% quality score")
        
        return validation_results
    
    async def _load_data_to_target(self, job: ConversionJob,
                                 transformed_data: Dict[str, pd.DataFrame]):
        self.logger.info(f"Loading data to target database for {job.job_id}")
        
        target_engine = create_engine(self.config['target_database']['connection_string'])
        table_prefix = self.config['target_database']['table_prefix']
        
        for table_name, df in transformed_data.items():
            target_table_name = f"{table_prefix}{table_name.lower()}"
            
            try:
                df.to_sql(
                    target_table_name,
                    target_engine,
                    schema=self.config['target_database']['schema'],
                    if_exists='replace',
                    index=False,
                    method='multi',
                    chunksize=self.config['conversion_settings']['batch_size']
                )
                
                self.logger.info(f"Loaded {len(df)} records to {target_table_name}")
                
            except Exception as e:
                error_msg = f"Failed to load {table_name}: {str(e)}"
                job.error_log.append(error_msg)
                raise Exception(error_msg)
    
    async def _verify_conversion_integrity(self, job: ConversionJob):
        self.logger.info(f"Verifying conversion integrity for {job.job_id}")
        
        target_engine = create_engine(self.config['target_database']['connection_string'])
        table_prefix = self.config['target_database']['table_prefix']
        
        verification_results = {}
        
        with target_engine.connect() as conn:
            tables_query = text(f"""
                SELECT table_name, table_rows 
                FROM information_schema.tables 
                WHERE table_name LIKE '{table_prefix}%'
                AND table_schema = :schema
            """)
            
            result = conn.execute(tables_query, {'schema': self.config['target_database']['schema']})
            
            for table_name, row_count in result:
                verification_results[table_name] = {
                    'rows_loaded': row_count,
                    'verification_passed': row_count > 0
                }
        
        failed_verifications = [
            table for table, result in verification_results.items() 
            if not result['verification_passed']
        ]
        
        if failed_verifications:
            raise Exception(f"Verification failed for tables: {failed_verifications}")
        
        self.logger.info("Conversion integrity verification passed")
    
    async def _rollback_conversion(self, job: ConversionJob):
        self.logger.info(f"Rolling back conversion for {job.job_id}")
        
        target_engine = create_engine(self.config['target_database']['connection_string'])
        table_prefix = self.config['target_database']['table_prefix']
        
        try:
            with target_engine.connect() as conn:
                tables_query = text(f"""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_name LIKE '{table_prefix}%'
                    AND table_schema = :schema
                """)
                
                result = conn.execute(tables_query, {'schema': self.config['target_database']['schema']})
                
                for (table_name,) in result:
                    drop_query = text(f"DROP TABLE IF EXISTS {table_name}")
                    conn.execute(drop_query)
                    conn.commit()
                
            self.logger.info("Rollback completed successfully")
            
        except Exception as e:
            self.logger.error(f"Rollback failed: {e}")
    
    def get_conversion_status(self, job_id: str) -> Dict[str, Any]:
        if job_id not in self.active_conversions:
            return {'error': 'Conversion job not found'}
        
        job = self.active_conversions[job_id]
        status_data = asdict(job)
        
        if job.records_total > 0:
            status_data['progress_percentage'] = (job.records_processed / job.records_total) * 100
        else:
            status_data['progress_percentage'] = 0
        
        return status_data
    
    def list_conversion_templates(self) -> Dict[str, Any]:
        return {
            template_name: {
                'description': template['description'],
                'typical_tables': template['typical_tables'],
                'supported_transformations': list(template['data_transformations'].keys())
            }
            for template_name, template in self.conversion_templates.items()
        }
    
    def generate_conversion_report(self, job_id: str) -> Dict[str, Any]:
        if job_id not in self.active_conversions:
            return {'error': 'Conversion job not found'}
        
        job = self.active_conversions[job_id]
        transformer_report = self.data_transformer.generate_transformation_report()
        
        report = {
            'job_summary': asdict(job),
            'transformation_report': transformer_report,
            'recommendations': [],
            'next_steps': []
        }
        
        if job.conversion_status == 'COMPLETED':
            report['recommendations'].extend([
                "Verify converted data meets business requirements",
                "Train staff on new TerraFusion interface",
                "Schedule legacy system decommissioning",
                "Implement data backup procedures"
            ])
            
            report['next_steps'].extend([
                "Configure user access and permissions",
                "Set up automated data validation jobs",
                "Plan go-live date and user training",
                "Establish ongoing support procedures"
            ])
        
        elif job.conversion_status == 'FAILED':
            report['recommendations'].extend([
                "Review error log for specific issues",
                "Validate source system connectivity",
                "Check data quality in source system",
                "Consider incremental conversion approach"
            ])
        
        return report

def create_county_conversion_config(county_name: str, source_system_type: str) -> Dict[str, Any]:
    """Creates a county-specific conversion configuration"""
    
    config_template = {
        "county_info": {
            "name": county_name,
            "state": "WA",
            "population": 0,
            "parcels_estimated": 0
        },
        "source_system": {
            "type": source_system_type,
            "connection_string": f"PLACEHOLDER_CONNECTION_STRING_FOR_{source_system_type.upper()}",
            "database_version": "unknown",
            "last_updated": "unknown"
        },
        "conversion_preferences": {
            "preserve_history": True,
            "include_inactive_records": False,
            "validate_addresses": True,
            "standardize_names": True,
            "geocode_addresses": False
        },
        "custom_field_mappings": {},
        "business_rules": {
            "parcel_id_format": "standard",
            "assessment_year": datetime.now().year,
            "exemption_codes": "standardize",
            "owner_name_format": "title_case"
        }
    }
    
    config_filename = f"{county_name.lower().replace(' ', '_')}_conversion_config.json"
    
    with open(config_filename, 'w') as f:
        json.dump(config_template, f, indent=2, default=str)
    
    return config_template

async def main():
    orchestrator = PACSConversionOrchestrator()
    
    print("PACS Conversion Orchestrator initialized")
    print(f"Available conversion templates: {list(orchestrator.conversion_templates.keys())}")
    
    sample_config = create_county_conversion_config("Benton County", "oracle_pacs")
    print(f"Sample configuration created for Benton County")
    
    templates = orchestrator.list_conversion_templates()
    print(f"Supported PACS systems: {len(templates)}")

if __name__ == "__main__":
    asyncio.run(main())
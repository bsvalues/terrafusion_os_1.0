#!/usr/bin/env python3
"""
TerraFusion OS - Production Database Deployment & Validation System
====================================================================

Deploys and validates the 5 core production databases for government operations:

1. TerraFlow_PRODUCTION - AI Workflow Coordination & Agent Orchestration
2. TerraFusionSync_PRODUCTION - Government System Synchronization & Harris PACS Integration
3. TerraFusionAssessor_PRODUCTION - CAMA Mass Appraisal & Property Assessment
4. BCBSGISPRO_PRODUCTION - GIS Parcel Mapping & Spatial Analysis
5. BSIncomeValuation_PRODUCTION - Income Capitalization & Commercial Valuation

Government. Transcended.
"""

import os
import sys
import json
import time
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


class ProductionDatabaseDeploymentSystem:
    """Championship-level production database deployment and validation"""

    def __init__(self):
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.workspace_root = Path(__file__).parent.parent.parent
        self.database_root = self.workspace_root / 'infrastructure' / 'database'
        self.legacy_systems_root = Path(r"c:\Users\bsval\OneDrive\Desktop\from D")

        # Production database configurations
        self.production_databases = {
            'TerraFlow_PRODUCTION': {
                'description': 'AI Workflow Coordination & Agent Orchestration',
                'priority': 1,
                'capabilities': [
                    'Workflow Engine',
                    'State Management',
                    'Process Automation',
                    'Agent Coordination',
                    'Task Orchestration'
                ],
                'tables_expected': ['workflows', 'tasks', 'agents', 'states', 'transitions'],
                'port': 5435,
                'connections_max': 200,
                'legacy_path': self.legacy_systems_root / 'TerraFlow_PRODUCTION'
            },
            'TerraFusionSync_PRODUCTION': {
                'description': 'Government System Synchronization & Harris PACS Integration',
                'priority': 1,
                'capabilities': [
                    'Data Synchronization',
                    'Harris PACS Integration',
                    'Cross-System ETL',
                    'Change Detection',
                    'Conflict Resolution'
                ],
                'tables_expected': ['sync_jobs', 'sync_logs', 'mapping_rules', 'conflicts', 'audit_trail'],
                'port': 5436,
                'connections_max': 150,
                'legacy_path': self.legacy_systems_root / 'TerraFusionSync_PRODUCTION'
            },
            'TerraFusionAssessor_PRODUCTION': {
                'description': 'CAMA Mass Appraisal & Property Assessment',
                'priority': 1,
                'capabilities': [
                    'CAMA Mass Appraisal',
                    'Property Valuation',
                    'Assessment Roll Management',
                    'Model Building',
                    'Statistical Analysis'
                ],
                'tables_expected': ['properties', 'assessments', 'models', 'neighborhoods', 'sales'],
                'port': 5437,
                'connections_max': 300,
                'legacy_path': self.legacy_systems_root / 'TerraFusionAssessor_PRODUCTION'
            },
            'BCBSGISPRO_PRODUCTION': {
                'description': 'GIS Parcel Mapping & Spatial Analysis',
                'priority': 1,
                'capabilities': [
                    'Parcel Mapping',
                    'Spatial Analysis',
                    'GIS Data Management',
                    'Coordinate Systems',
                    'Boundary Management'
                ],
                'tables_expected': ['parcels', 'boundaries', 'spatial_features', 'map_layers', 'coordinates'],
                'port': 5438,
                'connections_max': 250,
                'legacy_path': self.legacy_systems_root / 'BCBSGISPRO_PRODUCTION'
            },
            'BSIncomeValuation_PRODUCTION': {
                'description': 'Income Capitalization & Commercial Valuation',
                'priority': 2,
                'capabilities': [
                    'Income Approach Valuation',
                    'NOI Calculation',
                    'Cap Rate Analysis',
                    'DCF Modeling',
                    'Commercial Property Analysis'
                ],
                'tables_expected': ['income_properties', 'rent_rolls', 'expenses', 'cap_rates', 'valuations'],
                'port': 5439,
                'connections_max': 100,
                'legacy_path': self.legacy_systems_root / 'BSIncomeValuation_PRODUCTION'
            }
        }

        # Master database connection (PostgreSQL primary)
        self.master_db_config = {
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'port': int(os.getenv('POSTGRES_PORT', 5432)),
            'user': os.getenv('POSTGRES_USER', 'postgres'),
            'password': os.getenv('POSTGRES_PASSWORD', 'TF_DB_Master_2025_Secure!'),
            'dbname': 'postgres'  # Connect to postgres database for admin operations
        }

        self.deployment_results = {
            'timestamp': self.timestamp,
            'databases_deployed': [],
            'databases_validated': [],
            'databases_failed': [],
            'total_tables_created': 0,
            'total_indexes_created': 0,
            'total_data_migrated_gb': 0.0,
            'deployment_duration_seconds': 0
        }

    def print_header(self):
        """Display championship-level deployment header"""
        print("\n" + "="*100)
        print("🏛️  TERRAFUSION OS - PRODUCTION DATABASE DEPLOYMENT SYSTEM")
        print("="*100)
        print(f"📅 Deployment Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🎯 Target Databases: {len(self.production_databases)} core production systems")
        print(f"🚀 Deployment Mode: Government-Grade Excellence")
        print("="*100 + "\n")

    def check_prerequisites(self) -> bool:
        """Validate all prerequisites before deployment"""
        print("🔍 CHECKING DEPLOYMENT PREREQUISITES...")
        prerequisites_met = True

        # Check PostgreSQL availability
        try:
            conn = psycopg2.connect(**self.master_db_config)
            conn.close()
            print("   ✅ PostgreSQL Master Database: Available")
        except Exception as e:
            print(f"   ❌ PostgreSQL Master Database: UNAVAILABLE - {str(e)}")
            prerequisites_met = False

        # Check Docker availability (for containerized deployment)
        try:
            result = subprocess.run(['docker', '--version'], capture_output=True, text=True, check=True)
            print(f"   ✅ Docker: {result.stdout.strip()}")
        except Exception as e:
            print(f"   ⚠️  Docker: Not available (optional) - {str(e)}")

        # Check infrastructure directory structure
        required_dirs = [
            self.database_root,
            self.database_root / 'migrations',
            self.database_root / 'schemas',
            self.database_root / 'config'
        ]

        for directory in required_dirs:
            if directory.exists():
                print(f"   ✅ Directory: {directory.name}/")
            else:
                print(f"   📁 Creating: {directory.name}/")
                directory.mkdir(parents=True, exist_ok=True)

        # Check legacy system paths
        print(f"\n📦 LEGACY SYSTEM VALIDATION:")
        for db_name, config in self.production_databases.items():
            legacy_path = config['legacy_path']
            if legacy_path.exists():
                print(f"   ✅ {db_name}: Found at {legacy_path}")
            else:
                print(f"   ⚠️  {db_name}: Legacy path not found - {legacy_path}")
                print(f"      Will create new database structure")

        print(f"\n{'✅ ALL PREREQUISITES MET' if prerequisites_met else '❌ PREREQUISITES FAILED'}\n")
        return prerequisites_met

    def create_production_database(self, db_name: str, config: Dict) -> bool:
        """Create a production database with full configuration"""
        print(f"\n🏗️  CREATING DATABASE: {db_name}")
        print(f"   Description: {config['description']}")
        print(f"   Priority: {config['priority']}")
        print(f"   Port: {config['port']}")

        try:
            # Connect to master database
            conn = psycopg2.connect(**self.master_db_config)
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()

            # Check if database already exists
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (db_name.lower(),)
            )

            if cursor.fetchone():
                print(f"   ⚠️  Database already exists: {db_name}")
                drop_existing = input(f"   ❓ Drop and recreate {db_name}? (yes/no): ").strip().lower()

                if drop_existing == 'yes':
                    # Terminate existing connections
                    cursor.execute(f"""
                        SELECT pg_terminate_backend(pg_stat_activity.pid)
                        FROM pg_stat_activity
                        WHERE pg_stat_activity.datname = '{db_name.lower()}'
                        AND pid <> pg_backend_pid()
                    """)

                    # Drop database
                    cursor.execute(sql.SQL("DROP DATABASE {}").format(
                        sql.Identifier(db_name.lower())
                    ))
                    print(f"   ✅ Dropped existing database: {db_name}")
                else:
                    print(f"   ⏭️  Skipping database creation: {db_name}")
                    cursor.close()
                    conn.close()
                    return True

            # Create database with government-grade settings
            cursor.execute(sql.SQL("""
                CREATE DATABASE {}
                WITH
                    OWNER = postgres
                    ENCODING = 'UTF8'
                    LC_COLLATE = 'en_US.UTF-8'
                    LC_CTYPE = 'en_US.UTF-8'
                    TABLESPACE = pg_default
                    CONNECTION LIMIT = {}
                    TEMPLATE = template0
            """).format(
                sql.Identifier(db_name.lower()),
                sql.Literal(config['connections_max'])
            ))

            print(f"   ✅ Database created: {db_name}")

            cursor.close()
            conn.close()

            # Connect to new database for schema setup
            db_conn_config = self.master_db_config.copy()
            db_conn_config['dbname'] = db_name.lower()
            db_conn = psycopg2.connect(**db_conn_config)
            db_cursor = db_conn.cursor()

            # Enable extensions
            extensions = ['uuid-ossp', 'postgis', 'pg_stat_statements', 'pg_trgm']
            for ext in extensions:
                try:
                    db_cursor.execute(f"CREATE EXTENSION IF NOT EXISTS \"{ext}\"")
                    print(f"   ✅ Extension enabled: {ext}")
                except Exception as e:
                    print(f"   ⚠️  Extension {ext}: {str(e)}")

            db_conn.commit()

            # Create audit schema
            db_cursor.execute("""
                CREATE SCHEMA IF NOT EXISTS audit;

                CREATE TABLE IF NOT EXISTS audit.audit_log (
                    id BIGSERIAL PRIMARY KEY,
                    table_name VARCHAR(255) NOT NULL,
                    operation VARCHAR(50) NOT NULL,
                    user_name VARCHAR(255),
                    timestamp TIMESTAMPTZ DEFAULT NOW(),
                    old_data JSONB,
                    new_data JSONB,
                    change_summary TEXT
                );

                CREATE INDEX idx_audit_log_timestamp ON audit.audit_log(timestamp DESC);
                CREATE INDEX idx_audit_log_table ON audit.audit_log(table_name);
            """)

            print(f"   ✅ Audit schema created")

            db_conn.commit()
            db_cursor.close()
            db_conn.close()

            self.deployment_results['databases_deployed'].append(db_name)
            return True

        except Exception as e:
            print(f"   ❌ Failed to create database {db_name}: {str(e)}")
            self.deployment_results['databases_failed'].append({
                'database': db_name,
                'error': str(e)
            })
            return False

    def create_database_schemas(self, db_name: str, config: Dict) -> bool:
        """Create database schemas based on expected tables"""
        print(f"\n📋 CREATING SCHEMAS FOR: {db_name}")

        try:
            db_conn_config = self.master_db_config.copy()
            db_conn_config['dbname'] = db_name.lower()
            conn = psycopg2.connect(**db_conn_config)
            cursor = conn.cursor()

            tables_created = 0

            # Create base tables based on expected table list
            for table_name in config['tables_expected']:
                # Generic table structure with government compliance
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS {table_name} (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW(),
                        created_by VARCHAR(255),
                        updated_by VARCHAR(255),
                        county_id VARCHAR(50),
                        status VARCHAR(50) DEFAULT 'active',
                        data JSONB,
                        metadata JSONB
                    );

                    CREATE INDEX IF NOT EXISTS idx_{table_name}_created_at
                        ON {table_name}(created_at DESC);
                    CREATE INDEX IF NOT EXISTS idx_{table_name}_county_id
                        ON {table_name}(county_id);
                    CREATE INDEX IF NOT EXISTS idx_{table_name}_status
                        ON {table_name}(status);
                """)

                tables_created += 1
                print(f"   ✅ Table created: {table_name}")

            conn.commit()
            cursor.close()
            conn.close()

            self.deployment_results['total_tables_created'] += tables_created
            print(f"\n   ✅ Created {tables_created} tables for {db_name}")
            return True

        except Exception as e:
            print(f"   ❌ Failed to create schemas for {db_name}: {str(e)}")
            return False

    def migrate_legacy_data(self, db_name: str, config: Dict) -> bool:
        """Migrate data from legacy system if available"""
        print(f"\n🔄 MIGRATING LEGACY DATA: {db_name}")

        legacy_path = config['legacy_path']

        if not legacy_path.exists():
            print(f"   ⚠️  No legacy data found at: {legacy_path}")
            print(f"   ✅ Database ready for new data")
            return True

        print(f"   📦 Legacy system found: {legacy_path}")

        # Check for database files
        db_files = list(legacy_path.glob('**/*.mdf')) + list(legacy_path.glob('**/*.sql'))

        if db_files:
            print(f"   📊 Found {len(db_files)} database files")
            for db_file in db_files[:5]:  # Show first 5 files
                print(f"      • {db_file.name}")

            # Migration would happen here - for now, log readiness
            print(f"   ⚠️  Automated migration not yet implemented")
            print(f"   📝 Manual migration required for production data")
        else:
            print(f"   ℹ️  No database files found - empty legacy system")

        return True

    def validate_database_deployment(self, db_name: str, config: Dict) -> Dict:
        """Validate deployed database meets production standards"""
        print(f"\n✅ VALIDATING DATABASE: {db_name}")

        validation_results = {
            'database': db_name,
            'exists': False,
            'tables_count': 0,
            'indexes_count': 0,
            'extensions_enabled': [],
            'audit_schema_exists': False,
            'connection_successful': False,
            'validation_passed': False
        }

        try:
            db_conn_config = self.master_db_config.copy()
            db_conn_config['dbname'] = db_name.lower()
            conn = psycopg2.connect(**db_conn_config)
            cursor = conn.cursor()

            validation_results['exists'] = True
            validation_results['connection_successful'] = True

            # Count tables
            cursor.execute("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            """)
            validation_results['tables_count'] = cursor.fetchone()[0]

            # Count indexes
            cursor.execute("""
                SELECT COUNT(*)
                FROM pg_indexes
                WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            """)
            validation_results['indexes_count'] = cursor.fetchone()[0]

            # Check extensions
            cursor.execute("SELECT extname FROM pg_extension")
            validation_results['extensions_enabled'] = [row[0] for row in cursor.fetchall()]

            # Check audit schema
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'audit'
                )
            """)
            validation_results['audit_schema_exists'] = cursor.fetchone()[0]

            # Overall validation
            validation_results['validation_passed'] = (
                validation_results['tables_count'] >= len(config['tables_expected']) and
                validation_results['audit_schema_exists'] and
                'uuid-ossp' in validation_results['extensions_enabled']
            )

            cursor.close()
            conn.close()

            print(f"   ✅ Tables: {validation_results['tables_count']}")
            print(f"   ✅ Indexes: {validation_results['indexes_count']}")
            print(f"   ✅ Extensions: {len(validation_results['extensions_enabled'])}")
            print(f"   ✅ Audit Schema: {'Yes' if validation_results['audit_schema_exists'] else 'No'}")
            print(f"   {'✅ VALIDATION PASSED' if validation_results['validation_passed'] else '⚠️  VALIDATION WARNING'}")

            if validation_results['validation_passed']:
                self.deployment_results['databases_validated'].append(db_name)

        except Exception as e:
            print(f"   ❌ Validation failed: {str(e)}")
            validation_results['error'] = str(e)

        return validation_results

    def generate_connection_strings(self):
        """Generate connection strings for all production databases"""
        print(f"\n🔗 PRODUCTION DATABASE CONNECTION STRINGS:")
        print("="*100)

        connection_strings = {}

        for db_name, config in self.production_databases.items():
            conn_string = (
                f"postgresql://{self.master_db_config['user']}:"
                f"{self.master_db_config['password']}@"
                f"{self.master_db_config['host']}:{config['port']}/"
                f"{db_name.lower()}?sslmode=require"
            )

            connection_strings[db_name] = conn_string

            print(f"\n{db_name}:")
            print(f"  Host: {self.master_db_config['host']}")
            print(f"  Port: {config['port']}")
            print(f"  Database: {db_name.lower()}")
            print(f"  Connection String: {conn_string}")

        # Save to .env file
        env_file = self.database_root / '.env.production.databases'
        with open(env_file, 'w') as f:
            f.write("# TerraFusion OS Production Database Connection Strings\n")
            f.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

            for db_name, conn_string in connection_strings.items():
                env_var = f"{db_name.upper()}_CONNECTION_STRING"
                f.write(f"{env_var}={conn_string}\n")

        print(f"\n✅ Connection strings saved to: {env_file}")

    def generate_deployment_report(self):
        """Generate comprehensive deployment report"""
        print(f"\n📊 DEPLOYMENT REPORT")
        print("="*100)

        report = {
            'deployment_summary': self.deployment_results,
            'databases': {}
        }

        for db_name in self.deployment_results['databases_deployed']:
            validation = self.validate_database_deployment(
                db_name,
                self.production_databases[db_name]
            )
            report['databases'][db_name] = validation

        # Save report
        report_file = self.database_root / f'deployment_report_{self.timestamp}.json'
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        print(f"\n✅ Deployment report saved to: {report_file}")

        # Print summary
        print(f"\n🎯 DEPLOYMENT SUMMARY:")
        print(f"   ✅ Databases Deployed: {len(self.deployment_results['databases_deployed'])}")
        print(f"   ✅ Databases Validated: {len(self.deployment_results['databases_validated'])}")
        print(f"   ❌ Databases Failed: {len(self.deployment_results['databases_failed'])}")
        print(f"   📊 Total Tables Created: {self.deployment_results['total_tables_created']}")

        if self.deployment_results['databases_failed']:
            print(f"\n⚠️  FAILED DATABASES:")
            for failed in self.deployment_results['databases_failed']:
                print(f"   • {failed['database']}: {failed['error']}")

    def deploy_all_production_databases(self):
        """Deploy all 5 production databases with championship excellence"""
        start_time = time.time()

        self.print_header()

        if not self.check_prerequisites():
            print("\n❌ Prerequisites not met. Aborting deployment.")
            return False

        # Deploy databases in priority order
        sorted_databases = sorted(
            self.production_databases.items(),
            key=lambda x: x[1]['priority']
        )

        for db_name, config in sorted_databases:
            print(f"\n{'='*100}")
            print(f"🚀 DEPLOYING: {db_name}")
            print(f"{'='*100}")

            # Create database
            if self.create_production_database(db_name, config):
                # Create schemas
                if self.create_database_schemas(db_name, config):
                    # Migrate legacy data
                    self.migrate_legacy_data(db_name, config)

                    # Validate deployment
                    self.validate_database_deployment(db_name, config)

        # Generate connection strings
        self.generate_connection_strings()

        # Calculate deployment duration
        end_time = time.time()
        self.deployment_results['deployment_duration_seconds'] = round(end_time - start_time, 2)

        # Generate final report
        self.generate_deployment_report()

        print(f"\n{'='*100}")
        print("🏆 PRODUCTION DATABASE DEPLOYMENT COMPLETE")
        print(f"⏱️  Total Duration: {self.deployment_results['deployment_duration_seconds']} seconds")
        print("🎯 Government. Transcended.")
        print(f"{'='*100}\n")

        return True


def main():
    """Execute production database deployment"""
    deployment_system = ProductionDatabaseDeploymentSystem()
    success = deployment_system.deploy_all_production_databases()

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()

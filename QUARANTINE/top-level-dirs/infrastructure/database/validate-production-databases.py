#!/usr/bin/env python3
"""
TerraFusion OS - Production Database Quick Validator
====================================================

Validates the 5 core production databases without requiring psql client.
Uses pure Python psycopg2 library for direct PostgreSQL connection.
"""

import os
import sys
import json
from datetime import datetime
from typing import Dict, List, Tuple

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("❌ ERROR: psycopg2 not installed")
    print("   Install with: pip install psycopg2-binary")
    sys.exit(1)


class ProductionDatabaseValidator:
    """Quick validation for production databases"""

    def __init__(self):
        self.production_databases = [
            {
                'name': 'TerraFlow_PRODUCTION',
                'description': 'AI Workflow Coordination & Agent Orchestration',
                'port': 5435,
                'priority': 'CRITICAL'
            },
            {
                'name': 'TerraFusionSync_PRODUCTION',
                'description': 'Government System Synchronization & Harris PACS Integration',
                'port': 5436,
                'priority': 'CRITICAL'
            },
            {
                'name': 'TerraFusionAssessor_PRODUCTION',
                'description': 'CAMA Mass Appraisal & Property Assessment',
                'port': 5437,
                'priority': 'CRITICAL'
            },
            {
                'name': 'BCBSGISPRO_PRODUCTION',
                'description': 'GIS Parcel Mapping & Spatial Analysis',
                'port': 5438,
                'priority': 'CRITICAL'
            },
            {
                'name': 'BSIncomeValuation_PRODUCTION',
                'description': 'Income Capitalization & Commercial Valuation',
                'port': 5439,
                'priority': 'HIGH'
            }
        ]

        self.master_db_config = {
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'port': int(os.getenv('POSTGRES_PORT', 5432)),
            'user': os.getenv('POSTGRES_USER', 'postgres'),
            'password': os.getenv('POSTGRES_PASSWORD', 'TF_DB_Master_2025_Secure!'),
            'dbname': 'postgres'
        }

        self.validation_results = []

    def print_header(self):
        """Display validation header"""
        print("\n" + "="*100)
        print("🏛️  TERRAFUSION OS - PRODUCTION DATABASE VALIDATION")
        print("="*100)
        print(f"📅 Validation Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🎯 Total Databases: {len(self.production_databases)}")
        print("="*100 + "\n")

    def test_master_connection(self) -> bool:
        """Test connection to PostgreSQL master"""
        print("🔍 CHECKING POSTGRESQL AVAILABILITY...")

        try:
            conn = psycopg2.connect(**self.master_db_config)
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            cursor.close()
            conn.close()

            print(f"   ✅ PostgreSQL Master: Available at {self.master_db_config['host']}:{self.master_db_config['port']}")
            print(f"   📊 Version: {version.split(',')[0]}")
            return True

        except Exception as e:
            print(f"   ❌ PostgreSQL Master: UNAVAILABLE")
            print(f"   Error: {str(e)}")
            return False

    def validate_database(self, db_config: Dict) -> Dict:
        """Validate a single production database"""
        db_name = db_config['name']
        result = {
            'name': db_name,
            'description': db_config['description'],
            'port': db_config['port'],
            'priority': db_config['priority'],
            'exists': False,
            'accessible': False,
            'tables_count': 0,
            'schemas_count': 0,
            'extensions': [],
            'size_mb': 0.0,
            'error': None
        }

        print(f"\n🗄️  Checking: {db_name}")
        print(f"   Description: {db_config['description']}")
        print(f"   Priority: {db_config['priority']}")

        try:
            # Check if database exists
            conn = psycopg2.connect(**self.master_db_config)
            cursor = conn.cursor()

            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (db_name.lower(),)
            )

            if cursor.fetchone():
                result['exists'] = True
                print(f"   ✅ Database exists: {db_name.lower()}")

                cursor.close()
                conn.close()

                # Try to connect to the database
                try:
                    db_conn_config = self.master_db_config.copy()
                    db_conn_config['dbname'] = db_name.lower()
                    db_conn = psycopg2.connect(**db_conn_config)
                    db_cursor = db_conn.cursor()

                    result['accessible'] = True
                    print(f"   ✅ Connection successful: {db_name.lower()}")

                    # Count tables
                    db_cursor.execute("""
                        SELECT COUNT(*)
                        FROM information_schema.tables
                        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
                    """)
                    result['tables_count'] = db_cursor.fetchone()[0]
                    print(f"   📊 Tables: {result['tables_count']}")

                    # Count schemas
                    db_cursor.execute("""
                        SELECT COUNT(*)
                        FROM information_schema.schemata
                        WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
                    """)
                    result['schemas_count'] = db_cursor.fetchone()[0]

                    # Get extensions
                    db_cursor.execute("SELECT extname FROM pg_extension")
                    result['extensions'] = [row[0] for row in db_cursor.fetchall()]
                    print(f"   📦 Extensions: {len(result['extensions'])} ({', '.join(result['extensions'][:3])}...)")

                    # Get database size
                    db_cursor.execute(f"SELECT pg_database_size('{db_name.lower()}')")
                    size_bytes = db_cursor.fetchone()[0]
                    result['size_mb'] = round(size_bytes / (1024 * 1024), 2)
                    print(f"   💾 Size: {result['size_mb']} MB")

                    db_cursor.close()
                    db_conn.close()

                except Exception as e:
                    result['error'] = f"Connection failed: {str(e)}"
                    print(f"   ❌ Connection failed: {str(e)}")
            else:
                print(f"   ❌ Database NOT found: {db_name.lower()}")
                print(f"   💡 Run deployment script to create this database")
                cursor.close()
                conn.close()

        except Exception as e:
            result['error'] = str(e)
            print(f"   ❌ Validation error: {str(e)}")

        return result

    def generate_summary(self):
        """Generate validation summary"""
        print("\n" + "="*100)
        print("📊 VALIDATION SUMMARY")
        print("="*100)

        total = len(self.validation_results)
        found = sum(1 for r in self.validation_results if r['exists'])
        accessible = sum(1 for r in self.validation_results if r['accessible'])
        total_tables = sum(r['tables_count'] for r in self.validation_results)
        total_size_mb = sum(r['size_mb'] for r in self.validation_results)

        print(f"\n🎯 Overall Status:")
        print(f"   Total Databases: {total}")
        print(f"   Databases Found: {found} / {total}")
        print(f"   Databases Accessible: {accessible} / {total}")
        print(f"   Total Tables: {total_tables}")
        print(f"   Total Size: {total_size_mb} MB")

        if accessible == total:
            print(f"\n🏆 ALL PRODUCTION DATABASES VALIDATED - GOVERNMENT. TRANSCENDED.")
            exit_code = 0
        elif found == total:
            print(f"\n⚠️  ALL DATABASES EXIST BUT SOME CONNECTION ISSUES")
            exit_code = 1
        else:
            print(f"\n❌ MISSING PRODUCTION DATABASES - DEPLOYMENT REQUIRED")
            print(f"   Run: python infrastructure/database/deploy-production-databases.py")
            exit_code = 2

        print(f"\n📋 Detailed Results:")
        for result in self.validation_results:
            if result['accessible']:
                status = "✅ READY"
                print(f"   {status} - {result['name']} ({result['tables_count']} tables, {result['size_mb']} MB)")
            elif result['exists']:
                status = "⚠️  EXISTS (Connection Issue)"
                print(f"   {status} - {result['name']}")
            else:
                status = "❌ MISSING"
                print(f"   {status} - {result['name']}")

        # Save results
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_path = f'infrastructure/database/validation_report_{timestamp}.json'

        with open(report_path, 'w') as f:
            json.dump({
                'timestamp': timestamp,
                'summary': {
                    'total': total,
                    'found': found,
                    'accessible': accessible,
                    'total_tables': total_tables,
                    'total_size_mb': total_size_mb
                },
                'databases': self.validation_results
            }, f, indent=2)

        print(f"\n💾 Validation report saved: {report_path}")
        print("\n" + "="*100 + "\n")

        return exit_code

    def validate_all(self) -> int:
        """Validate all production databases"""
        self.print_header()

        if not self.test_master_connection():
            print("\n❌ Cannot connect to PostgreSQL master. Aborting validation.")
            return 3

        print(f"\n📊 VALIDATING PRODUCTION DATABASES...")
        print("="*100)

        for db_config in self.production_databases:
            result = self.validate_database(db_config)
            self.validation_results.append(result)

        return self.generate_summary()


def main():
    """Execute production database validation"""
    validator = ProductionDatabaseValidator()
    exit_code = validator.validate_all()
    sys.exit(exit_code)


if __name__ == '__main__':
    main()

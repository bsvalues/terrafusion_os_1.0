#!/usr/bin/env python3
"""
TerraFusion Database Architecture Setup Script
Implements hybrid microservices database architecture for development independence
"""

import os
import sqlite3
import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime


class TerraFusionDatabaseArchitect:
    def __init__(self):
        self.base_path = Path(__file__).parent
        self.applications = self._get_applications()
        self.master_services = ['TerraSync', 'TerraFlow']

    def _get_applications(self) -> List[str]:
        """Get list of TerraFusion applications"""
        apps = []
        for item in self.base_path.iterdir():
            if item.is_dir() and item.name.endswith('_PRODUCTION'):
                app_name = item.name.replace('_PRODUCTION', '')
                apps.append(app_name)
        return sorted(apps)

    def create_development_databases(self):
        """Create SQLite databases for development"""
        print("🏗️ Creating Development Database Architecture")
        print("=" * 60)

        db_dir = self.base_path / "databases" / "development"
        db_dir.mkdir(parents=True, exist_ok=True)

        # Master databases
        self._create_master_databases(db_dir)

        # Application databases
        self._create_application_databases(db_dir)

        # Create replication configuration
        self._create_replication_config(db_dir)

        print(
            f"\n✅ Created {len(self.applications) + 2} development databases")
        print(f"📁 Location: {db_dir}")

    def _create_master_databases(self, db_dir: Path):
        """Create master service databases"""
        print("\n📊 Creating Master Databases:")

        for service in self.master_services:
            db_path = db_dir / f"{service.lower()}_master.db"

            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()

                if service == 'TerraSync':
                    self._create_terrasync_schema(cursor)
                elif service == 'TerraFlow':
                    self._create_terraflow_schema(cursor)

                conn.commit()

            print(f"   ✅ {service} Master DB: {db_path.name}")

    def _create_application_databases(self, db_dir: Path):
        """Create application-specific databases"""
        print("\n🚀 Creating Application Databases:")

        for app in self.applications:
            db_path = db_dir / f"{app.lower()}_dev.db"

            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()

                # Common tables for all applications
                self._create_common_schema(cursor, app)

                # Application-specific tables
                self._create_app_specific_schema(cursor, app)

                conn.commit()

            print(f"   ✅ {app}: {db_path.name}")

    def _create_terrasync_schema(self, cursor):
        """Create TerraSync master database schema"""
        schema = """
        -- Master Data Tables
        CREATE TABLE IF NOT EXISTS master_entities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type VARCHAR(50) NOT NULL,
            entity_id VARCHAR(100) NOT NULL,
            data JSON NOT NULL,
            version INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(entity_type, entity_id)
        );
        
        CREATE TABLE IF NOT EXISTS sync_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            application VARCHAR(50) NOT NULL,
            last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
            sync_version INTEGER DEFAULT 1,
            status VARCHAR(20) DEFAULT 'active'
        );
        
        CREATE TABLE IF NOT EXISTS replication_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_app VARCHAR(50),
            target_app VARCHAR(50),
            operation VARCHAR(20) NOT NULL,
            entity_type VARCHAR(50),
            entity_id VARCHAR(100),
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) DEFAULT 'pending'
        );
        
        CREATE INDEX IF NOT EXISTS idx_master_entities_type ON master_entities(entity_type);
        CREATE INDEX IF NOT EXISTS idx_sync_status_app ON sync_status(application);
        CREATE INDEX IF NOT EXISTS idx_replication_log_status ON replication_log(status);
        """
        cursor.executescript(schema)

    def _create_terraflow_schema(self, cursor):
        """Create TerraFlow processing database schema"""
        schema = """
        -- Data Processing Tables
        CREATE TABLE IF NOT EXISTS processing_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_name VARCHAR(100) NOT NULL,
            source_app VARCHAR(50),
            target_app VARCHAR(50),
            job_config JSON,
            status VARCHAR(20) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            started_at DATETIME,
            completed_at DATETIME,
            error_message TEXT
        );
        
        CREATE TABLE IF NOT EXISTS data_transformations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transformation_name VARCHAR(100) NOT NULL,
            source_schema JSON,
            target_schema JSON,
            transformation_rules JSON,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS processing_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER,
            metric_name VARCHAR(50),
            metric_value REAL,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (job_id) REFERENCES processing_jobs(id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
        CREATE INDEX IF NOT EXISTS idx_data_transformations_active ON data_transformations(is_active);
        """
        cursor.executescript(schema)

    def _create_common_schema(self, cursor, app_name: str):
        """Create common schema for all applications"""
        schema = f"""
        -- Common Application Tables
        CREATE TABLE IF NOT EXISTS app_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_key VARCHAR(100) NOT NULL UNIQUE,
            config_value TEXT,
            config_type VARCHAR(20) DEFAULT 'string',
            is_encrypted BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name VARCHAR(50),
            record_id VARCHAR(100),
            operation VARCHAR(20) NOT NULL,
            old_values JSON,
            new_values JSON,
            user_id VARCHAR(50),
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS sync_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cache_key VARCHAR(200) NOT NULL UNIQUE,
            cache_data JSON,
            expires_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Application Info
        INSERT OR IGNORE INTO app_config (config_key, config_value, config_type) VALUES
        ('app_name', '{app_name}', 'string'),
        ('app_version', '2.0.0', 'string'),
        ('database_version', '1.0', 'string'),
        ('sync_enabled', 'true', 'boolean'),
        ('last_sync', datetime('now'), 'datetime');
        
        CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
        CREATE INDEX IF NOT EXISTS idx_sync_cache_key ON sync_cache(cache_key);
        """
        cursor.executescript(schema)

    def _create_app_specific_schema(self, cursor, app_name: str):
        """Create application-specific schema based on app type"""
        if 'Pilt' in app_name:
            self._create_pilt_schema(cursor)
        elif 'Agent' in app_name:
            self._create_agent_schema(cursor)
        elif 'Assessor' in app_name:
            self._create_assessor_schema(cursor)
        elif 'Levy' in app_name:
            self._create_levy_schema(cursor)
        else:
            self._create_generic_app_schema(cursor, app_name)

    def _create_pilt_schema(self, cursor):
        """Create PILT-specific schema"""
        schema = """
        -- PILT Specific Tables
        CREATE TABLE IF NOT EXISTS pilt_receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_number VARCHAR(50) UNIQUE NOT NULL,
            federal_fiscal_year INTEGER NOT NULL,
            county_name VARCHAR(100) NOT NULL,
            total_amount DECIMAL(15,2) NOT NULL,
            hanford_acres INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS school_districts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            district_code VARCHAR(10) UNIQUE NOT NULL,
            district_name VARCHAR(200) NOT NULL,
            assessed_value DECIMAL(15,2),
            levy_rate DECIMAL(8,4),
            is_active BOOLEAN DEFAULT 1
        );
        
        CREATE TABLE IF NOT EXISTS pilt_distributions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_id INTEGER,
            district_id INTEGER,
            distribution_amount DECIMAL(15,2),
            calculation_method VARCHAR(50),
            FOREIGN KEY (receipt_id) REFERENCES pilt_receipts(id),
            FOREIGN KEY (district_id) REFERENCES school_districts(id)
        );
        """
        cursor.executescript(schema)

    def _create_agent_schema(self, cursor):
        """Create Agent-specific schema"""
        schema = """
        -- Agent Specific Tables
        CREATE TABLE IF NOT EXISTS agent_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id VARCHAR(100) UNIQUE NOT NULL,
            user_id VARCHAR(50),
            agent_type VARCHAR(50),
            status VARCHAR(20) DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS agent_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id VARCHAR(100),
            message_type VARCHAR(20) NOT NULL,
            message_content TEXT,
            response_content TEXT,
            processing_time_ms INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS agent_capabilities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            capability_name VARCHAR(100) NOT NULL,
            capability_config JSON,
            is_enabled BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """
        cursor.executescript(schema)

    def _create_assessor_schema(self, cursor):
        """Create Assessor-specific schema"""
        schema = """
        -- Assessor Specific Tables
        CREATE TABLE IF NOT EXISTS properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parcel_number VARCHAR(50) UNIQUE NOT NULL,
            property_address TEXT,
            assessed_value DECIMAL(15,2),
            market_value DECIMAL(15,2),
            property_type VARCHAR(50),
            assessment_year INTEGER,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER,
            assessment_type VARCHAR(50),
            assessment_value DECIMAL(15,2),
            assessment_date DATE,
            assessor_notes TEXT,
            FOREIGN KEY (property_id) REFERENCES properties(id)
        );
        
        CREATE TABLE IF NOT EXISTS valuation_methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            method_name VARCHAR(100) NOT NULL,
            method_config JSON,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """
        cursor.executescript(schema)

    def _create_levy_schema(self, cursor):
        """Create Levy-specific schema"""
        schema = """
        -- Levy Specific Tables
        CREATE TABLE IF NOT EXISTS levy_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            levy_code VARCHAR(20) UNIQUE NOT NULL,
            levy_description TEXT,
            levy_rate DECIMAL(8,4),
            effective_year INTEGER,
            is_active BOOLEAN DEFAULT 1
        );
        
        CREATE TABLE IF NOT EXISTS levy_calculations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id VARCHAR(50),
            levy_code_id INTEGER,
            assessed_value DECIMAL(15,2),
            levy_amount DECIMAL(15,2),
            calculation_date DATE,
            FOREIGN KEY (levy_code_id) REFERENCES levy_codes(id)
        );
        
        CREATE TABLE IF NOT EXISTS levy_collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            calculation_id INTEGER,
            collection_date DATE,
            amount_collected DECIMAL(15,2),
            collection_status VARCHAR(20),
            FOREIGN KEY (calculation_id) REFERENCES levy_calculations(id)
        );
        """
        cursor.executescript(schema)

    def _create_generic_app_schema(self, cursor, app_name: str):
        """Create generic schema for other applications"""
        schema = f"""
        -- Generic Application Tables for {app_name}
        CREATE TABLE IF NOT EXISTS app_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_type VARCHAR(50) NOT NULL,
            data_key VARCHAR(100) NOT NULL,
            data_value JSON,
            metadata JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(data_type, data_key)
        );
        
        CREATE TABLE IF NOT EXISTS app_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_type VARCHAR(50) NOT NULL,
            transaction_data JSON,
            status VARCHAR(20) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            processed_at DATETIME
        );
        
        CREATE INDEX IF NOT EXISTS idx_app_data_type ON app_data(data_type);
        CREATE INDEX IF NOT EXISTS idx_app_transactions_status ON app_transactions(status);
        """
        cursor.executescript(schema)

    def _create_replication_config(self, db_dir: Path):
        """Create replication configuration file"""
        config = {
            "version": "1.0",
            "created_at": datetime.now().isoformat(),
            "master_services": {
                "terrasync": {
                    "database": str(db_dir / "terrasync_master.db"),
                    "role": "master_sync",
                    "port": 5432
                },
                "terraflow": {
                    "database": str(db_dir / "terraflow_master.db"),
                    "role": "data_processing",
                    "port": 5433
                }
            },
            "applications": {},
            "replication_rules": {
                "sync_interval": "5m",
                "batch_size": 1000,
                "retry_attempts": 3,
                "conflict_resolution": "master_wins"
            }
        }

        for app in self.applications:
            config["applications"][app.lower()] = {
                "database": str(db_dir / f"{app.lower()}_dev.db"),
                "sync_enabled": True,
                "sync_tables": ["app_config", "audit_log"],
                "master_tables": ["master_entities"],
                "local_tables": ["*"]
            }

        config_path = db_dir / "replication_config.json"
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)

        print(f"\n📋 Replication config: {config_path.name}")

    def create_docker_compose(self):
        """Create Docker Compose for production PostgreSQL setup"""
        print("\n🐳 Creating Docker Compose for Production")

        compose_content = """version: '3.8'

services:
  # Master Databases
  terrasync-master:
    image: postgres:15
    environment:
      POSTGRES_DB: terrasync_master
      POSTGRES_USER: terrasync_user
      POSTGRES_PASSWORD: ${TERRASYNC_DB_PASSWORD:-terrasync_pass}
    volumes:
      - terrasync_data:/var/lib/postgresql/data
      - ./init-sql/terrasync:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - terrafusion-network
    restart: unless-stopped

  terraflow-master:
    image: postgres:15
    environment:
      POSTGRES_DB: terraflow_master
      POSTGRES_USER: terraflow_user
      POSTGRES_PASSWORD: ${TERRAFLOW_DB_PASSWORD:-terraflow_pass}
    volumes:
      - terraflow_data:/var/lib/postgresql/data
      - ./init-sql/terraflow:/docker-entrypoint-initdb.d
    ports:
      - "5433:5432"
    networks:
      - terrafusion-network
    restart: unless-stopped

  # Application Databases (Core)
  pilt-db:
    image: postgres:15
    environment:
      POSTGRES_DB: terrafusion_pilt_prod
      POSTGRES_USER: pilt_user
      POSTGRES_PASSWORD: ${PILT_DB_PASSWORD:-pilt_pass}
    volumes:
      - pilt_data:/var/lib/postgresql/data
    ports:
      - "5434:5432"
    networks:
      - terrafusion-network
    restart: unless-stopped

  agent-db:
    image: postgres:15
    environment:
      POSTGRES_DB: terra_agent_prod
      POSTGRES_USER: agent_user
      POSTGRES_PASSWORD: ${AGENT_DB_PASSWORD:-agent_pass}
    volumes:
      - agent_data:/var/lib/postgresql/data
    ports:
      - "5435:5432"
    networks:
      - terrafusion-network
    restart: unless-stopped

  # Database Administration
  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@terrafusion.com
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin_pass}
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    ports:
      - "8080:80"
    networks:
      - terrafusion-network
    restart: unless-stopped

volumes:
  terrasync_data:
  terraflow_data:
  pilt_data:
  agent_data:
  pgadmin_data:

networks:
  terrafusion-network:
    driver: bridge
"""

        compose_path = self.base_path / "docker-compose.databases.yml"
        with open(compose_path, 'w') as f:
            f.write(compose_content)

        print(f"   ✅ Docker Compose: {compose_path.name}")

    def create_environment_template(self):
        """Create environment template for database passwords"""
        env_content = """# TerraFusion Database Environment Variables
# Copy this to .env and update with secure passwords

# Master Database Passwords
TERRASYNC_DB_PASSWORD=your_secure_terrasync_password
TERRAFLOW_DB_PASSWORD=your_secure_terraflow_password

# Application Database Passwords
PILT_DB_PASSWORD=your_secure_pilt_password
AGENT_DB_PASSWORD=your_secure_agent_password

# Administration
PGADMIN_PASSWORD=your_secure_pgadmin_password

# Development Settings
NODE_ENV=development
DATABASE_URL_TERRASYNC=postgresql://terrasync_user:terrasync_pass@localhost:5432/terrasync_master
DATABASE_URL_TERRAFLOW=postgresql://terraflow_user:terraflow_pass@localhost:5433/terraflow_master
"""

        env_path = self.base_path / ".env.template"
        with open(env_path, 'w') as f:
            f.write(env_content)

        print(f"   ✅ Environment template: {env_path.name}")

    def generate_summary_report(self):
        """Generate implementation summary report"""
        print("\n" + "=" * 60)
        print("🎯 TERRAFUSION DATABASE ARCHITECTURE SUMMARY")
        print("=" * 60)

        print(f"\n📊 ECOSYSTEM OVERVIEW:")
        print(f"   • Total Applications: {len(self.applications)}")
        print(f"   • Master Services: {len(self.master_services)}")
        print(f"   • Development Databases: {len(self.applications) + 2}")

        print(f"\n🏗️ ARCHITECTURE COMPONENTS:")
        print(f"   ✅ Hybrid Database Strategy")
        print(f"   ✅ SQLite for Development")
        print(f"   ✅ PostgreSQL for Production")
        print(f"   ✅ Automated Replication Config")
        print(f"   ✅ Docker Compose Setup")

        print(f"\n📁 FILES CREATED:")
        print(f"   • Database Architecture Strategy: DATABASE_ARCHITECTURE_STRATEGY.md")
        print(f"   • Setup Script: setup_database_architecture.py")
        print(f"   • Docker Compose: docker-compose.databases.yml")
        print(f"   • Environment Template: .env.template")
        print(f"   • Replication Config: databases/development/replication_config.json")

        print(f"\n🚀 NEXT STEPS:")
        print(f"   1. Review database architecture strategy")
        print(f"   2. Test development database setup")
        print(f"   3. Configure application connections")
        print(f"   4. Implement replication services")
        print(f"   5. Deploy production environment")

        print(f"\n🎉 DATABASE ARCHITECTURE IMPLEMENTATION COMPLETE!")


def main():
    """Main execution function"""
    architect = TerraFusionDatabaseArchitect()

    print("🏗️ TerraFusion Database Architecture Setup")
    print("=" * 50)
    print(f"Found {len(architect.applications)} applications")
    print(
        f"Applications: {', '.join(architect.applications[:5])}{'...' if len(architect.applications) > 5 else ''}")

    try:
        # Create development databases
        architect.create_development_databases()

        # Create production setup files
        architect.create_docker_compose()
        architect.create_environment_template()

        # Generate summary
        architect.generate_summary_report()

    except Exception as e:
        print(f"\n❌ Error during setup: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()

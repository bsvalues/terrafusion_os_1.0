"""
Database migration script.
This script will directly create tables from the models.py file
without relying on Flask-Migrate, which can time out with complex schemas.
"""
import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Determine environment and get the correct database URL
env_mode = os.environ.get("ENV_MODE", "development").lower()
logger.info(f"Using environment: {env_mode}")

# Initialize db_url to None
db_url = None

# Get environment-specific database URL
if env_mode == "training":
    db_url = os.environ.get("DATABASE_URL_TRAINING")
    if db_url:
        logger.info("Using DATABASE_URL_TRAINING")
elif env_mode == "production":
    db_url = os.environ.get("DATABASE_URL_PRODUCTION")
    if db_url:
        logger.info("Using DATABASE_URL_PRODUCTION")

# Fallback to environment suffix
if not db_url:
    env_suffix = "_" + env_mode.upper() if env_mode != "development" else ""
    db_url = os.environ.get(f"DATABASE_URL{env_suffix}")
    if db_url:
        logger.info(f"Using DATABASE_URL{env_suffix}")

# Final fallback to default DATABASE_URL
if not db_url:
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        logger.info("Using default DATABASE_URL")

# Exit if no database URL is found
if not db_url:
    logger.error("No database URL found for the current environment")
    logger.error(f"Please set DATABASE_URL_TRAINING, DATABASE_URL_PRODUCTION, DATABASE_URL_{env_mode.upper()} or DATABASE_URL")
    sys.exit(1)

def create_tables():
    """
    Create database tables directly using SQL statements
    based on our models.py file structure.
    """
    logger.info("Starting direct database migration")
    
    try:
        # Connect to the database
        conn = psycopg2.connect(db_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        # Create a cursor
        cursor = conn.cursor()
        
        # Check if tables already exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public'
        """)
        existing_tables = [table[0] for table in cursor.fetchall()]
        
        # Create tables if they don't exist
        create_permissions_table(cursor, existing_tables)
        create_roles_table(cursor, existing_tables)
        create_role_permissions_table(cursor, existing_tables)
        create_users_table(cursor, existing_tables)
        create_user_roles_table(cursor, existing_tables)
        create_api_tokens_table(cursor, existing_tables)
        create_audit_logs_table(cursor, existing_tables)
        create_gis_projects_table(cursor, existing_tables)
        create_files_table(cursor, existing_tables)
        create_query_logs_table(cursor, existing_tables)
        create_mfa_setup_table(cursor, existing_tables)
        create_indexed_documents_table(cursor, existing_tables)
        create_properties_table(cursor, existing_tables)
        create_tax_records_table(cursor, existing_tables)
        create_assessments_table(cursor, existing_tables)
        create_inspections_table(cursor, existing_tables)
        create_comparable_sales_table(cursor, existing_tables)
        create_market_areas_table(cursor, existing_tables)
        create_appeals_table(cursor, existing_tables)
        create_property_data_quality_alerts_table(cursor, existing_tables)
        
        # Close connection
        cursor.close()
        conn.close()
        
        logger.info("Database migration completed successfully")
        
    except Exception as e:
        logger.error(f"Error during database migration: {str(e)}")
        sys.exit(1)

def create_permissions_table(cursor, existing_tables):
    """Create permissions table"""
    if 'permissions' not in existing_tables:
        logger.info("Creating permissions table")
        cursor.execute("""
            CREATE TABLE permissions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(64) UNIQUE NOT NULL,
                description TEXT
            )
        """)

def create_roles_table(cursor, existing_tables):
    """Create roles table"""
    if 'roles' not in existing_tables:
        logger.info("Creating roles table")
        cursor.execute("""
            CREATE TABLE roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(64) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def create_role_permissions_table(cursor, existing_tables):
    """Create role_permissions table"""
    if 'role_permissions' not in existing_tables:
        logger.info("Creating role_permissions table")
        cursor.execute("""
            CREATE TABLE role_permissions (
                role_id INTEGER REFERENCES roles(id),
                permission_id INTEGER REFERENCES permissions(id),
                PRIMARY KEY (role_id, permission_id)
            )
        """)

def create_users_table(cursor, existing_tables):
    """Create users table"""
    if 'users' not in existing_tables:
        logger.info("Creating users table")
        cursor.execute("""
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(64) UNIQUE NOT NULL,
                email VARCHAR(120) UNIQUE NOT NULL,
                full_name VARCHAR(128),
                department VARCHAR(128),
                ad_object_id VARCHAR(128),
                mfa_enabled BOOLEAN DEFAULT FALSE,
                mfa_secret VARCHAR(64),
                last_login TIMESTAMP,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def create_user_roles_table(cursor, existing_tables):
    """Create user_roles table"""
    if 'user_roles' not in existing_tables:
        logger.info("Creating user_roles table")
        cursor.execute("""
            CREATE TABLE user_roles (
                user_id INTEGER REFERENCES users(id),
                role_id INTEGER REFERENCES roles(id),
                PRIMARY KEY (user_id, role_id)
            )
        """)

def create_api_tokens_table(cursor, existing_tables):
    """Create api_tokens table"""
    if 'api_tokens' not in existing_tables:
        logger.info("Creating api_tokens table")
        cursor.execute("""
            CREATE TABLE api_tokens (
                id SERIAL PRIMARY KEY,
                token VARCHAR(128) UNIQUE NOT NULL,
                name VARCHAR(128),
                user_id INTEGER REFERENCES users(id) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                last_used_at TIMESTAMP,
                revoked BOOLEAN DEFAULT FALSE
            )
        """)

def create_audit_logs_table(cursor, existing_tables):
    """Create audit_logs table"""
    if 'audit_logs' not in existing_tables:
        logger.info("Creating audit_logs table")
        cursor.execute("""
            CREATE TABLE audit_logs (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER REFERENCES users(id),
                action VARCHAR(64) NOT NULL,
                resource_type VARCHAR(64),
                resource_id INTEGER,
                details JSONB,
                ip_address VARCHAR(45),
                user_agent VARCHAR(256)
            )
        """)

def create_gis_projects_table(cursor, existing_tables):
    """Create gis_projects table"""
    if 'gis_projects' not in existing_tables:
        logger.info("Creating gis_projects table")
        cursor.execute("""
            CREATE TABLE gis_projects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(128) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER REFERENCES users(id) NOT NULL
            )
        """)

def create_files_table(cursor, existing_tables):
    """Create files table"""
    if 'files' not in existing_tables:
        logger.info("Creating files table")
        cursor.execute("""
            CREATE TABLE files (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                original_filename VARCHAR(255) NOT NULL,
                file_path VARCHAR(512) NOT NULL,
                file_size INTEGER NOT NULL,
                file_type VARCHAR(64),
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                description TEXT,
                file_metadata JSONB,
                storage_bucket VARCHAR(64),
                storage_path VARCHAR(512),
                storage_url VARCHAR(1024),
                user_id INTEGER REFERENCES users(id) NOT NULL,
                project_id INTEGER REFERENCES gis_projects(id)
            )
        """)

def create_query_logs_table(cursor, existing_tables):
    """Create query_logs table"""
    if 'query_logs' not in existing_tables:
        logger.info("Creating query_logs table")
        cursor.execute("""
            CREATE TABLE query_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) NOT NULL,
                query TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                response TEXT,
                processing_time FLOAT
            )
        """)

def create_mfa_setup_table(cursor, existing_tables):
    """Create mfa_setup table"""
    if 'mfa_setup' not in existing_tables:
        logger.info("Creating mfa_setup table")
        cursor.execute("""
            CREATE TABLE mfa_setup (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) NOT NULL UNIQUE,
                backup_codes JSONB,
                verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def create_indexed_documents_table(cursor, existing_tables):
    """Create indexed_documents table"""
    if 'indexed_documents' not in existing_tables:
        logger.info("Creating indexed_documents table")
        cursor.execute("""
            CREATE TABLE indexed_documents (
                id SERIAL PRIMARY KEY,
                file_id INTEGER REFERENCES files(id) NOT NULL,
                index_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                chunk_count INTEGER DEFAULT 0,
                status VARCHAR(32) DEFAULT 'indexed'
            )
        """)

def create_properties_table(cursor, existing_tables):
    """Create properties table"""
    if 'properties' not in existing_tables:
        logger.info("Creating properties table")
        cursor.execute("""
            CREATE TABLE properties (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                parcel_id VARCHAR(64) UNIQUE NOT NULL,
                address VARCHAR(256) NOT NULL,
                city VARCHAR(64),
                state VARCHAR(2) DEFAULT 'WA',
                zip_code VARCHAR(10),
                property_type VARCHAR(32),
                lot_size FLOAT,
                year_built INTEGER,
                bedrooms INTEGER,
                bathrooms FLOAT,
                total_area FLOAT,
                owner_name VARCHAR(256),
                owner_address VARCHAR(256),
                purchase_date DATE,
                purchase_price NUMERIC(12,2),
                features JSONB,
                location JSONB,
                property_metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Create indexes for properties
        cursor.execute("CREATE INDEX idx_properties_parcel_id ON properties(parcel_id)")
        cursor.execute("CREATE INDEX idx_properties_address ON properties(address)")
        cursor.execute("CREATE INDEX idx_properties_property_type ON properties(property_type)")

def create_tax_records_table(cursor, existing_tables):
    """Create tax_records table"""
    if 'tax_records' not in existing_tables:
        logger.info("Creating tax_records table")
        cursor.execute("""
            CREATE TABLE tax_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                property_id UUID REFERENCES properties(id) NOT NULL,
                tax_year INTEGER NOT NULL,
                land_value NUMERIC(12,2),
                improvement_value NUMERIC(12,2),
                total_value NUMERIC(12,2),
                tax_amount NUMERIC(12,2),
                tax_rate NUMERIC(7,6),
                status VARCHAR(32),
                exemptions JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uix_tax_record_property_year UNIQUE (property_id, tax_year)
            )
        """)

def create_assessments_table(cursor, existing_tables):
    """Create assessments table"""
    if 'assessments' not in existing_tables:
        logger.info("Creating assessments table")
        cursor.execute("""
            CREATE TABLE assessments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                property_id UUID REFERENCES properties(id) NOT NULL,
                assessment_date DATE NOT NULL,
                assessor_id INTEGER REFERENCES users(id),
                land_value NUMERIC(12,2),
                improvement_value NUMERIC(12,2),
                total_value NUMERIC(12,2),
                comparable_properties JSONB,
                market_conditions JSONB,
                valuation_method VARCHAR(32),
                notes TEXT,
                documents INTEGER[],
                status VARCHAR(32) DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def create_inspections_table(cursor, existing_tables):
    """Create inspections table"""
    if 'inspections' not in existing_tables:
        logger.info("Creating inspections table")
        cursor.execute("""
            CREATE TABLE inspections (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                property_id UUID REFERENCES properties(id) NOT NULL,
                inspection_date DATE NOT NULL,
                inspector_id INTEGER REFERENCES users(id),
                inspection_type VARCHAR(32),
                condition VARCHAR(32),
                findings TEXT,
                recommendations TEXT,
                changes_noted JSONB,
                photos INTEGER[],
                documents INTEGER[],
                status VARCHAR(32) DEFAULT 'scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def create_comparable_sales_table(cursor, existing_tables):
    """Create comparable_sales table"""
    if 'comparable_sales' not in existing_tables:
        logger.info("Creating comparable_sales table")
        cursor.execute("""
            CREATE TABLE comparable_sales (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                property_id UUID REFERENCES properties(id),
                address VARCHAR(256) NOT NULL,
                city VARCHAR(64),
                state VARCHAR(2) DEFAULT 'WA',
                zip_code VARCHAR(10),
                sale_date DATE NOT NULL,
                sale_price NUMERIC(12,2) NOT NULL,
                property_type VARCHAR(32),
                lot_size FLOAT,
                year_built INTEGER,
                bedrooms INTEGER,
                bathrooms FLOAT,
                total_area FLOAT,
                sale_type VARCHAR(32),
                verified BOOLEAN DEFAULT FALSE,
                verification_source VARCHAR(256),
                features JSONB,
                location JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def create_market_areas_table(cursor, existing_tables):
    """Create market_areas table"""
    if 'market_areas' not in existing_tables:
        logger.info("Creating market_areas table")
        cursor.execute("""
            CREATE TABLE market_areas (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(128) NOT NULL,
                code VARCHAR(32) UNIQUE,
                description TEXT,
                boundary JSONB,
                current_trend VARCHAR(32),
                market_factors JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def create_appeals_table(cursor, existing_tables):
    """Create appeals table"""
    if 'appeals' not in existing_tables:
        logger.info("Creating appeals table")
        cursor.execute("""
            CREATE TABLE appeals (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                property_id UUID REFERENCES properties(id) NOT NULL,
                assessment_id UUID REFERENCES assessments(id) NOT NULL,
                appeal_date DATE NOT NULL,
                appellant_name VARCHAR(256),
                appellant_contact VARCHAR(256),
                reason TEXT,
                requested_value NUMERIC(12,2),
                hearing_date DATE,
                decision_date DATE,
                decision VARCHAR(32),
                adjusted_value NUMERIC(12,2),
                decision_notes TEXT,
                documents INTEGER[],
                status VARCHAR(32) DEFAULT 'submitted',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def create_property_data_quality_alerts_table(cursor, existing_tables):
    """Create property_data_quality_alerts table"""
    if 'property_data_quality_alerts' not in existing_tables:
        logger.info("Creating property_data_quality_alerts table")
        cursor.execute("""
            CREATE TABLE property_data_quality_alerts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                property_id UUID REFERENCES properties(id),
                alert_type VARCHAR(64) NOT NULL,
                severity VARCHAR(16) NOT NULL,
                description TEXT NOT NULL,
                data_source VARCHAR(128),
                field_name VARCHAR(128),
                detected_value VARCHAR(256),
                expected_range VARCHAR(256),
                detection_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(32) DEFAULT 'new',
                resolved_by INTEGER REFERENCES users(id),
                resolution_time TIMESTAMP,
                resolution_notes TEXT
            )
        """)

if __name__ == "__main__":
    create_tables()
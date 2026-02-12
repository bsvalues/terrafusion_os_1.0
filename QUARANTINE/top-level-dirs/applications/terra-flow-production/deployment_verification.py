#!/usr/bin/env python3
"""
Deployment Verification Script

This script performs a series of checks to verify that the application
is ready for deployment, including database connections, environment
variables, and critical functionality.
"""
import os
import sys
import logging
import importlib
import subprocess
import socket
import requests
from urllib.parse import urlparse
import time
import json
from contextlib import contextmanager

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('deployment_verification.log')
    ]
)
logger = logging.getLogger('verify')

class VerificationError(Exception):
    """Exception raised for verification failures."""
    pass

@contextmanager
def step(message):
    """Context manager for verification steps"""
    logger.info(f"STARTING: {message}")
    start_time = time.time()
    try:
        yield
        duration = time.time() - start_time
        logger.info(f"PASSED: {message} ({duration:.2f}s)")
        print(f"✅ {message}")
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"FAILED: {message} ({duration:.2f}s) - {str(e)}")
        print(f"❌ {message}: {str(e)}")
        raise

def check_environment_variables():
    """Verify that required environment variables are set"""
    with step("Checking environment variables"):
        required_vars = [
            'DATABASE_URL',
            'SESSION_SECRET'
        ]
        
        optional_vars = [
            'SUPABASE_URL',
            'SUPABASE_KEY',
            'ENVIRONMENT',
            'DEBUG',
            'LOG_LEVEL'
        ]
        
        missing = [var for var in required_vars if not os.environ.get(var)]
        if missing:
            raise VerificationError(f"Missing required environment variables: {', '.join(missing)}")
        
        # Check if DATABASE_URL is properly formatted
        db_url = os.environ.get('DATABASE_URL', '')
        if db_url:
            try:
                parsed = urlparse(db_url)
                if not all([parsed.scheme, parsed.username, parsed.password, parsed.hostname, parsed.path]):
                    raise VerificationError(f"DATABASE_URL is not properly formatted: {db_url}")
            except Exception as e:
                raise VerificationError(f"Failed to parse DATABASE_URL: {str(e)}")
        
        # Log which optional variables are set
        set_optional = [var for var in optional_vars if os.environ.get(var)]
        if set_optional:
            logger.info(f"Optional environment variables set: {', '.join(set_optional)}")

def check_database_connection():
    """Verify database connection"""
    with step("Checking database connection"):
        try:
            from sqlalchemy import create_engine
            from sqlalchemy.sql import text
            
            db_url = os.environ.get('DATABASE_URL')
            engine = create_engine(db_url)
            
            # Test the connection
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                row = result.fetchone()
                if row[0] != 1:
                    raise VerificationError("Database query returned unexpected result")
                
                # Check if PostGIS is installed
                result = conn.execute(text("SELECT PostGIS_Version()"))
                postgis_version = result.fetchone()[0]
                logger.info(f"PostGIS version: {postgis_version}")
                
                # Check if required tables exist
                tables_query = text("""
                    SELECT tablename FROM pg_catalog.pg_tables
                    WHERE schemaname = 'public'
                """)
                result = conn.execute(tables_query)
                tables = [row[0] for row in result]
                
                required_tables = ['users', 'roles', 'permissions', 'data_anomaly']
                missing_tables = [table for table in required_tables if table not in tables]
                
                if missing_tables:
                    raise VerificationError(f"Missing required database tables: {', '.join(missing_tables)}")
                
                logger.info(f"Found {len(tables)} tables in database")
        except ImportError as e:
            raise VerificationError(f"Missing required package: {str(e)}")
        except Exception as e:
            raise VerificationError(f"Database connection failed: {str(e)}")

def check_dependencies():
    """Verify that all required dependencies are installed"""
    with step("Checking dependencies"):
        required_packages = [
            'flask',
            'flask_sqlalchemy',
            'flask_login',
            'flask_migrate',
            'gunicorn',
            'psycopg2',
            'sqlalchemy',
            'shapely',
            'geopandas',
            'langchain',
            'openai'
        ]
        
        missing = []
        for package in required_packages:
            try:
                importlib.import_module(package.replace('-', '_'))
            except ImportError:
                missing.append(package)
        
        if missing:
            raise VerificationError(f"Missing required packages: {', '.join(missing)}")

def check_port_availability():
    """Check if the required port is available"""
    with step("Checking port availability"):
        port = 5000
        
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("0.0.0.0", port))
                logger.info(f"Port {port} is available")
        except OSError:
            # Port is in use - check if it's our application
            try:
                response = requests.get(f"http://localhost:{port}/health")
                if response.status_code == 200 and "GeoAssessmentPro" in response.text:
                    logger.info(f"Port {port} is in use by GeoAssessmentPro")
                else:
                    raise VerificationError(f"Port {port} is in use by another application")
            except requests.RequestException:
                raise VerificationError(f"Port {port} is in use but not responding to HTTP requests")

def check_filesystem_permissions():
    """Check filesystem permissions"""
    with step("Checking filesystem permissions"):
        directories_to_check = [
            '.',
            './logs',
            './static',
            './uploads',
            './instance'
        ]
        
        for directory in directories_to_check:
            if not os.path.exists(directory):
                try:
                    os.makedirs(directory, exist_ok=True)
                    logger.info(f"Created directory: {directory}")
                except Exception as e:
                    raise VerificationError(f"Failed to create directory {directory}: {str(e)}")
            
            # Check if directory is writable
            test_file = os.path.join(directory, '.write_test')
            try:
                with open(test_file, 'w') as f:
                    f.write('test')
                os.remove(test_file)
            except Exception as e:
                raise VerificationError(f"Directory {directory} is not writable: {str(e)}")

def check_critical_files():
    """Check that all critical files exist"""
    with step("Checking critical files"):
        required_files = [
            'main.py',
            'app.py',
            'models.py',
            'requirements.txt',
            'alembic.ini'
        ]
        
        missing = [file for file in required_files if not os.path.exists(file)]
        if missing:
            raise VerificationError(f"Missing critical files: {', '.join(missing)}")

def check_migrations():
    """Check database migrations"""
    with step("Checking database migrations"):
        try:
            # Check if migrations directory exists and has files
            if not os.path.exists('migrations'):
                raise VerificationError("Migrations directory not found")
            
            version_files = []
            for root, dirs, files in os.walk('migrations/versions'):
                version_files.extend([os.path.join(root, file) for file in files if file.endswith('.py')])
            
            if not version_files:
                raise VerificationError("No migration versions found")
            
            logger.info(f"Found {len(version_files)} migration versions")
            
            # Check if migrations can be inspected
            try:
                result = subprocess.run(
                    ['flask', 'db', 'current'], 
                    capture_output=True, 
                    text=True,
                    check=True
                )
                if result.stdout:
                    current_revision = result.stdout.strip()
                    logger.info(f"Current migration: {current_revision}")
            except subprocess.CalledProcessError as e:
                logger.warning(f"Could not get current migration: {e.stderr}")
                # This isn't a fatal error as we might not have the app context
        except Exception as e:
            raise VerificationError(f"Migration check failed: {str(e)}")

def check_api_endpoints():
    """Check critical API endpoints"""
    with step("Checking API endpoints"):
        # We'll skip actual HTTP calls since the application might not be running
        # This is a static check of the code
        try:
            with open('app.py', 'r') as f:
                app_content = f.read()
            
            endpoints = []
            for line in app_content.split('\n'):
                if '@app.route(' in line:
                    endpoints.append(line.strip())
            
            if not endpoints:
                with open('main.py', 'r') as f:
                    main_content = f.read()
                
                for line in main_content.split('\n'):
                    if '@app.route(' in line:
                        endpoints.append(line.strip())
            
            if not endpoints:
                raise VerificationError("No API endpoints found in app.py or main.py")
            
            logger.info(f"Found {len(endpoints)} API endpoints")
        except Exception as e:
            raise VerificationError(f"API endpoint check failed: {str(e)}")

def check_static_assets():
    """Check static assets"""
    with step("Checking static assets"):
        if not os.path.exists('static'):
            raise VerificationError("Static directory not found")
        
        css_dir = os.path.join('static', 'css')
        js_dir = os.path.join('static', 'js')
        img_dir = os.path.join('static', 'img')
        
        if not os.path.exists(css_dir) or not os.listdir(css_dir):
            raise VerificationError("CSS directory is missing or empty")
        
        if not os.path.exists(js_dir) or not os.listdir(js_dir):
            logger.warning("JS directory is missing or empty - this may be intentional")
        
        logger.info(f"Found static assets: CSS={len(os.listdir(css_dir))}, JS={len(os.listdir(js_dir)) if os.path.exists(js_dir) else 0}")

def check_templates():
    """Check templates"""
    with step("Checking templates"):
        if not os.path.exists('templates'):
            raise VerificationError("Templates directory not found")
        
        templates = []
        for root, dirs, files in os.walk('templates'):
            templates.extend([os.path.join(root, file) for file in files if file.endswith('.html')])
        
        if not templates:
            raise VerificationError("No templates found")
        
        logger.info(f"Found {len(templates)} templates")

def export_verification_report():
    """Export a verification report"""
    with step("Exporting verification report"):
        report = {
            "application": "GeoAssessmentPro",
            "verification_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "system_info": {
                "python_version": sys.version,
                "platform": sys.platform,
                "environment": os.environ.get("ENVIRONMENT", "development")
            },
            "checks_passed": True,
            "verification_details": []
        }
        
        # Add verification results from log
        try:
            with open('deployment_verification.log', 'r') as f:
                log_content = f.read()
            
            passed_checks = []
            failed_checks = []
            
            for line in log_content.split('\n'):
                if "PASSED:" in line:
                    check_name = line.split("PASSED:")[1].split("(")[0].strip()
                    passed_checks.append(check_name)
                elif "FAILED:" in line:
                    check_name = line.split("FAILED:")[1].split("(")[0].strip()
                    error = line.split("-")[1].strip() if "-" in line else "Unknown error"
                    failed_checks.append({"name": check_name, "error": error})
            
            if failed_checks:
                report["checks_passed"] = False
            
            report["verification_details"] = {
                "passed_checks": passed_checks,
                "failed_checks": failed_checks
            }
            
            with open('verification_report.json', 'w') as f:
                json.dump(report, f, indent=2)
            
            logger.info(f"Verification report exported to verification_report.json")
        except Exception as e:
            logger.error(f"Failed to export verification report: {str(e)}")

def main():
    """Main verification function"""
    print("\n=============================================")
    print("GeoAssessmentPro Deployment Verification Tool")
    print("=============================================\n")
    
    checks = [
        check_environment_variables,
        check_database_connection,
        check_dependencies,
        check_port_availability,
        check_filesystem_permissions,
        check_critical_files,
        check_migrations,
        check_api_endpoints,
        check_static_assets,
        check_templates
    ]
    
    failed = False
    for check in checks:
        try:
            check()
        except Exception:
            failed = True
    
    export_verification_report()
    
    print("\n=============================================")
    if failed:
        print("❌ Verification FAILED. See verification_report.json for details.")
        return 1
    else:
        print("✅ All checks PASSED! The application is ready for deployment.")
        return 0

if __name__ == "__main__":
    sys.exit(main())
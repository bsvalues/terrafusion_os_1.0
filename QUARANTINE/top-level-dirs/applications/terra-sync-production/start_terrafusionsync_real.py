#!/usr/bin/env python3
"""
TerraFusionSync Startup Script - Real Data Configuration
Configures environment for real Benton County data and starts server on port 5003
"""

import os
import sys
from pathlib import Path

def setup_environment():
    """Configure environment variables for real data mode"""
    
    # Database configuration - Use SQLite with real Benton County data
    os.environ['DATABASE_URL'] = 'sqlite:///terrafusionsync_real.db'
    
    # Security configuration
    os.environ['SESSION_SECRET'] = 'terrafusion-enterprise-production-secret-key-2025'
    os.environ['JWT_SECRET_KEY'] = 'terrafusion-jwt-production-key-secure-2025'
    os.environ['ENCRYPTION_KEY'] = 'terrafusion-encryption-key-aes256-secure'
    
    # Application configuration
    os.environ['FLASK_ENV'] = 'production'
    os.environ['APP_VERSION'] = '1.0.0'
    os.environ['BUILD_NUMBER'] = 'enterprise-001'
    
    # Performance configuration
    os.environ['DATABASE_POOL_SIZE'] = '20'
    os.environ['DATABASE_MAX_OVERFLOW'] = '30'
    os.environ['DATABASE_POOL_TIMEOUT'] = '30'
    
    # Cache configuration
    os.environ['CACHE_TYPE'] = 'simple'
    os.environ['CACHE_DEFAULT_TIMEOUT'] = '300'
    
    # Monitoring configuration
    os.environ['MONITORING_ENABLED'] = 'true'
    os.environ['METRICS_ENDPOINT'] = '/metrics'
    os.environ['HEALTH_CHECK_ENDPOINT'] = '/health'
    
    # API configuration
    os.environ['API_RATE_LIMIT'] = '1000'
    os.environ['API_TIMEOUT'] = '30'
    os.environ['API_MAX_CONTENT_LENGTH'] = '16777216'
    
    # Logging configuration
    os.environ['LOG_LEVEL'] = 'INFO'
    os.environ['LOG_FILE_MAX_SIZE'] = '100MB'
    os.environ['LOG_BACKUP_COUNT'] = '10'
    os.environ['LOG_RETENTION_DAYS'] = '90'
    
    # Enterprise features
    os.environ['MULTI_TENANT_ENABLED'] = 'true'
    os.environ['AUDIT_LOGGING_ENABLED'] = 'true'
    os.environ['BACKUP_ENABLED'] = 'true'
    
    # Deployment configuration
    os.environ['DEPLOYMENT_ENVIRONMENT'] = 'production'
    
    # Real data configuration
    os.environ['REAL_DATA_ENABLED'] = 'true'
    os.environ['BENTON_FTP_DATA'] = 'true'
    os.environ['COUNTY_CODE'] = 'benton-wa'
    
    print("[OK] Environment configured for real Benton County data")

def start_server():
    """Start the TerraFusionSync server"""
    
    # Check if real database exists
    db_path = Path('terrafusionsync_real.db')
    if not db_path.exists():
        print(f"[FAIL] Real database not found: {db_path.absolute()}")
        print("Please ensure terrafusionsync_real.db is in the current directory")
        return False
    
    print(f"[OK] Real database found: {db_path.absolute()} ({db_path.stat().st_size / (1024*1024):.1f} MB)")
    
    # Import and start the Flask app
    try:
        from app import app
        print("[LAUNCH] Starting TerraFusionSync with Real Benton County Data")
        print("[CHART] Database: SQLite with 88,011 active properties")
        print("[WEB] Server will start on: http://localhost:5003")
        print("📈 Features: Enterprise property assessment, GIS export, district lookup, AI analysis")
        print("\n" + "="*60)
        print("TerraFusionSync PRODUCTION - Real Data Mode")
        print("="*60)
        
        # Start the Flask development server on port 5003
        app.run(
            host='0.0.0.0',
            port=5003,
            debug=False,
            threaded=True
        )
        
    except ImportError as e:
        print(f"[FAIL] Failed to import app: {e}")
        return False
    except Exception as e:
        print(f"[FAIL] Failed to start server: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("[TOOL] Setting up TerraFusionSync Real Data Environment...")
    setup_environment()
    
    print("\n[LAUNCH] Starting TerraFusionSync Server...")
    success = start_server()
    
    if not success:
        sys.exit(1) 
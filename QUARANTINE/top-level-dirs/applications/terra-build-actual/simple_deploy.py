#!/usr/bin/env python3
"""
TerraFusion Enhanced Enterprise Simple Deployment
"""

import os
import sys
import sqlite3
import json
import logging
from datetime import datetime
from werkzeug.security import generate_password_hash

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def initialize_database():
    """Initialize the enterprise database"""
    logger.info("Initializing database...")
    
    db_path = 'terrafusion_enterprise.db'
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        ''')
        
        # Create properties table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS properties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                parcel_id TEXT UNIQUE NOT NULL,
                address TEXT,
                latitude REAL,
                longitude REAL,
                building_type TEXT,
                square_feet INTEGER,
                year_built INTEGER,
                quality_grade TEXT,
                condition_rating TEXT,
                assessed_value REAL,
                market_value REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create valuations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS valuations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                property_id INTEGER,
                valuation_method TEXT,
                rcn_value REAL,
                market_value REAL,
                confidence_score REAL,
                analysis_data TEXT,
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (property_id) REFERENCES properties (id),
                FOREIGN KEY (created_by) REFERENCES users (id)
            )
        ''')
        
        # Create agent tasks table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agent_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_type TEXT NOT NULL,
                agent_id TEXT NOT NULL,
                task_data TEXT,
                result_data TEXT,
                execution_time REAL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        ''')
        
        # Create audit log table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                resource TEXT,
                details TEXT,
                ip_address TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Create default admin user
        cursor.execute('''
            INSERT OR IGNORE INTO users (username, password_hash, role)
            VALUES (?, ?, ?)
        ''', ('admin', generate_password_hash('admin123'), 'admin'))
        
        # Insert sample properties
        sample_properties = [
            ('P001', '123 Main St, Olympia WA', 47.0379, -122.9015, 'SFR', 2000, 2015, 'MEDIUM', 'GOOD', 285000, 295000),
            ('P002', '456 Oak Ave, Olympia WA', 47.0395, -122.8995, 'CONDO', 1200, 2018, 'HIGH', 'EXCELLENT', 195000, 205000),
            ('P003', '789 Pine Rd, Olympia WA', 47.0365, -122.9025, 'SFR', 2500, 2010, 'HIGH', 'GOOD', 385000, 395000),
            ('P004', '321 Cedar St, Olympia WA', 47.0385, -122.9005, 'COMMERCIAL', 5000, 2005, 'MEDIUM', 'AVERAGE', 750000, 780000),
            ('P005', '654 Elm Dr, Olympia WA', 47.0375, -122.8985, 'SFR', 1800, 2020, 'PREMIUM', 'EXCELLENT', 425000, 435000)
        ]
        
        for prop in sample_properties:
            cursor.execute('''
                INSERT OR IGNORE INTO properties 
                (parcel_id, address, latitude, longitude, building_type, square_feet, 
                 year_built, quality_grade, condition_rating, assessed_value, market_value)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', prop)
        
        conn.commit()
        conn.close()
        
        logger.info("Database initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return False

def create_config():
    """Create deployment configuration"""
    config = {
        "environment": "production",
        "database_path": "terrafusion_enterprise.db",
        "web_server": {
            "host": "0.0.0.0",
            "port": 5001
        },
        "ai_orchestrator": {
            "max_agents": 6,
            "models": ["gpt-4", "llama3.2"]
        }
    }
    
    with open('deployment_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    logger.info("Configuration created")
    return True

def start_application():
    """Start the TerraFusion Enhanced Enterprise application"""
    logger.info("Starting TerraFusion Enhanced Enterprise Application...")
    
    try:
        # Import and start the enhanced application
        exec(open('terrafusion_enterprise_enhanced.py').read())
        return True
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        return False

def main():
    """Main deployment function"""
    print("TerraFusion Enhanced Enterprise Deployment")
    print("=" * 50)
    
    # Step 1: Create configuration
    if not create_config():
        print("Configuration creation failed")
        return False
    
    # Step 2: Initialize database
    if not initialize_database():
        print("Database initialization failed")
        return False
    
    # Step 3: Start application
    print("\nStarting TerraFusion Enhanced Enterprise...")
    print("Application will be available at: http://localhost:5001")
    print("Default login: admin / admin123")
    print("=" * 50)
    
    # Start the application
    if start_application():
        print("Application started successfully!")
        return True
    else:
        print("Application startup failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
"""
Create Data Quality Tables

This script creates the necessary database tables for data quality monitoring
using SQLAlchemy and Flask-Migrate.
"""

import os
import sys
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate, migrate
import json
from datetime import datetime
from app import db, app as flask_app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("create_data_quality_tables")

def create_data_quality_tables():
    """Create the data quality tables using SQLAlchemy migrations"""
    try:
        logger.info("Setting up data quality tables...")
        
        with flask_app.app_context():
            # Import models to make sure they're registered with SQLAlchemy
            from sync_service.models.data_quality import (
                DataQualityRule, DataQualityIssue, DataQualityReport,
                AnomalyDetectionConfig, DataAnomaly, DataQualityAlert,
                DataQualityNotification
            )
            
            # Create tables
            db.create_all()
            
            logger.info("Data quality tables created successfully")
            
            # Check if we have data quality alerts
            alerts = DataQualityAlert.query.all()
            
            if not alerts:
                logger.info("Creating sample data quality alerts...")
                
                # Create sample alerts
                sample_alerts = [
                    DataQualityAlert(
                        name="Property Data Completeness",
                        description="Ensures that property records have all required fields completed",
                        alert_type="completeness",
                        conditions=json.dumps({
                            "table": "properties",
                            "required_fields": ["parcel_id", "address", "property_class"]
                        }),
                        severity_threshold="high",
                        recipients=json.dumps(["admin@example.com"]),
                        channels=json.dumps(["email", "log"])
                    ),
                    DataQualityAlert(
                        name="Invalid Property Values",
                        description="Checks for outlier values in property assessment data",
                        alert_type="range",
                        conditions=json.dumps({
                            "table": "property_valuations",
                            "field": "assessed_value",
                            "min_value": 1000,
                            "max_value": 50000000
                        }),
                        severity_threshold="medium",
                        recipients=json.dumps(["admin@example.com"]),
                        channels=json.dumps(["log"])
                    )
                ]
                
                # Add and commit
                for alert in sample_alerts:
                    db.session.add(alert)
                    
                db.session.commit()
                logger.info(f"Created {len(sample_alerts)} sample alerts")
                
            else:
                logger.info(f"Found {len(alerts)} existing data quality alerts")
            
            return True
            
    except Exception as e:
        logger.error(f"Error creating data quality tables: {str(e)}")
        return False

if __name__ == "__main__":
    if create_data_quality_tables():
        logger.info("Data quality tables setup completed successfully")
        sys.exit(0)
    else:
        logger.error("Failed to create data quality tables")
        sys.exit(1)
#!/usr/bin/env python3
"""
Setup Data Quality Tables

This script ensures that all necessary tables for data quality monitoring are
created in the Supabase database.
"""

import os
import logging
import json
from datetime import datetime
# Import what's already available in the project
from supabase_client import get_supabase_client

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def setup_data_quality_tables():
    """Create all necessary data quality tables in Supabase"""
    logger.info("Setting up data quality tables in Supabase...")
    
    # Environment variables should already be loaded by the main application
    
    # Get Supabase client
    client = get_supabase_client()
    if not client:
        logger.error("Failed to get Supabase client")
        return False
    
    try:
        # SQL for creating the data_quality_alerts table
        create_alerts_table_sql = """
        CREATE TABLE IF NOT EXISTS data_quality_alerts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT,
            check_type TEXT NOT NULL,
            parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
            threshold FLOAT NOT NULL DEFAULT 0.95,
            severity TEXT NOT NULL DEFAULT 'medium',
            notification_channels JSONB DEFAULT '["log"]'::jsonb,
            enabled BOOLEAN DEFAULT TRUE,
            last_checked TIMESTAMP WITH TIME ZONE,
            last_status TEXT,
            last_value TEXT,
            last_error TEXT,
            triggered_count INTEGER DEFAULT 0,
            created_date TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Add some indices for faster querying
        CREATE INDEX IF NOT EXISTS idx_data_quality_alerts_type ON data_quality_alerts(check_type);
        CREATE INDEX IF NOT EXISTS idx_data_quality_alerts_severity ON data_quality_alerts(severity);
        """
        
        # SQL for creating a data_quality_notifications table
        create_notifications_table_sql = """
        CREATE TABLE IF NOT EXISTS data_quality_notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            alert_id UUID REFERENCES data_quality_alerts(id),
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            severity TEXT NOT NULL DEFAULT 'medium',
            status TEXT NOT NULL DEFAULT 'new',
            recipient TEXT,
            channel TEXT DEFAULT 'log',
            notification_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            delivered_at TIMESTAMP WITH TIME ZONE,
            read_at TIMESTAMP WITH TIME ZONE
        );
        
        -- Add indices for faster querying
        CREATE INDEX IF NOT EXISTS idx_data_quality_notifications_alert ON data_quality_notifications(alert_id);
        CREATE INDEX IF NOT EXISTS idx_data_quality_notifications_status ON data_quality_notifications(status);
        """
        
        # Execute SQL statements as RPC functions
        logger.info("Creating data_quality_alerts table...")
        response = client.rpc('exec_sql', {'query': create_alerts_table_sql}).execute()
        if hasattr(response, 'error') and response.error:
            logger.error(f"Error creating alerts table: {response.error}")
            # Try alternative approach using direct SQL
            logger.info("Will try to use direct SQL API instead...")
            try:
                response = client.sql(create_alerts_table_sql)
                logger.info("Successfully created data_quality_alerts table using SQL API")
            except Exception as sql_error:
                logger.error(f"Error creating alerts table using SQL API: {str(sql_error)}")
        else:
            logger.info("Successfully created data_quality_alerts table")
            
        logger.info("Creating data_quality_notifications table...")
        response = client.rpc('exec_sql', {'query': create_notifications_table_sql}).execute()
        if hasattr(response, 'error') and response.error:
            logger.error(f"Error creating notifications table: {response.error}")
            # Try alternative approach using direct SQL
            logger.info("Will try to use direct SQL API instead...")
            try:
                response = client.sql(create_notifications_table_sql)
                logger.info("Successfully created data_quality_notifications table using SQL API")
            except Exception as sql_error:
                logger.error(f"Error creating notifications table using SQL API: {str(sql_error)}")
        else:
            logger.info("Successfully created data_quality_notifications table")
        
        # Create example alerts if none exist
        alerts_response = client.table('data_quality_alerts').select('*').execute()
        if not (hasattr(alerts_response, 'data') and alerts_response.data):
            logger.info("No alerts found. Creating example alerts...")
            
            # Create two example alerts
            example_alerts = [
                {
                    "name": "Property Data Completeness",
                    "description": "Ensures that property records have all required fields completed",
                    "check_type": "completeness",
                    "parameters": {
                        "table": "properties",
                        "required_fields": ["parcel_id", "address", "property_class"]
                    },
                    "threshold": 0.95,
                    "severity": "high",
                    "notification_channels": ["log", "email"],
                    "enabled": True
                },
                {
                    "name": "Invalid Property Values",
                    "description": "Checks for outlier values in property assessment data",
                    "check_type": "range",
                    "parameters": {
                        "table": "property_valuations",
                        "field": "assessed_value",
                        "min_value": 1000,
                        "max_value": 50000000
                    },
                    "threshold": 0.98,
                    "severity": "medium",
                    "notification_channels": ["log"],
                    "enabled": True
                }
            ]
            
            # Insert example alerts
            response = client.table('data_quality_alerts').insert(example_alerts).execute()
            if hasattr(response, 'error') and response.error:
                logger.error(f"Error creating example alerts: {response.error}")
            else:
                logger.info(f"Created {len(example_alerts)} example alerts")
                
        return True
        
    except Exception as e:
        logger.error(f"Error setting up data quality tables: {str(e)}")
        return False

if __name__ == "__main__":
    if setup_data_quality_tables():
        logger.info("Data quality tables setup completed successfully")
    else:
        logger.error("Failed to setup data quality tables")
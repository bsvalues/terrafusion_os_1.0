"""
Create Data Anomaly Table

This script creates the data_anomaly table for storing detected anomalies
in property assessment data.
"""

import logging
from app import db, app
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_data_anomaly_table():
    """
    Create the data_anomaly table if it doesn't exist.
    """
    with app.app_context():
        try:
            # Create the table
            query = """
            CREATE TABLE IF NOT EXISTS data_anomaly (
                id SERIAL PRIMARY KEY,
                config_id INTEGER,
                table_name VARCHAR(255) NOT NULL,
                field_name VARCHAR(255),
                record_id VARCHAR(255),
                anomaly_type VARCHAR(100) NOT NULL,
                anomaly_details TEXT,
                anomaly_score FLOAT,
                current_value TEXT,
                previous_value TEXT,
                severity VARCHAR(50) NOT NULL DEFAULT 'medium',
                status VARCHAR(50) NOT NULL DEFAULT 'open',
                resolved_at TIMESTAMP,
                resolved_by VARCHAR(100),
                detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Create indexes for better query performance
            CREATE INDEX IF NOT EXISTS idx_data_anomaly_table_name ON data_anomaly(table_name);
            CREATE INDEX IF NOT EXISTS idx_data_anomaly_record_id ON data_anomaly(record_id);
            CREATE INDEX IF NOT EXISTS idx_data_anomaly_severity ON data_anomaly(severity);
            CREATE INDEX IF NOT EXISTS idx_data_anomaly_status ON data_anomaly(status);
            CREATE INDEX IF NOT EXISTS idx_data_anomaly_detected_at ON data_anomaly(detected_at);
            """
            
            db.session.execute(query)
            db.session.commit()
            
            logger.info("Data anomaly table created successfully")
            
            # Create the notification table
            query = """
            CREATE TABLE IF NOT EXISTS data_quality_notification (
                id SERIAL PRIMARY KEY,
                alert_id INTEGER,
                issue_id INTEGER,
                anomaly_id INTEGER REFERENCES data_anomaly(id) ON DELETE SET NULL,
                report_id INTEGER,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                severity VARCHAR(50) NOT NULL DEFAULT 'medium',
                recipient VARCHAR(255) NOT NULL,
                channel VARCHAR(100) NOT NULL DEFAULT 'email',
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                notification_data JSONB,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                delivered_at TIMESTAMP,
                read_at TIMESTAMP
            );
            
            -- Create indexes for better query performance
            CREATE INDEX IF NOT EXISTS idx_notification_alert_id ON data_quality_notification(alert_id);
            CREATE INDEX IF NOT EXISTS idx_notification_anomaly_id ON data_quality_notification(anomaly_id);
            CREATE INDEX IF NOT EXISTS idx_notification_status ON data_quality_notification(status);
            CREATE INDEX IF NOT EXISTS idx_notification_created_at ON data_quality_notification(created_at);
            """
            
            db.session.execute(query)
            db.session.commit()
            
            logger.info("Data quality notification table created successfully")
            
            return True
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating data anomaly table: {str(e)}")
            return False

if __name__ == "__main__":
    create_data_anomaly_table()
"""
Generate Sample Anomalies

This script generates sample anomalies for testing the geospatial anomaly visualization.
It requires existing sample parcels in the database.
"""

import os
import sys
import logging
import json
import random
import datetime
from sqlalchemy import text
from app import db, app
from data_stability_framework import framework

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Anomaly types
ANOMALY_TYPES = [
    "statistical_outlier",
    "value_change",
    "rule_violation",
    "pattern_anomaly",
    "missing_data"
]

# Severity levels
SEVERITY_LEVELS = [
    "low",
    "medium",
    "high",
    "critical"
]

# Fields to generate anomalies for
ANOMALY_FIELDS = {
    "total_value": {
        "description": "Total property value anomaly",
        "types": ["statistical_outlier", "value_change"]
    },
    "land_value": {
        "description": "Land value anomaly",
        "types": ["statistical_outlier", "value_change"]
    },
    "improvement_value": {
        "description": "Improvement value anomaly",
        "types": ["statistical_outlier", "value_change"]
    },
    "acreage": {
        "description": "Property acreage anomaly",
        "types": ["statistical_outlier", "rule_violation"]
    },
    "square_footage": {
        "description": "Building square footage anomaly",
        "types": ["statistical_outlier", "missing_data"]
    },
    "bedrooms": {
        "description": "Bedroom count anomaly",
        "types": ["statistical_outlier", "pattern_anomaly"]
    },
    "bathrooms": {
        "description": "Bathroom count anomaly",
        "types": ["statistical_outlier", "pattern_anomaly"]
    },
    "year_built": {
        "description": "Year built anomaly",
        "types": ["statistical_outlier", "rule_violation", "missing_data"]
    },
    "last_sale_price": {
        "description": "Sale price anomaly",
        "types": ["statistical_outlier", "value_change"]
    }
}

def generate_sample_anomalies(count=100):
    """
    Generate sample anomalies for testing.
    
    Args:
        count: Number of anomalies to generate
    """
    with app.app_context():
        try:
            # First make sure tables exist
            check_tables()
            
            # Get existing parcel records
            query = "SELECT id, parcel_id, address, property_type, total_value FROM parcels LIMIT 1000"
            result = db.session.execute(text(query))
            parcels = result.fetchall()
            
            if not parcels:
                logger.error("No parcels found. Please create sample parcels first.")
                return
            
            logger.info(f"Found {len(parcels)} parcels to use for anomaly generation")
            
            # Generate anomalies
            anomalies_created = 0
            for _ in range(count):
                # Randomly select a parcel
                parcel = random.choice(parcels)
                parcel_id = parcel[0]  # ID from database
                
                # Randomly select a field and anomaly type
                field_name = random.choice(list(ANOMALY_FIELDS.keys()))
                field_info = ANOMALY_FIELDS[field_name]
                anomaly_type = random.choice(field_info["types"])
                
                # Randomly select severity
                severity = random.choice(SEVERITY_LEVELS)
                
                # Create anomaly details
                anomaly_details = generate_anomaly_details(field_name, anomaly_type, parcel)
                
                # Create the anomaly record
                anomaly_id = create_anomaly_record(
                    table_name="parcels",
                    field_name=field_name,
                    record_id=parcel_id,
                    anomaly_type=anomaly_type,
                    anomaly_details=anomaly_details,
                    severity=severity
                )
                
                if anomaly_id:
                    anomalies_created += 1
                
                # Add a bit of delay between records
                if anomalies_created % 10 == 0:
                    logger.info(f"Created {anomalies_created} anomalies so far")
            
            logger.info(f"Successfully created {anomalies_created} sample anomalies")
            
        except Exception as e:
            logger.error(f"Error generating sample anomalies: {str(e)}")

def check_tables():
    """Check if required tables exist and create them if they don't"""
    try:
        # Check if data_anomaly table exists
        check_query = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'data_anomaly'
        );
        """
        result = db.session.execute(text(check_query))
        data_anomaly_exists = result.scalar()
        
        if not data_anomaly_exists:
            logger.info("Data anomaly table does not exist. Creating it now.")
            from create_data_anomaly_table import create_data_anomaly_table
            create_data_anomaly_table()
        
        # Check if parcels table exists
        check_query = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'parcels'
        );
        """
        result = db.session.execute(text(check_query))
        parcels_exists = result.scalar()
        
        if not parcels_exists:
            logger.info("Parcels table does not exist. Creating it now.")
            from create_parcels_table import create_parcels_table
            create_parcels_table()
        
    except Exception as e:
        logger.error(f"Error checking tables: {str(e)}")
        raise

def generate_anomaly_details(field_name, anomaly_type, parcel):
    """
    Generate anomaly details based on field and type.
    
    Args:
        field_name: Name of the field with the anomaly
        anomaly_type: Type of anomaly
        parcel: Parcel data
        
    Returns:
        JSON string with anomaly details
    """
    if anomaly_type == "statistical_outlier":
        return json.dumps({
            "description": f"Value for {field_name} is a statistical outlier",
            "field": field_name,
            "value": random.uniform(100, 10000) if "value" in field_name else random.randint(1, 100),
            "expected_range": [
                random.uniform(50, 500) if "value" in field_name else random.randint(1, 10),
                random.uniform(1000, 5000) if "value" in field_name else random.randint(20, 50)
            ],
            "z_score": random.uniform(3.1, 10.0),
            "detection_method": "zscore"
        })
    
    elif anomaly_type == "value_change":
        current_value = random.uniform(100000, 1000000) if "value" in field_name else random.randint(1, 100)
        previous_value = current_value * (1 - random.uniform(0.3, 0.8))
        
        return json.dumps({
            "description": f"Unusual change in {field_name}",
            "field": field_name,
            "current_value": current_value,
            "previous_value": previous_value,
            "change_percent": round((current_value - previous_value) / abs(previous_value) * 100, 2),
            "threshold": 25.0,
            "detection_method": "percent_change"
        })
    
    elif anomaly_type == "rule_violation":
        return json.dumps({
            "description": f"Value violates business rule for {field_name}",
            "field": field_name,
            "rule_name": f"valid_{field_name}_range",
            "rule_description": f"Valid range check for {field_name}",
            "value": random.uniform(100, 10000) if "value" in field_name else random.randint(1, 100),
            "expected_range": [
                random.uniform(1000, 5000) if "value" in field_name else random.randint(1, 10),
                random.uniform(100000, 500000) if "value" in field_name else random.randint(20, 50)
            ],
            "message": f"Value for {field_name} outside of expected range"
        })
    
    elif anomaly_type == "pattern_anomaly":
        return json.dumps({
            "description": f"Unusual pattern detected in {field_name}",
            "field": field_name,
            "value": random.uniform(100, 10000) if "value" in field_name else random.randint(1, 100),
            "pattern_type": "sequence_break",
            "confidence": random.uniform(0.7, 0.99),
            "detection_method": "pattern_recognition"
        })
    
    elif anomaly_type == "missing_data":
        return json.dumps({
            "description": f"Missing or null value for {field_name}",
            "field": field_name,
            "impact": random.choice(["low", "medium", "high"]),
            "recommended_action": "Review and update data entry"
        })
    
    # Default case
    return json.dumps({
        "description": f"Anomaly in {field_name}",
        "type": anomaly_type
    })

def create_anomaly_record(table_name, field_name, record_id, anomaly_type, anomaly_details, severity):
    """
    Create an anomaly record in the database.
    
    Args:
        table_name: Name of the table with the anomaly
        field_name: Name of the field with the anomaly
        record_id: ID of the record with the anomaly
        anomaly_type: Type of anomaly
        anomaly_details: JSON string with details
        severity: Severity level
        
    Returns:
        ID of the created anomaly record, or None if failed
    """
    try:
        # Calculate random anomaly score
        anomaly_score = random.uniform(0.7, 1.0)
        
        # Determine random status (mostly open, some resolved)
        status = "open" if random.random() < 0.8 else "resolved"
        
        # Random detection date within the last 30 days
        days_ago = random.randint(0, 30)
        detected_at = datetime.datetime.now() - datetime.timedelta(days=days_ago)
        
        # Insert query
        query = """
        INSERT INTO data_anomaly 
        (table_name, field_name, record_id, anomaly_type, anomaly_details, 
         anomaly_score, severity, status, detected_at)
        VALUES
        (:table_name, :field_name, :record_id, :anomaly_type, :anomaly_details,
         :anomaly_score, :severity, :status, :detected_at)
        RETURNING id
        """
        
        result = db.session.execute(
            text(query),
            {
                "table_name": table_name,
                "field_name": field_name,
                "record_id": str(record_id),
                "anomaly_type": anomaly_type,
                "anomaly_details": anomaly_details,
                "anomaly_score": anomaly_score,
                "severity": severity,
                "status": status,
                "detected_at": detected_at
            }
        )
        
        anomaly_id = result.scalar()
        db.session.commit()
        
        return anomaly_id
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating anomaly record: {str(e)}")
        return None

if __name__ == "__main__":
    # Get count from command line argument if provided
    count = 100
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            logger.error("Invalid count argument. Using default of 100.")
    
    generate_sample_anomalies(count)
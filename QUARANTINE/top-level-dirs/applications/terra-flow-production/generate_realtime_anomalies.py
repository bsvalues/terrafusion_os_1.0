"""
Generate Real-time Anomalies

This script runs in the background to continuously generate new anomalies
at random intervals, simulating real-time anomaly detection for the visualization.
"""

import os
import sys
import logging
import time
import random
import threading
import datetime
import json
import argparse
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
    "pattern_anomaly"
]

# Severity distribution
SEVERITY_DISTRIBUTION = {
    "low": 0.45,
    "medium": 0.35,
    "high": 0.15,
    "critical": 0.05
}

# Fields for anomaly generation
ANOMALY_FIELDS = [
    "total_value",
    "land_value",
    "improvement_value",
    "acreage",
    "square_footage"
]

class RealTimeAnomalyGenerator:
    """
    Continuously generates anomalies at random intervals to simulate
    real-time anomaly detection.
    """
    
    def __init__(self, interval_min=10, interval_max=30):
        """
        Initialize the generator.
        
        Args:
            interval_min: Minimum seconds between anomalies
            interval_max: Maximum seconds between anomalies
        """
        self.interval_min = interval_min
        self.interval_max = interval_max
        self.running = False
        self.generator_thread = None
        self.anomalies_generated = 0
        self.start_time = None
    
    def start(self):
        """Start the anomaly generator thread"""
        if self.running:
            logger.warning("Generator already running")
            return
        
        self.running = True
        self.start_time = time.time()
        self.generator_thread = threading.Thread(target=self._generator_loop)
        self.generator_thread.daemon = True
        self.generator_thread.start()
        
        logger.info("Real-time anomaly generator started")
    
    def stop(self):
        """Stop the anomaly generator thread"""
        self.running = False
        if self.generator_thread:
            self.generator_thread.join(timeout=2.0)
        
        runtime = time.time() - self.start_time if self.start_time else 0
        logger.info(f"Real-time anomaly generator stopped after {runtime:.1f} seconds")
        logger.info(f"Generated {self.anomalies_generated} anomalies")
    
    def _generator_loop(self):
        """Main generator loop"""
        while self.running:
            try:
                # Generate a random anomaly
                with app.app_context():
                    self._generate_random_anomaly()
                
                # Wait a random interval
                interval = random.uniform(self.interval_min, self.interval_max)
                time.sleep(interval)
            
            except Exception as e:
                logger.error(f"Error in generator loop: {str(e)}")
                time.sleep(5)  # Sleep longer after error
    
    def _generate_random_anomaly(self):
        """Generate a random anomaly"""
        try:
            # Get a random parcel
            query = "SELECT id FROM parcels ORDER BY RANDOM() LIMIT 1"
            result = db.session.execute(text(query))
            parcel_id = result.scalar()
            
            if not parcel_id:
                logger.error("No parcels available for anomaly generation")
                return
            
            # Select random anomaly characteristics
            anomaly_type = random.choice(ANOMALY_TYPES)
            field_name = random.choice(ANOMALY_FIELDS)
            
            # Select severity based on distribution
            severity = self._select_weighted_severity()
            
            # Create anomaly details
            anomaly_details = self._create_anomaly_details(anomaly_type, field_name, parcel_id)
            
            # Insert the anomaly
            anomaly_id = self._create_anomaly_record(
                table_name="parcels",
                field_name=field_name,
                record_id=parcel_id,
                anomaly_type=anomaly_type,
                anomaly_details=anomaly_details,
                severity=severity
            )
            
            if anomaly_id:
                self.anomalies_generated += 1
                logger.info(f"Generated {severity} {anomaly_type} anomaly (ID: {anomaly_id})")
        
        except Exception as e:
            logger.error(f"Error generating random anomaly: {str(e)}")
    
    def _select_weighted_severity(self):
        """Select a severity level based on weighted distribution"""
        r = random.random()
        cumulative = 0
        
        for severity, weight in SEVERITY_DISTRIBUTION.items():
            cumulative += weight
            if r <= cumulative:
                return severity
        
        # Fallback
        return "medium"
    
    def _create_anomaly_details(self, anomaly_type, field_name, parcel_id):
        """
        Create details for an anomaly.
        
        Args:
            anomaly_type: Type of anomaly
            field_name: Field with the anomaly
            parcel_id: ID of the parcel
            
        Returns:
            JSON string with anomaly details
        """
        # Get current field value
        query = f"SELECT {field_name} FROM parcels WHERE id = :parcel_id"
        result = db.session.execute(text(query), {"parcel_id": parcel_id})
        current_value = result.scalar()
        
        if anomaly_type == "statistical_outlier":
            return json.dumps({
                "description": f"Value for {field_name} is a statistical outlier",
                "field": field_name,
                "value": float(current_value) if current_value else random.uniform(100, 10000),
                "expected_range": [
                    random.uniform(50, 500),
                    random.uniform(1000, 5000)
                ],
                "z_score": random.uniform(3.1, 10.0),
                "detection_method": "zscore",
                "detected_by": "RealTimeAnomalyGenerator"
            })
        
        elif anomaly_type == "value_change":
            previous_value = float(current_value) * 0.7 if current_value else random.uniform(100, 1000)
            current = float(current_value) if current_value else previous_value * 1.5
            
            return json.dumps({
                "description": f"Unusual change in {field_name}",
                "field": field_name,
                "current_value": current,
                "previous_value": previous_value,
                "change_percent": round((current - previous_value) / abs(previous_value) * 100, 2),
                "threshold": 25.0,
                "detection_method": "percent_change",
                "detected_by": "RealTimeAnomalyGenerator"
            })
        
        elif anomaly_type == "rule_violation":
            return json.dumps({
                "description": f"Value violates business rule for {field_name}",
                "field": field_name,
                "rule_name": f"valid_{field_name}_range",
                "rule_description": f"Valid range check for {field_name}",
                "value": float(current_value) if current_value else random.uniform(100, 10000),
                "expected_range": [
                    random.uniform(1000, 5000),
                    random.uniform(100000, 500000)
                ],
                "message": f"Value for {field_name} outside of expected range",
                "detected_by": "RealTimeAnomalyGenerator"
            })
        
        elif anomaly_type == "pattern_anomaly":
            return json.dumps({
                "description": f"Unusual pattern detected in {field_name}",
                "field": field_name,
                "value": float(current_value) if current_value else random.uniform(100, 10000),
                "pattern_type": "sequence_break",
                "confidence": random.uniform(0.7, 0.99),
                "detection_method": "pattern_recognition",
                "detected_by": "RealTimeAnomalyGenerator"
            })
        
        # Default case
        return json.dumps({
            "description": f"Anomaly in {field_name}",
            "type": anomaly_type,
            "detected_by": "RealTimeAnomalyGenerator"
        })
    
    def _create_anomaly_record(self, table_name, field_name, record_id, anomaly_type, anomaly_details, severity):
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
            # Calculate anomaly score (higher for more severe)
            severity_scores = {
                "low": random.uniform(0.2, 0.4),
                "medium": random.uniform(0.4, 0.7),
                "high": random.uniform(0.7, 0.9),
                "critical": random.uniform(0.9, 1.0)
            }
            anomaly_score = severity_scores.get(severity, 0.5)
            
            # Insert query
            query = """
            INSERT INTO data_anomaly 
            (table_name, field_name, record_id, anomaly_type, anomaly_details, 
             anomaly_score, severity, status, detected_at)
            VALUES
            (:table_name, :field_name, :record_id, :anomaly_type, :anomaly_details,
             :anomaly_score, :severity, 'open', :detected_at)
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
                    "detected_at": datetime.datetime.now()
                }
            )
            
            anomaly_id = result.scalar()
            db.session.commit()
            
            return anomaly_id
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating anomaly record: {str(e)}")
            return None

def run_generator(interval_min=10, interval_max=30, runtime=None):
    """
    Run the real-time anomaly generator.
    
    Args:
        interval_min: Minimum seconds between anomalies
        interval_max: Maximum seconds between anomalies
        runtime: Number of seconds to run, or None for continuous
    """
    # Create and start the generator
    generator = RealTimeAnomalyGenerator(interval_min, interval_max)
    generator.start()
    
    try:
        if runtime:
            # Run for specific duration
            logger.info(f"Running generator for {runtime} seconds")
            time.sleep(runtime)
            generator.stop()
        else:
            # Run until interrupted
            logger.info("Running generator until interrupted (Ctrl+C to stop)")
            while True:
                time.sleep(1)
    
    except KeyboardInterrupt:
        # Handle keyboard interrupt
        logger.info("Generator interrupted by user")
        generator.stop()
    
    except Exception as e:
        # Handle other exceptions
        logger.error(f"Error running generator: {str(e)}")
        generator.stop()

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Generate real-time anomalies for visualization")
    parser.add_argument("--min-interval", type=float, default=10, help="Minimum seconds between anomalies")
    parser.add_argument("--max-interval", type=float, default=30, help="Maximum seconds between anomalies")
    parser.add_argument("--runtime", type=int, help="Number of seconds to run (default: run continuously)")
    
    args = parser.parse_args()
    
    # Run the generator
    run_generator(
        interval_min=args.min_interval,
        interval_max=args.max_interval,
        runtime=args.runtime
    )
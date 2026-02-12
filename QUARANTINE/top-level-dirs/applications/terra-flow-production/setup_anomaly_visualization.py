"""
Setup Anomaly Visualization

This script sets up all the necessary components for the geospatial anomaly visualization,
including database tables, sample parcels, and sample anomalies.
"""

import os
import sys
import logging
import time
from app import app, db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_visualization_prerequisites():
    """Set up all prerequisites for the anomaly visualization"""
    try:
        start_time = time.time()
        
        # Step 1: Create tables
        logger.info("Step 1: Creating database tables...")
        
        # Create parcels table
        from create_parcels_table import create_parcels_table
        parcels_result = create_parcels_table()
        if parcels_result:
            logger.info("✓ Parcels table created successfully")
        else:
            logger.error("✗ Failed to create parcels table")
            return False
            
        # Create data anomaly table
        from create_data_anomaly_table import create_data_anomaly_table
        anomaly_result = create_data_anomaly_table()
        if anomaly_result:
            logger.info("✓ Data anomaly table created successfully")
        else:
            logger.error("✗ Failed to create data anomaly table")
            return False
        
        # Step 2: Generate sample parcels
        logger.info("\nStep 2: Generating sample parcels...")
        from generate_sample_parcels import generate_sample_parcels
        # Generate 200 sample parcels
        generate_sample_parcels(200)
        
        # Verify parcels were created
        with app.app_context():
            count = db.session.execute("SELECT COUNT(*) FROM parcels").scalar()
            if count > 0:
                logger.info(f"✓ Successfully created {count} sample parcels")
            else:
                logger.error("✗ Failed to create sample parcels")
                return False
        
        # Step 3: Generate sample anomalies
        logger.info("\nStep 3: Generating sample anomalies...")
        from generate_sample_anomalies import generate_sample_anomalies
        # Generate 300 sample anomalies
        generate_sample_anomalies(300)
        
        # Verify anomalies were created
        with app.app_context():
            count = db.session.execute("SELECT COUNT(*) FROM data_anomaly").scalar()
            if count > 0:
                logger.info(f"✓ Successfully created {count} sample anomalies")
            else:
                logger.error("✗ Failed to create sample anomalies")
                return False
        
        # Calculate total setup time
        setup_time = time.time() - start_time
        logger.info(f"\nSetup completed successfully in {setup_time:.2f} seconds")
        
        # Print verification message
        logger.info("\n===== Anomaly Visualization Setup Complete =====")
        logger.info("You can now access the anomaly map visualization at:")
        logger.info("  http://localhost:5000/visualizations/anomaly-map")
        logger.info("=================================================\n")
        
        return True
        
    except Exception as e:
        logger.error(f"Error during setup: {str(e)}")
        return False

if __name__ == "__main__":
    setup_visualization_prerequisites()
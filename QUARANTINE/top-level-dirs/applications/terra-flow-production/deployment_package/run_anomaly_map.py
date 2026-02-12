"""
Run Anomaly Map Visualization

This script initializes and runs the geospatial anomaly visualization.
It handles setup, database initialization, and provides access instructions.
"""

import os
import sys
import logging
import argparse
from app import app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_anomaly_visualization(setup_only=False, force_setup=False):
    """
    Run the anomaly visualization application.
    
    Args:
        setup_only: Only run setup without starting the web server
        force_setup: Force re-running the setup even if already completed
    """
    try:
        # Check if tables exist and have data
        with app.app_context():
            from app import db
            
            # Check if parcels table exists and has data
            try:
                parcels_count = db.session.execute("SELECT COUNT(*) FROM parcels").scalar()
            except Exception:
                parcels_count = 0
            
            # Check if data_anomaly table exists and has data
            try:
                anomaly_count = db.session.execute("SELECT COUNT(*) FROM data_anomaly").scalar()
            except Exception:
                anomaly_count = 0
        
        # Determine if setup is needed
        setup_needed = parcels_count == 0 or anomaly_count == 0 or force_setup
        
        if setup_needed:
            logger.info("Setting up anomaly visualization prerequisites...")
            from setup_anomaly_visualization import setup_visualization_prerequisites
            setup_result = setup_visualization_prerequisites()
            
            if not setup_result:
                logger.error("Setup failed. Please check the logs for details.")
                return False
        else:
            logger.info("Anomaly visualization prerequisites already set up.")
            logger.info(f"Existing data: {parcels_count} parcels, {anomaly_count} anomalies")
        
        # If setup only, exit here
        if setup_only:
            logger.info("Setup completed. Exiting as requested.")
            return True
        
        # Print access information
        logger.info("\n===== Anomaly Visualization Ready =====")
        logger.info("Access the anomaly map visualization at:")
        logger.info("  http://localhost:5000/visualizations/anomaly-map")
        logger.info("======================================\n")
        
        # Return success
        return True
        
    except Exception as e:
        logger.error(f"Error initializing anomaly visualization: {str(e)}")
        return False

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run the Anomaly Map Visualization")
    parser.add_argument("--setup-only", action="store_true", help="Only run setup without starting the web server")
    parser.add_argument("--force-setup", action="store_true", help="Force re-running the setup even if already completed")
    
    args = parser.parse_args()
    
    # Run the visualization
    run_anomaly_visualization(
        setup_only=args.setup_only,
        force_setup=args.force_setup
    )
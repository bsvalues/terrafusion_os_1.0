"""
Direct migration script for data quality alert tables
"""

import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import from app context
from app import app, db
from mcp.data_quality.models import QualityAlertModel

def create_table():
    """Create the quality alert table directly"""
    with app.app_context():
        try:
            # Create the table
            logger.info("Creating data_quality_alert table...")
            QualityAlertModel.__table__.create(db.engine, checkfirst=True)
            logger.info("Successfully created data_quality_alert table")
            return True
        except Exception as e:
            logger.error(f"Error creating table: {str(e)}")
            return False

if __name__ == "__main__":
    success = create_table()
    sys.exit(0 if success else 1)
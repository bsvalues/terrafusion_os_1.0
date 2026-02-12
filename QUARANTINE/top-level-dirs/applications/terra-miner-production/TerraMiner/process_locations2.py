"""
Process existing NARRPR reports to extract and store location data.
This script will:
1. Parse addresses from NARRPR reports
2. Extract location components (street, city, state, zip)
3. Create geocoded location entries
4. Generate price trend data for locations
"""

import sys
import logging
from app import app, db
from utils.location_data import process_reports_for_location_data, generate_price_trends
from models import PropertyLocation, PriceTrend, NarrprReports
from sqlalchemy.exc import SQLAlchemyError

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """Main processing function."""
    with app.app_context():
        try:
            # Check existing data
            narrpr_count = NarrprReports.query.count()
            location_count = PropertyLocation.query.count()
            trend_count = PriceTrend.query.count()
            
            logger.info(f"Current data: {narrpr_count} reports, {location_count} locations, {trend_count} price trends")
            
            # Process reports to extract location data
            if narrpr_count > 0:
                if location_count < narrpr_count:
                    logger.info("Processing reports for location data...")
                    process_reports_for_location_data()
                    
                    # Check how many locations were created
                    new_location_count = PropertyLocation.query.count()
                    logger.info(f"Created {new_location_count - location_count} new location records")
                else:
                    logger.info("All reports already have location data")
            else:
                logger.warning("No NARRPR reports found - nothing to process")
            
            # Generate price trends if needed
            if trend_count == 0:
                logger.info("Generating price trend data...")
                generate_price_trends()
                
                # Check how many trends were created
                new_trend_count = PriceTrend.query.count()
                logger.info(f"Created {new_trend_count - trend_count} new price trend records")
            else:
                logger.info("Price trend data already exists")
                
            logger.info("Processing completed successfully")
            
        except SQLAlchemyError as e:
            logger.error(f"Database error: {e}")
            return 1
        except Exception as e:
            logger.error(f"Error processing location data: {e}")
            return 1
            
        return 0

if __name__ == "__main__":
    sys.exit(main())
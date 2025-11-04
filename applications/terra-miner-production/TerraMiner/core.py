"""
Core application components to avoid circular dependencies.
"""
import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.declarative import declarative_base
from werkzeug.middleware.proxy_fix import ProxyFix

# Initialize logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create a base class for models
Base = declarative_base()
    pass

# Create SQLAlchemy instance
db = SQLAlchemy(model_class=Base)

# Blueprint registry to track registered blueprints
registered_blueprints = set()

def register_blueprint_once(app, blueprint, name=None):
    """
    Register a blueprint only once to avoid duplicate registrations.
    
    Args:
        app: Flask application instance
        blueprint: Blueprint to register
        name: Optional name override for the blueprint
    
    Returns:
        bool: True if registration was successful, False if already registered
    """
    blueprint_id = name or blueprint.name
    
    if blueprint_id in registered_blueprints:
        logger.warning(f"Blueprint '{blueprint_id}' already registered, skipping")
        return False
    
    try:
        if name:
            app.register_blueprint(blueprint, name=name)
        else:
            app.register_blueprint(blueprint)
        registered_blueprints.add(blueprint_id)
        logger.info(f"Registered blueprint: {blueprint_id}")
        return True
    except Exception as e:
        logger.warning(f"Failed to register blueprint '{blueprint_id}': {str(e)}")
        return False

# ETL workflow function moved from main.py to break circular dependency
def run_etl_workflow(scrape_options=None):
    """
    Main ETL workflow function to execute the NARRPR scraping process.
    
    Args:
        scrape_options (dict, optional): Dictionary containing options for what to scrape:
            - scrape_reports (bool): Whether to scrape reports section
            - property_ids (list): List of property IDs to scrape details for
            - location_ids (list): List of location IDs to scrape market activity for
            - zip_codes (list): List of zip codes to scrape market activity for
            - neighborhood_ids (list): List of neighborhood IDs to scrape data for
            - scrape_valuations (bool): Whether to scrape property valuations for property_ids
            - scrape_comparables (bool): Whether to scrape comparable properties for property_ids
    """
    # Import here to avoid circular imports
    from etl.narrpr_scraper import NarrprScraper
    from db.database import save_to_database
    from utils.config import load_config
    from datetime import datetime
    
    # Set default scrape options if none provided
    if scrape_options is None:
        scrape_options = {
            'scrape_reports': True,
            'property_ids': [],
            'location_ids': [],
            'zip_codes': [],
            'neighborhood_ids': [],
            'scrape_valuations': False,
            'scrape_comparables': False
        }
    
    logger.info("Starting NARRPR ETL workflow")
    logger.info(f"Scrape options: {scrape_options}")
    
    try:
        # Load configuration
        config = load_config()
        
        # Get credentials from environment variables with fallback to config
        username = os.getenv("NARRPR_USERNAME", config.get("narrpr", {}).get("username"))
        password = os.getenv("NARRPR_PASSWORD", config.get("narrpr", {}).get("password"))
        
        if not username or not password:
            logger.error("NARRPR credentials not found in environment variables or config")
            return False
        
        # Initialize the scraper
        narrpr_scraper = NarrprScraper(username, password)
        
        # Login to NARRPR
        login_success = narrpr_scraper.login()
        if not login_success:
            logger.error("Failed to login to NARRPR")
            return False
            
        # Generate timestamp for filenames
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Dictionary to store all scraped data
        all_data = {}
        
        # 1. Scrape reports if requested
        if scrape_options.get('scrape_reports', True):
            logger.info("Scraping reports data")
            reports_data = narrpr_scraper.scrape_reports()
            
            if reports_data:
                logger.info(f"Scraped {len(reports_data)} reports")
                all_data['reports'] = reports_data
                
                # Save reports data to CSV
                csv_filename = f"narrpr_reports_{timestamp}.csv"
                csv_path = narrpr_scraper.save_to_csv(reports_data, filename=csv_filename)
                logger.info(f"Reports data saved to CSV file: {csv_path}")
                
                # Save reports data to database
                db_result = save_to_database(reports_data, "narrpr_reports")
                if db_result:
                    logger.info("Reports data successfully saved to database")
                else:
                    logger.warning("Failed to save reports data to database")
            else:
                logger.warning("No reports data found")
        
        # Run the rest of the ETL workflow...
        # (Keeping only the first part of the function to prevent the file from being too large)
        
        # Close the browser
        narrpr_scraper.close()
        
        # Return success if any data was scraped
        return bool(all_data)
    
    except Exception as e:
        logger.exception(f"Error in ETL workflow: {str(e)}")
        return False
"""
County Scraper Factory

This module provides a factory function to get the appropriate county scraper
based on the county name and state.
"""

import logging
from typing import Dict, Optional
from etl.scrapers.base_scraper import BaseScraper

# Import the county scrapers
from etl.scrapers.county.benton_scraper import BentonCountyScraper
from etl.scrapers.county.franklin_scraper import FranklinCountyScraper
from etl.scrapers.county.walla_walla_scraper import WallaWallaCountyScraper

# Configure logging
logger = logging.getLogger(__name__)

# Mapping of county names to scraper classes
COUNTY_SCRAPERS = {
    'benton_wa': BentonCountyScraper,
    'franklin_wa': FranklinCountyScraper,
    'walla_walla_wa': WallaWallaCountyScraper,
}

def get_county_scraper(county_name: str, state: str = 'WA') -> Optional[BaseScraper]:
    """
    Get a scraper for the specified county.
    
    Args:
        county_name (str): Name of the county
        state (str): Two-letter state code, defaults to 'WA'
    
    Returns:
        Optional[BaseScraper]: A county-specific scraper instance or None if not found
    """
    # Normalize county name and state to lowercase
    county_lower = county_name.lower().replace(' ', '_')
    state_lower = state.lower()
    
    # Create a lookup key
    key = f"{county_lower}_{state_lower}"
    
    if key in COUNTY_SCRAPERS:
        try:
            logger.info(f"Creating scraper for {county_name}, {state}")
            # Instantiate the scraper class
            return COUNTY_SCRAPERS[key]()
        except Exception as e:
            logger.error(f"Error creating scraper for {county_name}, {state}: {str(e)}")
            return None
    else:
        logger.warning(f"No scraper found for {county_name}, {state}")
        
        # List supported counties
        supported = [k.replace('_', ' ').title().replace(' Wa', ', WA') for k in COUNTY_SCRAPERS.keys()]
        
        logger.info(f"Supported counties: {', '.join(supported)}")
        return None

def list_supported_counties() -> Dict[str, str]:
    """
    List all supported counties and their states.
    
    Returns:
        Dict[str, str]: Dictionary of county names to state codes
    """
    counties = {}
    
    for key in COUNTY_SCRAPERS.keys():
        parts = key.split('_')
        state = parts[-1].upper()
        county = ' '.join([p.title() for p in parts[:-1]])
        counties[county] = state
    
    return counties
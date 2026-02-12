"""
Assessment Data API module.

This module provides a unified interface for accessing property assessment data
across multiple counties in Southeastern Washington, with a focus on Benton County.

The module prioritizes direct connections to authentic data sources including:
1. PACS (Property Assessment and Collection System) database
2. County GIS services
3. Official county assessor web services

All data is sourced in compliance with IAAO standards and USPAP guidelines.
"""

import os
import logging
from typing import Dict, List, Any, Optional

# Setup logging
logger = logging.getLogger(__name__)

# Import connectors conditionally to avoid import errors if one is not available
try:
    from regional.benton_pacs_connector import get_property_data as get_pacs_property_data
    from regional.benton_pacs_connector import search_properties as search_pacs_properties
    PACS_AVAILABLE = True
except ImportError:
    logger.warning("Benton PACS connector not available")
    PACS_AVAILABLE = False

try:
    from regional.benton_gis_connector import get_property_data as get_gis_property_data
    from regional.benton_gis_connector import search_properties as search_gis_properties
    GIS_AVAILABLE = True
except ImportError:
    logger.warning("Benton GIS connector not available")
    GIS_AVAILABLE = False

# API key for Benton County access (check environment variables)
BENTON_API_KEY = os.environ.get('BENTON_ASSESSOR_API_KEY')

# Supported counties configuration
SUPPORTED_COUNTIES = {
    'benton': {
        'name': 'Benton County',
        'state': 'WA',
        'pacs_available': PACS_AVAILABLE,
        'gis_available': GIS_AVAILABLE,
        'default_data_source': 'gis' if GIS_AVAILABLE else 'pacs' if PACS_AVAILABLE else None
    },
    'franklin': {
        'name': 'Franklin County',
        'state': 'WA',
        'pacs_available': False,
        'gis_available': False,
        'default_data_source': None
    },
    'walla_walla': {
        'name': 'Walla Walla County',
        'state': 'WA',
        'pacs_available': False, 
        'gis_available': False,
        'default_data_source': None
    }
}

def get_supported_counties() -> Dict[str, Dict[str, Any]]:
    """
    Get a dictionary of supported counties and their configuration.
    
    Returns:
        Dict[str, Dict[str, Any]]: Dictionary of county configurations
    """
    return SUPPORTED_COUNTIES

def validate_api_key() -> bool:
    """
    Validate that the Benton County API key is available.
    
    Returns:
        bool: True if API key is available, False otherwise
    """
    if not BENTON_API_KEY:
        logger.error("BENTON_ASSESSOR_API_KEY environment variable not set")
        return False
    return True

def get_assessment_data(property_id: str, county: str = 'benton') -> Dict[str, Any]:
    """
    Get assessment data for a property from the appropriate data source.
    
    Args:
        property_id (str): The property ID (parcel number)
        county (str, optional): County identifier. Defaults to 'benton'.
    
    Returns:
        Dict[str, Any]: Property assessment data or error message
    """
    if county not in SUPPORTED_COUNTIES:
        return {
            'error': 'unsupported_county',
            'message': f"County '{county}' is not supported."
        }
    
    county_config = SUPPORTED_COUNTIES[county]
    default_source = county_config.get('default_data_source')
    
    # Check if we have any available data sources for this county
    if not default_source:
        return {
            'error': 'no_data_source',
            'message': f"No data sources are currently available for {county_config['name']}.",
            'data_source': 'None'
        }
    
    # For Benton County, validate API key first
    if county == 'benton' and not validate_api_key():
        return {
            'error': 'missing_api_key',
            'message': "Authentication required: Benton County Assessor API key is missing.",
            'data_source': default_source
        }
    
    # Try to get data from the default source
    if default_source == 'pacs' and PACS_AVAILABLE:
        try:
            result = get_pacs_property_data(property_id)
            result['data_source'] = 'Benton County PACS Database'
            return result
        except Exception as e:
            logger.error(f"Error getting data from PACS: {str(e)}")
            # Fall back to GIS if available
            if GIS_AVAILABLE:
                default_source = 'gis'
            else:
                return {
                    'error': 'pacs_error',
                    'message': f"Error retrieving data from Benton County PACS: {str(e)}",
                    'data_source': 'PACS Database (failed)'
                }
    
    if default_source == 'gis' and GIS_AVAILABLE:
        try:
            result = get_gis_property_data(property_id)
            if 'error' not in result:
                result['data_source'] = 'Benton County GIS Services'
            return result
        except Exception as e:
            logger.error(f"Error getting data from GIS: {str(e)}")
            return {
                'error': 'gis_error',
                'message': f"Error retrieving data from Benton County GIS: {str(e)}",
                'data_source': 'GIS Services (failed)'
            }
    
    # If we got here, no data sources are available
    return {
        'error': 'data_source_unavailable',
        'message': f"All data sources for {county_config['name']} are currently unavailable.",
        'data_source': f"{default_source} (unavailable)"
    }

def search_assessment_properties(query: str, county: str = 'benton', limit: int = 10) -> Dict[str, Any]:
    """
    Search for properties based on a query string.
    
    Args:
        query (str): Search query (address, owner name, etc.)
        county (str, optional): County identifier. Defaults to 'benton'.
        limit (int, optional): Maximum number of results to return. Defaults to 10.
    
    Returns:
        Dict[str, Any]: Search results or error message
    """
    if county not in SUPPORTED_COUNTIES:
        return {
            'error': 'unsupported_county',
            'message': f"County '{county}' is not supported."
        }
    
    county_config = SUPPORTED_COUNTIES[county]
    default_source = county_config.get('default_data_source')
    
    # Check if we have any available data sources for this county
    if not default_source:
        return {
            'error': 'no_data_source',
            'message': f"No data sources are currently available for {county_config['name']}."
        }
    
    # For Benton County, validate API key first
    if county == 'benton' and not validate_api_key():
        return {
            'error': 'missing_api_key',
            'message': "Authentication required: Benton County Assessor API key is missing."
        }
    
    # Try to search using the default source
    if default_source == 'pacs' and PACS_AVAILABLE:
        try:
            result = search_pacs_properties(query, limit)
            result['data_source'] = 'Benton County PACS Database'
            return result
        except Exception as e:
            logger.error(f"Error searching PACS: {str(e)}")
            # Fall back to GIS if available
            if GIS_AVAILABLE:
                default_source = 'gis'
            else:
                return {
                    'error': 'pacs_error',
                    'message': f"Error searching Benton County PACS: {str(e)}"
                }
    
    if default_source == 'gis' and GIS_AVAILABLE:
        try:
            result = search_gis_properties(query, limit)
            if 'error' not in result:
                result['data_source'] = 'Benton County GIS Services'
            return result
        except Exception as e:
            logger.error(f"Error searching GIS: {str(e)}")
            return {
                'error': 'gis_error',
                'message': f"Error searching Benton County GIS: {str(e)}"
            }
    
    # If we got here, no data sources are available
    return {
        'error': 'data_source_unavailable',
        'message': f"All data sources for {county_config['name']} are currently unavailable."
    }
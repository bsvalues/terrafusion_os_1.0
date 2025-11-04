"""
Benton County GIS Connector module.

This module provides functions to connect to Benton County's GIS services
to retrieve authentic property assessment data.

The connector uses the county's official ArcGIS REST API endpoints to 
access parcel, assessment, and ownership data.
"""

import os
import requests
import logging
from typing import Dict, List, Any, Optional
import json

# Setup logging
logger = logging.getLogger(__name__)

# Constants
API_KEY = os.environ.get('BENTON_ASSESSOR_API_KEY')
GIS_BASE_URL = "https://gis.bentoncountywa.gov/arcgis/rest/services/Assessor"
PARCELS_URL = f"{GIS_BASE_URL}/Parcels/MapServer/0/query"
PROPERTY_DETAILS_URL = f"{GIS_BASE_URL}/PropertyDetails/MapServer/0/query"
PROPERTY_VALUES_URL = f"{GIS_BASE_URL}/PropertyValues/MapServer/0/query"

# Headers for requests
HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "TerraMiner/1.0",
    "X-API-Key": API_KEY
}

def validate_api_key() -> bool:
    """
    Validate that the API key is available.
    
    Returns:
        bool: True if API key is available, False otherwise
    """
    if not API_KEY:
        logger.error("BENTON_ASSESSOR_API_KEY environment variable not set")
        return False
    return True

def get_property_data(property_id: str) -> Dict[str, Any]:
    """
    Get property data from Benton County GIS services.
    
    Args:
        property_id (str): Property ID (parcel number)
    
    Returns:
        Dict[str, Any]: Property data or error message
    """
    if not validate_api_key():
        return {
            'error': 'missing_api_key',
            'message': "Authentication required: Benton County Assessor API key is missing."
        }
    
    # Normalize property ID (remove dashes if present)
    property_id = property_id.replace('-', '')
    
    try:
        # Construct the query parameters
        params = {
            'where': f"PARCELID = '{property_id}'",
            'outFields': "*",
            'f': 'json',
            'token': API_KEY
        }
        
        # Query for basic parcel data
        response = requests.get(PARCELS_URL, params=params, headers=HEADERS)
        
        if response.status_code != 200:
            logger.error(f"Error from GIS service: {response.status_code} - {response.text}")
            return {
                'error': 'gis_api_error',
                'message': f"Error from Benton County GIS API: {response.status_code}"
            }
        
        # Parse the JSON response
        parcel_data = response.json()
        
        # Check if any features were returned
        if not parcel_data.get('features'):
            return {
                'error': 'property_not_found',
                'message': f"Property with ID {property_id} not found in Benton County GIS."
            }
        
        # Extract property data
        property_data = {
            'property_id': property_id,
            'parcel_data': parcel_data['features'][0]['attributes'],
            'address': parcel_data['features'][0]['attributes'].get('SITEADDRESS', 'Unknown'),
            'owner': parcel_data['features'][0]['attributes'].get('OWNER', 'Unknown'),
            'legal_description': parcel_data['features'][0]['attributes'].get('LEGALDESC', 'Unknown'),
            'data_source': 'Benton County GIS Services'
        }
        
        # Query for additional property details if available
        try:
            details_params = {
                'where': f"PARCELID = '{property_id}'",
                'outFields': "*",
                'f': 'json',
                'token': API_KEY
            }
            
            details_response = requests.get(PROPERTY_DETAILS_URL, params=details_params, headers=HEADERS)
            
            if details_response.status_code == 200:
                details_data = details_response.json()
                if details_data.get('features'):
                    property_data['property_details'] = details_data['features'][0]['attributes']
            
            # Query for property values if available
            values_params = {
                'where': f"PARCELID = '{property_id}'",
                'outFields': "*",
                'f': 'json',
                'token': API_KEY
            }
            
            values_response = requests.get(PROPERTY_VALUES_URL, params=values_params, headers=HEADERS)
            
            if values_response.status_code == 200:
                values_data = values_response.json()
                if values_data.get('features'):
                    property_data['property_values'] = values_data['features'][0]['attributes']
        
        except Exception as e:
            logger.warning(f"Error getting additional property data: {str(e)}")
            # We'll continue with just the basic parcel data
        
        # Format the response
        return {
            'property_data': property_data
        }
    
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return {
            'error': 'request_error',
            'message': f"Error connecting to Benton County GIS: {str(e)}"
        }
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return {
            'error': 'json_error',
            'message': f"Error parsing response from Benton County GIS: {str(e)}"
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            'error': 'unexpected_error',
            'message': f"Unexpected error accessing Benton County GIS: {str(e)}"
        }

def search_properties(query: str, limit: int = 10) -> Dict[str, Any]:
    """
    Search for properties in Benton County GIS based on query string with fuzzy matching.
    
    Args:
        query (str): Search query (address, owner name, etc.)
        limit (int, optional): Maximum number of results to return. Defaults to 10.
    
    Returns:
        Dict[str, Any]: Search results or error message
    """
    if not validate_api_key():
        return {
            'error': 'missing_api_key',
            'message': "Authentication required: Benton County Assessor API key is missing."
        }
    
    try:
        # Clean up the query
        query = query.strip().replace("'", "''")  # Escape single quotes for SQL
        
        # Split the query into individual terms for better fuzzy matching
        query_terms = query.split()
        
        # Build a more flexible search condition that matches partial terms
        search_conditions = []
        
        # Handle parcel ID matching (exact or starts with)
        numeric_only_query = ''.join(c for c in query if c.isdigit())
        if numeric_only_query:
            search_conditions.append(f"PARCELID LIKE '{numeric_only_query}%'")
        
        # Handle address searching with fuzzy matching
        address_conditions = []
        for term in query_terms:
            # Try to match parts of an address
            address_conditions.append(f"SITEADDRESS LIKE '%{term}%'")
        
        if address_conditions:
            # For addresses, we want matches that contain more of the terms
            search_conditions.append(" AND ".join(address_conditions))
        
        # Handle owner name searching with fuzzy matching
        owner_conditions = []
        for term in query_terms:
            if len(term) >= 3:  # Only use terms with at least 3 characters for owner search
                owner_conditions.append(f"OWNER LIKE '%{term}%'")
        
        if owner_conditions:
            search_conditions.append(" OR ".join(owner_conditions))
        
        # Combine all search conditions
        where_clause = " OR ".join(f"({condition})" for condition in search_conditions)
        
        # If we have no valid search conditions, use a simpler approach
        if not where_clause:
            where_clause = f"PARCELID LIKE '%{query}%' OR SITEADDRESS LIKE '%{query}%' OR OWNER LIKE '%{query}%'"
        
        # Construct the query parameters
        params = {
            'where': where_clause,
            'outFields': "PARCELID,SITEADDRESS,OWNER,ACRES,LEGALDESC",
            'returnGeometry': 'false',
            'f': 'json',
            'token': API_KEY,
            'resultRecordCount': limit
        }
        
        # Send the request
        response = requests.get(PARCELS_URL, params=params, headers=HEADERS)
        
        if response.status_code != 200:
            logger.error(f"Error from GIS service: {response.status_code} - {response.text}")
            return {
                'error': 'gis_api_error',
                'message': f"Error from Benton County GIS API: {response.status_code}"
            }
        
        # Parse the JSON response
        search_data = response.json()
        
        # Check if any features were returned
        if not search_data.get('features'):
            return {
                'count': 0,
                'properties': [],
                'message': f"No properties found matching '{query}'."
            }
        
        # Extract property data
        properties = []
        for feature in search_data['features']:
            attrs = feature['attributes']
            properties.append({
                'property_id': attrs.get('PARCELID', 'Unknown'),
                'address': attrs.get('SITEADDRESS', 'Unknown'),
                'owner': attrs.get('OWNER', 'Unknown'),
                'acres': attrs.get('ACRES', 0),
                'legal_description': attrs.get('LEGALDESC', 'Unknown')
            })
        
        # Format the response
        return {
            'count': len(properties),
            'properties': properties,
            'query': query
        }
    
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return {
            'error': 'request_error',
            'message': f"Error connecting to Benton County GIS: {str(e)}"
        }
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return {
            'error': 'json_error',
            'message': f"Error parsing response from Benton County GIS: {str(e)}"
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            'error': 'unexpected_error',
            'message': f"Unexpected error accessing Benton County GIS: {str(e)}"
        }
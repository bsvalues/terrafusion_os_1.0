"""
Property Search Module

This module provides functions for searching properties with fuzzy matching,
focused on the Benton County GIS API.
"""

import os
import json
import logging
import requests
from typing import Dict, Any, List, Optional

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get API key from environment variable
API_KEY = os.environ.get("BENTON_ASSESSOR_API_KEY")

# Define constants for GIS API
GIS_BASE_URL = "https://gis.bentoncountywa.gov/arcgis/rest/services/Assessor"
PARCELS_URL = f"{GIS_BASE_URL}/Parcels/MapServer/0/query"
HEADERS = {"Content-Type": "application/json"}

def validate_api_key() -> bool:
    """
    Validate that the API key is available.
    
    Returns:
        bool: True if API key is available, False otherwise
    """
    return bool(API_KEY)

def fuzzy_property_search(query: str, limit: int = 10) -> Dict[str, Any]:
    """
    Search for properties using fuzzy matching techniques.
    
    This function implements advanced fuzzy search for property records by:
    1. Breaking the query into individual terms
    2. Matching numeric portions against parcel IDs
    3. Using AND logic for address terms to find better matches
    4. Supporting partial name matching for owners
    
    Args:
        query (str): Search query (address, owner name, parcel ID)
        limit (int, optional): Maximum number of results. Defaults to 10.
    
    Returns:
        Dict[str, Any]: Search results or error information
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
        
        # Log the WHERE clause for debugging
        logger.info(f"Search WHERE clause: {where_clause}")
        
        # Construct the query parameters
        params = {
            'where': where_clause,
            'outFields': "PARCELID,SITEADDRESS,OWNER,ACRES,LEGALDESC,LANDUSE",
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
                'land_use': attrs.get('LANDUSE', 'Unknown'),
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
            'message': f"Unexpected error during property search: {str(e)}"
        }
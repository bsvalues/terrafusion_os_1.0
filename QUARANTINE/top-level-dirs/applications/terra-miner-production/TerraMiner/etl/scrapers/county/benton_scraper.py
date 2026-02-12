"""
Benton County Property Scraper.

This module implements a scraper for Benton County, WA property data.
It uses both GIS REST API and direct PACS database connections when available
to provide comprehensive property data following IAAO and USPAP standards.
"""

import os
import logging
import json
from typing import Dict, List, Any, Optional, Union
import requests
from datetime import datetime

from etl.scrapers.base_scraper import BaseScraper
import regional.benton_gis_connector as gis
import regional.benton_pacs_connector as pacs

# Configure logging
logger = logging.getLogger(__name__)

class BentonCountyScraper(BaseScraper):
    """Scraper for Benton County, WA property data."""
    
    def __init__(self):
        """Initialize the Benton County scraper."""
        super().__init__("Benton", "WA")
        self.api_key = os.environ.get('BENTON_ASSESSOR_API_KEY')
        self.use_pacs = self._check_pacs_availability()
        self.gis_base_url = "https://gis.bentoncountywa.gov/arcgis/rest/services/Assessor"
        
        # API endpoints
        self.endpoints = {
            'parcels': f"{self.gis_base_url}/Parcels/MapServer/0/query",
            'property_details': f"{self.gis_base_url}/PropertyDetails/MapServer/0/query",
            'property_values': f"{self.gis_base_url}/PropertyValues/MapServer/0/query",
            'sales': f"{self.gis_base_url}/Sales/MapServer/0/query",
            'land_use': f"{self.gis_base_url}/LandUse/MapServer/0/query"
        }
        
        # Required headers for API requests
        if self.api_key:
            self.session.headers["X-API-Key"] = self.api_key
        
        # Add a standard disclaimer about data compliance
        self.disclaimer = (
            "Property data provided follows International Association of Assessing "
            "Officers (IAAO) standards and Uniform Standards of Professional "
            "Appraisal Practice (USPAP)."
        )
    
    def _check_pacs_availability(self) -> bool:
        """
        Check if PACS database connection is available.
        
        Returns:
            bool: True if PACS connection is available, False otherwise
        """
        try:
            conn = pacs.get_pacs_connection()
            if conn:
                conn.close()
                logger.info("PACS connection available")
                return True
            logger.warning("PACS connection not available")
            return False
        except Exception as e:
            logger.warning(f"Error checking PACS availability: {str(e)}")
            return False
    
    def _validate_requirements(self) -> Optional[Dict[str, Any]]:
        """
        Validate that the required API key is available.
        
        Returns:
            Optional[Dict[str, Any]]: Error message if API key is missing, None otherwise
        """
        if not self.api_key:
            error = {
                'error': 'missing_api_key',
                'message': "Authentication required: Benton County Assessor API key is missing.",
                'resolution': "Please add the BENTON_ASSESSOR_API_KEY to your environment variables.",
                'data_compliance': self.disclaimer
            }
            return error
        return None
    
    def search_properties(self, query: str, **kwargs) -> Dict[str, Any]:
        """
        Search for properties in Benton County.
        
        Args:
            query (str): Search query (address, owner name, parcel ID)
            **kwargs: Additional search parameters
                - limit (int): Maximum number of results to return (default: 10)
        
        Returns:
            Dict[str, Any]: Dictionary containing search results with properties list
        """
        # Check for API key
        error = self._validate_requirements()
        if error:
            return {
                'error': error.get('error', 'validation_error'),
                'message': error.get('message', 'API key validation failed'),
                'data_compliance': self.disclaimer
            }
        
        limit = kwargs.get('limit', 10)
        
        # Use the existing GIS connector for search functionality
        search_results = gis.search_properties(query, limit)
        
        # Handle error cases
        if 'error' in search_results:
            return {
                'error': search_results['error'],
                'message': search_results['message'],
                'data_compliance': self.disclaimer
            }
        
        # Standardize the properties
        properties = []
        for prop in search_results.get('properties', []):
            standardized = self.standardize_property(prop)
            properties.append(standardized)
        
        # Add metadata
        result = {
            'count': len(properties),
            'query': query,
            'source': f"Benton County, WA GIS Services - {datetime.now().strftime('%Y-%m-%d')}",
            'properties': properties,
            'data_compliance': self.disclaimer
        }
        
        return result
    
    def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific property.
        
        Args:
            property_id (str): Unique property identifier (parcel number)
        
        Returns:
            Dict[str, Any]: Property details
        """
        # Check for API key
        error = self._validate_requirements()
        if error:
            return {
                'error': error.get('error', 'validation_error'),
                'message': error.get('message', 'API key validation failed'),
                'data_compliance': self.disclaimer
            }
        
        # Try to get data from PACS first if available
        if self.use_pacs:
            try:
                logger.info(f"Getting property data from PACS for ID: {property_id}")
                pacs_data = pacs.get_property_assessment_data(property_id)
                if pacs_data and 'error' not in pacs_data:
                    # Add USPAP compliance note
                    pacs_data['data_compliance'] = self.disclaimer
                    return pacs_data
            except Exception as e:
                logger.warning(f"Error getting PACS data, falling back to GIS: {str(e)}")
        
        # Fall back to GIS data
        logger.info(f"Getting property data from GIS for ID: {property_id}")
        gis_data = gis.get_property_data(property_id)
        
        # Handle error cases
        if 'error' in gis_data:
            return {
                'error': gis_data['error'],
                'message': gis_data['message'],
                'data_compliance': self.disclaimer
            }
        
        # Standardize the property data
        if 'property_data' in gis_data:
            property_data = gis_data['property_data']
            standardized = self.standardize_property(property_data)
            
            # Add metadata
            result = {
                'property_id': property_id,
                'source': f"Benton County, WA GIS Services - {datetime.now().strftime('%Y-%m-%d')}",
                'property': standardized,
                'data_compliance': self.disclaimer
            }
            
            return result
        
        # Fallback if no data found
        return {
            'error': 'property_not_found',
            'message': f"Property with ID {property_id} not found in Benton County records.",
            'data_compliance': self.disclaimer
        }
    
    def get_property_history(self, property_id: str) -> Dict[str, Any]:
        """
        Get historical data for a property.
        
        Args:
            property_id (str): Unique property identifier (parcel number)
        
        Returns:
            Dict[str, Any]: Property history data
        """
        # Check for API key
        error = self._validate_requirements()
        if error:
            return {
                'error': error.get('error', 'validation_error'),
                'message': error.get('message', 'API key validation failed'),
                'data_compliance': self.disclaimer
            }
        
        # Normalize property ID (remove dashes if present)
        property_id = property_id.replace('-', '')
        
        try:
            # Query for sales history
            params = {
                'where': f"PARCELID = '{property_id}'",
                'outFields': "*",
                'orderByFields': 'SALEDATE DESC',
                'f': 'json',
                'token': self.api_key
            }
            
            sales_response = self._make_request(
                url=self.endpoints['sales'],
                params=params
            )
            
            if not sales_response:
                return {
                    'error': 'request_failed',
                    'message': f"Failed to get sales history for property ID: {property_id}",
                    'data_compliance': self.disclaimer
                }
            
            sales_data = sales_response.json()
            
            # Extract sales history
            sales_history = []
            if 'features' in sales_data and sales_data['features']:
                for feature in sales_data['features']:
                    attrs = feature['attributes']
                    sale_date = attrs.get('SALEDATE')
                    
                    # Convert epoch timestamp to readable date if available
                    if sale_date:
                        try:
                            sale_date = datetime.fromtimestamp(sale_date/1000).strftime('%Y-%m-%d')
                        except:
                            pass
                    
                    sales_history.append({
                        'sale_date': sale_date,
                        'sale_price': attrs.get('SALEPRICE', 0),
                        'sale_type': attrs.get('SALETYPE', 'Unknown'),
                        'buyer': attrs.get('BUYER', 'Unknown'),
                        'seller': attrs.get('SELLER', 'Unknown'),
                        'deed_type': attrs.get('DEEDTYPE', 'Unknown'),
                        'instrument_number': attrs.get('INSTRUMENTNUMBER', 'Unknown')
                    })
            
            # Get property tax history if using PACS
            tax_history = []
            if self.use_pacs:
                try:
                    # Implementation would depend on the PACS connector's capabilities
                    # This is a placeholder for now
                    pass
                except Exception as e:
                    logger.warning(f"Error getting tax history from PACS: {str(e)}")
            
            # Combine all history data
            history = {
                'property_id': property_id,
                'sales_history': sales_history,
                'tax_history': tax_history,
                'source': f"Benton County, WA Records - {datetime.now().strftime('%Y-%m-%d')}",
                'data_compliance': self.disclaimer
            }
            
            return history
        
        except Exception as e:
            logger.error(f"Error getting property history: {str(e)}")
            return {
                'error': 'unexpected_error',
                'message': f"Error retrieving property history: {str(e)}",
                'data_compliance': self.disclaimer
            }
    
    def standardize_property(self, raw_property: Dict[str, Any]) -> Dict[str, Any]:
        """
        Standardize Benton County property data format.
        
        Args:
            raw_property (Dict[str, Any]): Raw property data
        
        Returns:
            Dict[str, Any]: Standardized property data
        """
        # Extract property ID
        if 'property_id' in raw_property:
            property_id = raw_property['property_id']
        elif 'parcel_data' in raw_property and 'PARCELID' in raw_property['parcel_data']:
            property_id = raw_property['parcel_data']['PARCELID']
        else:
            property_id = raw_property.get('PARCELID', 'Unknown')
        
        # Extract address components
        if 'address' in raw_property and isinstance(raw_property['address'], str):
            street_address = raw_property['address']
            city = "Benton County"
            state = "WA"
            zip_code = ""
        else:
            street_address = raw_property.get('SITEADDRESS', raw_property.get('address', 'Unknown'))
            city = "Benton County"
            state = "WA"
            zip_code = raw_property.get('ZIP', '')
        
        # Extract property values
        if 'property_values' in raw_property:
            assessed_value = raw_property['property_values'].get('ASSESSEDVALUE', 0)
            market_value = raw_property['property_values'].get('MARKETVALUE', 0)
        else:
            assessed_value = raw_property.get('ASSESSEDVALUE', 0)
            market_value = raw_property.get('MARKETVALUE', 0)
        
        # Build the standardized property object
        standardized = {
            'property_id': property_id,
            'address': {
                'street': street_address,
                'city': city,
                'state': state,
                'postal_code': zip_code,
                'display': f"{street_address}, {city}, {state} {zip_code}".strip().rstrip(', ')
            },
            'owner': raw_property.get('owner', raw_property.get('OWNER', 'Unknown')),
            'legal_description': raw_property.get('legal_description', raw_property.get('LEGALDESC', 'Unknown')),
            'assessed_value': assessed_value,
            'market_value': market_value,
            'data_source': f"Benton County, WA GIS - {datetime.now().strftime('%Y-%m-%d')}",
            'data_compliance': self.disclaimer
        }
        
        # Add additional details if available
        if 'property_details' in raw_property:
            details = raw_property['property_details']
            standardized.update({
                'year_built': details.get('YEARBUILT', 'Unknown'),
                'bedrooms': details.get('BEDROOMS', 'Unknown'),
                'bathrooms': details.get('BATHROOMS', 'Unknown'),
                'living_area': details.get('LIVINGAREA', 'Unknown'),
                'land_use': details.get('LANDUSE', 'Unknown'),
                'acres': details.get('ACRES', raw_property.get('acres', 0))
            })
        elif 'parcel_data' in raw_property:
            standardized['acres'] = raw_property['parcel_data'].get('ACRES', 0)
        else:
            standardized['acres'] = raw_property.get('acres', raw_property.get('ACRES', 0))
        
        return standardized
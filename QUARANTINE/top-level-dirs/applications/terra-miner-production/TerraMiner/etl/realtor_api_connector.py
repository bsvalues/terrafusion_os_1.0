"""
Realtor API connector for real estate data.

This connector uses the RapidAPI Realtor API to fetch property data.
"""

import os
import json
import logging
import time
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional, Union
from urllib.parse import urljoin

from etl.base_api_connector import BaseApiConnector
from models.property import standardize_property_data

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class RealtorApiConnector(BaseApiConnector):
    """
    Connector for the Realtor API via RapidAPI.
    
    This connector provides access to Realtor.com data through RapidAPI,
    implementing the standardized BaseApiConnector interface.
    """
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        """
        Initialize the Realtor API connector.
        
        Args:
            api_key (str, optional): RapidAPI key
            **kwargs: Additional connector-specific configuration options
        """
        super().__init__(**kwargs)
        
        # Set API key, using environment variable as fallback
        self.api_key = api_key or os.environ.get('RAPIDAPI_KEY')
        if not self.api_key:
            logger.warning("No RapidAPI key provided or found in environment")
            return
        
        # RapidAPI configuration
        self.base_url = "https://realtor-data1.p.rapidapi.com/"
        
        # API endpoint mapping
        self.endpoints = {
            'search': 'property_list/',
            'details': 'property-detail/',
            'trends': 'market-trends/',
        }
        
        # API headers
        self.headers = {
            'x-rapidapi-key': self.api_key,
            'x-rapidapi-host': 'realtor-data1.p.rapidapi.com',
            'Content-Type': 'application/json'
        }
        
        self.is_authenticated = True
        logger.info("Realtor API connector initialized")
    
    def search_properties(self, location: str, **kwargs) -> Dict[str, Any]:
        """
        Search for properties in a specific location.
        
        Args:
            location (str): Location to search (city, zip code, address, etc.)
            **kwargs: Additional search parameters
                limit (int): Maximum number of results (default: 10)
                offset (int): Number of results to skip (default: 0)
                beds (int): Minimum bedrooms
                baths (int): Minimum bathrooms
                min_price (int): Minimum price
                max_price (int): Maximum price
                property_type (str): Type of property
        
        Returns:
            Dict[str, Any]: Search results
        """
        if not self.is_authenticated:
            logger.error("Realtor API is not authenticated")
            return {"error": "Not authenticated", "listings": []}
        
        # Prepare search query
        start_time = time.time()
        error_type = None
        success = False
        
        try:
            # Apply throttling to avoid rate limits
            self._throttle_requests()
            
            # Parse the location to determine the search type
            location_type = 'postal_code' if location.strip().isdigit() else 'city'
            
            # Map parameters to Realtor API format
            limit = kwargs.get('limit', 10)
            offset = kwargs.get('offset', 0)
            beds = kwargs.get('beds')
            baths = kwargs.get('baths')
            min_price = kwargs.get('min_price')
            max_price = kwargs.get('max_price')
            property_type = kwargs.get('property_type', 'single_family')
            
            # Build the search query
            search_query = {
                "query": {
                    "status": ["for_sale"],
                },
                "limit": limit,
                "offset": offset,
                "sort": {
                    "direction": "desc",
                    "field": "list_date"
                }
            }
            
            # Add location filter
            if location_type == 'postal_code':
                search_query["query"]["postal_code"] = location
            else:
                search_query["query"]["city"] = location.split(',')[0].strip()
                # Add state if provided
                if ',' in location:
                    state = location.split(',')[1].strip()
                    search_query["query"]["state_code"] = state
            
            # Add optional filters
            if beds is not None:
                search_query["query"]["beds_min"] = beds
            if baths is not None:
                search_query["query"]["baths_min"] = baths
            if min_price is not None:
                search_query["query"]["price_min"] = min_price
            if max_price is not None:
                search_query["query"]["price_max"] = max_price
            if property_type is not None:
                search_query["query"]["property_type"] = [property_type]
            
            # Make the API request
            endpoint = urljoin(self.base_url, self.endpoints['search'])
            response = requests.post(
                endpoint,
                headers=self.headers,
                json=search_query,
                timeout=10
            )
            
            # Update rate limit information
            self._update_rate_limits(response.headers)
            
            # Process the response
            if response.status_code == 200:
                data = response.json()
                success = True
                
                # Format the results
                listings = []
                if 'properties' in data:
                    for prop in data['properties']:
                        # Standardize each property
                        standardized = self.standardize_property(prop)
                        listings.append(standardized)
                
                result = {
                    "listings": listings,
                    "total_listings": data.get('matching_rows', 0),
                    "status": "success",
                    "message": "Properties found"
                }
            else:
                if response.status_code == 429:
                    error_type = 'rate_limit'
                    logger.warning(f"Rate limit exceeded for Realtor API: {response.text}")
                else:
                    logger.error(f"Realtor API search error: {response.status_code} - {response.text}")
                
                result = {
                    "listings": [],
                    "total_listings": 0,
                    "status": "error",
                    "message": f"API error: {response.status_code}",
                    "details": response.text
                }
        
        except requests.exceptions.Timeout:
            error_type = 'timeout'
            logger.error("Realtor API request timed out")
            result = {
                "listings": [],
                "total_listings": 0,
                "status": "error",
                "message": "Request timed out"
            }
        
        except Exception as e:
            logger.error(f"Realtor API search exception: {str(e)}")
            result = {
                "listings": [],
                "total_listings": 0,
                "status": "error",
                "message": f"Exception: {str(e)}"
            }
        
        # Update metrics
        response_time = time.time() - start_time
        self._update_metrics(success, response_time, error_type)
        
        return result
    
    def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific property.
        
        Args:
            property_id (str): Property identifier
            
        Returns:
            Dict[str, Any]: Property details
        """
        if not self.is_authenticated:
            logger.error("Realtor API is not authenticated")
            return {"error": "Not authenticated"}
        
        # Prepare the request
        start_time = time.time()
        error_type = None
        success = False
        
        try:
            # Apply throttling to avoid rate limits
            self._throttle_requests()
            
            # Make the API request
            endpoint = urljoin(self.base_url, self.endpoints['details'])
            response = requests.post(
                endpoint,
                headers=self.headers,
                json={"property_id": property_id},
                timeout=10
            )
            
            # Update rate limit information
            self._update_rate_limits(response.headers)
            
            # Process the response
            if response.status_code == 200:
                data = response.json()
                success = True
                
                # Standardize the property data
                result = self.standardize_property(data.get('properties', [{}])[0])
                result['status'] = 'success'
                result['message'] = 'Property details retrieved'
            else:
                if response.status_code == 429:
                    error_type = 'rate_limit'
                    logger.warning(f"Rate limit exceeded for Realtor API: {response.text}")
                else:
                    logger.error(f"Realtor API property details error: {response.status_code} - {response.text}")
                
                result = {
                    "status": "error",
                    "message": f"API error: {response.status_code}",
                    "details": response.text
                }
        
        except requests.exceptions.Timeout:
            error_type = 'timeout'
            logger.error("Realtor API request timed out")
            result = {
                "status": "error",
                "message": "Request timed out"
            }
        
        except Exception as e:
            logger.error(f"Realtor API property details exception: {str(e)}")
            result = {
                "status": "error",
                "message": f"Exception: {str(e)}"
            }
        
        # Update metrics
        response_time = time.time() - start_time
        self._update_metrics(success, response_time, error_type)
        
        return result
    
    def get_market_trends(self, location: str, **kwargs) -> Dict[str, Any]:
        """
        Get market trends data for a specific location.
        
        Args:
            location (str): Location to analyze (city, zip code, etc.)
            **kwargs: Additional parameters
                property_type (str): Type of property (default: 'single_family')
                period (str): Time period for trends (default: '3mo')
        
        Returns:
            Dict[str, Any]: Market trend data
        """
        if not self.is_authenticated:
            logger.error("Realtor API is not authenticated")
            return {"error": "Not authenticated", "trends": []}
        
        # Prepare the request
        start_time = time.time()
        error_type = None
        success = False
        
        try:
            # Apply throttling to avoid rate limits
            self._throttle_requests()
            
            # Parse the location to determine the search type
            location_type = 'postal_code' if location.strip().isdigit() else 'city'
            
            # Map parameters to Realtor API format
            property_type = kwargs.get('property_type', 'single_family')
            period = kwargs.get('period', '3mo')
            
            # Build the search query
            query = {
                "property_type": property_type,
                "period": period
            }
            
            # Add location
            if location_type == 'postal_code':
                query["postal_code"] = location
            else:
                query["city"] = location.split(',')[0].strip()
                # Add state if provided
                if ',' in location:
                    state = location.split(',')[1].strip()
                    query["state_code"] = state
            
            # Make the API request
            endpoint = urljoin(self.base_url, self.endpoints['trends'])
            response = requests.post(
                endpoint,
                headers=self.headers,
                json=query,
                timeout=10
            )
            
            # Update rate limit information
            self._update_rate_limits(response.headers)
            
            # Process the response
            if response.status_code == 200:
                data = response.json()
                success = True
                
                # Format the results
                result = {
                    "trends": data.get('trends', []),
                    "location": location,
                    "property_type": property_type,
                    "period": period,
                    "status": "success",
                    "message": "Market trends retrieved"
                }
            else:
                if response.status_code == 429:
                    error_type = 'rate_limit'
                    logger.warning(f"Rate limit exceeded for Realtor API: {response.text}")
                else:
                    logger.error(f"Realtor API market trends error: {response.status_code} - {response.text}")
                
                result = {
                    "trends": [],
                    "status": "error",
                    "message": f"API error: {response.status_code}",
                    "details": response.text
                }
        
        except requests.exceptions.Timeout:
            error_type = 'timeout'
            logger.error("Realtor API request timed out")
            result = {
                "trends": [],
                "status": "error",
                "message": "Request timed out"
            }
        
        except Exception as e:
            logger.error(f"Realtor API market trends exception: {str(e)}")
            result = {
                "trends": [],
                "status": "error",
                "message": f"Exception: {str(e)}"
            }
        
        # Update metrics
        response_time = time.time() - start_time
        self._update_metrics(success, response_time, error_type)
        
        return result
    
    def standardize_property(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert Realtor API-specific property data to a standardized format.
        
        Args:
            data (Dict[str, Any]): Original property data from Realtor API
            
        Returns:
            Dict[str, Any]: Standardized property data
        """
        # Start with the generic standardization
        std_data = standardize_property_data('realtor', data)
        
        # Add any additional Realtor API specific mappings
        if 'property_id' in data:
            std_data['external_id'] = str(data['property_id'])
        
        # Address components (handle various formats)
        address_fields = ['line', 'street_number', 'street_name', 'street_suffix']
        if 'address' in data and any(field in data['address'] for field in address_fields):
            address_obj = data['address']
            address_parts = []
            
            if 'line' in address_obj:
                std_data['address'] = address_obj['line']
            else:
                # Construct from parts
                if 'street_number' in address_obj:
                    address_parts.append(address_obj['street_number'])
                if 'street_name' in address_obj:
                    address_parts.append(address_obj['street_name'])
                if 'street_suffix' in address_obj:
                    address_parts.append(address_obj['street_suffix'])
                
                if address_parts:
                    std_data['address'] = ' '.join(address_parts)
            
            std_data['city'] = address_obj.get('city')
            std_data['state'] = address_obj.get('state_code') or address_obj.get('state')
            std_data['zip_code'] = address_obj.get('postal_code')
            std_data['county'] = address_obj.get('county')
        
        # Location
        if 'location' in data:
            location = data['location']
            if 'address' in location:
                std_data['latitude'] = location['address'].get('lat')
                std_data['longitude'] = location['address'].get('lon')
        elif 'lat' in data and 'lon' in data:
            std_data['latitude'] = data['lat']
            std_data['longitude'] = data['lon']
        
        # Property details
        std_data['property_type'] = data.get('prop_type') or data.get('property_type')
        std_data['bedrooms'] = data.get('beds')
        std_data['bathrooms'] = data.get('baths')
        std_data['square_feet'] = data.get('building_size')
        if 'building_size_units' in data and data['building_size_units'] == 'sqft' and 'building_size' in data:
            std_data['square_feet'] = data['building_size']
        
        if 'lot_size' in data:
            # Convert to acres if needed
            lot_size = data['lot_size']
            if 'lot_size_units' in data and data['lot_size_units'] == 'sqft':
                # Convert sqft to acres (1 acre = 43,560 sqft)
                std_data['lot_size'] = lot_size / 43560
            else:
                std_data['lot_size'] = lot_size
        
        std_data['year_built'] = data.get('year_built')
        std_data['stories'] = data.get('stories')
        
        # Price information
        std_data['list_price'] = data.get('price')
        std_data['price_per_sqft'] = data.get('price_per_sqft')
        
        # Features and details
        if 'features' in data:
            for feature_group in data['features']:
                category = feature_group.get('category', '').lower()
                feature_values = feature_group.get('text', [])
                
                if category and feature_values:
                    std_data['features'][category] = feature_values
        
        # Status
        std_data['status'] = data.get('status', '').lower()
        std_data['days_on_market'] = data.get('days_on_market')
        
        # Return the standardized data
        return std_data
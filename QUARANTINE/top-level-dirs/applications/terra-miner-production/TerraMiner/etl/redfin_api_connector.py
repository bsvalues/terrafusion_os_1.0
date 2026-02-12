"""
Redfin API connector for real estate data

This connector provides access to Redfin property data through their public API.
Note: Redfin does not have an official public API, so this uses their internal APIs
which could change without notice.
"""

import os
import json
import logging
import requests
import time
import re
from typing import Dict, Any, Optional, List, Union
from bs4 import BeautifulSoup

from etl.base_api_connector import BaseApiConnector

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class RedfinApiConnector(BaseApiConnector):
    """
    Connector for Redfin property data.
    
    This connector uses Redfin's internal APIs to gather property data,
    market trends, and search for properties.
    """
    
    def __init__(self, **kwargs):
        """
        Initialize the Redfin API connector.
        
        Args:
            **kwargs: Additional connector-specific configuration options
        """
        super().__init__(**kwargs)
        
        # Redfin API configuration
        self.base_url = "https://www.redfin.com/stingray/"
        self.search_url = "https://www.redfin.com/stingray/api/gis"
        self.property_url = "https://www.redfin.com/stingray/api/home/details"
        self.trends_url = "https://www.redfin.com/stingray/api/v1/market/trends"
        
        # Common headers
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.redfin.com/'
        }
        
        self.min_request_interval = kwargs.get('min_request_interval', 3.0)  # Longer delay for Redfin
        self.source_priority = kwargs.get('priority', 'tertiary')
        self.is_authenticated = True
        logger.info("Redfin API connector initialized successfully")
    
    def _make_request(self, url: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Make a request to the Redfin API.
        
        Args:
            url (str): API endpoint to call
            params (dict, optional): Query parameters
        
        Returns:
            dict: Response data
        """
        self._throttle_requests()
        
        try:
            start_time = time.time()
            self.last_request_time = start_time
            self.metrics['requests'] += 1
            
            response = requests.get(
                url,
                headers=self.headers,
                params=params,
                timeout=30
            )
            
            elapsed = time.time() - start_time
            self.metrics['total_response_time'] += elapsed
            
            # Check for rate limiting or blocking
            if response.status_code == 429 or response.status_code == 403:
                logger.warning(f"Redfin access limited: {response.status_code}")
                self.metrics['rate_limit_hits'] += 1
                return {"error": "Access limited or blocked"}
            
            # Check for other errors
            if response.status_code != 200:
                logger.error(f"Redfin API error: {response.status_code}: {response.text}")
                self.metrics['errors'] += 1
                return {"error": f"API error: {response.status_code}"}
            
            # For Redfin API, response is typically a JavaScript object wrapped in a function call
            content = response.text
            
            # Extract JSON from the response
            json_match = re.search(r'(\{.*\})', content)
            if json_match:
                try:
                    json_str = json_match.group(1)
                    data = json.loads(json_str)
                    return data
                except json.JSONDecodeError:
                    logger.error("Failed to parse Redfin response as JSON")
                    self.metrics['errors'] += 1
                    return {"error": "Failed to parse response"}
            else:
                # If not JSON, return the HTML content for parsing
                return {"html": content}
            
        except requests.exceptions.Timeout:
            logger.error("Redfin API request timed out")
            self.metrics['timeouts'] += 1
            return {"error": "Request timed out"}
            
        except Exception as e:
            logger.error(f"Redfin API request error: {str(e)}")
            self.metrics['errors'] += 1
            return {"error": f"Request error: {str(e)}"}
    
    def search_properties(self, address: str = None, city: str = None, 
                         state: str = None, zipcode: str = None, 
                         min_price: int = None, max_price: int = None) -> List[Dict[str, Any]]:
        """
        Search for properties using Redfin's search API.
        
        Args:
            address (str, optional): Street address
            city (str, optional): City name
            state (str, optional): State code
            zipcode (str, optional): ZIP code
            min_price (int, optional): Minimum price
            max_price (int, optional): Maximum price
        
        Returns:
            list: List of matching properties
        """
        # Build search query
        search_query = ""
        if address:
            search_query = address
            if city and state:
                search_query += f", {city}, {state}"
            elif zipcode:
                search_query += f" {zipcode}"
        elif city and state:
            search_query = f"{city}, {state}"
        elif zipcode:
            search_query = zipcode
        else:
            logger.warning("No search parameters provided")
            return []
        
        # Build parameters
        params = {
            'q': search_query,
            'start': 0,
            'count': 20,
            'v': 2,
            'market': 'false',
            'al': 1,
            'aft': 0
        }
        
        if min_price:
            params['min_price'] = min_price
        
        if max_price:
            params['max_price'] = max_price
        
        # Make the request
        url = f"{self.search_url}?{self._build_query_string(params)}"
        response = self._make_request(url)
        
        if 'error' in response:
            return []
        
        try:
            # Extract property data from response
            properties = []
            if 'homes' in response and 'results' in response['homes']:
                for result in response['homes']['results']:
                    properties.append(self._parse_property_result(result))
            
            return properties
        except Exception as e:
            logger.error(f"Error processing Redfin search results: {str(e)}")
            return []
    
    def _parse_property_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse a property result from Redfin search.
        
        Args:
            result (dict): Property result data
        
        Returns:
            dict: Parsed property data
        """
        property_data = {
            'property_id': result.get('id', ''),
            'url': f"https://www.redfin.com{result.get('url', '')}",
            'address': result.get('streetLine', {}).get('value', ''),
            'city': result.get('cityState', '').split(',')[0] if ',' in result.get('cityState', '') else '',
            'state': result.get('cityState', '').split(',')[1].strip() if ',' in result.get('cityState', '') else '',
            'zipcode': result.get('postalCode', {}).get('value', ''),
            'price': result.get('price', {}).get('value', 0),
            'beds': result.get('beds', 0),
            'baths': result.get('baths', 0),
            'square_feet': result.get('sqFt', {}).get('value', 0),
            'lot_size': result.get('lotSize', {}).get('value', 0),
            'year_built': result.get('yearBuilt', {}).get('value', 0),
            'latitude': result.get('latLong', {}).get('latitude', 0),
            'longitude': result.get('latLong', {}).get('longitude', 0),
            'status': result.get('status', ''),
            'property_type': result.get('propertyType', ''),
            'days_on_market': result.get('timeOnRedfin', {}).get('value', 0),
            'primary_image_url': result.get('photoUrl', ''),
            'source': 'redfin'
        }
        
        return property_data
    
    def _build_query_string(self, params: Dict[str, Any]) -> str:
        """
        Build a query string from parameters.
        
        Args:
            params (dict): Parameters
        
        Returns:
            str: Query string
        """
        return '&'.join([f"{k}={v}" for k, v in params.items()])
    
    def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """
        Get detailed property information.
        
        Args:
            property_id (str): Redfin property ID
        
        Returns:
            dict: Property details
        """
        params = {
            'propertyId': property_id,
            'accessLevel': 1
        }
        
        url = f"{self.property_url}?{self._build_query_string(params)}"
        response = self._make_request(url)
        
        if 'error' in response:
            return {}
        
        try:
            # Extract property data from response
            property_data = response.get('payload', {})
            if not property_data:
                return {}
            
            property_details = {
                'property_id': property_id,
                'source': 'redfin',
                # Basic information
                'address': property_data.get('addressInfo', {}).get('streetLine', ''),
                'city': property_data.get('addressInfo', {}).get('city', ''),
                'state': property_data.get('addressInfo', {}).get('state', ''),
                'zipcode': property_data.get('addressInfo', {}).get('zip', ''),
                'latitude': property_data.get('addressInfo', {}).get('latitude', 0),
                'longitude': property_data.get('addressInfo', {}).get('longitude', 0),
                
                # Property details
                'price': property_data.get('listingInfo', {}).get('price', 0),
                'status': property_data.get('listingInfo', {}).get('status', ''),
                'beds': property_data.get('marketingInfo', {}).get('beds', 0),
                'baths': property_data.get('marketingInfo', {}).get('baths', 0),
                'square_feet': property_data.get('marketingInfo', {}).get('sqFt', 0),
                'lot_size': property_data.get('marketingInfo', {}).get('lotSize', 0),
                'year_built': property_data.get('marketingInfo', {}).get('yearBuilt', 0),
                'property_type': property_data.get('propertyTypeInfo', {}).get('propertyType', ''),
                
                # Listing details
                'days_on_market': property_data.get('listingInfo', {}).get('daysOnMarket', 0),
                'listing_date': property_data.get('listingInfo', {}).get('listingDate', ''),
                'listing_agent': property_data.get('listingInfo', {}).get('listingAgent', ''),
                'listing_office': property_data.get('listingInfo', {}).get('listingOffice', ''),
                
                # Property features
                'description': property_data.get('marketingInfo', {}).get('description', ''),
                'features': property_data.get('marketingInfo', {}).get('features', []),
                
                # Images
                'primary_image_url': property_data.get('marketingInfo', {}).get('primaryPhoto', {}).get('url', ''),
                'image_count': len(property_data.get('marketingInfo', {}).get('photos', [])),
                
                # Valuation
                'estimated_value': property_data.get('valuationInfo', {}).get('estimatedValue', 0),
                
                # Raw data for reference
                'raw_data': property_data
            }
            
            return property_details
            
        except Exception as e:
            logger.error(f"Error processing Redfin property details: {str(e)}")
            return {}
    
    def get_property_history(self, property_id: str) -> List[Dict[str, Any]]:
        """
        Get property history events.
        
        Args:
            property_id (str): Redfin property ID
        
        Returns:
            list: Property history events
        """
        # Get property details which includes history
        property_details = self.get_property_details(property_id)
        if not property_details:
            return []
        
        history = []
        
        # Extract price history from property data
        raw_data = property_details.get('raw_data', {})
        price_history = raw_data.get('historyInfo', {}).get('priceHistory', [])
        
        for event in price_history:
            history_event = {
                'event_type': event.get('eventType', ''),
                'event_date': event.get('date', ''),
                'previous_value': event.get('previousPrice', 0),
                'new_value': event.get('price', 0),
                'source': 'redfin',
                'description': f"{event.get('eventDescription', '')} - {event.get('price', 0)}",
                'details': event
            }
            
            history.append(history_event)
        
        return history
    
    def get_market_trends(self, zipcode: str = None, city: str = None, 
                         state: str = None) -> Dict[str, Any]:
        """
        Get market trends for a location.
        
        Args:
            zipcode (str, optional): ZIP code
            city (str, optional): City name
            state (str, optional): State code
        
        Returns:
            dict: Market trend data
        """
        region_type = None
        region_id = None
        
        # First, need to get region ID for the location
        if zipcode:
            region_type = "zip"
            search_query = zipcode
        elif city and state:
            region_type = "city"
            search_query = f"{city}, {state}"
        else:
            logger.warning("Either zipcode or city and state must be provided")
            return {}
        
        # Search for region ID
        search_params = {
            'q': search_query,
            'type': 2,
            'v': 2
        }
        
        search_url = f"{self.search_url}?{self._build_query_string(search_params)}"
        search_response = self._make_request(search_url)
        
        if 'error' in search_response:
            return {}
        
        try:
            # Find matching region
            if 'payload' in search_response and 'sections' in search_response['payload']:
                for section in search_response['payload']['sections']:
                    if section.get('type') == region_type:
                        region_id = section.get('id', '')
                        break
            
            if not region_id:
                logger.warning(f"No region ID found for {search_query}")
                return {}
            
            # Get market trends for the region
            trend_params = {
                'regionId': region_id,
                'regionType': region_type,
                'metrics': 'SalePrice,MedianPricePerSqFt,Inventory,DomPercent,NewListings',
                'mode': 'download'
            }
            
            trend_url = f"{self.trends_url}?{self._build_query_string(trend_params)}"
            trend_response = self._make_request(trend_url)
            
            if 'error' in trend_response:
                return {}
            
            # Process trend data
            if 'payload' in trend_response:
                return {
                    'region_id': region_id,
                    'region_type': region_type,
                    'location': search_query,
                    'source': 'redfin',
                    'trends': trend_response['payload']
                }
            
            return {}
            
        except Exception as e:
            logger.error(f"Error processing Redfin market trends: {str(e)}")
            return {}
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get connector performance metrics."""
        # Calculate average response time
        avg_response_time = 0
        if self.metrics['requests'] > 0:
            avg_response_time = self.metrics['total_response_time'] / self.metrics['requests']
        
        return {
            'requests': self.metrics['requests'],
            'errors': self.metrics['errors'],
            'timeouts': self.metrics['timeouts'],
            'rate_limit_hits': self.metrics['rate_limit_hits'],
            'avg_response_time': round(avg_response_time, 3)
        }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get connector health status."""
        # Calculate error rate
        error_rate = 0
        if self.metrics['requests'] > 0:
            error_rate = (self.metrics['errors'] / self.metrics['requests']) * 100
        
        # Determine status based on error rate and rate limit hits
        if self.metrics['rate_limit_hits'] > 5 or error_rate > 20:
            status = 'critical'
            healthy = False
            message = f'Access limited or high error rate: {error_rate:.1f}%'
        elif self.metrics['rate_limit_hits'] > 2 or error_rate > 10:
            status = 'degraded'
            healthy = True
            message = f'Some access issues or elevated errors: {error_rate:.1f}%'
        else:
            status = 'healthy'
            healthy = True
            message = 'Connector operating normally'
        
        return {
            'status': status,
            'message': message,
            'healthy': healthy,
            'error_rate': error_rate,
            'authenticated': self.is_authenticated
        }
    
    def standardize_property(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Standardize property data from Redfin format to common format.
        
        Args:
            data (dict): Property data from Redfin
        
        Returns:
            dict: Standardized property data
        """
        standardized = {
            'source': 'redfin',
            'external_id': data.get('property_id') or data.get('id', '')
        }
        
        # Extract common fields with Redfin-specific mappings
        standardized.update({
            'price': data.get('price', 0),
            'address_line1': data.get('address', ''),
            'city': data.get('city', ''),
            'state': data.get('state', ''),
            'zipcode': data.get('zipcode', ''),
            'bedrooms': data.get('beds', 0) or data.get('bedrooms', 0),
            'bathrooms': data.get('baths', 0) or data.get('bathrooms', 0),
            'square_feet': data.get('square_feet', 0) or data.get('sqFt', 0),
            'lot_size': data.get('lot_size', 0) or data.get('lotSize', 0),
            'year_built': data.get('year_built', 0) or data.get('yearBuilt', 0),
            'property_type': data.get('property_type', ''),
            'status': data.get('status', ''),
            'latitude': data.get('latitude', 0),
            'longitude': data.get('longitude', 0),
            'primary_image_url': data.get('primary_image_url', '') or data.get('photoUrl', ''),
            'days_on_market': data.get('days_on_market', 0),
            'raw_data': data
        })
        
        return standardized
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test the connection to Redfin.
        
        Returns:
            dict: Test results
        """
        # Try a simple search
        try:
            # Test with a well-known location
            search_query = "Seattle, WA"
            
            search_params = {
                'q': search_query,
                'start': 0,
                'count': 1,
                'v': 2,
                'al': 1
            }
            
            url = f"{self.search_url}?{self._build_query_string(search_params)}"
            start_time = time.time()
            response = self._make_request(url)
            elapsed = time.time() - start_time
            
            if 'error' in response:
                return {
                    'success': False,
                    'message': f"API error: {response['error']}",
                    'response_time': elapsed
                }
            
            # Check for expected data structures
            if 'payload' in response and 'sections' in response['payload']:
                return {
                    'success': True,
                    'message': "Successfully connected to Redfin API.",
                    'response_time': elapsed
                }
            else:
                return {
                    'success': False,
                    'message': "Connected to Redfin, but received unexpected response format.",
                    'response_time': elapsed
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f"Connection test failed: {str(e)}"
            }
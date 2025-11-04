"""
ATTOM Property Data API connector

This connector provides access to ATTOM's comprehensive property data API,
which includes property characteristics, ownership, sales history, tax data,
and more across the United States.
"""

import os
import json
import logging
import requests
import time
import datetime
from typing import Dict, Any, Optional, List, Union

from etl.base_api_connector import BaseApiConnector
from etl.data_validation import validate_required_fields, normalize_address, deduplicate_records, fuzzy_deduplicate_records

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class AttomApiConnector(BaseApiConnector):
    """
    Connector for the ATTOM Property Data API.
    
    ATTOM provides one of the most comprehensive property data sets in the US,
    including detailed information on over 155 million properties.
    """
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        """
        Initialize the ATTOM API connector.
        
        Args:
            api_key (str, optional): ATTOM API key
            **kwargs: Additional connector-specific configuration options
        """
        super().__init__(**kwargs)
        
        # Set API key, using environment variable as fallback
        self.api_key = api_key or os.environ.get('ATTOM_API_KEY')
        if not self.api_key:
            logger.warning("No ATTOM API key provided or found in environment")
            return
        
        # API configuration
        self.base_url = "https://api.gateway.attomdata.com/propertyapi/v1.0.0"
        
        # API endpoint mapping
        self.endpoints = {
            'property': 'property/detail',
            'search': 'property/address',
            'sale': 'sale/detail',
            'assessment': 'assessment/detail',
            'avm': 'property/expandedprofile',
            'school': 'school/snapshot',
            'neighborhood': 'neighborhood/detail',
        }
        
        # API headers
        self.headers = {
            'apikey': self.api_key,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        self.min_request_interval = kwargs.get('min_request_interval', 1.0)
        self.source_priority = kwargs.get('priority', 'primary')
        self.is_authenticated = True
        logger.info("ATTOM API connector initialized successfully")
    
    def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make a request to the ATTOM API.
        
        Args:
            endpoint (str): API endpoint to call
            params (dict): Query parameters
        
        Returns:
            dict: Response data
        """
        if not self.is_authenticated:
            logger.warning("ATTOM API connector is not authenticated")
            return {"error": "Not authenticated"}
        
        url = f"{self.base_url}/{endpoint}"
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
            
            # Check for rate limiting
            if response.status_code == 429:
                logger.warning("ATTOM API rate limit reached")
                self.metrics['rate_limit_hits'] += 1
                return {"error": "Rate limit exceeded"}
            
            # Check for other errors
            if response.status_code != 200:
                logger.error(f"ATTOM API error: {response.status_code}: {response.text}")
                self.metrics['errors'] += 1
                return {"error": f"API error: {response.status_code}"}
            
            # Parse response
            data = response.json()
            return data
            
        except requests.exceptions.Timeout:
            logger.error("ATTOM API request timed out")
            self.metrics['timeouts'] += 1
            return {"error": "Request timed out"}
            
        except Exception as e:
            logger.error(f"ATTOM API request error: {str(e)}")
            self.metrics['errors'] += 1
            return {"error": f"Request error: {str(e)}"}
    
    def search_properties(self, address: str = None, city: str = None, 
                          state: str = None, zipcode: str = None, 
                          radius: float = 0.1) -> List[Dict[str, Any]]:
        """
        Search for properties by address components.
        
        Args:
            address (str, optional): Street address
            city (str, optional): City name
            state (str, optional): State code
            zipcode (str, optional): ZIP code
            radius (float, optional): Search radius in miles
        
        Returns:
            list: List of matching properties
        """
        params = {}
        
        # Build address search parameters
        if address:
            params['address'] = address
        
        if city:
            params['city'] = city
            
        if state:
            params['state'] = state
            
        if zipcode:
            params['zipcode'] = zipcode
        
        # Must have at least one search parameter
        if not params:
            logger.warning("No search parameters provided")
            return []
        
        # Add search radius
        params['radius'] = str(radius)
        
        # Make the request
        response = self._make_request(self.endpoints['search'], params)
        
        if 'error' in response:
            return []
        
        try:
            # Extract property data from response
            properties = response.get('property', [])
            # Deduplicate by attomid, id, or apn (fallback order)
            if properties and isinstance(properties, list):
                # Try attomid, then id, then apn
                dedup_keys = None
                if properties and 'attomid' in properties[0]:
                    dedup_keys = ['attomid']
                elif properties and 'id' in properties[0]:
                    dedup_keys = ['id']
                elif properties and 'apn' in properties[0]:
                    dedup_keys = ['apn']
                else:
                    dedup_keys = None
                import csv
                from datetime import datetime
                input_count = len(properties)
                if dedup_keys:
                    properties = deduplicate_records(properties, dedup_keys)
                strict_count = len(properties)
                # Further deduplicate using fuzzy address similarity
                threshold = getattr(self, 'fuzzy_threshold', 95)
                properties = fuzzy_deduplicate_records(properties, address_field="address", threshold=threshold)
                fuzzy_count = len(properties)
                # Log deduplication metrics
                with open('dedup_metrics.csv', 'a', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow([
                        datetime.utcnow().isoformat(),
                        'attom',
                        input_count,
                        strict_count,
                        fuzzy_count,
                        threshold
                    ])
            return properties
        except Exception as e:
            logger.error(f"Error processing ATTOM property search results: {str(e)}")
            return []
    
    def get_property_details(self, property_id: str = None, address: str = None, 
                             zipcode: str = None) -> Dict[str, Any]:
        """
        Get detailed property information.
        
        Args:
            property_id (str, optional): ATTOM property ID
            address (str, optional): Street address
            zipcode (str, optional): ZIP code
        
        Returns:
            dict: Property details
        """
        params = {}
        
        # Either property_id or (address and zipcode) are required
        if property_id:
            params['attomId'] = property_id
        elif address and zipcode:
            params['address'] = address
            params['zipcode'] = zipcode
        else:
            logger.warning("Either property_id or address+zipcode must be provided")
            return {}
        
        # Make the request
        response = self._make_request(self.endpoints['property'], params)
        
        if 'error' in response:
            return {}
        
        try:
            # Extract property data from response
            properties = response.get('property', [])
            if properties:
                return properties[0]
            return {}
        except Exception as e:
            logger.error(f"Error processing ATTOM property details: {str(e)}")
            return {}
    
    def get_property_sales(self, property_id: str = None, address: str = None, 
                          zipcode: str = None) -> Dict[str, Any]:
        """
        Get property sales history.
        
        Args:
            property_id (str, optional): ATTOM property ID
            address (str, optional): Street address
            zipcode (str, optional): ZIP code
        
        Returns:
            dict: Sales history
        """
        params = {}
        
        # Either property_id or (address and zipcode) are required
        if property_id:
            params['attomId'] = property_id
        elif address and zipcode:
            params['address'] = address
            params['zipcode'] = zipcode
        else:
            logger.warning("Either property_id or address+zipcode must be provided")
            return {}
        
        # Make the request
        response = self._make_request(self.endpoints['sale'], params)
        
        if 'error' in response:
            return {}
        
        try:
            # Extract sale data from response
            properties = response.get('property', [])
            if properties:
                return properties[0]
            return {}
        except Exception as e:
            logger.error(f"Error processing ATTOM sales data: {str(e)}")
            return {}
    
    def get_property_valuation(self, property_id: str = None, address: str = None, 
                              zipcode: str = None) -> Dict[str, Any]:
        """
        Get automated valuation model (AVM) data for a property.
        
        Args:
            property_id (str, optional): ATTOM property ID
            address (str, optional): Street address
            zipcode (str, optional): ZIP code
        
        Returns:
            dict: Property valuation data
        """
        params = {}
        
        # Either property_id or (address and zipcode) are required
        if property_id:
            params['attomId'] = property_id
        elif address and zipcode:
            params['address'] = address
            params['zipcode'] = zipcode
        else:
            logger.warning("Either property_id or address+zipcode must be provided")
            return {}
        
        # Make the request
        response = self._make_request(self.endpoints['avm'], params)
        
        if 'error' in response:
            return {}
        
        try:
            # Extract AVM data from response
            properties = response.get('property', [])
            if properties:
                return properties[0]
            return {}
        except Exception as e:
            logger.error(f"Error processing ATTOM valuation data: {str(e)}")
            return {}
    
    def get_neighborhood_data(self, property_id: str = None, address: str = None, 
                             zipcode: str = None) -> Dict[str, Any]:
        """
        Get neighborhood information for a property.
        
        Args:
            property_id (str, optional): ATTOM property ID
            address (str, optional): Street address
            zipcode (str, optional): ZIP code
        
        Returns:
            dict: Neighborhood data
        """
        params = {}
        
        # Either property_id or (address and zipcode) are required
        if property_id:
            params['attomId'] = property_id
        elif address and zipcode:
            params['address'] = address
            params['zipcode'] = zipcode
        else:
            logger.warning("Either property_id or address+zipcode must be provided")
            return {}
        
        # Make the request
        response = self._make_request(self.endpoints['neighborhood'], params)
        
        if 'error' in response:
            return {}
        
        try:
            # Extract neighborhood data from response
            return response.get('neighborhood', {})
        except Exception as e:
            logger.error(f"Error processing ATTOM neighborhood data: {str(e)}")
            return {}
    
    def get_property_history(self, property_id: str) -> List[Dict[str, Any]]:
        """
        Get property history (sales, loans, tax assessments).
        
        Args:
            property_id (str): Property identifier
        
        Returns:
            list: Property history events
        """
        # Get sales history
        sales_data = self.get_property_sales(property_id=property_id)
        
        history = []
        
        # Extract sales history
        sale_transactions = sales_data.get('saleTransactions', [])
        for sale in sale_transactions:
            history.append({
                'event_type': 'sale',
                'event_date': sale.get('recordingDate'),
                'new_value': sale.get('amount', {}).get('saleAmt'),
                'source': 'attom',
                'description': f"Property sold for ${sale.get('amount', {}).get('saleAmt', 0):,}",
                'details': sale
            })
        
        return history
    
    def get_market_trends(self, location: str = None, **kwargs) -> Dict[str, Any]:
        """
        Get market trends data for a location.
        
        Args:
            location (str, optional): Location string (ZIP, city, etc.)
            **kwargs: Additional search parameters
        
        Returns:
            dict: Market trend data
        """
        # Parse location string
        zipcode = None
        city = None
        state = None
        
        if location:
            # Check if it's a ZIP code (5 digits)
            if len(location) == 5 and location.isdigit():
                zipcode = location
            else:
                # Assume city, state format
                parts = location.split(',')
                if len(parts) >= 2:
                    city = parts[0].strip()
                    state = parts[1].strip()
        
        # Use explicit parameters if provided
        zipcode = kwargs.get('zipcode', zipcode)
        city = kwargs.get('city', city)
        state = kwargs.get('state', state)
        
        # Build the area search parameters
        params = {}
        if zipcode:
            params['postalcode'] = zipcode
        elif city and state:
            params['city'] = city
            params['state'] = state
        elif state:
            params['state'] = state
        else:
            logger.warning("No location parameters provided")
            return {}
        
        # Add radius parameter if provided
        if 'radius' in kwargs:
            params['radius'] = kwargs['radius']
        
        # Make request to expanded profile endpoint which includes market data
        endpoint = self.endpoints['avm']
        response = self._make_request(endpoint, params)
        
        if 'error' in response:
            return {'error': response['error'], 'source': 'attom'}
        
        # Process the market data
        market_data = {
            'source': 'attom',
            'location': location or f"{city}, {state}" if city and state else state or zipcode,
            'date_generated': datetime.datetime.now().isoformat(),
            'trends': {}
        }
        
        # Extract trend data from response
        try:
            properties = response.get('property', [])
            if properties:
                # Get the first property's area data
                area_data = properties[0].get('area', {})
                
                # Extract median home value
                median_value = area_data.get('median_value')
                if median_value:
                    market_data['trends']['median_home_value'] = median_value
                
                # Extract market appreciation rates
                appreciation = area_data.get('appreciation')
                if appreciation:
                    market_data['trends']['appreciation'] = appreciation
                
                # Extract other market indicators
                market_data['trends']['median_sale_price'] = area_data.get('median_sale_price')
                market_data['trends']['median_price_per_sqft'] = area_data.get('median_price_per_sqft')
                market_data['trends']['days_on_market'] = area_data.get('days_on_market')
                
                # Add location details
                market_data['location_details'] = {
                    'zipcode': area_data.get('postal_code'),
                    'city': area_data.get('city'),
                    'state': area_data.get('state'),
                    'county': area_data.get('county')
                }
        except Exception as e:
            logger.error(f"Error processing ATTOM market trend data: {str(e)}")
            market_data['error'] = f"Processing error: {str(e)}"
        
        return market_data
    
    def standardize_property(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Standardize property data from ATTOM format to common format, with validation and normalization.
        
        Args:
            data (dict): Property data from ATTOM
        
        Returns:
            dict: Standardized property data
        """
        standardized = {
            "id": data.get("identifier", {}).get("attomId"),
            "address": data.get("address", {}),
            "owner": data.get("owner", {}),
            "building": data.get("building", {}),
            "lot": data.get("lot", {}),
            "sale": data.get("sale", {}),
            "tax": data.get("tax", {}),
            "valuation": data.get("avm", {}),
        }
        # Validate required fields
        if not validate_required_fields(standardized, ["address", "id"]):
            raise ValueError("Missing required fields in ATTOM property data: ['address', 'id']")
        # Normalize address
        standardized["address"] = normalize_address(standardized["address"])
        location = data.get('location', {})
        if location:
            standardized.update({
                'latitude': location.get('latitude'),
                'longitude': location.get('longitude'),
            })
        
        # Extract building information
        building = data.get('building', {})
        if building:
            standardized.update({
                'square_feet': building.get('size', {}).get('universalsize'),
                'bedrooms': building.get('rooms', {}).get('beds'),
                'bathrooms': building.get('rooms', {}).get('bathstotal'),
                'year_built': building.get('yearbuilt'),
                'stories': building.get('stories'),
                'property_type': building.get('construction', {}).get('style'),
            })
        
        # Extract lot information
        lot = data.get('lot', {})
        if lot:
            standardized.update({
                'lot_size': lot.get('size', {}).get('universalsize'),
            })
        
        # Extract valuation
        sale = data.get('sale', {})
        if sale:
            standardized.update({
                'price': sale.get('amount', {}).get('saleAmt'),
                'last_sold_date': sale.get('salesearchdate'),
                'last_sold_price': sale.get('amount', {}).get('saleAmt'),
            })
        
        # Extract tax information
        tax = data.get('tax', {})
        if tax:
            standardized.update({
                'tax_assessed_value': tax.get('taxAmt'),
                'tax_annual_amount': tax.get('taxAmt'),
            })
        
        # Set raw data for reference
        standardized['raw_data'] = data
        
        return standardized
    
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
        if not self.is_authenticated:
            return {
                'status': 'critical',
                'message': 'Not authenticated - API key missing or invalid',
                'healthy': False
            }
        
        # Calculate error rate
        error_rate = 0
        if self.metrics['requests'] > 0:
            error_rate = (self.metrics['errors'] / self.metrics['requests']) * 100
        
        # Determine status based on error rate
        if error_rate > 20:
            status = 'critical'
            healthy = False
            message = f'High error rate: {error_rate:.1f}%'
        elif error_rate > 5:
            status = 'degraded'
            healthy = True
            message = f'Elevated error rate: {error_rate:.1f}%'
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
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test the connection to the ATTOM API.
        
        Returns:
            dict: Test results
        """
        if not self.is_authenticated:
            return {
                'success': False,
                'message': 'Not authenticated - API key missing or invalid'
            }
        
        # Try a simple request
        try:
            # Test with a known address
            params = {
                'address': '1600 Pennsylvania Ave',
                'city': 'Washington',
                'state': 'DC',
            }
            
            start_time = time.time()
            response = self._make_request(self.endpoints['search'], params)
            elapsed = time.time() - start_time
            
            if 'error' in response:
                return {
                    'success': False,
                    'message': f"API error: {response['error']}",
                    'response_time': elapsed
                }
            
            properties = response.get('property', [])
            if properties:
                return {
                    'success': True,
                    'message': f"Successfully connected to ATTOM API. Found {len(properties)} properties.",
                    'response_time': elapsed
                }
            else:
                return {
                    'success': True,
                    'message': "Successfully connected to ATTOM API, but no properties found for test address.",
                    'response_time': elapsed
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f"Connection test failed: {str(e)}"
            }
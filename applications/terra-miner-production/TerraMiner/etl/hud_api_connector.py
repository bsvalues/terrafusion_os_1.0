"""
HUD (Housing and Urban Development) API connector

This connector provides access to housing data from the U.S. Department of Housing
and Urban Development API, including Fair Market Rents, Income Limits, and more.
"""

import os
import json
import logging
import requests
import time
from typing import Dict, Any, Optional, List, Union

from etl.base_api_connector import BaseApiConnector

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class HudApiConnector(BaseApiConnector):
    """
    Connector for the HUD (Housing and Urban Development) API.
    
    This connector provides access to HUD's Open Data APIs, which include
    data on Fair Market Rents, Income Limits, Housing Counselors, and other
    housing-related datasets.
    """
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        """
        Initialize the HUD API connector.
        
        Args:
            api_key (str, optional): HUD API key
            **kwargs: Additional connector-specific configuration options
        """
        super().__init__(**kwargs)
        
        # Set API key, using environment variable as fallback
        self.api_key = api_key or os.environ.get('HUD_API_KEY')
        if not self.api_key:
            logger.warning("No HUD API key provided or found in environment")
            return
        
        # HUD API configuration
        self.base_url = "https://www.huduser.gov/hudapi/public"
        
        # API endpoint mapping
        self.endpoints = {
            'fmr': '/fmr/data',          # Fair Market Rents
            'il': '/il/data',             # Income Limits
            'chas': '/chas/data',         # Comprehensive Housing Affordability Strategy
            'hic': '/hic/data',           # Housing Inventory Count
            'usps': '/usps/data',         # USPS Vacancy Data
            'counseling': '/hc/data',     # Housing Counseling Data
            'lihtc': '/lihtc/data',       # Low Income Housing Tax Credit
        }
        
        # API headers
        self.headers = {
            'Authorization': f"Bearer {self.api_key}",
            'Content-Type': 'application/json'
        }
        
        self.source_priority = kwargs.get('priority', 'tertiary')
        self.is_authenticated = True
        logger.info("HUD API connector initialized successfully")
    
    def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Make a request to the HUD API.
        
        Args:
            endpoint (str): API endpoint to call
            params (dict, optional): Query parameters
        
        Returns:
            dict: Response data
        """
        if not self.is_authenticated:
            logger.warning("HUD API connector is not authenticated")
            return {"error": "Not authenticated"}
        
        url = f"{self.base_url}{endpoint}"
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
                logger.warning("HUD API rate limit reached")
                self.metrics['rate_limit_hits'] += 1
                return {"error": "Rate limit exceeded"}
            
            # Check for other errors
            if response.status_code != 200:
                logger.error(f"HUD API error: {response.status_code}: {response.text}")
                self.metrics['errors'] += 1
                return {"error": f"API error: {response.status_code}"}
            
            # Parse response
            data = response.json()
            return data
            
        except requests.exceptions.Timeout:
            logger.error("HUD API request timed out")
            self.metrics['timeouts'] += 1
            return {"error": "Request timed out"}
            
        except Exception as e:
            logger.error(f"HUD API request error: {str(e)}")
            self.metrics['errors'] += 1
            return {"error": f"Request error: {str(e)}"}
    
    def get_fair_market_rents(self, zip_code: str = None, county: str = None, 
                             state: str = None, year: int = None) -> Dict[str, Any]:
        """
        Get Fair Market Rent data for a location.
        
        Args:
            zip_code (str, optional): ZIP code
            county (str, optional): County name
            state (str, optional): State code
            year (int, optional): Year for data (defaults to most recent)
        
        Returns:
            dict: Fair Market Rent data
        """
        params = {}
        
        # Build query parameters
        if zip_code:
            params['zip'] = zip_code
        elif county and state:
            params['county'] = county
            params['state'] = state
        elif state:
            params['state'] = state
        else:
            logger.warning("Either zip_code, county+state, or state must be provided")
            return {}
        
        if year:
            params['year'] = year
        
        # Make the request
        response = self._make_request(self.endpoints['fmr'], params)
        
        if 'error' in response:
            return {}
        
        return response.get('data', {})
    
    def get_income_limits(self, zip_code: str = None, county: str = None, 
                         state: str = None, year: int = None) -> Dict[str, Any]:
        """
        Get Income Limit data for a location.
        
        Args:
            zip_code (str, optional): ZIP code
            county (str, optional): County name
            state (str, optional): State code
            year (int, optional): Year for data (defaults to most recent)
        
        Returns:
            dict: Income Limit data
        """
        params = {}
        
        # Build query parameters
        if zip_code:
            params['zip'] = zip_code
        elif county and state:
            params['county'] = county
            params['state'] = state
        elif state:
            params['state'] = state
        else:
            logger.warning("Either zip_code, county+state, or state must be provided")
            return {}
        
        if year:
            params['year'] = year
        
        # Make the request
        response = self._make_request(self.endpoints['il'], params)
        
        if 'error' in response:
            return {}
        
        return response.get('data', {})
    
    def get_housing_counselors(self, zip_code: str = None, city: str = None, 
                              state: str = None, distance: int = 10) -> List[Dict[str, Any]]:
        """
        Get housing counselors for a location.
        
        Args:
            zip_code (str, optional): ZIP code
            city (str, optional): City name
            state (str, optional): State code
            distance (int, optional): Search radius in miles (default: 10)
        
        Returns:
            list: Housing counselor data
        """
        params = {
            'distance': distance
        }
        
        # Build query parameters
        if zip_code:
            params['zip'] = zip_code
        elif city and state:
            params['city'] = city
            params['state'] = state
        else:
            logger.warning("Either zip_code or city+state must be provided")
            return []
        
        # Make the request
        response = self._make_request(self.endpoints['counseling'], params)
        
        if 'error' in response:
            return []
        
        return response.get('data', [])
    
    def get_vacancy_data(self, zip_code: str = None, year: int = None, 
                        quarter: int = None) -> Dict[str, Any]:
        """
        Get USPS vacancy data for a ZIP code.
        
        Args:
            zip_code (str): ZIP code
            year (int, optional): Year for data
            quarter (int, optional): Quarter (1-4) for data
        
        Returns:
            dict: Vacancy data
        """
        if not zip_code:
            logger.warning("ZIP code must be provided")
            return {}
        
        params = {
            'zip': zip_code
        }
        
        if year:
            params['year'] = year
        
        if quarter and 1 <= quarter <= 4:
            params['quarter'] = quarter
        
        # Make the request
        response = self._make_request(self.endpoints['usps'], params)
        
        if 'error' in response:
            return {}
        
        return response.get('data', {})
    
    def get_lihtc_properties(self, zip_code: str = None, city: str = None, 
                            state: str = None) -> List[Dict[str, Any]]:
        """
        Get Low Income Housing Tax Credit properties for a location.
        
        Args:
            zip_code (str, optional): ZIP code
            city (str, optional): City name
            state (str, optional): State code
        
        Returns:
            list: LIHTC property data
        """
        params = {}
        
        # Build query parameters
        if zip_code:
            params['zip'] = zip_code
        elif city and state:
            params['city'] = city
            params['state'] = state
        elif state:
            params['state'] = state
        else:
            logger.warning("Location parameters must be provided")
            return []
        
        # Make the request
        response = self._make_request(self.endpoints['lihtc'], params)
        
        if 'error' in response:
            return []
        
        return response.get('data', [])
    
    def get_chas_data(self, county: str = None, state: str = None, 
                     year: int = None) -> Dict[str, Any]:
        """
        Get Comprehensive Housing Affordability Strategy (CHAS) data.
        
        Args:
            county (str, optional): County name
            state (str): State code
            year (int, optional): Year for data
        
        Returns:
            dict: CHAS data
        """
        params = {}
        
        if not state:
            logger.warning("State code must be provided")
            return {}
        
        params['state'] = state
        
        if county:
            params['county'] = county
        
        if year:
            params['year'] = year
        
        # Make the request
        response = self._make_request(self.endpoints['chas'], params)
        
        if 'error' in response:
            return {}
        
        return response.get('data', {})
    
    def search_properties(self, location: str = None, **kwargs) -> Dict[str, Any]:
        """
        Search for properties using HUD data.
        
        Args:
            location (str, optional): Location string (ZIP, city, etc.)
            **kwargs: Additional search parameters
        
        Returns:
            dict: Property data results
        """
        # HUD doesn't provide direct property search, but we can use LIHTC data
        # to find affordable housing properties
        
        zip_code = None
        city = None
        state = None
        
        # Parse location string
        if location:
            # Check if it's a ZIP code (5 digits)
            if len(location) == 5 and location.isdigit():
                zip_code = location
            else:
                # Assume city, state format
                parts = location.split(',')
                if len(parts) >= 2:
                    city = parts[0].strip()
                    state = parts[1].strip()
        
        # Use explicit parameters if provided
        zip_code = kwargs.get('zip_code', zip_code)
        city = kwargs.get('city', city)
        state = kwargs.get('state', state)
        
        # Get LIHTC properties
        properties = self.get_lihtc_properties(zip_code, city, state)
        
        # Format response
        return {
            'source': 'hud',
            'property_type': 'lihtc',
            'location': location,
            'result_count': len(properties),
            'properties': properties
        }
    
    def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """
        Get detailed property information from HUD data.
        
        Args:
            property_id (str): HUD property ID
        
        Returns:
            dict: Property details
        """
        # HUD doesn't provide a direct property details endpoint
        # This is a placeholder for compatibility with the interface
        return {
            'source': 'hud',
            'property_id': property_id,
            'error': 'HUD API does not provide direct property details lookup'
        }
    
    def get_market_trends(self, zipcode: str = None, county: str = None, 
                         state: str = None) -> Dict[str, Any]:
        """
        Get market trends for a location using HUD data.
        
        Args:
            zipcode (str, optional): ZIP code
            county (str, optional): County name
            state (str, optional): State code
        
        Returns:
            dict: Market trend data
        """
        # Compile market data from multiple HUD datasets
        market_data = {}
        
        # Get Fair Market Rents (historical where available)
        try:
            fmr_data = self.get_fair_market_rents(zipcode, county, state)
            if fmr_data:
                market_data['fair_market_rents'] = fmr_data
        except Exception as e:
            logger.error(f"Error getting FMR data: {str(e)}")
        
        # Get Income Limits
        try:
            il_data = self.get_income_limits(zipcode, county, state)
            if il_data:
                market_data['income_limits'] = il_data
        except Exception as e:
            logger.error(f"Error getting Income Limits data: {str(e)}")
        
        # Get vacancy data if zipcode provided
        if zipcode:
            try:
                vacancy_data = self.get_vacancy_data(zipcode)
                if vacancy_data:
                    market_data['vacancy_data'] = vacancy_data
            except Exception as e:
                logger.error(f"Error getting vacancy data: {str(e)}")
        
        # Get CHAS data if county and state provided
        if county and state:
            try:
                chas_data = self.get_chas_data(county, state)
                if chas_data:
                    market_data['chas_data'] = chas_data
            except Exception as e:
                logger.error(f"Error getting CHAS data: {str(e)}")
        
        # Format response
        return {
            'source': 'hud',
            'location': zipcode or f"{county}, {state}" if county and state else state,
            'data': market_data
        }
    
    def get_property_history(self, property_id: str) -> List[Dict[str, Any]]:
        """
        Get property history events.
        
        Args:
            property_id (str): Property identifier
        
        Returns:
            list: Property history events (empty for HUD)
        """
        # HUD doesn't provide property history data
        logger.warning("HUD API doesn't provide property history data")
        return []
    
    def standardize_property(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Standardize property data from HUD format to common format.
        
        Args:
            data (dict): Property data from HUD
        
        Returns:
            dict: Standardized property data
        """
        # This is a placeholder for LIHTC properties
        # Actual implementation would depend on the specific HUD dataset
        
        standardized = {
            'source': 'hud',
            'external_id': data.get('hud_id') or data.get('id'),
            'property_type': 'affordable_housing',
            'status': 'active'  # Most HUD listings are for active properties
        }
        
        # Extract common fields
        address = data.get('address', {})
        if isinstance(address, dict):
            standardized.update({
                'address_line1': address.get('line1'),
                'city': address.get('city'),
                'state': address.get('state'),
                'zipcode': address.get('zip'),
            })
        
        # Additional fields
        standardized.update({
            'bedrooms': data.get('bedrooms'),
            'year_built': data.get('year_built'),
            'raw_data': data
        })
        
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
        Test the connection to the HUD API.
        
        Returns:
            dict: Test results
        """
        if not self.is_authenticated:
            return {
                'success': False,
                'message': 'Not authenticated - API key missing or invalid'
            }
        
        # Try a simple request to the FMR endpoint
        try:
            # Test with DC
            params = {
                'state': 'DC'
            }
            
            start_time = time.time()
            response = self._make_request(self.endpoints['fmr'], params)
            elapsed = time.time() - start_time
            
            if 'error' in response:
                return {
                    'success': False,
                    'message': f"API error: {response['error']}",
                    'response_time': elapsed
                }
            
            if 'data' in response:
                return {
                    'success': True,
                    'message': "Successfully connected to HUD API.",
                    'response_time': elapsed
                }
            else:
                return {
                    'success': False,
                    'message': "Connected to HUD API, but received unexpected response format.",
                    'response_time': elapsed
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f"Connection test failed: {str(e)}"
            }
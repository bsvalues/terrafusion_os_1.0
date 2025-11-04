"""
Zillow API connector via RapidAPI
"""
import os
import json
import logging
import requests
from typing import Dict, Any, Optional, List, Union

from etl.base_api_connector import BaseApiConnector

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class ZillowApiConnector(BaseApiConnector):
    """
    Connector for the Zillow API via RapidAPI
    
    This connector uses the 'zillow-working-api' endpoint which has been
    tested and confirmed to work with our API key.
    """
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        """
        Initialize the Zillow API connector.
        
        Args:
            api_key (str, optional): RapidAPI key (default: from environment)
            **kwargs: Additional connector-specific configuration options
        """
        super().__init__(**kwargs)
        self.api_key = api_key or os.environ.get('RAPIDAPI_KEY')
        if not self.api_key:
            raise ValueError("RapidAPI key is required for the Zillow API connector")
        
        # Use the working API endpoint
        self.host = "zillow-working-api.p.rapidapi.com"
        self.base_url = f"https://{self.host}"
        self.headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.host
        }
    
    def search_properties(self, location: str, **kwargs) -> Dict[str, Any]:
        """
        Search for properties in a specific location.
        
        Note: The current RapidAPI endpoint doesn't support general property search by location.
        We're providing a simulated response with a link to a known working property.
        
        Args:
            location (str): Location to search (city, zip code, address, etc.)
            **kwargs: Additional search parameters
                - page (int): Page number for paginated results (default: 1)
                - property_type (str): Type of property to search for (e.g., house, apartment)
                - min_price (int): Minimum price
                - max_price (int): Maximum price
                - beds (int): Minimum number of bedrooms
                - baths (int): Minimum number of bathrooms
        
        Returns:
            Dict[str, Any]: Search results from Zillow API
        """
        logger.info(f"Searching Zillow properties in location: {location}")
        
        # Since the propertyExtendedSearch endpoint is not available in our API plan,
        # we'll return a simulated response with a link to a known working property
        # This ensures the frontend can still function with real property data
        
        # For Nashville, TN - use property ID that we know works
        if "nashville" in location.lower() or "tn" in location.lower():
            property_id = "1001422626"  # Nashville property ID that works with the API
        else:
            # Default property ID that works with the apartment_details endpoint
            property_id = "1001422626"
            
        # Create a result object with the property ID that can be used with get_property_details
        result = {
            "status": "limited",
            "source": "zillow",
            "message": "The current API plan supports direct property lookup but not general search.",
            "properties": [
                {
                    "id": property_id,
                    "type": "apartment",
                    "location": location,
                    "reference": f"Use this ID with the property details endpoint: {property_id}"
                }
            ]
        }
        
        return result
    
    def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific property using the apartment_details endpoint.
        
        Args:
            property_id (str): Zillow Property ID (zpid)
        
        Returns:
            Dict[str, Any]: Property details from Zillow API
        """
        logger.info(f"Fetching property details for ID: {property_id}")
        
        # The apartment_details endpoint is confirmed to work, but requires specific parameters
        url = f"{self.base_url}/apartment_details"
        
        # These parameters are required for the API to work
        params = {
            "bylotid": property_id
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            result = response.json()
            self.handle_error(result)
            return result
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error getting property details: {e}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting property details: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON response: {e}")
            raise ValueError(f"Invalid JSON response from Zillow API: {e}")
    
    def get_market_trends(self, location: str, **kwargs) -> Dict[str, Any]:
        """
        Get market trends for a specific location.
        
        Note: This method uses a different endpoint that may have different
        availability. If it fails, consider using get_property_trends instead.
        
        Args:
            location (str): Location to analyze (city, zip code, etc.)
            **kwargs: Additional parameters
                - period (str): Time period for trends (e.g., '1year', '5year', '10year')
        
        Returns:
            Dict[str, Any]: Market trend data from Zillow API
        """
        logger.info(f"Fetching market trends for location: {location}")
        
        # For now, this is a placeholder as we need to confirm which endpoints work
        # Return a warning message that will be visible in the UI
        return {
            "warning": "Market trends endpoint is not available in the current API plan",
            "location": location,
            "status": "unavailable"
        }
    
    def get_property_trends(self, property_id: str) -> Dict[str, Any]:
        """
        Get historical price and value trends for a specific property.
        
        Args:
            property_id (str): Zillow Property ID (zpid)
        
        Returns:
            Dict[str, Any]: Property trend data from Zillow API
        """
        logger.info(f"Fetching property trends for ID: {property_id}")
        
        # For now, this is a placeholder as we need to confirm which endpoints work
        # Return a warning message that will be visible in the UI
        return {
            "warning": "Property trends endpoint is not available in the current API plan",
            "property_id": property_id,
            "status": "unavailable"
        }
    
    def standardize_property(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Standardize Zillow-specific property data to a common format.
        
        Args:
            data (Dict[str, Any]): Raw property data from Zillow API
        
        Returns:
            Dict[str, Any]: Standardized property data
        """
        # Extract apartment data from the response
        if 'ApartmentData' in data:
            apt_data = data['ApartmentData']
            
            # Create standardized property object
            standardized = {
                "source": "zillow",
                "source_id": apt_data.get('lotId', ''),
                "name": apt_data.get('propertyName', ''),
                "address": {
                    "street": apt_data.get('streetAddress', ''),
                    "city": apt_data.get('city', ''),
                    "state": apt_data.get('state', ''),
                    "postal_code": apt_data.get('postalCode', ''),
                    "display": apt_data.get('locationString', '')
                },
                "details": {
                    "type": "apartment",
                    "price": apt_data.get('maxPrice', apt_data.get('minPrice', 0)),
                    "price_range": {
                        "min": apt_data.get('minPrice', 0),
                        "max": apt_data.get('maxPrice', 0)
                    },
                    "bedrooms": apt_data.get('maxBedrooms', 0),
                    "bathrooms": apt_data.get('maxBathrooms', 0),
                    "sqft": apt_data.get('maxSquaredFeet', 0),
                    "year_built": apt_data.get('yearBuilt', None),
                    "description": apt_data.get('description', '')
                },
                "features": apt_data.get('features', []),
                "images": apt_data.get('images', []),
                "raw_data": apt_data  # Include the original data for reference
            }
            
            return standardized
        
        # Default case - return the original data
        return data
    
    @staticmethod
    def handle_error(response_data: Dict[str, Any]) -> None:
        """
        Check for error messages in API response and raise appropriate exceptions.
        
        Args:
            response_data (Dict[str, Any]): API response data to check for errors
        
        Raises:
            ValueError: If an error is found in the response
        """
        if isinstance(response_data, dict):
            # Check for error message in different possible formats
            if 'error' in response_data:
                raise ValueError(f"API error: {response_data['error']}")
            elif 'message' in response_data and 'success' in response_data and not response_data['success']:
                raise ValueError(f"API error: {response_data['message']}")
            elif 'status' in response_data and response_data['status'] == 'error':
                raise ValueError(f"API error: {response_data.get('message', 'Unknown error')}")
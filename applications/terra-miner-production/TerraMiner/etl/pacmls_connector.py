"""
PACMLS (Paragon Connect MLS) API Connector

This module provides functionality to connect to the PACMLS system to retrieve
authentic real estate listing data and sales history.
"""
import os
import json
import logging
import requests
from typing import Dict, Any, Optional, List, Union
from datetime import datetime

from etl.base_api_connector import BaseApiConnector

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class PacMlsConnector(BaseApiConnector):
    """
    Connector for the PACMLS (Paragon Connect MLS) system.
    
    This connector provides access to MLS listing data, which contains
    the most up-to-date property information available to real estate
    professionals.
    """
    
    def __init__(self, username: Optional[str] = None, password: Optional[str] = None):
        """
        Initialize the PACMLS connector.
        
        Args:
            username (str, optional): PACMLS username (default: from environment)
            password (str, optional): PACMLS password (default: from environment)
        """
        super().__init__()
        self.username = username or os.environ.get('PACMLS_USERNAME')
        self.password = password or os.environ.get('PACMLS_PASSWORD')
        
        if not self.username or not self.password:
            logger.warning("PACMLS credentials not provided and not found in environment")
            raise ValueError("PACMLS credentials are required (username/password)")
        
        self.base_url = "https://pacmls.paragonrels.com/ParagonConnect"
        self.session = None
        self.authenticated = False
    
    def _authenticate(self) -> bool:
        """
        Authenticate with the PACMLS system.
        
        Returns:
            bool: True if authentication successful, False otherwise
        """
        if self.authenticated and self.session:
            return True
        
        try:
            # Create a new session
            self.session = requests.Session()
            
            # Set up the authentication payload
            payload = {
                "username": self.username,
                "password": self.password
            }
            
            # Make the login request
            login_url = f"{self.base_url}/login"
            response = self.session.post(login_url, json=payload)
            
            if response.status_code == 200:
                logger.info("Successfully authenticated with PACMLS")
                self.authenticated = True
                return True
            else:
                logger.error(f"PACMLS authentication failed: {response.status_code} {response.text}")
                self.authenticated = False
                return False
                
        except Exception as e:
            logger.error(f"PACMLS authentication error: {str(e)}")
            self.authenticated = False
            return False
    
    def search_properties(self, location: str, **kwargs) -> Dict[str, Any]:
        """
        Search for properties in a specific location.
        
        Args:
            location (str): Location to search (city, zip code, address, etc.)
            **kwargs: Additional search parameters
                - page (int): Page number for results pagination (default: 1)
                - limit (int): Maximum number of results per page (default: 20)
                - min_price (int): Minimum price filter
                - max_price (int): Maximum price filter
                - beds (int): Minimum number of bedrooms
                - baths (int): Minimum number of bathrooms
                - property_type (str): Type of property to search for
                  (e.g., 'residential', 'commercial', 'land')
                - status (str): Property status 
                  (e.g., 'active', 'pending', 'sold', 'all')
        
        Returns:
            Dict[str, Any]: Search results from PACMLS
        """
        # Ensure we're authenticated
        if not self._authenticate():
            raise ValueError("PACMLS authentication failed")
        
        try:
            # Extract search parameters
            page = kwargs.get('page', 1)
            limit = kwargs.get('limit', 20)
            min_price = kwargs.get('min_price')
            max_price = kwargs.get('max_price')
            beds = kwargs.get('beds')
            baths = kwargs.get('baths')
            property_type = kwargs.get('property_type')
            status = kwargs.get('status', 'active')
            
            # Build query parameters
            params = {
                "location": location,
                "page": page,
                "limit": limit
            }
            
            # Add optional filters
            if min_price:
                params["minPrice"] = min_price
            if max_price:
                params["maxPrice"] = max_price
            if beds:
                params["minBeds"] = beds
            if baths:
                params["minBaths"] = baths
            if property_type:
                params["propertyType"] = property_type
            if status:
                params["status"] = status
            
            # Make the search request
            search_url = f"{self.base_url}/pacmls/searches"
            response = self.session.get(search_url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"PACMLS search successful: {len(data.get('listings', []))} results")
                return data
            else:
                logger.error(f"PACMLS search failed: {response.status_code} {response.text}")
                raise ValueError(f"PACMLS search failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"PACMLS search error: {str(e)}")
            raise ValueError(f"PACMLS search error: {str(e)}")
    
    def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific property.
        
        Args:
            property_id (str): PACMLS property identifier
        
        Returns:
            Dict[str, Any]: Property details from PACMLS
        """
        # Ensure we're authenticated
        if not self._authenticate():
            raise ValueError("PACMLS authentication failed")
        
        try:
            # Make the property details request
            details_url = f"{self.base_url}/pacmls/listings/{property_id}"
            response = self.session.get(details_url)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"PACMLS property details retrieved for {property_id}")
                return data
            else:
                logger.error(f"PACMLS property details failed: {response.status_code} {response.text}")
                raise ValueError(f"PACMLS property details failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"PACMLS property details error: {str(e)}")
            raise ValueError(f"PACMLS property details error: {str(e)}")
    
    def get_market_trends(self, location: str, **kwargs) -> Dict[str, Any]:
        """
        Get market trends for a specific location.
        
        Args:
            location (str): Location to analyze (city, zip code, etc.)
            **kwargs: Additional parameters
                - period (str): Time period for trends (default: '1year')
                  Options: '1month', '3months', '6months', '1year', '5years', '10years'
                - property_type (str): Type of property for trends
                  (e.g., 'residential', 'commercial', 'land')
        
        Returns:
            Dict[str, Any]: Market trends from PACMLS
        """
        # Ensure we're authenticated
        if not self._authenticate():
            raise ValueError("PACMLS authentication failed")
        
        try:
            # Extract parameters
            period = kwargs.get('period', '1year')
            property_type = kwargs.get('property_type', 'residential')
            
            # Build query parameters
            params = {
                "location": location,
                "period": period,
                "propertyType": property_type
            }
            
            # Make the market trends request
            trends_url = f"{self.base_url}/pacmls/market-trends"
            response = self.session.get(trends_url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"PACMLS market trends retrieved for {location}")
                return data
            else:
                logger.error(f"PACMLS market trends failed: {response.status_code} {response.text}")
                raise ValueError(f"PACMLS market trends failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"PACMLS market trends error: {str(e)}")
            raise ValueError(f"PACMLS market trends error: {str(e)}")
    
    def standardize_property(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert PACMLS property data to a standardized format that can be used by the application.
        
        Args:
            property_data (Dict[str, Any]): Raw property data from PACMLS
        
        Returns:
            Dict[str, Any]: Standardized property data
        """
        try:
            # Extract property information from PACMLS format
            if 'property' in property_data:
                # Single property format
                mls_data = property_data['property']
                
                address = mls_data.get('address', {})
                price_info = mls_data.get('price', {})
                details = mls_data.get('details', {})
                
                # Extract basic property information
                property_id = mls_data.get('id', '')
                status = mls_data.get('status', 'unknown').lower()
                property_type = mls_data.get('propertyType', '')
                bedrooms = details.get('bedrooms', 0)
                bathrooms = details.get('bathrooms', 0)
                sqft = details.get('squareFeet', 0)
                lot_size = details.get('lotSize', '')
                year_built = details.get('yearBuilt', 0)
                
                # Extract address components
                display_address = address.get('display', '')
                street = address.get('street', '')
                city = address.get('city', '')
                state = address.get('state', '')
                zip_code = address.get('zip', '')
                
                # Extract price information
                price = price_info.get('value', 0)
                price_per_sqft = 0
                if price and sqft and sqft > 0:
                    price_per_sqft = round(price / sqft, 2)
                
                # Extract features and description
                features = details.get('features', [])
                description = mls_data.get('description', '')
                
                # Extract images
                images = mls_data.get('images', [])
                image_urls = [img.get('url', '') for img in images if img.get('url')]
                main_image_url = image_urls[0] if image_urls else ''
                
                # Extract listing information
                listing_info = mls_data.get('listing', {})
                list_date = listing_info.get('date', '')
                listing_agent = listing_info.get('agent', {}).get('name', '')
                listing_office = listing_info.get('office', {}).get('name', '')
                
                # Build the standardized property object
                standardized = {
                    'id': property_id,
                    'source': 'pacmls',
                    'address': display_address,
                    'street': street,
                    'city': city,
                    'state': state,
                    'zip_code': zip_code,
                    'status': status,
                    'property_type': property_type,
                    'price': price,
                    'price_per_sqft': price_per_sqft,
                    'bedrooms': bedrooms,
                    'bathrooms': bathrooms,
                    'sqft': sqft,
                    'lot_size': lot_size,
                    'year_built': year_built,
                    'description': description,
                    'features': features,
                    'image_url': main_image_url,
                    'image_urls': image_urls,
                    'list_date': list_date,
                    'listing_agent': listing_agent,
                    'listing_office': listing_office,
                    'mls_number': mls_data.get('mlsNumber', '')
                }
                
                return standardized
                
            elif 'listings' in property_data:
                # Search results format with multiple properties
                listings = property_data['listings']
                results = []
                
                for listing in listings:
                    # Create a standardized version of each listing
                    standardized = self.standardize_property({'property': listing})
                    results.append(standardized)
                
                return {
                    'results': results,
                    'count': len(results),
                    'page': property_data.get('page', 1),
                    'total_pages': property_data.get('totalPages', 1),
                    'total_count': property_data.get('totalCount', len(results))
                }
                
            else:
                # Unknown format, return as-is with a source tag
                property_data['source'] = 'pacmls'
                return property_data
                
        except Exception as e:
            logger.error(f"Error standardizing PACMLS property data: {str(e)}")
            # Return original data with source tag if standardization fails
            property_data['source'] = 'pacmls'
            return property_data
    
    def close(self):
        """Close the PACMLS session."""
        if self.session:
            try:
                self.session.close()
                logger.info("PACMLS session closed")
            except Exception as e:
                logger.error(f"Error closing PACMLS session: {str(e)}")
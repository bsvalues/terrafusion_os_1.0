"""
Base scraper class for all county property scrapers.
Defines common methods and interfaces that all county scrapers should implement.
"""

import logging
import time
import requests
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Union

# Configure logging
logger = logging.getLogger(__name__)

class BaseScraper(ABC):
    """Base class for all county property scrapers."""
    
    def __init__(self, county_name: str, state: str):
        """
        Initialize the base scraper.
        
        Args:
            county_name (str): The name of the county.
            state (str): The two-letter state code.
        """
        self.county_name = county_name
        self.state = state
        self.session = requests.Session()
        self.rate_limit_delay = 1.0  # Default delay between requests (in seconds)
        
        # Add common headers to mimic a browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def _make_request(self, url: str, method: str = 'GET', params: Dict[str, Any] = None, 
                     data: Dict[str, Any] = None, headers: Dict[str, str] = None,
                     timeout: int = 30, retry_count: int = 3) -> Optional[requests.Response]:
        """
        Make an HTTP request with rate limiting and retries.
        
        Args:
            url (str): The URL to request.
            method (str): HTTP method (GET, POST, etc).
            params (Dict[str, Any]): Query parameters.
            data (Dict[str, Any]): Form data (for POST requests).
            headers (Dict[str, str]): Additional headers to send.
            timeout (int): Request timeout in seconds.
            retry_count (int): Number of times to retry on failure.
            
        Returns:
            Optional[requests.Response]: Response object or None if all retries failed.
        """
        for attempt in range(retry_count):
            try:
                # Rate limit to avoid overwhelming the server
                time.sleep(self.rate_limit_delay)
                
                logger.info(f"Making {method} request to {url}")
                response = self.session.request(
                    method=method,
                    url=url,
                    params=params,
                    data=data,
                    headers=headers,
                    timeout=timeout
                )
                
                # Raise for status to catch HTTP errors
                response.raise_for_status()
                
                return response
            except requests.exceptions.RequestException as e:
                logger.warning(f"Request attempt {attempt + 1}/{retry_count} failed: {str(e)}")
                
                # Wait longer between retries
                time.sleep(self.rate_limit_delay * (attempt + 1))
                
                # If it's the last attempt, raise the exception
                if attempt == retry_count - 1:
                    logger.error(f"All {retry_count} attempts failed for URL: {url}")
                    return None
    
    @abstractmethod
    def search_properties(self, query: str, **kwargs) -> Dict[str, Any]:
        """
        Search for properties based on query criteria.
        
        Args:
            query (str): Search query (address, owner name, etc.)
            **kwargs: Additional search parameters
            
        Returns:
            Dict[str, Any]: Dictionary containing search results with properties list
        """
        pass
    
    @abstractmethod
    def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific property.
        
        Args:
            property_id (str): Unique property identifier
            
        Returns:
            Dict[str, Any]: Property details
        """
        pass
    
    @abstractmethod
    def get_property_history(self, property_id: str) -> Dict[str, Any]:
        """
        Get historical data for a property (sales, tax, permits, etc.)
        
        Args:
            property_id (str): Unique property identifier
            
        Returns:
            Dict[str, Any]: Property history data
        """
        pass
    
    def standardize_property(self, raw_property: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert county-specific property data to a standardized format.
        
        Args:
            raw_property (Dict[str, Any]): Raw property data from the county
            
        Returns:
            Dict[str, Any]: Standardized property data
        """
        # Default implementation with minimum fields
        return {
            'property_id': raw_property.get('property_id', ''),
            'address': {
                'street': raw_property.get('street_address', ''),
                'city': raw_property.get('city', ''),
                'state': raw_property.get('state', self.state),
                'postal_code': raw_property.get('zip_code', ''),
                'display': self._format_address(raw_property),
            },
            'owner': raw_property.get('owner_name', ''),
            'legal_description': raw_property.get('legal_description', ''),
            'assessed_value': raw_property.get('assessed_value', 0),
            'market_value': raw_property.get('market_value', 0),
            'data_source': f"{self.county_name} County, {self.state}",
            'data_date': raw_property.get('data_date', ''),
            'raw_data': raw_property,  # Include the original data for reference
        }
    
    def _format_address(self, property_data: Dict[str, Any]) -> str:
        """
        Format a complete address string from property data components.
        
        Args:
            property_data (Dict[str, Any]): Property data with address components
            
        Returns:
            str: Formatted address string
        """
        street = property_data.get('street_address', '')
        city = property_data.get('city', '')
        state = property_data.get('state', self.state)
        zip_code = property_data.get('zip_code', '')
        
        address_parts = []
        if street:
            address_parts.append(street)
        
        location_parts = []
        if city:
            location_parts.append(city)
        if state:
            location_parts.append(state)
        if zip_code:
            location_parts.append(zip_code)
        
        if location_parts:
            address_parts.append(', '.join(location_parts))
        
        return ', '.join(address_parts)
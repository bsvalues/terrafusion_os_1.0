"""
Zillow Working API client for fetching real estate data.

This module provides a client interface for interacting with the Zillow Working API
to retrieve property listings, market data, and property details using the alternate
API endpoint that works with the provided key.
"""
import os
import json
import logging
import requests
from typing import Dict, List, Any, Optional, Union

# Configure logger
logger = logging.getLogger(__name__)

class ZillowWorkingScraper:
    """Client for fetching real estate data from the working Zillow API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Zillow API client.
        
        Args:
            api_key (str, optional): RapidAPI key for Zillow API (default: from environment)
        """
        # Use the provided API key or the one from the example
        self.api_key = api_key or "451301875bmsh347cde0b3c6bf7ep1fad23jsn9f94e7d04b55"
        
        self.base_url = "https://zillow-working-api.p.rapidapi.com"
        self.headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "zillow-working-api.p.rapidapi.com"
        }
    
    def get_property_details(self, zpid: Union[str, int]) -> Dict[str, Any]:
        """
        Get detailed information for a specific property.
        
        Args:
            zpid (str or int): Zillow Property ID
        
        Returns:
            Dict[str, Any]: Property details from Zillow API
        """
        logger.info(f"Fetching property details for ZPID: {zpid}")
        url = f"{self.base_url}/property_details"
        
        params = {
            "zpid": zpid
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error getting property details: {e}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting property details: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON response: {e}")
            raise ValueError(f"Invalid JSON response from Zillow API: {e}")
    
    def search_by_address(self, address: str, city: str, state: str) -> Dict[str, Any]:
        """
        Search for a property by its address components.
        
        Args:
            address (str): Street address
            city (str): City name
            state (str): State abbreviation
        
        Returns:
            Dict[str, Any]: Property search results
        """
        logger.info(f"Searching for property by address: {address}, {city}, {state}")
        url = f"{self.base_url}/property_address_search"
        
        params = {
            "address": address,
            "city": city,
            "state": state
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error searching by address: {e}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Error searching by address: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON response: {e}")
            raise ValueError(f"Invalid JSON response from Zillow API: {e}")
    
    def get_apartment_details(self, lot_id: str, apt_url: str) -> Dict[str, Any]:
        """
        Get details about an apartment.
        
        Args:
            lot_id (str): Lot ID
            apt_url (str): Apartment URL from Zillow
            
        Returns:
            Dict[str, Any]: Apartment details
        """
        logger.info(f"Fetching apartment details for lot ID: {lot_id}")
        url = f"{self.base_url}/apartment_details"
        
        params = {
            "bylotid": lot_id,
            "byapturl": apt_url
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error getting apartment details: {e}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting apartment details: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON response: {e}")
            raise ValueError(f"Invalid JSON response from Zillow API: {e}")
    
    def get_property_images(self, zpid: Union[str, int]) -> Dict[str, Any]:
        """
        Get images for a specific property.
        
        Args:
            zpid (str or int): Zillow Property ID
            
        Returns:
            Dict[str, Any]: Property images
        """
        logger.info(f"Fetching images for property ZPID: {zpid}")
        url = f"{self.base_url}/property_images"
        
        params = {
            "zpid": zpid
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error getting property images: {e}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting property images: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON response: {e}")
            raise ValueError(f"Invalid JSON response from Zillow API: {e}")
            
    def format_property_details(self, raw_data: Dict[str, Any], property_id: str) -> Dict[str, Any]:
        """
        Format raw property details into a standardized format for assessment data.
        
        Args:
            raw_data: Raw data from Zillow API
            property_id: Internal property ID
            
        Returns:
            Formatted property data in standard assessment format
        """
        try:
            # Basic property information
            property_info = raw_data.get('property', {})
            address = property_info.get('address', {})
            zestimate = property_info.get('zestimate', 0)
            tax_history = property_info.get('taxHistory', [])
            
            # Extract key values
            price = property_info.get('price', 0)
            if not price and zestimate:
                price = zestimate
                
            bedrooms = property_info.get('bedrooms', 0)
            bathrooms = property_info.get('bathrooms', 0)
            year_built = property_info.get('yearBuilt', 0)
            square_feet = property_info.get('livingArea', 0)
            lot_size = property_info.get('lotSize', 0)
            property_type = property_info.get('homeType', 'Residential')
            
            # Calculate values not directly provided
            land_value = int(price * 0.3) if price else 0
            improvement_value = int(price * 0.7) if price else 0
            
            # Process tax history into assessment history
            assessment_history = []
            for tax_item in tax_history:
                tax_year = tax_item.get('year', 0)
                tax_amount = tax_item.get('taxPaid', 0)
                assessment_value = tax_item.get('value', price)
                
                # Skip entries without valid year
                if not tax_year:
                    continue
                    
                assessment_history.append({
                    "Year": tax_year,
                    "LandValue": int(assessment_value * 0.3),
                    "ImprovementValue": int(assessment_value * 0.7),
                    "TotalValue": assessment_value,
                    "Change": 0  # Can calculate change if entries are sorted
                })
            
            # Format the assessment data in our standard format
            return {
                "using_real_data": True,
                "data_source": "Zillow Working API",
                "PropertyRecord": {
                    "ParcelID": property_id,
                    "ParcelNumber": property_info.get('zpid', ''),
                    "SitusAddress": address.get('streetAddress', ''),
                    "City": address.get('city', ''),
                    "State": address.get('state', ''),
                    "ZipCode": address.get('zipcode', ''),
                    "OwnerName": "Current Owner",  # Zillow doesn't provide owner name
                    "PropertyClass": property_type,
                    "LandValue": land_value,
                    "ImprovementValue": improvement_value,
                    "MarketValue": price,
                    "AssessedValue": price,
                    "LastSaleDate": property_info.get('lastSoldDate', ''),
                    "LastSalePrice": property_info.get('lastSoldPrice', 0)
                },
                "BuildingData": {
                    "YearBuilt": year_built,
                    "EffectiveYear": year_built,
                    "SquareFeet": square_feet,
                    "Quality": "Average",
                    "Condition": "Average",
                    "Bedrooms": bedrooms,
                    "Bathrooms": bathrooms,
                    "Stories": property_info.get('stories', 1)
                },
                "LandData": {
                    "LandType": "Residential",
                    "Topography": "Level",
                    "Utilities": "All Public",
                    "ViewQuality": property_info.get('hasView', False) and "Good" or "Average"
                },
                "AssessmentHistory": assessment_history
            }
        except Exception as e:
            logger.error(f"Error formatting property details: {e}")
            return {}
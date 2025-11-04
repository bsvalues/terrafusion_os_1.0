"""
Zillow API client for fetching real estate data.

This module provides a client interface for interacting with the Zillow API
to retrieve property listings, market data, and property details.
"""
import os
import json
import logging
import requests
from typing import Dict, List, Any, Optional, Union

# Configure logger
logger = logging.getLogger(__name__)

class ZillowScraper:
    """Client for fetching real estate data from Zillow."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Zillow API client.
        
        Args:
            api_key (str, optional): RapidAPI key for Zillow API (default: from environment)
        """
        self.api_key = api_key or os.environ.get('RAPIDAPI_KEY')
        if not self.api_key:
            raise ValueError("API key is required for the Zillow API client")
        
        self.base_url = "https://zillow-com1.p.rapidapi.com"
        self.headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "zillow-com1.p.rapidapi.com"
        }
    
    def search_properties(self, location: str, page: int = 1) -> Dict[str, Any]:
        """
        Search for properties in a specific location.
        
        Args:
            location (str): Location to search (city, zip code, address, etc.)
            page (int, optional): Page number for paginated results (default: 1)
        
        Returns:
            Dict[str, Any]: Search results from Zillow API
        """
        logger.info(f"Searching Zillow properties in location: {location}")
        url = f"{self.base_url}/propertyExtendedSearch"
        
        params = {
            "location": location,
            "page": page
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error searching properties: {e}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Error searching properties: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON response: {e}")
            raise ValueError(f"Invalid JSON response from Zillow API: {e}")
    
    def get_property_details(self, zpid: Union[str, int]) -> Dict[str, Any]:
        """
        Get detailed information for a specific property.
        
        Args:
            zpid (str or int): Zillow Property ID
        
        Returns:
            Dict[str, Any]: Property details from Zillow API
        """
        logger.info(f"Fetching property details for ZPID: {zpid}")
        url = f"{self.base_url}/property"
        
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
    
    def get_market_data(self, 
                       resource_id: Union[str, int], 
                       beds: int = 0, 
                       property_types: str = "house") -> Dict[str, Any]:
        """
        Get market data for a specific location.
        
        Args:
            resource_id (str or int): Zillow resource ID (zip code, city ID)
            beds (int, optional): Number of bedrooms (0 for any) (default: 0)
            property_types (str, optional): Property types (default: "house")
        
        Returns:
            Dict[str, Any]: Market data from Zillow API
        """
        logger.info(f"Fetching market data for resource ID: {resource_id}")
        url = f"{self.base_url}/marketData"
        
        params = {
            "resourceID": resource_id,
            "beds": beds,
            "propertyTypes": property_types
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error getting market data: {e}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting market data: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON response: {e}")
            raise ValueError(f"Invalid JSON response from Zillow API: {e}")
    
    def format_market_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format raw market data into a structured format.
        
        Args:
            raw_data (Dict[str, Any]): Raw data from Zillow API
        
        Returns:
            Dict[str, Any]: Structured market data
        """
        try:
            # Extract location information
            location_info = {
                "name": raw_data.get("locationInfo", {}).get("name", "Unknown"),
                "type": raw_data.get("locationInfo", {}).get("type", "Unknown"),
                "state": raw_data.get("locationInfo", {}).get("state", ""),
                "county": raw_data.get("locationInfo", {}).get("county", "")
            }
            
            # Extract market overview metrics
            metrics = raw_data.get("marketData", {}).get("metrics", {})
            market_overview = {
                "median_price": metrics.get("medianPrice", 0),
                "median_price_per_sqft": metrics.get("medianPricePerSqft", 0),
                "median_days_on_market": metrics.get("medianDaysOnMarket", 0),
                "avg_days_on_market": metrics.get("avgDaysOnMarket", 0),
                "homes_sold_last_month": metrics.get("homesSoldLastMonth", 0),
                "total_active_listings": metrics.get("totalActiveListing", 0)
            }
            
            # Extract price trends
            price_trends = []
            trend_data = raw_data.get("marketData", {}).get("priceTrends", [])
            for trend in trend_data:
                price_trends.append({
                    "date": trend.get("date", ""),
                    "price": trend.get("price", 0),
                    "percent_change": trend.get("percentChange", 0)
                })
            
            return {
                "location_info": location_info,
                "market_overview": market_overview,
                "price_trends": price_trends
            }
            
        except Exception as e:
            logger.error(f"Error formatting market data: {e}")
            raise ValueError(f"Failed to format market data: {e}")
    
    def get_market_insights(self, zpid: Union[str, int]) -> Dict[str, Any]:
        """
        Get market insights for a specific property.
        
        Args:
            zpid (str or int): Zillow Property ID
        
        Returns:
            Dict[str, Any]: Market insights from Zillow API
        """
        logger.info(f"Fetching market insights for ZPID: {zpid}")
        url = f"{self.base_url}/marketInsights"
        
        params = {
            "zpid": zpid
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            return response.json()
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error getting market insights: {e}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting market insights: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON response: {e}")
            raise ValueError(f"Invalid JSON response from Zillow API: {e}")
"""
Zillow ETL plugin for retrieving and storing Zillow market data.
"""
import os
import json
import logging
from datetime import datetime, date
from typing import Dict, List, Any, Optional, Tuple

from app import db
from etl.base import BaseETL
from etl.zillow_scraper import ZillowScraper
from models.zillow_data import ZillowMarketData, ZillowPriceTrend, ZillowProperty
from etl.data_validation import validate_required_fields, normalize_address, deduplicate_records, fuzzy_deduplicate_records

# Configure logger
logger = logging.getLogger(__name__)

class ZillowMarketDataETL(BaseETL):
    """ETL plugin for Zillow market data."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Zillow Market Data ETL plugin.
        
        Args:
            config (Dict[str, Any], optional): Configuration options including:
                - resource_id: The Zillow resource ID for the location (zip code, city ID)
                - beds: Number of bedrooms (default: 0 for any)
                - property_types: Property types (default: "house")
                - api_key: RapidAPI key for Zillow API (default: from environment)
        """
        super().__init__(config)
        
        # Set default configuration values
        self.config.setdefault('resource_id', None)
        self.config.setdefault('beds', 0)
        self.config.setdefault('property_types', 'house')
        self.config.setdefault('api_key', os.environ.get('RAPIDAPI_KEY'))
        
        # Initialize Zillow scraper
        self.scraper = ZillowScraper(api_key=self.config['api_key'])
    
    def extract(self) -> Dict[str, Any]:
        """
        Extract market data from Zillow API.
        
        Returns:
            Dict[str, Any]: Raw market data from Zillow API
        """
        if not self.config['resource_id']:
            raise ValueError("Resource ID is required for Zillow market data ETL")
        
        # Fetch from Zillow API
        raw_data = self.scraper.get_market_data(
            self.config['resource_id'],
            self.config['beds'],
            self.config['property_types']
        )
        
        if not raw_data or "locationInfo" not in raw_data:
            raise ValueError(f"Failed to fetch market data for resource ID {self.config['resource_id']}")
        
        return raw_data
    
    def transform(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform raw Zillow API data into a structured format, with validation and normalization.
        
        Args:
            raw_data (Dict[str, Any]): Raw data from Zillow API
            
        Returns:
            Dict[str, Any]: Transformed data ready for loading
        """
        # Format the data using the existing formatter
        data = self.scraper.format_market_data(raw_data)
        # Example: Validate required fields for market data (customize as needed)
        required_fields = ["location", "stats"]
        if not validate_required_fields(data, required_fields):
            raise ValueError(f"Missing required fields in Zillow market data: {required_fields}")
        # Normalize address if present
        if "location" in data:
            data["location"] = normalize_address(data["location"])
        return data
    
    def load(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load transformed Zillow market data into the database.
        
        Args:
            processed_data (Dict[str, Any]): Transformed market data
            
        Returns:
            Dict[str, Any]: Load result information
        """
        try:
            # Create new market data record
            market_data = ZillowMarketData(
                resource_id=self.config['resource_id'],
                location_name=processed_data["location_info"].get("name"),
                location_type=processed_data["location_info"].get("type"),
                beds=self.config['beds'],
                property_types=self.config['property_types'],
                median_price=processed_data["market_overview"].get("median_price"),
                median_price_per_sqft=processed_data["market_overview"].get("median_price_per_sqft"),
                median_days_on_market=processed_data["market_overview"].get("median_days_on_market"),
                avg_days_on_market=processed_data["market_overview"].get("avg_days_on_market"),
                homes_sold_last_month=processed_data["market_overview"].get("homes_sold_last_month"),
                total_active_listings=processed_data["market_overview"].get("total_active_listings"),
                raw_data=self.extract()  # Store the original raw data
            )
            
            # Save market data
            db.session.add(market_data)
            db.session.commit()
            
            # Add price trends
            trend_count = 0
            for trend in processed_data["price_trends"]:
                if not trend.get("date") or not trend.get("price"):
                    continue
                
                try:
                    # Parse date string to datetime
                    trend_date = datetime.strptime(trend["date"], "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    logger.warning(f"Invalid date format in price trend: {trend.get('date')}")
                    continue
                
                price_trend = ZillowPriceTrend(
                    market_data_id=market_data.id,
                    date=trend_date,
                    price=trend.get("price"),
                    percent_change=trend.get("percent_change")
                )
                
                db.session.add(price_trend)
                trend_count += 1
            
            db.session.commit()
            logger.info(f"Successfully stored market data for resource ID {self.config['resource_id']}")
            
            return {
                "market_data_id": market_data.id,
                "records_processed": 1,
                "price_trends_added": trend_count,
                "location_name": market_data.location_name,
                "location_type": market_data.location_type
            }
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error storing market data: {str(e)}")
            raise

class ZillowPropertyETL(BaseETL):
    """ETL plugin for Zillow property data."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Zillow Property ETL plugin.
        
        Args:
            config (Dict[str, Any], optional): Configuration options including:
                - zpid: Zillow Property ID
                - api_key: RapidAPI key for Zillow API (default: from environment)
        """
        super().__init__(config)
        
        # Set default configuration values
        self.config.setdefault('zpid', None)
        self.config.setdefault('api_key', os.environ.get('RAPIDAPI_KEY'))
        
        # Initialize Zillow scraper
        self.scraper = ZillowScraper(api_key=self.config['api_key'])
    
    def extract(self) -> Dict[str, Any]:
        """
        Extract property data from Zillow API.
        
        Returns:
            Dict[str, Any]: Raw property data from Zillow API
        """
        if not self.config['zpid']:
            raise ValueError("ZPID is required for Zillow property ETL")
        
        # Fetch from Zillow API
        property_data = self.scraper.get_property_details(self.config['zpid'])
        
        if not property_data:
            raise ValueError(f"Failed to fetch property details for ZPID {self.config['zpid']}")
        
        return property_data
    
    def transform(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform raw Zillow property data, with validation and normalization.
        
        Args:
            raw_data (Dict[str, Any]): Raw property data from Zillow API
            
        Returns:
            Dict[str, Any]: Transformed property data
        """
        property_data = raw_data
        # Extract relevant information
        transformed = {
            "address": property_data.get("address", {}),
            "price_info": property_data.get("price", {}),
            "building_info": property_data.get("building", {}),
            "zpid": self.config['zpid'],
            "property_type": property_data.get("propertyType"),
            "status": property_data.get("homeStatus"),
            "days_on_market": property_data.get("daysOnZillow"),
            "url": property_data.get("url"),
            "image_url": property_data.get("imgSrc")
        }
        # Validate required fields
        required_fields = ["address", "zpid"]
        if not validate_required_fields(transformed, required_fields):
            raise ValueError(f"Missing required fields in Zillow property data: {required_fields}")
        # Normalize address
        transformed["address"] = normalize_address(transformed["address"])
        return transformed
    
    def load(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load transformed property data into the database.
        
        Args:
            processed_data (Dict[str, Any]): Transformed property data
            
        Returns:
            Dict[str, Any]: Load result information
        """
        transformed_data = processed_data
        try:
            # Check if we already have this property
            existing_property = ZillowProperty.query.filter_by(zpid=self.config['zpid']).first()
            
            address = transformed_data["address"]
            price_info = transformed_data["price_info"]
            building_info = transformed_data["building_info"]
            
            # Create or update property record
            if existing_property:
                property_obj = existing_property
            else:
                property_obj = ZillowProperty(zpid=self.config['zpid'])
            
            # Update properties
            property_obj.address = address.get("streetAddress")
            property_obj.city = address.get("city")
            property_obj.state = address.get("state")
            property_obj.zip_code = address.get("zipcode")
            property_obj.price = price_info.get("value")
            property_obj.beds = building_info.get("beds")
            property_obj.baths = building_info.get("baths")
            property_obj.square_feet = building_info.get("livingArea")
            property_obj.lot_size = building_info.get("lotSize")
            property_obj.year_built = building_info.get("yearBuilt")
            property_obj.property_type = transformed_data["property_type"]
            property_obj.status = transformed_data["status"]
            property_obj.days_on_market = transformed_data["days_on_market"]
            property_obj.url = transformed_data["url"]
            property_obj.image_url = transformed_data["image_url"]
            property_obj.raw_data = self.extract()  # Store the original raw data
            
            # Save to database
            if not existing_property:
                db.session.add(property_obj)
            
            db.session.commit()
            logger.info(f"Successfully stored property details for ZPID {self.config['zpid']}")
            
            return {
                "property_id": property_obj.id,
                "records_processed": 1,
                "is_new": not existing_property,
                "address": property_obj.address,
                "city": property_obj.city,
                "state": property_obj.state
            }
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error storing property data: {str(e)}")
            raise

class ZillowPropertySearchETL(BaseETL):
    """ETL plugin for searching Zillow properties."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Zillow Property Search ETL plugin.
        
        Args:
            config (Dict[str, Any], optional): Configuration options including:
                - location: Location to search (city, zip code, etc.)
                - limit: Maximum number of results (default: 10)
                - api_key: RapidAPI key for Zillow API (default: from environment)
        """
        super().__init__(config)
        
        # Set default configuration values
        self.config.setdefault('location', None)
        self.config.setdefault('limit', 10)
        self.config.setdefault('api_key', os.environ.get('RAPIDAPI_KEY'))
        
        # Initialize Zillow scraper
        self.scraper = ZillowScraper(api_key=self.config['api_key'])
    
    def extract(self) -> Dict[str, Any]:
        """
        Extract property search results from Zillow API.
        
        Returns:
            Dict[str, Any]: Raw search results from Zillow API
        """
        if not self.config['location']:
            raise ValueError("Location is required for Zillow property search ETL")
        
        # Search for properties
        search_results = self.scraper.search_properties(self.config['location'], page=1)
        
        if not search_results or not search_results.get("results"):
            logger.warning(f"No properties found for location: {self.config['location']}")
            return {"results": []}
        
        return search_results
    
    def transform(self, raw_data: Dict[str, Any]) -> List[str]:
        """
        Transform search results into a list of ZPIDs to fetch.
        
        Args:
            raw_data (Dict[str, Any]): Raw search results from Zillow API
            
        Returns:
            List[str]: List of ZPIDs to fetch
        """
        search_results = raw_data
        results = search_results.get("results", [])
        zpids = []
        
        # Process each result
        for idx, result in enumerate(results):
            if idx >= self.config['limit']:
                break
                
            zpid = result.get("zpid")
            if zpid:
                zpids.append(zpid)
        
        return zpids
    
    def load(self, processed_data: List[str]) -> Dict[str, Any]:
        """
        Load property data for each ZPID using the ZillowPropertyETL.
        
        Args:
            processed_data (List[str]): List of ZPIDs to fetch
            
        Returns:
            Dict[str, Any]: Load result information
        """
        zpids = processed_data
        properties = []
        success_count = 0
        error_count = 0
        
        for zpid in zpids:
            try:
                # Use ZillowPropertyETL to fetch and store each property
                property_etl = ZillowPropertyETL(config={'zpid': zpid, 'api_key': self.config['api_key']})
                result = property_etl.run()
                
                if result["success"]:
                    properties.append(result)
                    success_count += 1
                else:
                    error_count += 1
                    logger.warning(f"Failed to process property ZPID {zpid}: {result.get('error')}")
            except Exception as e:
                error_count += 1
                logger.exception(f"Error processing property ZPID {zpid}: {str(e)}")
        
        import csv
        from datetime import datetime
        # Deduplicate properties by property_id (strict)
        deduped_properties = deduplicate_records(properties, ["property_id"])
        # Further deduplicate using fuzzy address similarity
        threshold = self.config.get('fuzzy_threshold', 98)
        fuzzy_deduped_properties = fuzzy_deduplicate_records(deduped_properties, address_field="address", threshold=threshold)
        # Log deduplication metrics
        with open('dedup_metrics.csv', 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                datetime.utcnow().isoformat(),
                'zillow',
                len(properties),
                len(deduped_properties),
                len(fuzzy_deduped_properties),
                threshold
            ])
        return {
            "records_processed": len(zpids),
            "success_count": success_count,
            "error_count": error_count,
            "properties": fuzzy_deduped_properties
        }
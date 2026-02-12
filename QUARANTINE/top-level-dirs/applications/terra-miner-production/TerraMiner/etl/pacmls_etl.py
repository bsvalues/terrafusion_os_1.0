"""
PACMLS ETL (Extract, Transform, Load) module.

This module provides functionality to extract data from the PACMLS system,
transform it into a standardized format, and load it into the database.

It follows a modular ETL pattern to enable scheduled updates and data aggregation.
"""

import os
import json
import logging
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

from app import db
from etl.base import BaseETL
from etl.pacmls_connector import PacMlsConnector
from models import Property, PropertyHistory, PropertyListing
from etl.data_validation import validate_required_fields, normalize_address, deduplicate_records

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class PacMlsETL(BaseETL):
    """
    Extract, transform, and load data from the PACMLS system.
    
    This ETL implementation fetches data from the PACMLS API, transforms it
    into a standardized format, and loads it into the Property and related
    tables in the database.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the PACMLS ETL with configuration.
        
        Args:
            config (Dict[str, Any], optional): Configuration for the ETL process
        """
        self.config = config or {}
        self.locations = self.config.get('locations', ['Seattle, WA'])
        self.property_ids = self.config.get('property_ids', [])
        self.username = self.config.get('username') or os.environ.get('PACMLS_USERNAME')
        self.password = self.config.get('password') or os.environ.get('PACMLS_PASSWORD')
        
        if not self.username or not self.password:
            raise ValueError("PACMLS credentials are required for the ETL process")
        
        self.connector = None
    
    def extract(self) -> Dict[str, Any]:
        """
        Extract data from the PACMLS system.
        
        Returns:
            Dict[str, Any]: Raw data from PACMLS
        """
        try:
            # Initialize the connector
            self.connector = PacMlsConnector(self.username, self.password)
            results = {}
            
            # Search for properties in specified locations
            for location in self.locations:
                logger.info(f"Searching for properties in {location}")
                search_results = self.connector.search_properties(location)
                results[f"search_{location}"] = search_results
            
            # Get property details for specific properties
            for property_id in self.property_ids:
                logger.info(f"Getting details for property {property_id}")
                property_details = self.connector.get_property_details(property_id)
                results[f"property_{property_id}"] = property_details
            
            # Get market trends for specified locations
            for location in self.locations:
                logger.info(f"Getting market trends for {location}")
                market_trends = self.connector.get_market_trends(location)
                results[f"trends_{location}"] = market_trends
            
            # Close the connector
            self.connector.close()
            
            return results
        except Exception as e:
            logger.error(f"PACMLS extraction error: {str(e)}")
            if self.connector:
                self.connector.close()
            raise
    
    def transform(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform the raw PACMLS data into a structured format.
        
        Args:
            raw_data (Dict[str, Any]): Raw data from PACMLS
        
        Returns:
            Dict[str, Any]: Transformed data ready for loading
        """
        try:
            transformed = {
                'properties': [],
                'market_trends': []
            }
            
            # Process search results
            for key, data in raw_data.items():
                if key.startswith('search_'):
                    if 'results' in data:
                        for prop in data['results']:
                            transformed['properties'].append(prop)
                            
                elif key.startswith('property_'):
                    # Standardize the property data if not already done
                    if not data.get('source'):
                        property_data = self.connector.standardize_property(data)
                        transformed['properties'].append(property_data)
                    else:
                        transformed['properties'].append(data)
                        
                elif key.startswith('trends_'):
                    location = key.replace('trends_', '')
                    trends_data = data.copy()
                    trends_data['location'] = location
                    transformed['market_trends'].append(trends_data)
            
            # Validate, normalize, and deduplicate properties
            validated = []
            for prop in transformed['properties']:
                # Validate required fields (customize fields as needed)
                if not validate_required_fields(prop, ["address", "id"]):
                    continue
                # Normalize address
                if "address" in prop:
                    prop["address"] = normalize_address(prop["address"])
                validated.append(prop)
            # Deduplicate based on property ID
            deduped = deduplicate_records(validated, ["id"])
            transformed['properties'] = deduped
            logger.info(f"Transformed {len(transformed['properties'])} properties and {len(transformed['market_trends'])} market trend datasets")
            return transformed
        
        except Exception as e:
            logger.error(f"PACMLS transformation error: {str(e)}")
            raise
    
    def load(self, transformed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load the transformed data into the database.
        
        Args:
            transformed_data (Dict[str, Any]): Transformed property data
        
        Returns:
            Dict[str, Any]: Loading results with counts and status
        """
        try:
            properties = transformed_data.get('properties', [])
            market_trends = transformed_data.get('market_trends', [])
            # Deduplicate properties by 'id'
            from etl.data_validation import deduplicate_records, fuzzy_deduplicate_records
            import csv
            from datetime import datetime
            input_count = len(properties)
            properties = deduplicate_records(properties, ["id"])
            strict_count = len(properties)
            # Further deduplicate using fuzzy address similarity
            threshold = getattr(self, 'fuzzy_threshold', 96)
            properties = fuzzy_deduplicate_records(properties, address_field="address", threshold=threshold)
            fuzzy_count = len(properties)
            # Log deduplication metrics
            with open('dedup_metrics.csv', 'a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    datetime.utcnow().isoformat(),
                    'pacmls',
                    input_count,
                    strict_count,
                    fuzzy_count,
                    threshold
                ])
            # Track stats for the result
            results = {
                'properties_added': 0,
                'properties_updated': 0,
                'market_trends_added': 0
            }
            
            # Start a database transaction
            with db.session.begin():
                # Process properties
                for prop_data in properties:
                    property_id = prop_data.get('id')
                    if not property_id:
                        logger.warning("Property missing ID, skipping")
                        continue
                    
                    # Check if property exists
                    existing_property = Property.query.filter_by(external_id=property_id, source='pacmls').first()
                    
                    if existing_property:
                        # Update the existing property
                        self._update_property(existing_property, prop_data)
                        results['properties_updated'] += 1
                    else:
                        # Create a new property
                        self._create_property(prop_data)
                        results['properties_added'] += 1
                
                # Process market trends (simplified for this implementation)
                # TODO: Implement market trends processing based on your data model
                results['market_trends_added'] = len(market_trends)
            
            logger.info(f"PACMLS data loaded successfully: {results}")
            return results
            
        except Exception as e:
            logger.error(f"PACMLS loading error: {str(e)}")
            # Rollback transaction in case of error
            db.session.rollback()
            raise
    
    def _create_property(self, property_data: Dict[str, Any]) -> Property:
        """
        Create a new property record from PACMLS data.
        
        Args:
            property_data (Dict[str, Any]): Property data from PACMLS
        
        Returns:
            Property: Created property instance
        """
        try:
            # Create a new property
            property_obj = Property(
                external_id=property_data.get('id', ''),
                source='pacmls',
                address=property_data.get('address', ''),
                street=property_data.get('street', ''),
                city=property_data.get('city', ''),
                state=property_data.get('state', ''),
                zip_code=property_data.get('zip_code', ''),
                property_type=property_data.get('property_type', ''),
                bedrooms=property_data.get('bedrooms', 0),
                bathrooms=property_data.get('bathrooms', 0),
                square_feet=property_data.get('sqft', 0),
                lot_size=property_data.get('lot_size', ''),
                year_built=property_data.get('year_built', 0),
                description=property_data.get('description', ''),
                status=property_data.get('status', 'unknown'),
                price=property_data.get('price', 0),
                price_per_sqft=property_data.get('price_per_sqft', 0),
                features=json.dumps(property_data.get('features', [])),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            # Add main image if available
            if property_data.get('image_url'):
                property_obj.image_url = property_data.get('image_url')
            
            # Add property to the session
            db.session.add(property_obj)
            
            # Create a new property listing
            if property_data.get('list_date') or property_data.get('listing_agent'):
                listing = PropertyListing(
                    property=property_obj,
                    list_date=datetime.strptime(property_data.get('list_date'), '%Y-%m-%d') if property_data.get('list_date') else None,
                    list_price=property_data.get('price', 0),
                    listing_agent=property_data.get('listing_agent', ''),
                    listing_office=property_data.get('listing_office', ''),
                    mls_number=property_data.get('mls_number', ''),
                    created_at=datetime.now()
                )
                db.session.add(listing)
            
            return property_obj
        
        except Exception as e:
            logger.error(f"Error creating property: {str(e)}")
            raise
    
    def _update_property(self, property_obj: Property, property_data: Dict[str, Any]) -> Property:
        """
        Update an existing property with new data from PACMLS.
        
        Args:
            property_obj (Property): Existing property to update
            property_data (Dict[str, Any]): Property data from PACMLS
        
        Returns:
            Property: Updated property instance
        """
        try:
            # Check if we need to create a price history record
            current_price = property_obj.price
            new_price = property_data.get('price', 0)
            
            if current_price != new_price and current_price > 0 and new_price > 0:
                price_history = PropertyHistory(
                    property=property_obj,
                    price=current_price,
                    event_type='price_change',
                    event_date=datetime.now(),
                    description=f"Price changed from ${current_price:,} to ${new_price:,}",
                    created_at=datetime.now()
                )
                db.session.add(price_history)
            
            # Update property fields
            property_obj.address = property_data.get('address', '') or property_obj.address
            property_obj.street = property_data.get('street', '') or property_obj.street
            property_obj.city = property_data.get('city', '') or property_obj.city
            property_obj.state = property_data.get('state', '') or property_obj.state
            property_obj.zip_code = property_data.get('zip_code', '') or property_obj.zip_code
            property_obj.property_type = property_data.get('property_type', '') or property_obj.property_type
            property_obj.bedrooms = property_data.get('bedrooms', 0) or property_obj.bedrooms
            property_obj.bathrooms = property_data.get('bathrooms', 0) or property_obj.bathrooms
            property_obj.square_feet = property_data.get('sqft', 0) or property_obj.square_feet
            property_obj.lot_size = property_data.get('lot_size', '') or property_obj.lot_size
            property_obj.year_built = property_data.get('year_built', 0) or property_obj.year_built
            property_obj.description = property_data.get('description', '') or property_obj.description
            property_obj.status = property_data.get('status', 'unknown')
            property_obj.price = new_price
            property_obj.price_per_sqft = property_data.get('price_per_sqft', 0) or property_obj.price_per_sqft
            property_obj.features = json.dumps(property_data.get('features', [])) if property_data.get('features') else property_obj.features
            property_obj.updated_at = datetime.now()
            
            # Update main image if available and different
            if property_data.get('image_url') and property_data.get('image_url') != property_obj.image_url:
                property_obj.image_url = property_data.get('image_url')
            
            # Update or create a property listing
            if property_data.get('list_date') or property_data.get('listing_agent'):
                # Check for existing listing
                listing = PropertyListing.query.filter_by(property_id=property_obj.id).order_by(PropertyListing.created_at.desc()).first()
                
                if listing:
                    # Update existing listing
                    if property_data.get('list_date'):
                        listing.list_date = datetime.strptime(property_data.get('list_date'), '%Y-%m-%d')
                    listing.list_price = property_data.get('price', 0) or listing.list_price
                    listing.listing_agent = property_data.get('listing_agent', '') or listing.listing_agent
                    listing.listing_office = property_data.get('listing_office', '') or listing.listing_office
                    listing.mls_number = property_data.get('mls_number', '') or listing.mls_number
                else:
                    # Create new listing
                    listing = PropertyListing(
                        property=property_obj,
                        list_date=datetime.strptime(property_data.get('list_date'), '%Y-%m-%d') if property_data.get('list_date') else None,
                        list_price=property_data.get('price', 0),
                        listing_agent=property_data.get('listing_agent', ''),
                        listing_office=property_data.get('listing_office', ''),
                        mls_number=property_data.get('mls_number', ''),
                        created_at=datetime.now()
                    )
                    db.session.add(listing)
            
            return property_obj
        
        except Exception as e:
            logger.error(f"Error updating property: {str(e)}")
            raise
    
    def run(self) -> Dict[str, Any]:
        """
        Run the complete ETL process for PACMLS data.
        
        Returns:
            Dict[str, Any]: Results of the ETL process
        """
        try:
            logger.info("Starting PACMLS ETL process")
            
            # Execute the ETL pipeline
            raw_data = self.extract()
            transformed_data = self.transform(raw_data)
            results = self.load(transformed_data)
            
            logger.info("PACMLS ETL process completed successfully")
            return {
                'status': 'success',
                'timestamp': datetime.now().isoformat(),
                'results': results
            }
            
        except Exception as e:
            logger.error(f"PACMLS ETL process failed: {str(e)}")
            return {
                'status': 'error',
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
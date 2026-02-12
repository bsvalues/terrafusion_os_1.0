"""
Service for interacting with NARRPR (National Association of REALTORS® Realtors Property Resource) data.

This module provides methods for searching NARRPR properties and retrieving
property details, market activity, and comparable properties.
"""

import logging
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class NarrprService:
    """Service for NARRPR property data."""
    
    def __init__(self):
        """Initialize the NARRPR service."""
        logger.info("Initializing NARRPR service")

    def find_property(self, address: str, city: str, state: str, zip_code: str) -> Dict[str, Any]:
        """
        Find a property by address.
        
        Args:
            address (str): Property address
            city (str): City
            state (str): State
            zip_code (str): ZIP code
            
        Returns:
            Dict[str, Any]: Property details
        """
        logger.info(f"Finding property: {address}, {city}, {state} {zip_code}")
        
        # In a real implementation, this would call the NARRPR API or scraper
        # For development, we'll return mock data
        mock_property = self._generate_mock_property({
            'address': address,
            'city': city,
            'state': state,
            'zip_code': zip_code
        })
        
        logger.info(f"Found property: {address}")
        
        return mock_property
    
    def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """
        Get property details by ID.
        
        Args:
            property_id (str): Property ID
            
        Returns:
            Dict[str, Any]: Property details
        """
        logger.info(f"Getting property details for ID: {property_id}")
        
        # In a real implementation, this would call the NARRPR API or scraper
        # For development, we'll return mock data
        mock_property = self._generate_mock_property({'id': property_id})
        
        logger.info(f"Retrieved property details for ID: {property_id}")
        
        return mock_property
    
    def get_market_activity(self, location: str, property_type: str = 'all') -> Dict[str, Any]:
        """
        Get market activity for a location.
        
        Args:
            location (str): Location (city, state, zip)
            property_type (str, optional): Property type
            
        Returns:
            Dict[str, Any]: Market activity
        """
        logger.info(f"Getting market activity for location: {location}, property_type: {property_type}")
        
        # In a real implementation, this would call the NARRPR API or scraper
        # For development, we'll return mock data
        mock_activity = self._generate_mock_market_activity(location, property_type)
        
        logger.info(f"Retrieved market activity for location: {location}")
        
        return mock_activity
    
    def find_comparable_properties(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Find comparable properties based on search parameters.
        
        Args:
            params (Dict[str, Any]): Search parameters
            
        Returns:
            List[Dict[str, Any]]: List of comparable properties
        """
        logger.info(f"Finding comparable properties with params: {params}")
        
        # In a real implementation, this would call the NARRPR API or scraper
        # For development, we'll return mock data
        mock_properties = self._generate_mock_comparable_properties(params)
        
        logger.info(f"Found {len(mock_properties)} comparable properties")
        
        return mock_properties
    
    def _generate_mock_property(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a mock property based on parameters.
        
        Args:
            params (Dict[str, Any]): Property parameters
            
        Returns:
            Dict[str, Any]: Mock property
        """
        # Get parameters or use defaults
        property_id = params.get('id', f"narrpr-{random.randint(10000, 99999)}")
        address = params.get('address', '123 Main St')
        city = params.get('city', 'San Francisco')
        state = params.get('state', 'CA')
        zip_code = params.get('zip_code', '94105')
        
        # Generate property details
        beds = random.randint(2, 5)
        baths = round(random.uniform(1.5, 4.0), 1)
        sqft = random.randint(1000, 3500)
        lot_size = random.randint(2500, 10000)
        year_built = random.randint(1950, 2023)
        property_type = random.choice(['Single Family', 'Condo', 'Townhouse', 'Multi-Family'])
        
        # Generate price (based on size and location)
        base_price_per_sqft = random.randint(350, 850)  # Price per sqft varies by location
        price = int(base_price_per_sqft * sqft)
        
        # Generate property data
        property_data = {
            'id': property_id,
            'address': address,
            'city': city,
            'state': state,
            'zip_code': zip_code,
            'beds': beds,
            'baths': baths,
            'sqft': sqft,
            'lot_size': lot_size,
            'year_built': year_built,
            'property_type': property_type,
            'price': price,
            'price_per_sqft': base_price_per_sqft,
            'school_rating': random.randint(5, 10),
            'walkability': random.randint(50, 95),
            'zoning': 'R-1',
            'last_sold_date': (datetime.now() - timedelta(days=random.randint(90, 1800))).strftime('%Y-%m-%d'),
            'last_sold_price': int(price * random.uniform(0.7, 0.95)),
            'listing_history': self._generate_mock_listing_history(price),
            'tax_history': self._generate_mock_tax_history(price),
            'valuation': {
                'current': price,
                'one_year_forecast': int(price * random.uniform(1.01, 1.08)),
                'valuation_range': {
                    'low': int(price * 0.9),
                    'high': int(price * 1.1)
                }
            },
            'features': {
                'bedrooms': beds,
                'bathrooms': baths,
                'total_rooms': beds + random.randint(2, 4),
                'stories': random.choice([1, 1, 2, 2, 3]),
                'garage_spaces': random.choice([1, 2, 2, 3]),
                'pool': random.choice([True, False, False, False]),
                'fireplace': random.choice([True, True, False]),
                'ac': random.choice([True, True, True, False]),
                'heating': random.choice(['Forced Air', 'Central', 'Heat Pump', 'Radiant']),
                'basement': random.choice([True, False, False]),
                'roof_type': random.choice(['Asphalt', 'Tile', 'Metal', 'Slate']),
                'architectural_style': random.choice(['Traditional', 'Colonial', 'Ranch', 'Contemporary', 'Victorian', 'Craftsman'])
            },
            'location': {
                'latitude': 37.7749 + (random.random() - 0.5) * 0.1,
                'longitude': -122.4194 + (random.random() - 0.5) * 0.1,
                'flood_zone': random.choice(['None', 'None', 'None', 'AE', 'X']),
                'parcel_id': f"APN-{random.randint(1000000, 9999999)}",
                'census_tract': f"{random.randint(1000, 9999)}.00"
            }
        }
        
        return property_data
    
    def _generate_mock_listing_history(self, current_price: int) -> List[Dict[str, Any]]:
        """
        Generate mock listing history.
        
        Args:
            current_price (int): Current property price
            
        Returns:
            List[Dict[str, Any]]: Mock listing history
        """
        history = []
        
        # Generate 0-3 past listings
        num_listings = random.randint(0, 3)
        
        if num_listings > 0:
            # Start from current and go back in time
            price = current_price
            date = datetime.now() - timedelta(days=random.randint(30, 90))
            
            for i in range(num_listings):
                # Price decays as we go back in time
                price = int(price * random.uniform(0.85, 0.98))
                
                # Listing statuses
                if i == 0:
                    status = 'Listed'
                    days_on_market = random.randint(1, 60)
                else:
                    status = random.choice(['Expired', 'Withdrawn', 'Sold'])
                    days_on_market = random.randint(30, 180)
                
                # Generate listing
                listing = {
                    'date': date.strftime('%Y-%m-%d'),
                    'price': price,
                    'status': status,
                    'days_on_market': days_on_market,
                    'listing_agent': f"Agent {random.randint(100, 999)}",
                    'listing_office': f"Realty {random.randint(100, 999)}"
                }
                
                history.append(listing)
                
                # Go back in time for next listing
                date = date - timedelta(days=random.randint(180, 730))
        
        return history
    
    def _generate_mock_tax_history(self, current_price: int) -> List[Dict[str, Any]]:
        """
        Generate mock tax history.
        
        Args:
            current_price (int): Current property price
            
        Returns:
            List[Dict[str, Any]]: Mock tax history
        """
        history = []
        
        # Generate 3-5 years of tax history
        num_years = random.randint(3, 5)
        
        # Start from current year and go back
        value = current_price
        
        for i in range(num_years):
            year = datetime.now().year - i
            
            # Value decreases as we go back in time
            if i > 0:
                value = int(value * random.uniform(0.92, 0.98))
            
            # Tax rate around 1.0-1.5% of value
            tax_rate = random.uniform(0.01, 0.015)
            tax_amount = int(value * tax_rate)
            
            # Generate tax record
            tax_record = {
                'year': year,
                'assessed_value': value,
                'tax_amount': tax_amount,
                'tax_rate': tax_rate
            }
            
            history.append(tax_record)
        
        return history
    
    def _generate_mock_market_activity(self, location: str, property_type: str = 'all') -> Dict[str, Any]:
        """
        Generate mock market activity.
        
        Args:
            location (str): Location (city, state, zip)
            property_type (str, optional): Property type
            
        Returns:
            Dict[str, Any]: Mock market activity
        """
        # Extract city and state from location
        location_parts = location.split(',')
        city = location_parts[0].strip()
        state_zip = location_parts[1].strip() if len(location_parts) > 1 else 'CA 94105'
        state_zip_parts = state_zip.split(' ')
        state = state_zip_parts[0].strip()
        
        # Generate time periods for statistics
        now = datetime.now()
        current_month = now.replace(day=1)
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        year_ago = current_month.replace(year=current_month.year - 1)
        
        # Generate random statistics with reasonable values
        current_median_price = random.randint(500000, 2000000)
        last_month_median_price = int(current_median_price * random.uniform(0.97, 1.03))
        year_ago_median_price = int(current_median_price * random.uniform(0.9, 1.1))
        
        # Calculate price changes
        mom_change = (current_median_price - last_month_median_price) / last_month_median_price
        yoy_change = (current_median_price - year_ago_median_price) / year_ago_median_price
        
        # Generate inventory changes
        current_inventory = random.randint(50, 500)
        last_month_inventory = int(current_inventory * random.uniform(0.9, 1.1))
        year_ago_inventory = int(current_inventory * random.uniform(0.8, 1.2))
        
        # Calculate inventory changes
        inventory_mom_change = (current_inventory - last_month_inventory) / last_month_inventory
        inventory_yoy_change = (current_inventory - year_ago_inventory) / year_ago_inventory
        
        # Generate days on market
        current_dom = random.randint(15, 60)
        last_month_dom = int(current_dom * random.uniform(0.9, 1.1))
        year_ago_dom = int(current_dom * random.uniform(0.8, 1.2))
        
        # Generate market activity data
        market_activity = {
            'location': {
                'city': city,
                'state': state
            },
            'property_type': property_type,
            'stats': {
                'median_price': {
                    'current': current_median_price,
                    'last_month': last_month_median_price,
                    'year_ago': year_ago_median_price,
                    'mom_change': mom_change,
                    'yoy_change': yoy_change
                },
                'inventory': {
                    'current': current_inventory,
                    'last_month': last_month_inventory,
                    'year_ago': year_ago_inventory,
                    'mom_change': inventory_mom_change,
                    'yoy_change': inventory_yoy_change
                },
                'days_on_market': {
                    'current': current_dom,
                    'last_month': last_month_dom,
                    'year_ago': year_ago_dom,
                    'mom_change': (current_dom - last_month_dom) / last_month_dom,
                    'yoy_change': (current_dom - year_ago_dom) / year_ago_dom
                },
                'sold_to_list_ratio': {
                    'current': random.uniform(0.95, 1.02),
                    'last_month': random.uniform(0.95, 1.02),
                    'year_ago': random.uniform(0.95, 1.02)
                }
            },
            'market_trends': {
                'price_trend': random.choice(['up', 'down', 'stable']),
                'inventory_trend': random.choice(['up', 'down', 'stable']),
                'days_on_market_trend': random.choice(['up', 'down', 'stable']),
                'forecast': random.choice(['improving', 'declining', 'stable'])
            },
            'price_distribution': {
                'under_500k': random.uniform(0, 0.2),
                '500k_to_750k': random.uniform(0.1, 0.3),
                '750k_to_1m': random.uniform(0.1, 0.3),
                '1m_to_1.5m': random.uniform(0.1, 0.2),
                'over_1.5m': random.uniform(0, 0.2)
            },
            'property_type_distribution': {
                'single_family': random.uniform(0.4, 0.7),
                'condo': random.uniform(0.1, 0.3),
                'townhouse': random.uniform(0.1, 0.2),
                'multi_family': random.uniform(0, 0.1)
            }
        }
        
        return market_activity
    
    def _generate_mock_comparable_properties(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate mock comparable properties.
        
        Args:
            params (Dict[str, Any]): Search parameters
            
        Returns:
            List[Dict[str, Any]]: List of mock comparable properties
        """
        # Extract params
        location = params.get('location', 'San Francisco, CA 94105')
        property_type = params.get('property_type', 'Single Family')
        min_beds = params.get('min_beds', 2)
        max_beds = params.get('max_beds', 4)
        min_baths = params.get('min_baths', 1)
        max_baths = params.get('max_baths', 3)
        min_sqft = params.get('min_sqft', 1000)
        max_sqft = params.get('max_sqft', 3000)
        min_price = params.get('min_price')
        max_price = params.get('max_price')
        
        # Subject property details for reference
        subject_address = params.get('subject_address', '123 Main St')
        subject_city = params.get('subject_city', 'San Francisco')
        subject_state = params.get('subject_state', 'CA')
        subject_zip = params.get('subject_zip', '94105')
        subject_beds = params.get('subject_beds', 3)
        subject_baths = params.get('subject_baths', 2)
        subject_sqft = params.get('subject_sqft', 1800)
        subject_year_built = params.get('subject_year_built', 2000)
        subject_lot_size = params.get('subject_lot_size', 5000)
        subject_price = params.get('subject_price')
        
        # Generate 5-8 properties
        num_properties = random.randint(5, 8)
        
        properties = []
        for i in range(num_properties):
            # Generate a property with similar characteristics to the subject property
            # to ensure they are truly comparable
            
            # Beds: within 1 of subject
            beds = max(1, subject_beds + random.choice([-1, 0, 0, 1]))
            
            # Baths: within 1 of subject
            baths = max(1, round(subject_baths + random.choice([-1, -0.5, 0, 0, 0.5, 1]), 1))
            
            # Sqft: within 20% of subject
            sqft = int(subject_sqft * random.uniform(0.8, 1.2))
            
            # Year built: within 10 years of subject
            year_built = max(1900, subject_year_built + random.randint(-10, 10))
            
            # Lot size: within 30% of subject
            lot_size = int(subject_lot_size * random.uniform(0.7, 1.3))
            
            # Generate price based on subject (if available) or calculate based on sqft
            if subject_price:
                # Price: within 15% of subject
                price = int(subject_price * random.uniform(0.85, 1.15))
            else:
                # Price based on sqft (random price per sqft between $400-800)
                price_per_sqft = random.randint(400, 800)
                price = int(sqft * price_per_sqft)
            
            # Status (70% active, 15% pending, 15% sold)
            status_rand = random.random()
            if status_rand < 0.7:
                status = 'active'
                days_on_market = random.randint(1, 60)
                sale_date = None
            elif status_rand < 0.85:
                status = 'pending'
                days_on_market = random.randint(30, 90)
                sale_date = None
            else:
                status = 'sold'
                days_on_market = random.randint(30, 90)
                sale_date = (datetime.now() - timedelta(days=random.randint(10, 60))).strftime('%Y-%m-%d')
            
            # Generate address
            street_number = random.randint(100, 999)
            street_name = random.choice(['Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Washington', 'Lincoln', 'Jefferson', 'Madison'])
            street_type = random.choice(['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Rd', 'Way', 'Ct', 'Pl'])
            address = f"{street_number} {street_name} {street_type}"
            
            # Create property
            property_data = {
                'id': f"narrpr-comp-{i+1000}",
                'address': address,
                'city': subject_city,
                'state': subject_state,
                'zip_code': subject_zip,
                'price': price,
                'original_price': price + (random.randint(0, 5) * 10000) if random.random() < 0.3 else price,
                'beds': beds,
                'baths': baths,
                'sqft': sqft,
                'lot_size': lot_size,
                'year_built': year_built,
                'property_type': property_type,
                'status': status,
                'days_on_market': days_on_market,
                'sale_date': sale_date,
                'description': f"Comparable {beds} bedroom, {baths} bathroom {property_type.lower()} in {subject_city}.",
                'photos': [
                    f"https://example.com/photos/property-comp-{i+1000}-1.jpg",
                    f"https://example.com/photos/property-comp-{i+1000}-2.jpg"
                ],
                'url': f"https://example.com/properties/comp-{i+1000}",
                'walkability': random.randint(50, 95),
                'school_rating': random.randint(5, 10)
            }
            
            properties.append(property_data)
        
        return properties
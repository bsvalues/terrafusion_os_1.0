"""
Utility functions for working with location-based data and visualizations.
"""

import re
import json
import logging
import random
from datetime import datetime, timedelta
from sqlalchemy import func, desc
from sqlalchemy.exc import SQLAlchemyError
from app import db
from models import (
    NarrprReports,
    PropertyLocation,
    PriceTrend,
    ActivityLog
)

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Regular expression for parsing addresses
ADDRESS_PATTERN = re.compile(r'(?P<street>.*?),\s*(?P<city>[^,]+),\s*(?P<state>[A-Z]{2})(?:\s*(?P<zip>\d{5}))?')

def extract_location_data(address):
    """
    Extract structured location data from a property address string.
    
    Args:
        address (str): Full property address
        
    Returns:
        dict: Dictionary with street, city, state, zip_code fields
    """
    match = ADDRESS_PATTERN.match(address)
    if match:
        return match.groupdict()
    else:
        # Basic fallback if the pattern doesn't match
        parts = address.split(',')
        if len(parts) >= 3:
            street = parts[0].strip()
            city = parts[1].strip()
            state_zip = parts[2].strip().split()
            state = state_zip[0] if state_zip else ''
            zip_code = state_zip[1] if len(state_zip) > 1 else ''
            
            return {
                'street': street,
                'city': city,
                'state': state,
                'zip_code': zip_code
            }
        else:
            # Another fallback if we don't have enough commas
            return {
                'street': address,
                'city': '',
                'state': '',
                'zip_code': ''
            }

def geocode_address(address_data):
    """
    Geocode an address to get latitude and longitude.
    
    For prototype purposes without relying on external APIs, we'll 
    use deterministic "fake" geocoding based on address hash values.
    
    In a production environment, this would call a real geocoding service.
    """
    # Create a deterministic hash from the address
    address_str = f"{address_data.get('street', '')}, {address_data.get('city', '')}, {address_data.get('state', '')}"
    
    # Use the hash of the address to create deterministic but realistic-looking coordinates
    address_hash = hash(address_str)
    random.seed(address_hash)
    
    # Base coordinates - United States center-ish
    base_lat = 39.8283
    base_lng = -98.5795
    
    # Generate "realistic" coordinates by adding noise based on the address hash
    # This creates deterministic but scattered points across the US
    lat_offset = (random.random() * 20) - 10  # +/- 10 degrees
    lng_offset = (random.random() * 50) - 25  # +/- 25 degrees
    
    # Adjust based on state to group points by state
    if address_data.get('state'):
        state = address_data.get('state')
        # Simple mapping to keep points grouped by state
        # In real app would use actual state boundaries
        state_hash = hash(state)
        random.seed(state_hash)
        state_lat_base = (random.random() * 10) - 5  # +/- 5 degrees
        state_lng_base = (random.random() * 10) - 5  # +/- 5 degrees
        
        lat_offset = lat_offset * 0.2 + state_lat_base  # Reduce noise, add state offset
        lng_offset = lng_offset * 0.2 + state_lng_base  # Reduce noise, add state offset
    
    latitude = base_lat + lat_offset
    longitude = base_lng + lng_offset
    
    return latitude, longitude

def convert_price_to_cents(price_str):
    """
    Convert a price string like "$500,000" to an integer of cents (50000000).
    
    Args:
        price_str (str): Price as a formatted string
        
    Returns:
        int: Price in cents
    """
    if not price_str:
        return None
    
    # Handle rental prices
    if '/' in price_str:
        price_part = price_str.split('/')[0]
    else:
        price_part = price_str
    
    # Remove non-numeric characters
    numeric_price = re.sub(r'[^\d.]', '', price_part)
    
    try:
        # Convert to float and then to cents
        price_dollars = float(numeric_price)
        return int(price_dollars * 100)
    except (ValueError, TypeError):
        return None

def extract_property_type(title):
    """
    Extract property type from title.
    
    Args:
        title (str): Property title
        
    Returns:
        str: Property type
    """
    # Common property types to look for
    property_types = [
        'Single Family', 'Townhouse', 'Condo', 'Multi-Family',
        'Apartment', 'Land', 'Commercial', 'Industrial'
    ]
    
    for prop_type in property_types:
        if prop_type.lower() in title.lower():
            return prop_type
    
    # Default if no type found
    return 'Residential'

def process_reports_for_location_data():
    """
    Process all NARRPR reports to extract and store location data.
    """
    logger.info("Processing NARRPR reports for location data")
    
    try:
        # Get all reports that don't have location data yet
        reports = NarrprReports.query.outerjoin(
            PropertyLocation, 
            NarrprReports.id == PropertyLocation.report_id
        ).filter(
            PropertyLocation.id == None
        ).all()
        
        logger.info(f"Found {len(reports)} reports without location data")
        
        for report in reports:
            try:
                # Skip if there's no address
                if not report.address:
                    continue
                
                # Extract location components
                location_data = extract_location_data(report.address)
                
                # Geocode the address
                latitude, longitude = geocode_address(location_data)
                
                # Extract property type from title
                property_type = extract_property_type(report.title)
                
                # Convert price to cents
                price_value = convert_price_to_cents(report.price)
                
                # Generate some plausible property details
                property_seed = hash(report.address)
                random.seed(property_seed)
                bedrooms = random.choice([2, 3, 3, 3, 4, 4, 5])  # weighted toward 3-4
                bathrooms = random.choice([1.0, 1.5, 2.0, 2.0, 2.5, 2.5, 3.0, 3.5])  # weighted toward 2-2.5
                square_feet = random.randint(1000, 3500)
                year_built = random.randint(1950, 2020)
                
                # Create new location record
                location = PropertyLocation(
                    address=report.address,
                    street=location_data.get('street', ''),
                    city=location_data.get('city', ''),
                    state=location_data.get('state', ''),
                    zip_code=location_data.get('zip_code', ''),
                    latitude=latitude,
                    longitude=longitude,
                    price=report.price,
                    price_value=price_value,
                    property_type=property_type,
                    bedrooms=bedrooms,
                    bathrooms=bathrooms,
                    square_feet=square_feet,
                    year_built=year_built,
                    report_id=report.id
                )
                
                db.session.add(location)
                
                # Log the activity
                activity = ActivityLog(
                    action='extract_location_data',
                    details=f"Extracted location data for property {report.id}: {report.address}"
                )
                db.session.add(activity)
                
            except Exception as e:
                logger.error(f"Error processing report {report.id}: {e}")
        
        db.session.commit()
        logger.info("Location data extraction completed")
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Database error while processing location data: {e}")
    except Exception as e:
        logger.error(f"Error in process_reports_for_location_data: {e}")

def generate_price_trends():
    """
    Generate price trends data for cities in our database.
    This would normally be from real data sources, but for prototyping
    we'll generate based on actual cities in our properties.
    """
    logger.info("Generating price trends data")
    
    try:
        # Get distinct cities from property_location table
        cities = db.session.query(
            PropertyLocation.city, 
            PropertyLocation.state
        ).distinct().all()
        
        logger.info(f"Found {len(cities)} distinct cities")
        
        # Check if we already have price trend data
        existing_count = PriceTrend.query.count()
        if existing_count > 0:
            logger.info(f"Found {existing_count} existing price trend records, skipping generation")
            return
        
        # For each city, generate 12 months of price trend data
        for city, state in cities:
            if not city or not state:
                continue
                
            # Get average price for this city from properties
            properties = PropertyLocation.query.filter_by(
                city=city,
                state=state
            ).all()
            
            # Skip if no properties
            if not properties:
                continue
                
            # Calculate average price from properties
            valid_prices = [p.price_value for p in properties if p.price_value]
            if not valid_prices:
                continue
                
            current_price = sum(valid_prices) // len(valid_prices)
            
            # Set a growth trend 
            city_seed = hash(f"{city},{state}")
            random.seed(city_seed)
            
            # Annual growth rate between -5% and 15%
            annual_growth_rate = (random.random() * 0.20) - 0.05
            monthly_growth_rate = annual_growth_rate / 12
            
            # Seasonal factor for realistic month-to-month variation
            seasonal_factors = [
                0.98,  # Jan
                0.99,  # Feb
                1.01,  # Mar
                1.02,  # Apr
                1.04,  # May
                1.05,  # Jun
                1.03,  # Jul
                1.02,  # Aug
                1.00,  # Sep
                0.98,  # Oct
                0.97,  # Nov
                0.98   # Dec
            ]
            
            # Generate 12 months of data, working backward from now
            today = datetime.now().date()
            
            for month_offset in range(12):
                # Calculate the date for this data point
                current_date = today.replace(day=1) - timedelta(days=30 * month_offset)
                month_index = current_date.month - 1  # 0-based index for seasonal factors
                
                # Calculate price with growth and seasonality
                month_factor = 1.0 - (month_offset * monthly_growth_rate)  # Going backward in time
                seasonal_adjustment = seasonal_factors[month_index]
                
                adjusted_price = int(current_price * month_factor * seasonal_adjustment)
                
                # Randomize other metrics
                total_listings = random.randint(20, 100)
                new_listings = random.randint(5, 20)
                days_on_market = max(10, 30 + (random.random() * 20) - 10)  # 20-50 days with noise
                price_per_sqft = adjusted_price // 1500  # rough approximation
                
                # Calculate price change from previous month (first month set to 0)
                if month_offset == 0:
                    price_change = 0.0  # First month has no change
                else:
                    # Calculate month-over-month percentage change
                    previous_price = int(current_price * (1.0 - ((month_offset-1) * monthly_growth_rate)) * seasonal_factors[(current_date.month % 12)])
                    price_change = ((adjusted_price - previous_price) / previous_price) * 100
                
                # Calculate number of properties sold
                properties_sold = random.randint(10, 50)
                
                trend = PriceTrend(
                    location_type='city',
                    location_value=f"{city}, {state}",
                    city=city,
                    state=state,
                    zip_code='',  # We don't have zip in this aggregation
                    date=current_date,
                    median_price=adjusted_price,
                    avg_price=int(adjusted_price * (0.95 + (random.random() * 0.1))),  # slight variation from median
                    price_change=price_change,
                    properties_sold=properties_sold,
                    total_listings=total_listings,
                    new_listings=new_listings,
                    days_on_market=days_on_market,
                    price_per_sqft=price_per_sqft
                )
                
                db.session.add(trend)
        
        db.session.commit()
        logger.info("Price trends data generation completed")
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Database error while generating price trends: {e}")
    except Exception as e:
        logger.error(f"Error in generate_price_trends: {e}")

def get_property_map_data():
    """
    Get property location data formatted for map visualization.
    
    Returns:
        list: List of property data points for mapping
    """
    try:
        properties = PropertyLocation.query.all()
        
        map_data = []
        for prop in properties:
            if prop.latitude and prop.longitude:
                map_data.append({
                    'id': prop.id,
                    'latitude': prop.latitude,
                    'longitude': prop.longitude,
                    'address': prop.address,
                    'price': prop.price,
                    'property_type': prop.property_type,
                    'bedrooms': prop.bedrooms,
                    'bathrooms': prop.bathrooms,
                    'square_feet': prop.square_feet,
                    'price_per_sqft': int(prop.price_value / prop.square_feet) if prop.price_value and prop.square_feet else None,
                    'report_id': prop.report_id
                })
        
        return map_data
    except Exception as e:
        logger.error(f"Error getting property map data: {e}")
        return []

def get_price_trend_data(location_type, location_value):
    """
    Get price trend data for a specific location.
    
    Args:
        location_type (str): Type of location (city, state, zip)
        location_value (str): Value of the location (e.g., "Seattle, WA")
        
    Returns:
        dict: Trend data with dates and values
    """
    try:
        trends = PriceTrend.query.filter_by(
            location_type=location_type,
            location_value=location_value
        ).order_by(PriceTrend.date).all()
        
        dates = [trend.date.strftime('%Y-%m') for trend in trends]
        median_prices = [trend.median_price / 100 for trend in trends]  # Convert back to dollars
        days_on_market = [trend.days_on_market for trend in trends]
        new_listings = [trend.new_listings for trend in trends]
        total_listings = [trend.total_listings for trend in trends]
        
        return {
            'dates': dates,
            'median_prices': median_prices,
            'days_on_market': days_on_market,
            'new_listings': new_listings,
            'total_listings': total_listings
        }
    except Exception as e:
        logger.error(f"Error getting price trend data: {e}")
        return {
            'dates': [],
            'median_prices': [],
            'days_on_market': [],
            'new_listings': [],
            'total_listings': []
        }

def get_price_comparison_data(location_values):
    """
    Get price trend data for multiple locations for comparison.
    
    Args:
        location_values (list): List of location values to compare
        
    Returns:
        dict: Comparison data organized by location
    """
    try:
        comparison_data = {}
        
        for location in location_values:
            location_type = 'city'  # Assuming city comparison
            location_parts = location.split(',')
            if len(location_parts) > 1:
                city = location_parts[0].strip()
                state = location_parts[1].strip()
                location_value = f"{city}, {state}"
            else:
                location_value = location
            
            trends = PriceTrend.query.filter_by(
                location_type=location_type,
                location_value=location_value
            ).order_by(PriceTrend.date).all()
            
            if trends:
                dates = [trend.date.strftime('%Y-%m') for trend in trends]
                median_prices = [trend.median_price / 100 for trend in trends]
                
                comparison_data[location_value] = {
                    'dates': dates,
                    'median_prices': median_prices
                }
        
        # Common date axis for all locations
        all_dates = set()
        for location_data in comparison_data.values():
            all_dates.update(location_data['dates'])
        
        common_dates = sorted(list(all_dates))
        
        # Add common dates axis
        comparison_data['common_dates'] = common_dates
        
        return comparison_data
    except Exception as e:
        logger.error(f"Error getting price comparison data: {e}")
        return {'common_dates': []}

def get_location_summary_stats():
    """
    Get summary statistics for all locations.
    
    Returns:
        dict: Summary statistics
    """
    try:
        # Get count of properties by city
        city_counts = db.session.query(
            PropertyLocation.city,
            PropertyLocation.state,
            func.count(PropertyLocation.id).label('count')
        ).group_by(
            PropertyLocation.city,
            PropertyLocation.state
        ).order_by(
            desc('count')
        ).limit(10).all()
        
        cities = []
        counts = []
        
        for city, state, count in city_counts:
            if city and state:
                cities.append(f"{city}, {state}")
                counts.append(count)
        
        # Get average price by state
        state_prices = db.session.query(
            PropertyLocation.state,
            func.avg(PropertyLocation.price_value).label('avg_price')
        ).filter(
            PropertyLocation.price_value.isnot(None)
        ).group_by(
            PropertyLocation.state
        ).order_by(
            desc('avg_price')
        ).limit(10).all()
        
        states = []
        avg_prices = []
        
        for state, avg_price in state_prices:
            if state and avg_price:
                states.append(state)
                avg_prices.append(float(avg_price) / 100)  # Convert to dollars
        
        # Get property counts by type
        type_counts = db.session.query(
            PropertyLocation.property_type,
            func.count(PropertyLocation.id).label('count')
        ).group_by(
            PropertyLocation.property_type
        ).order_by(
            desc('count')
        ).all()
        
        types = []
        type_count_values = []
        
        for prop_type, count in type_counts:
            if prop_type:
                types.append(prop_type)
                type_count_values.append(count)
        
        return {
            'top_cities': {
                'labels': cities,
                'counts': counts
            },
            'state_prices': {
                'labels': states,
                'prices': avg_prices
            },
            'property_types': {
                'labels': types,
                'counts': type_count_values
            }
        }
    except Exception as e:
        logger.error(f"Error getting location summary stats: {e}")
        return {
            'top_cities': {'labels': [], 'counts': []},
            'state_prices': {'labels': [], 'prices': []},
            'property_types': {'labels': [], 'counts': []}
        }

if __name__ == "__main__":
    # For testing
    from flask import Flask
    from flask_sqlalchemy import SQLAlchemy
    
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
    db = SQLAlchemy(app)
    
    with app.app_context():
        process_reports_for_location_data()
        generate_price_trends()
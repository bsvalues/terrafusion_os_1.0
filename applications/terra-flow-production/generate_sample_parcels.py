"""
Generate Sample Parcels

This script generates sample parcels with geometry data for Benton County, WA,
to use with the geospatial anomaly visualization.
"""

import os
import sys
import logging
import random
import datetime
from sqlalchemy import text
import json
from shapely.geometry import Polygon, Point
from app import db, app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Benton County, WA approximate boundaries
BENTON_COUNTY_BOUNDS = {
    "min_lat": 45.9,
    "max_lat": 46.5,
    "min_lon": -120.0,
    "max_lon": -118.8
}

# Sample cities
CITIES = [
    "Kennewick",
    "Richland", 
    "West Richland",
    "Prosser",
    "Benton City"
]

# Sample property types
PROPERTY_TYPES = [
    "residential",
    "commercial",
    "agricultural",
    "industrial",
    "public"
]

# Sample street names
STREET_NAMES = [
    "Main St", "Oak Ave", "Maple Ln", "Washington St", "Columbia Dr",
    "Vineyard Dr", "River Rd", "Canyon Rd", "Cottonwood Dr", "Desert Dr",
    "Orchard Way", "Valley View Rd", "Wine Country Rd", "Farm Rd", "Mountain View Dr",
    "Sunset Blvd", "Yakima St", "Clearwater Ave", "Lewis St", "Edison St"
]

def generate_sample_parcels(count=100):
    """
    Generate sample parcels with geometry data.
    
    Args:
        count: Number of parcels to generate
    """
    with app.app_context():
        try:
            # First check if parcels table exists
            check_tables()
            
            # Generate parcels
            parcels_created = 0
            for i in range(count):
                # Generate parcel data
                parcel_data = generate_parcel_data(i)
                
                # Create the parcel record
                parcel_id = create_parcel_record(parcel_data)
                
                if parcel_id:
                    parcels_created += 1
                
                # Log progress
                if (i + 1) % 20 == 0:
                    logger.info(f"Generated {i + 1} parcels so far")
            
            logger.info(f"Successfully created {parcels_created} sample parcels")
            
        except Exception as e:
            logger.error(f"Error generating sample parcels: {str(e)}")

def check_tables():
    """Check if required tables exist and create them if they don't"""
    try:
        # Check if parcels table exists
        check_query = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'parcels'
        );
        """
        result = db.session.execute(text(check_query))
        parcels_exists = result.scalar()
        
        if not parcels_exists:
            logger.info("Parcels table does not exist. Creating it now.")
            from create_parcels_table import create_parcels_table
            create_parcels_table()
        
    except Exception as e:
        logger.error(f"Error checking tables: {str(e)}")
        raise

def generate_parcel_data(index):
    """
    Generate data for a sample parcel.
    
    Args:
        index: Index number for unique identification
        
    Returns:
        Dictionary with parcel data
    """
    # Generate location within Benton County
    lat = random.uniform(
        BENTON_COUNTY_BOUNDS["min_lat"],
        BENTON_COUNTY_BOUNDS["max_lat"]
    )
    lon = random.uniform(
        BENTON_COUNTY_BOUNDS["min_lon"],
        BENTON_COUNTY_BOUNDS["max_lon"]
    )
    
    # Generate property geometry (simple polygon around point)
    parcel_geometry = generate_parcel_polygon(lat, lon)
    
    # Generate random values for the parcel
    parcel_id = f"R{random.randint(10000000, 99999999)}"
    property_type = random.choice(PROPERTY_TYPES)
    
    # Tax values depend on property type
    if property_type == "residential":
        land_value = random.uniform(50000, 200000)
        improvement_value = random.uniform(150000, 500000)
        square_footage = random.uniform(1000, 4000)
        bedrooms = random.randint(2, 5)
        bathrooms = random.choice([1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0])
    elif property_type == "commercial":
        land_value = random.uniform(100000, 1000000)
        improvement_value = random.uniform(500000, 5000000)
        square_footage = random.uniform(3000, 50000)
        bedrooms = 0
        bathrooms = random.randint(2, 10)
    elif property_type == "agricultural":
        land_value = random.uniform(75000, 500000)
        improvement_value = random.uniform(50000, 300000)
        square_footage = random.uniform(1500, 3000)
        bedrooms = random.randint(2, 4)
        bathrooms = random.randint(1, 3)
    elif property_type == "industrial":
        land_value = random.uniform(150000, 1500000)
        improvement_value = random.uniform(300000, 3000000)
        square_footage = random.uniform(5000, 100000)
        bedrooms = 0
        bathrooms = random.randint(2, 8)
    else:  # public
        land_value = random.uniform(100000, 800000)
        improvement_value = random.uniform(500000, 3000000)
        square_footage = random.uniform(3000, 30000)
        bedrooms = 0
        bathrooms = random.randint(2, 10)
    
    # Calculate total value
    total_value = land_value + improvement_value
    
    # Generate acreage (between 0.1 and 40)
    acreage = random.uniform(0.1, 40)
    
    # Generate address
    house_number = random.randint(100, 9999)
    street_name = random.choice(STREET_NAMES)
    city = random.choice(CITIES)
    address = f"{house_number} {street_name}, {city}, WA"
    zip_code = random.choice(["99301", "99352", "99353", "99350", "99320"])
    
    # Generate year built (between 1900 and 2023)
    year_built = random.randint(1900, 2023)
    
    # Generate last sale date (within the last 20 years)
    days_ago = random.randint(0, 365 * 20)
    last_sale_date = datetime.date.today() - datetime.timedelta(days=days_ago)
    
    # Generate last sale price (roughly related to total value)
    sale_multiplier = random.uniform(0.7, 1.3)
    last_sale_price = total_value * sale_multiplier
    
    # Create the parcel data dictionary
    parcel_data = {
        "parcel_id": parcel_id,
        "apn": f"A{random.randint(10000, 99999)}",
        "account_number": f"ACCT{random.randint(10000, 99999)}",
        "address": address,
        "city": city,
        "state": "WA",
        "zip": zip_code,
        "property_type": property_type,
        "zoning": ("R" if property_type == "residential" else
                 "C" if property_type == "commercial" else
                 "A" if property_type == "agricultural" else
                 "I" if property_type == "industrial" else "P"),
        "year_built": year_built,
        "total_value": total_value,
        "land_value": land_value,
        "improvement_value": improvement_value,
        "tax_year": datetime.date.today().year,
        "square_footage": square_footage,
        "acreage": acreage,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "last_sale_date": last_sale_date,
        "last_sale_price": last_sale_price,
        "geometry": parcel_geometry,
        "data_source": "sample_data",
        "metadata": json.dumps({
            "sample": True,
            "latitude": lat,
            "longitude": lon
        })
    }
    
    return parcel_data

def generate_parcel_polygon(center_lat, center_lon):
    """
    Generate a simple polygon around a center point for a parcel.
    
    Args:
        center_lat: Center latitude
        center_lon: Center longitude
        
    Returns:
        WKT representation of the polygon
    """
    # Calculate a random size for the parcel (in degrees, between ~30 and ~300 meters)
    size = random.uniform(0.0003, 0.003)
    
    # Generate a simple 4-point polygon (slightly randomized rectangle)
    coords = [
        (center_lon - size + random.uniform(-size*0.2, size*0.2), 
         center_lat - size + random.uniform(-size*0.2, size*0.2)),
        
        (center_lon + size + random.uniform(-size*0.2, size*0.2), 
         center_lat - size + random.uniform(-size*0.2, size*0.2)),
        
        (center_lon + size + random.uniform(-size*0.2, size*0.2), 
         center_lat + size + random.uniform(-size*0.2, size*0.2)),
        
        (center_lon - size + random.uniform(-size*0.2, size*0.2), 
         center_lat + size + random.uniform(-size*0.2, size*0.2)),
        
        # Close the polygon by repeating the first point
        (center_lon - size + random.uniform(-size*0.2, size*0.2), 
         center_lat - size + random.uniform(-size*0.2, size*0.2))
    ]
    
    # Create polygon
    polygon = Polygon(coords)
    
    # Get WKT representation
    wkt = polygon.wkt
    
    return f"SRID=4326;{wkt}"

def create_parcel_record(parcel_data):
    """
    Create a parcel record in the database.
    
    Args:
        parcel_data: Dictionary with parcel data
        
    Returns:
        ID of the created parcel record, or None if failed
    """
    try:
        # Build columns and values for the INSERT
        columns = []
        placeholders = []
        values = {}
        
        for key, value in parcel_data.items():
            columns.append(key)
            placeholders.append(f":{key}")
            values[key] = value
        
        # Create the INSERT query
        columns_str = ", ".join(columns)
        placeholders_str = ", ".join(placeholders)
        
        query = f"""
        INSERT INTO parcels ({columns_str})
        VALUES ({placeholders_str})
        RETURNING id
        """
        
        # Execute the query
        result = db.session.execute(text(query), values)
        parcel_id = result.scalar()
        db.session.commit()
        
        return parcel_id
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating parcel record: {str(e)}")
        return None

if __name__ == "__main__":
    # Get count from command line argument if provided
    count = 100
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            logger.error("Invalid count argument. Using default of 100.")
    
    generate_sample_parcels(count)
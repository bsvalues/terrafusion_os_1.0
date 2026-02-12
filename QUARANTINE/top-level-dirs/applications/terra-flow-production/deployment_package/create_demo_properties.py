"""
Create demo properties for the GeoAssessmentPro demonstration.

This script generates sample property data for Benton County, WA to showcase 
the assessment map functionality.
"""

import random
import datetime
import uuid
import json
import logging
from decimal import Decimal
from flask import Flask
from sqlalchemy import create_engine, text
from app import db, app
from models import Property, Assessment, TaxRecord

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Benton County map coordinates (approximate center)
BENTON_CENTER_LAT = 46.227638
BENTON_CENTER_LNG = -119.222046

# Property types with their relative frequencies
PROPERTY_TYPES = {
    'residential': 0.65,
    'commercial': 0.15,
    'agricultural': 0.10,
    'industrial': 0.05,
    'vacant': 0.05
}

# Street names for generating addresses
STREET_NAMES = [
    'Main St', 'Washington Ave', 'Columbia Dr', 'Jadwin Ave', 'Stevens Dr',
    'Clearwater Ave', 'Leslie Rd', 'Keene Rd', 'Gage Blvd', 'Wine Country Rd',
    'Canal Dr', 'Court St', 'Lee Blvd', 'Vineyard Dr', 'Kennewick Ave',
    'Columbia Park Trail', 'Queensgate Dr', 'Van Giesen St', 'George Washington Way',
    'Edison St', 'Swift Blvd', 'Wright Ave', 'Burden Blvd', 'Wellsian Way'
]

# Cities in Benton County
CITIES = {
    'Kennewick': 0.4,
    'Richland': 0.35,
    'West Richland': 0.1,
    'Prosser': 0.08,
    'Benton City': 0.05,
    'Paterson': 0.02
}

# Zoning types
ZONING_TYPES = {
    'residential': ['R1', 'R2', 'R3', 'RM'],
    'commercial': ['C1', 'C2', 'C3', 'CC'],
    'agricultural': ['AG', 'RR-5', 'RR-2'],
    'industrial': ['I1', 'I2', 'BP'],
    'vacant': ['R1', 'C1', 'AG', 'I1']
}

# Property features by type
PROPERTY_FEATURES = {
    'residential': {
        'bedrooms': [1, 2, 3, 4, 5, 6],
        'bathrooms': [1, 1.5, 2, 2.5, 3, 3.5, 4],
        'garage': ['None', '1 car attached', '2 car attached', '3 car attached', 'Detached'],
        'features': ['Fireplace', 'Deck', 'Pool', 'Finished Basement', 'Central Air', 
                     'Hardwood Floors', 'Granite Countertops', 'Updated Kitchen']
    },
    'commercial': {
        'building_type': ['Retail', 'Office', 'Mixed Use', 'Restaurant', 'Hotel', 'Medical'],
        'features': ['Elevator', 'Loading Dock', 'Corner Lot', 'Highway Access', 
                     'High Visibility', 'Ample Parking']
    },
    'agricultural': {
        'land_type': ['Cropland', 'Pasture', 'Orchard', 'Vineyard', 'Mixed Use'],
        'features': ['Irrigation', 'Outbuildings', 'Water Rights', 'Farm Equipment Included']
    },
    'industrial': {
        'building_type': ['Warehouse', 'Manufacturing', 'Distribution', 'Research Facility'],
        'features': ['Loading Dock', 'High Ceilings', 'Rail Access', 'Heavy Power', 
                     'Climate Control', 'Security System']
    }
}

def generate_coordinates(base_lat, base_lng, radius=0.15):
    """Generate random coordinates within a radius of the base point"""
    # Convert radius from degrees to a reasonable distance
    r = random.random() * radius
    theta = random.random() * 2 * 3.14159
    
    # Calculate offset
    lat_offset = r * random.choice([1, -1]) * (0.7 + 0.3 * random.random())
    lng_offset = r * random.choice([1, -1])
    
    return base_lat + lat_offset, base_lng + lng_offset

def generate_address():
    """Generate a random address"""
    number = random.randint(100, 9999)
    street = random.choice(STREET_NAMES)
    
    # Select city based on weighted probabilities
    city = random.choices(
        list(CITIES.keys()),
        weights=list(CITIES.values()),
        k=1
    )[0]
    
    return f"{number} {street}", city

def generate_parcel_id():
    """Generate a realistic parcel ID"""
    return f"R{random.randint(1000000, 9999999)}"

def generate_owner_name():
    """Generate a random owner name"""
    first_names = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Jennifer',
                   'William', 'Maria', 'James', 'Linda', 'Richard', 'Patricia', 'Thomas']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia',
                  'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez']
    
    # Sometimes generate company names for non-residential properties
    if random.random() < 0.3:
        companies = ['ABC Properties LLC', 'Benton Investments', 'Columbia Holdings',
                     'Washington Real Estate Group', 'Tri-Cities Properties', 
                     'Northwest Development Co.', 'River View Estates', 'Desert Valley Farms']
        return random.choice(companies)
        
    return f"{random.choice(first_names)} {random.choice(last_names)}"

def generate_residential_property():
    """Generate data for a residential property"""
    bedrooms = random.choice(PROPERTY_FEATURES['residential']['bedrooms'])
    bathrooms = random.choice(PROPERTY_FEATURES['residential']['bathrooms'])
    year_built = random.randint(1950, 2023)
    lot_size = random.randint(5000, 20000)
    total_area = random.randint(1000, 4000)
    
    # Calculate a realistic value based on features
    base_value = 250000
    base_value += bedrooms * 25000
    base_value += int(bathrooms * 15000)
    base_value += (2023 - year_built) * -1000
    base_value += total_area * 100
    base_value *= random.uniform(0.85, 1.15)  # Add some randomness
    
    # Random features
    num_features = random.randint(1, 5)
    features = random.sample(PROPERTY_FEATURES['residential']['features'], num_features)
    
    return {
        'type': 'residential',
        'bedrooms': bedrooms,
        'bathrooms': bathrooms,
        'year_built': year_built,
        'lot_size': lot_size,
        'total_area': total_area,
        'assessed_value': round(base_value, -3),  # Round to nearest thousand
        'features': {
            'bedrooms': bedrooms,
            'bathrooms': bathrooms,
            'garage': random.choice(PROPERTY_FEATURES['residential']['garage']),
            'amenities': features
        }
    }

def generate_commercial_property():
    """Generate data for a commercial property"""
    building_type = random.choice(PROPERTY_FEATURES['commercial']['building_type'])
    year_built = random.randint(1960, 2020)
    lot_size = random.randint(10000, 100000)
    building_area = random.randint(2000, 50000)
    
    # Calculate a realistic value based on features
    base_value = 750000
    base_value += building_area * 120
    base_value += (2023 - year_built) * -2000
    base_value *= random.uniform(0.9, 1.1)  # Add some randomness
    
    # Random features
    num_features = random.randint(1, 4)
    features = random.sample(PROPERTY_FEATURES['commercial']['features'], num_features)
    
    return {
        'type': 'commercial',
        'building_type': building_type,
        'year_built': year_built,
        'lot_size': lot_size,
        'total_area': building_area,
        'assessed_value': round(base_value, -3),  # Round to nearest thousand
        'features': {
            'building_type': building_type,
            'amenities': features,
            'building_area': building_area,
            'parking_spaces': random.randint(10, 200)
        }
    }

def generate_agricultural_property():
    """Generate data for an agricultural property"""
    land_type = random.choice(PROPERTY_FEATURES['agricultural']['land_type'])
    year_acquired = random.randint(1950, 2015)
    lot_size = random.randint(500000, 5000000)  # 5-50 acres
    
    # Calculate a realistic value based on features
    base_value = 400000
    base_value += lot_size * 0.5
    base_value *= random.uniform(0.8, 1.2)  # Add some randomness
    
    # Random features
    num_features = random.randint(1, 3)
    features = random.sample(PROPERTY_FEATURES['agricultural']['features'], num_features)
    
    return {
        'type': 'agricultural',
        'land_type': land_type,
        'year_built': year_acquired,
        'lot_size': lot_size,
        'assessed_value': round(base_value, -3),  # Round to nearest thousand
        'features': {
            'land_type': land_type,
            'amenities': features,
            'water_rights': random.choice([True, False]),
            'acres': round(lot_size / 43560, 1)  # Convert to acres
        }
    }

def generate_industrial_property():
    """Generate data for an industrial property"""
    building_type = random.choice(PROPERTY_FEATURES['industrial']['building_type'])
    year_built = random.randint(1960, 2015)
    lot_size = random.randint(20000, 200000)
    building_area = random.randint(5000, 100000)
    
    # Calculate a realistic value based on features
    base_value = 950000
    base_value += building_area * 90
    base_value += (2023 - year_built) * -3000
    base_value *= random.uniform(0.9, 1.1)  # Add some randomness
    
    # Random features
    num_features = random.randint(1, 4)
    features = random.sample(PROPERTY_FEATURES['industrial']['features'], num_features)
    
    return {
        'type': 'industrial',
        'building_type': building_type,
        'year_built': year_built,
        'lot_size': lot_size,
        'total_area': building_area,
        'assessed_value': round(base_value, -3),  # Round to nearest thousand
        'features': {
            'building_type': building_type,
            'amenities': features,
            'building_area': building_area,
            'ceiling_height': random.choice([12, 16, 20, 24, 30, 40])
        }
    }

def generate_vacant_property():
    """Generate data for a vacant property"""
    lot_size = random.randint(5000, 100000)
    
    # Calculate a realistic value based on features
    base_value = 50000
    base_value += lot_size * 1.5
    base_value *= random.uniform(0.8, 1.2)  # Add some randomness
    
    return {
        'type': 'vacant',
        'lot_size': lot_size,
        'assessed_value': round(base_value, -3),  # Round to nearest thousand
        'features': {
            'has_utilities': random.choice([True, False]),
            'topography': random.choice(['Flat', 'Sloped', 'Hilly']),
            'zoned_for': random.choice(['Residential', 'Commercial', 'Mixed Use'])
        }
    }

def generate_property():
    """Generate a random property"""
    # Select property type based on weighted probabilities
    property_type = random.choices(
        list(PROPERTY_TYPES.keys()),
        weights=list(PROPERTY_TYPES.values()),
        k=1
    )[0]
    
    # Generate coordinates
    lat, lng = generate_coordinates(BENTON_CENTER_LAT, BENTON_CENTER_LNG)
    
    # Generate address
    address, city = generate_address()
    
    # Generate property details based on type
    if property_type == 'residential':
        details = generate_residential_property()
    elif property_type == 'commercial':
        details = generate_commercial_property()
    elif property_type == 'agricultural':
        details = generate_agricultural_property()
    elif property_type == 'industrial':
        details = generate_industrial_property()
    else:  # vacant
        details = generate_vacant_property()
    
    # Select a zoning type based on property type
    zoning = random.choice(ZONING_TYPES[property_type])
    
    # Generate purchase details
    years_owned = random.randint(1, 20)
    purchase_date = datetime.date.today() - datetime.timedelta(days=365 * years_owned)
    purchase_price = int(details['assessed_value'] * random.uniform(0.7, 0.95))
    
    # Create a unified property object
    property_obj = Property(
        id=uuid.uuid4(),
        parcel_id=generate_parcel_id(),
        address=address,
        city=city,
        state='WA',
        zip_code=random.choice(['99336', '99352', '99353', '99320', '99321']),
        property_type=property_type,
        lot_size=details['lot_size'],
        year_built=details.get('year_built'),
        bedrooms=details.get('bedrooms'),
        bathrooms=details.get('bathrooms'),
        total_area=details.get('total_area'),
        owner_name=generate_owner_name(),
        owner_address=f"{random.randint(100, 9999)} {random.choice(STREET_NAMES)}",
        purchase_date=purchase_date,
        purchase_price=purchase_price,
        features=details['features'],
        location={
            'type': 'Point',
            'coordinates': [lng, lat]
        },
        property_metadata={
            'zoning': f"{zoning} - {property_type.capitalize()}",
            'school_district': random.choice([
                'Kennewick School District', 
                'Richland School District',
                'Prosser School District',
                'Kiona-Benton School District'
            ]),
            'flood_zone': random.choice(['None', 'Low', 'Medium', 'High']),
            'property_class': random.choice(['A', 'B', 'C']) if property_type != 'residential' else None
        },
        assessed_value=details['assessed_value']
    )
    
    return property_obj

def create_assessment(property_obj, year):
    """Create an assessment record for a property"""
    # Base the assessment value on the property's assessed value
    assessed_value = property_obj.assessed_value
    
    # Add some variation to make it more realistic
    variation = random.uniform(0.9, 1.1)
    if year == datetime.date.today().year:
        # Current year assessment matches the property's assessed value
        adjusted_value = assessed_value
    else:
        # Previous years have different values
        year_diff = datetime.date.today().year - year
        adjusted_value = int(assessed_value * (1 - year_diff * 0.03) * variation)
    
    # Split into land and improvements
    if property_obj.property_type in ['residential', 'commercial', 'industrial']:
        land_ratio = random.uniform(0.2, 0.4)
    elif property_obj.property_type == 'agricultural':
        land_ratio = random.uniform(0.7, 0.9)
    else:  # vacant
        land_ratio = 0.95
    
    land_value = int(adjusted_value * land_ratio)
    improvement_value = adjusted_value - land_value
    
    # Create assessment
    assessment = Assessment(
        id=uuid.uuid4(),
        property_id=property_obj.id,
        assessment_date=datetime.date(year, 1, 1),
        assessor_id=random.randint(1, 5),
        land_value=land_value,
        improvement_value=improvement_value,
        total_value=adjusted_value,
        valuation_method=random.choice(['cost', 'income', 'market']),
        notes=f"Annual assessment for tax year {year}",
        status='complete',
        created_at=datetime.datetime(year, random.randint(1, 6), random.randint(1, 28))
    )
    
    return assessment

def create_tax_record(property_obj, assessment, year):
    """Create a tax record for a property based on an assessment"""
    # Calculate tax amount based on assessment value and a tax rate
    tax_rate = random.uniform(0.008, 0.012)
    tax_amount = round(float(assessment.total_value) * tax_rate, 2)
    
    # Create tax record
    tax_record = TaxRecord(
        id=uuid.uuid4(),
        property_id=property_obj.id,
        tax_year=year,
        land_value=assessment.land_value,
        improvement_value=assessment.improvement_value,
        total_value=assessment.total_value,
        tax_amount=tax_amount,
        tax_rate=tax_rate,
        status=random.choice(['paid', 'unpaid']) if year == datetime.date.today().year else 'paid'
    )
    
    return tax_record

def create_demo_properties(count=100):
    """Create demo properties for the GeoAssessmentPro demonstration"""
    logger.info(f"Creating {count} demo properties...")
    current_year = datetime.date.today().year
    
    # Get existing property count
    existing_count = Property.query.count()
    if existing_count > 0:
        logger.info(f"Found {existing_count} existing properties in the database")
        proceed = input(f"Do you want to add {count} more properties? (y/n): ")
        if proceed.lower() != 'y':
            logger.info("Aborting property creation")
            return
    
    try:
        # Create properties
        for i in range(count):
            if i % 10 == 0:
                logger.info(f"Creating property {i+1}/{count}...")
            
            # Generate a new property
            property_obj = generate_property()
            
            # Add to database
            db.session.add(property_obj)
            db.session.flush()  # Flush to get the ID
            
            # Create assessments for the last 5 years
            for year in range(current_year - 4, current_year + 1):
                assessment = create_assessment(property_obj, year)
                db.session.add(assessment)
                
                # Create tax record based on assessment
                tax_record = create_tax_record(property_obj, assessment, year)
                db.session.add(tax_record)
        
        # Commit all changes
        db.session.commit()
        logger.info(f"Successfully created {count} demo properties with assessments and tax records")
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating demo properties: {str(e)}")
        raise

def main():
    """Main function"""
    with app.app_context():
        create_demo_properties()

if __name__ == "__main__":
    main()
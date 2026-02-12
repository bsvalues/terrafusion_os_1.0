"""
Create a small set of sample properties for the GeoAssessmentPro demonstration.
"""

import random
import datetime
import uuid
import json
import logging
from decimal import Decimal
from app import db, app
from models import Property, Assessment, TaxRecord

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sample property data
SAMPLE_PROPERTIES = [
    {
        "address": "123 Main St",
        "city": "Kennewick",
        "state": "WA",
        "zip_code": "99336",
        "property_type": "residential",
        "lot_size": 8500,
        "year_built": 1995,
        "bedrooms": 3,
        "bathrooms": 2,
        "total_area": 2100,
        "owner_name": "John Smith",
        "lat": 46.226,
        "lng": -119.210,
        "assessed_value": 320000,
        "features": {
            "bedrooms": 3,
            "bathrooms": 2,
            "garage": "2 car attached",
            "amenities": ["Fireplace", "Deck"]
        },
        "zoning": "R1 - Residential"
    },
    {
        "address": "456 Oak Ave",
        "city": "Richland",
        "state": "WA",
        "zip_code": "99352",
        "property_type": "residential",
        "lot_size": 10200,
        "year_built": 2005,
        "bedrooms": 4,
        "bathrooms": 2.5,
        "total_area": 2800,
        "owner_name": "Sarah Johnson",
        "lat": 46.275,
        "lng": -119.280,
        "assessed_value": 425000,
        "features": {
            "bedrooms": 4,
            "bathrooms": 2.5,
            "garage": "3 car attached",
            "amenities": ["Fireplace", "Deck", "Pool", "Hardwood Floors"]
        },
        "zoning": "R1 - Residential"
    },
    {
        "address": "789 Commerce Blvd",
        "city": "Kennewick",
        "state": "WA",
        "zip_code": "99336",
        "property_type": "commercial",
        "lot_size": 25000,
        "year_built": 2000,
        "total_area": 15000,
        "owner_name": "Tri-Cities Properties LLC",
        "lat": 46.215,
        "lng": -119.235,
        "assessed_value": 1250000,
        "features": {
            "building_type": "Retail",
            "building_area": 15000,
            "parking_spaces": 50,
            "amenities": ["Corner Lot", "Highway Access", "High Visibility"]
        },
        "zoning": "C1 - Commercial"
    },
    {
        "address": "101 Industrial Way",
        "city": "Richland",
        "state": "WA",
        "zip_code": "99352",
        "property_type": "industrial",
        "lot_size": 50000,
        "year_built": 1980,
        "total_area": 30000,
        "owner_name": "Columbia Manufacturing Inc",
        "lat": 46.265,
        "lng": -119.295,
        "assessed_value": 1850000,
        "features": {
            "building_type": "Manufacturing",
            "building_area": 30000,
            "ceiling_height": 24,
            "amenities": ["Loading Dock", "High Ceilings", "Heavy Power"]
        },
        "zoning": "I1 - Industrial"
    },
    {
        "address": "222 Vineyard Dr",
        "city": "Prosser",
        "state": "WA",
        "zip_code": "99350",
        "property_type": "agricultural",
        "lot_size": 2000000,
        "year_built": 1975,
        "owner_name": "Washington Wine Growers",
        "lat": 46.180,
        "lng": -119.310,
        "assessed_value": 780000,
        "features": {
            "land_type": "Vineyard",
            "water_rights": True,
            "acres": 45.9,
            "amenities": ["Irrigation", "Outbuildings"]
        },
        "zoning": "AG - Agricultural"
    },
    {
        "address": "555 Future Development",
        "city": "West Richland",
        "state": "WA",
        "zip_code": "99353",
        "property_type": "vacant",
        "lot_size": 15000,
        "owner_name": "Benton Investments LLC",
        "lat": 46.295,
        "lng": -119.360,
        "assessed_value": 125000,
        "features": {
            "has_utilities": True,
            "topography": "Flat",
            "zoned_for": "Residential"
        },
        "zoning": "R1 - Residential"
    }
]

def create_property(data):
    """Create a property from data"""
    # Create purchase date and price
    years_owned = random.randint(1, 10)
    purchase_date = datetime.date.today() - datetime.timedelta(days=365 * years_owned)
    purchase_price = int(data['assessed_value'] * random.uniform(0.7, 0.95))
    
    # Create property object
    property_obj = Property(
        id=uuid.uuid4(),
        parcel_id=f"R{random.randint(1000000, 9999999)}",
        address=data['address'],
        city=data['city'],
        state=data['state'],
        zip_code=data['zip_code'],
        property_type=data['property_type'],
        lot_size=data['lot_size'],
        year_built=data.get('year_built'),
        bedrooms=data.get('bedrooms'),
        bathrooms=data.get('bathrooms'),
        total_area=data.get('total_area'),
        owner_name=data['owner_name'],
        owner_address=f"{random.randint(100, 9999)} Some St",
        purchase_date=purchase_date,
        purchase_price=purchase_price,
        features=data['features'],
        location={
            'type': 'Point',
            'coordinates': [data['lng'], data['lat']]
        },
        property_metadata={
            'zoning': data['zoning'],
            'school_district': random.choice([
                'Kennewick School District', 
                'Richland School District',
                'Prosser School District'
            ]),
            'flood_zone': 'None'
        },
        assessed_value=data['assessed_value']
    )
    
    return property_obj

def create_assessment(property_obj, year):
    """Create an assessment record for a property"""
    # Base the assessment value on the property's assessed value
    assessed_value = property_obj.assessed_value
    
    # Add some variation for previous years
    if year < datetime.date.today().year:
        # Previous years have lower values
        year_diff = datetime.date.today().year - year
        adjustment = 1 - (year_diff * 0.03)
        adjusted_value = int(assessed_value * adjustment)
    else:
        # Current year assessment matches the property's assessed value
        adjusted_value = assessed_value
    
    # Split into land and improvements
    if property_obj.property_type in ['residential', 'commercial', 'industrial']:
        land_ratio = 0.3
    elif property_obj.property_type == 'agricultural':
        land_ratio = 0.8
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
    tax_rate = 0.01  # 1% tax rate
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
        status='paid'
    )
    
    return tax_record

def create_sample_properties():
    """Create sample properties from predefined data"""
    logger.info(f"Creating {len(SAMPLE_PROPERTIES)} sample properties...")
    current_year = datetime.date.today().year
    
    # Get existing property count
    existing_count = Property.query.count()
    if existing_count > 0:
        logger.info(f"Found {existing_count} existing properties in the database")
    
    try:
        # Create properties from sample data
        for data in SAMPLE_PROPERTIES:
            # Create property
            property_obj = create_property(data)
            
            # Add to database
            db.session.add(property_obj)
            db.session.flush()  # Flush to get the ID
            
            # Create assessments for the last 3 years
            for year in range(current_year - 2, current_year + 1):
                assessment = create_assessment(property_obj, year)
                db.session.add(assessment)
                
                # Create tax record based on assessment
                tax_record = create_tax_record(property_obj, assessment, year)
                db.session.add(tax_record)
        
        # Commit all changes
        db.session.commit()
        logger.info(f"Successfully created {len(SAMPLE_PROPERTIES)} sample properties with assessments and tax records")
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating sample properties: {str(e)}")
        raise

def main():
    """Main function"""
    with app.app_context():
        create_sample_properties()

if __name__ == "__main__":
    main()
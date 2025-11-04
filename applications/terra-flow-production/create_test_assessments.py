"""
Create test assessment records directly using SQLAlchemy.
"""

import uuid
import logging
import datetime
from decimal import Decimal
import random
from app import db, app
from models import Property, Assessment, TaxRecord

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_data():
    """Create test property data with SQLAlchemy"""
    try:
        with app.app_context():
            # Check if we already have properties
            existing_count = Property.query.count()
            if existing_count > 0:
                logger.info(f"Found {existing_count} existing properties in database")
                proceed = input(f"Database already has {existing_count} properties. Add more? (y/n): ")
                if proceed.lower() != 'y':
                    logger.info("Operation canceled by user")
                    return

            # Create test properties
            logger.info("Creating test properties...")
            
            # Sample data for a residential property
            prop1 = Property(
                id=uuid.uuid4(),
                parcel_id="R1234567",
                address="123 Main St",
                city="Kennewick",
                state="WA",
                zip_code="99336",
                property_type="residential",
                lot_size=8500,
                year_built=1995,
                bedrooms=3,
                bathrooms=2,
                total_area=2100,
                owner_name="John Smith",
                owner_address="789 Oak Ave",
                purchase_date=datetime.date(2015, 6, 15),
                purchase_price=Decimal('285000'),
                features={
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "garage": "2 car attached",
                    "amenities": ["Fireplace", "Deck"]
                },
                location={
                    "type": "Point",
                    "coordinates": [-119.210, 46.226]
                },
                property_metadata={
                    "zoning": "R1 - Residential",
                    "school_district": "Kennewick School District",
                    "flood_zone": "None"
                }
            )
            
            # Sample data for a commercial property
            prop2 = Property(
                id=uuid.uuid4(),
                parcel_id="C7654321",
                address="789 Commerce Blvd",
                city="Kennewick",
                state="WA",
                zip_code="99336",
                property_type="commercial",
                lot_size=25000,
                year_built=2000,
                total_area=15000,
                owner_name="Tri-Cities Properties LLC",
                owner_address="100 Business Plaza",
                purchase_date=datetime.date(2010, 8, 10),
                purchase_price=Decimal('950000'),
                features={
                    "building_type": "Retail",
                    "building_area": 15000,
                    "parking_spaces": 50,
                    "amenities": ["Corner Lot", "Highway Access"]
                },
                location={
                    "type": "Point",
                    "coordinates": [-119.235, 46.215]
                },
                property_metadata={
                    "zoning": "C1 - Commercial",
                    "property_class": "B",
                    "flood_zone": "None"
                }
            )
            
            # Sample data for a agricultural property
            prop3 = Property(
                id=uuid.uuid4(),
                parcel_id="A9876543",
                address="222 Vineyard Dr",
                city="Prosser",
                state="WA",
                zip_code="99350",
                property_type="agricultural",
                lot_size=2000000,
                year_built=1975,
                owner_name="Washington Wine Growers",
                owner_address="300 Farm Road",
                purchase_date=datetime.date(2005, 3, 15),
                purchase_price=Decimal('680000'),
                features={
                    "land_type": "Vineyard",
                    "water_rights": True,
                    "acres": 45.9,
                    "amenities": ["Irrigation", "Outbuildings"]
                },
                location={
                    "type": "Point",
                    "coordinates": [-119.310, 46.180]
                },
                property_metadata={
                    "zoning": "AG - Agricultural",
                    "flood_zone": "None"
                }
            )
            
            # Add properties to session
            db.session.add(prop1)
            db.session.add(prop2)
            db.session.add(prop3)
            
            # Flush to get IDs
            db.session.flush()
            
            # Create assessment records
            logger.info("Creating assessment records...")
            current_year = datetime.datetime.now().year
            
            for prop in [prop1, prop2, prop3]:
                property_id = prop.id
                base_value = prop.purchase_price * Decimal('1.2')  # 20% increase from purchase price
                
                # Create assessments for the last 3 years
                for year in range(current_year - 2, current_year + 1):
                    # Calculate assessment value with some variation
                    adjustment = Decimal(1 - ((current_year - year) * 0.03))
                    total_value = int(base_value * adjustment)
                    
                    # Split into land and improvement values
                    if prop.property_type == 'residential':
                        land_ratio = Decimal('0.3')
                    elif prop.property_type == 'commercial':
                        land_ratio = Decimal('0.25')
                    else:  # agricultural
                        land_ratio = Decimal('0.8')
                        
                    land_value = int(total_value * land_ratio)
                    improvement_value = total_value - land_value
                    
                    # Create assessment
                    assessment = Assessment(
                        id=uuid.uuid4(),
                        property_id=property_id,
                        assessment_date=datetime.date(year, 1, 1),
                        assessor_id=random.randint(1, 5),
                        land_value=land_value,
                        improvement_value=improvement_value,
                        total_value=total_value,
                        valuation_method=random.choice(['cost', 'income', 'market']),
                        notes=f"Annual assessment for tax year {year}",
                        status='complete',
                        created_at=datetime.datetime(year, random.randint(1, 6), random.randint(1, 28))
                    )
                    
                    db.session.add(assessment)
                    
                    # Create tax record based on assessment
                    tax_rate = Decimal('0.01')  # 1% tax rate
                    tax_amount = round(total_value * tax_rate, 2)
                    
                    tax_record = TaxRecord(
                        id=uuid.uuid4(),
                        property_id=property_id,
                        tax_year=year,
                        land_value=land_value,
                        improvement_value=improvement_value,
                        total_value=total_value,
                        tax_amount=tax_amount,
                        tax_rate=tax_rate,
                        status=random.choice(['paid', 'unpaid']) if year == current_year else 'paid'
                    )
                    
                    db.session.add(tax_record)
            
            # Commit all changes
            db.session.commit()
            logger.info("Successfully created test properties with assessments and tax records")
            
    except Exception as e:
        logger.error(f"Error creating test data: {str(e)}")
        db.session.rollback()
        raise

if __name__ == "__main__":
    create_test_data()
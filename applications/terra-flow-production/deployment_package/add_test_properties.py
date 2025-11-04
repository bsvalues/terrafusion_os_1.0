"""
Add test properties directly to the database for assessment map testing.
"""
import psycopg2
import os
import uuid
import logging
import json
import datetime
from decimal import Decimal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get database URL from environment
DATABASE_URL = os.environ.get("DATABASE_URL")

def insert_test_properties():
    """Insert test properties directly to the database"""
    conn = None
    cursor = None
    
    if not DATABASE_URL:
        logger.error("DATABASE_URL environment variable not set")
        return False
        
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Create test properties
        test_properties = [
            {
                "id": str(uuid.uuid4()),
                "parcel_id": "R1234567",
                "address": "123 Main St",
                "city": "Kennewick",
                "state": "WA",
                "zip_code": "99336",
                "property_type": "residential",
                "lot_size": 8500,
                "year_built": 1995,
                "bedrooms": 3,
                "bathrooms": 2,
                "owner_name": "John Smith",
                "owner_address": "789 Oak Ave",
                "purchase_date": "2015-06-15",
                "purchase_price": 285000,
                "assessed_value": 320000,
                "features": {
                    "garage": "2 car attached",
                    "amenities": ["Fireplace", "Deck"]
                },
                "location": {
                    "type": "Point",
                    "coordinates": [-119.210, 46.226]
                },
                "property_metadata": {
                    "zoning": "R1 - Residential",
                    "school_district": "Kennewick School District",
                    "flood_zone": "None"
                }
            },
            {
                "id": str(uuid.uuid4()),
                "parcel_id": "R7654321",
                "address": "456 Oak Ave",
                "city": "Richland",
                "state": "WA",
                "zip_code": "99352",
                "property_type": "residential",
                "lot_size": 10200,
                "year_built": 2005,
                "bedrooms": 4,
                "bathrooms": 2.5,
                "owner_name": "Sarah Johnson",
                "owner_address": "123 Pine St",
                "purchase_date": "2018-04-22",
                "purchase_price": 375000,
                "assessed_value": 425000,
                "features": {
                    "garage": "3 car attached",
                    "amenities": ["Fireplace", "Deck", "Pool"]
                },
                "location": {
                    "type": "Point",
                    "coordinates": [-119.280, 46.275]
                },
                "property_metadata": {
                    "zoning": "R1 - Residential",
                    "school_district": "Richland School District",
                    "flood_zone": "None"
                }
            },
            {
                "id": str(uuid.uuid4()),
                "parcel_id": "C1234567",
                "address": "789 Commerce Blvd",
                "city": "Kennewick",
                "state": "WA",
                "zip_code": "99336",
                "property_type": "commercial",
                "lot_size": 25000,
                "year_built": 2000,
                "owner_name": "Tri-Cities Properties LLC",
                "owner_address": "100 Business Plaza",
                "purchase_date": "2010-08-10",
                "purchase_price": 950000,
                "assessed_value": 1250000,
                "features": {
                    "building_type": "Retail",
                    "building_area": 15000,
                    "parking_spaces": 50,
                    "amenities": ["Corner Lot", "Highway Access"]
                },
                "location": {
                    "type": "Point",
                    "coordinates": [-119.235, 46.215]
                },
                "property_metadata": {
                    "zoning": "C1 - Commercial",
                    "property_class": "B",
                    "flood_zone": "None"
                }
            }
        ]
        
        # Insert properties
        for prop in test_properties:
            prop_id = prop["id"]
            now = datetime.datetime.now().isoformat()
            
            # Extract lat/lng from location JSON for map display
            lat = prop["location"]["coordinates"][1]
            lng = prop["location"]["coordinates"][0]
            
            # Convert JSON fields
            features_json = json.dumps(prop["features"])
            location_json = json.dumps(prop["location"])
            metadata_json = json.dumps(prop["property_metadata"])
            
            # SQL insert statement - using actual database schema
            cursor.execute("""
                INSERT INTO properties (
                    id, parcel_id, address, city, state, zip_code, property_type,
                    lot_size, year_built, bedrooms, bathrooms,
                    owner_name, owner_address, purchase_date, purchase_price,
                    features, location, property_metadata,
                    created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, 
                    %s, %s, %s, %s, 
                    %s, %s, %s, %s, 
                    %s, %s, %s,
                    %s, %s
                )
            """, (
                prop_id, prop["parcel_id"], prop["address"], prop["city"], 
                prop["state"], prop["zip_code"], prop["property_type"],
                prop["lot_size"], prop["year_built"], prop["bedrooms"], prop["bathrooms"],
                prop["owner_name"], prop["owner_address"], prop["purchase_date"], prop["purchase_price"],
                features_json, location_json, metadata_json,
                now, now
            ))
            
            # Create assessment records
            current_year = datetime.datetime.now().year
            for year in range(current_year - 2, current_year + 1):
                assessment_id = str(uuid.uuid4())
                assessment_date = f"{year}-01-01"
                
                # Calculate values based on year
                year_diff = current_year - year
                adjustment = 1 - (year_diff * 0.03)
                
                total_value = int(prop["assessed_value"] * adjustment)
                
                # Split values based on property type
                if prop["property_type"] == "residential":
                    land_ratio = 0.3
                elif prop["property_type"] == "commercial":
                    land_ratio = 0.25
                else:
                    land_ratio = 0.5
                    
                land_value = int(total_value * land_ratio)
                improvement_value = total_value - land_value
                
                # Insert assessment record
                cursor.execute("""
                    INSERT INTO assessments (
                        id, property_id, assessment_date, land_value, improvement_value,
                        total_value, valuation_method, notes, status, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    assessment_id, prop_id, assessment_date, land_value, improvement_value,
                    total_value, "market", f"Assessment for tax year {year}", "complete",
                    now, now
                ))
                
                # Create tax record
                tax_id = str(uuid.uuid4())
                tax_rate = 0.01  # 1% tax rate
                tax_amount = round(total_value * tax_rate, 2)
                
                cursor.execute("""
                    INSERT INTO tax_records (
                        id, property_id, tax_year, land_value, improvement_value,
                        total_value, tax_amount, tax_rate, status
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    tax_id, prop_id, year, land_value, improvement_value,
                    total_value, tax_amount, tax_rate, "paid"
                ))
                
        # Commit changes
        conn.commit()
        
        # Log success
        logger.info(f"Successfully inserted {len(test_properties)} test properties with assessments and tax records")
        return True
        
    except Exception as e:
        logger.error(f"Error inserting test properties: {str(e)}")
        if conn:
            conn.rollback()
        return False
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    insert_test_properties()
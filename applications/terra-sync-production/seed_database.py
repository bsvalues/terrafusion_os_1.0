"""
Seed database with sample property and district data
"""
import os
import json
from datetime import datetime
from app import app, db
from models import Property, DistrictBoundary, County
import uuid

def seed_counties():
    """Create sample counties"""
    counties = [
        {'county_id': 'benton-wa', 'name': 'Benton County', 'state': 'WA'},
        {'county_id': 'franklin-wa', 'name': 'Franklin County', 'state': 'WA'},
        {'county_id': 'walla-walla-wa', 'name': 'Walla Walla County', 'state': 'WA'},
    ]
    
    for county_data in counties:
        existing = County.query.filter_by(county_id=county_data['county_id']).first()
        if not existing:
            county = County(
                county_id=county_data['county_id'],
                name=county_data['name'],
                state=county_data['state']
            )
            db.session.add(county)
    
    db.session.commit()
    print("Counties seeded successfully")

def seed_properties():
    """Create sample property records"""
    properties = []
    
    # Sample property data for Benton County
    base_properties = [
        {
            'parcel_number': 'BEN001234567',
            'owner_name': 'Smith, John & Mary',
            'owner_address': '123 Main St, Richland, WA 99352',
            'property_address': '456 Oak Ave, Richland, WA 99352',
            'assessed_value': 285000.0,
            'tax_amount': 3420.0,
            'property_type': 'Residential',
            'acreage': 0.25,
            'zoning': 'R-1',
            'exemptions': ['homestead']
        },
        {
            'parcel_number': 'BEN001234568',
            'owner_name': 'Johnson Properties LLC',
            'owner_address': '789 Business Blvd, Kennewick, WA 99336',
            'property_address': '321 Commerce St, Kennewick, WA 99336',
            'assessed_value': 450000.0,
            'tax_amount': 5400.0,
            'property_type': 'Commercial',
            'acreage': 0.75,
            'zoning': 'C-2',
            'exemptions': []
        },
        {
            'parcel_number': 'BEN001234569',
            'owner_name': 'Davis Farm Holdings',
            'owner_address': 'PO Box 123, Prosser, WA 99350',
            'property_address': '1500 Country Rd, Prosser, WA 99350',
            'assessed_value': 750000.0,
            'tax_amount': 9000.0,
            'property_type': 'Agricultural',
            'acreage': 40.0,
            'zoning': 'AG',
            'exemptions': ['agricultural', 'open_space']
        },
        {
            'parcel_number': 'BEN001234570',
            'owner_name': 'Wilson, Robert',
            'owner_address': '555 River Rd, West Richland, WA 99353',
            'property_address': '555 River Rd, West Richland, WA 99353',
            'assessed_value': 325000.0,
            'tax_amount': 3900.0,
            'property_type': 'Residential',
            'acreage': 0.33,
            'zoning': 'R-2',
            'exemptions': ['homestead', 'senior']
        },
        {
            'parcel_number': 'BEN001234571',
            'owner_name': 'Tech Industrial Corp',
            'owner_address': '999 Industrial Way, Richland, WA 99352',
            'property_address': '999 Industrial Way, Richland, WA 99352',
            'assessed_value': 1200000.0,
            'tax_amount': 14400.0,
            'property_type': 'Industrial',
            'acreage': 5.0,
            'zoning': 'I-1',
            'exemptions': []
        }
    ]
    
    for i, prop_data in enumerate(base_properties):
        property_id = f"PROP_{uuid.uuid4().hex[:8].upper()}"
        
        # Check if property already exists
        existing = Property.query.filter_by(parcel_number=prop_data['parcel_number']).first()
        if existing:
            continue
            
        property_record = Property(
            property_id=property_id,
            county_id='benton-wa',
            parcel_number=prop_data['parcel_number'],
            owner_name=prop_data['owner_name'],
            owner_address=prop_data['owner_address'],
            property_address=prop_data['property_address'],
            assessed_value=prop_data['assessed_value'],
            tax_amount=prop_data['tax_amount'],
            property_type=prop_data['property_type'],
            acreage=prop_data['acreage'],
            zoning=prop_data['zoning'],
            exemptions=json.dumps(prop_data['exemptions']),
            last_updated=datetime.now(),
            updated_by='system'
        )
        
        db.session.add(property_record)
    
    db.session.commit()
    print("Properties seeded successfully")

def seed_districts():
    """Create sample district boundaries"""
    districts = [
        {
            'district_id': 'SCHOOL_001',
            'district_name': 'Richland School District',
            'district_type': 'School',
            'tax_rate': 0.008,
            'population': 45000,
            'area_square_miles': 85.2,
            'boundary_coordinates': [
                [-119.3, 46.3], [-119.2, 46.3], [-119.2, 46.2], [-119.3, 46.2], [-119.3, 46.3]
            ]
        },
        {
            'district_id': 'FIRE_001',
            'district_name': 'Benton County Fire District #1',
            'district_type': 'Fire',
            'tax_rate': 0.002,
            'population': 25000,
            'area_square_miles': 120.5,
            'boundary_coordinates': [
                [-119.4, 46.4], [-119.1, 46.4], [-119.1, 46.1], [-119.4, 46.1], [-119.4, 46.4]
            ]
        },
        {
            'district_id': 'WATER_001',
            'district_name': 'Columbia River Water District',
            'district_type': 'Water',
            'tax_rate': 0.001,
            'population': 35000,
            'area_square_miles': 95.8,
            'boundary_coordinates': [
                [-119.35, 46.35], [-119.15, 46.35], [-119.15, 46.15], [-119.35, 46.15], [-119.35, 46.35]
            ]
        },
        {
            'district_id': 'LIBRARY_001',
            'district_name': 'Mid-Columbia Libraries',
            'district_type': 'Library',
            'tax_rate': 0.0005,
            'population': 55000,
            'area_square_miles': 200.0,
            'boundary_coordinates': [
                [-119.5, 46.5], [-119.0, 46.5], [-119.0, 46.0], [-119.5, 46.0], [-119.5, 46.5]
            ]
        }
    ]
    
    for district_data in districts:
        # Check if district already exists
        existing = DistrictBoundary.query.filter_by(
            district_id=district_data['district_id'],
            county_id='benton-wa'
        ).first()
        if existing:
            continue
            
        district = DistrictBoundary(
            district_id=district_data['district_id'],
            county_id='benton-wa',
            district_name=district_data['district_name'],
            district_type=district_data['district_type'],
            tax_rate=district_data['tax_rate'],
            boundary_coordinates=json.dumps(district_data['boundary_coordinates']),
            population=district_data['population'],
            area_square_miles=district_data['area_square_miles']
        )
        
        db.session.add(district)
    
    db.session.commit()
    print("Districts seeded successfully")

def main():
    """Seed the database with sample data"""
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("Database tables created")
            
            # Seed data
            seed_counties()
            seed_properties()
            seed_districts()
            
            print("Database seeding completed successfully")
            
        except Exception as e:
            print(f"Error seeding database: {str(e)}")
            db.session.rollback()

if __name__ == '__main__':
    main()
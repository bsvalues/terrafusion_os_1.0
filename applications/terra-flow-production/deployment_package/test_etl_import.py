"""
ETL Import Test Script

This script tests the functionality of the Enhanced ETL module 
by importing sample property data and verifying the results.
"""

import os
import sys
import pandas as pd
from sync_service.enhanced_etl import get_enhanced_etl

def test_etl_import():
    """Test ETL import from CSV file"""
    print("Testing ETL import functionality...")
    
    # Get sample data file path
    file_path = os.path.join(os.getcwd(), 'uploads', 'sample_property_data.csv')
    if not os.path.exists(file_path):
        print(f"Error: Sample data file not found at {file_path}")
        return False
    
    # Create ETL instance
    etl = get_enhanced_etl()
    
    # Execute ETL pipeline with debug mode
    print("\nLoading data from:", file_path)
    
    # First, extract the data and look at the columns
    source_data = etl.extract_from_file(file_path)
    print("\nSource data columns:", list(source_data.columns))
    print("Source data shape:", source_data.shape)
    print("First row:", source_data.iloc[0].to_dict())
    
    # Get the target schema
    target_schema = etl.schemas.get("property", {})
    print("\nTarget schema keys:", list(target_schema.keys()))
    
    # Create a field mapping manually
    field_mapping = {
        "property_id": "PropertyID",
        "parcel_number": "ParcelNumber",
        "property_type": "PropertyType",
        "address": "StreetAddress",
        "city": "City",
        "state": "State",
        "zip": "ZipCode",
        "owner_name": "OwnerName",
        "owner_address": "OwnerAddress",
        "assessed_value": "AssessedValue",
        "land_value": "LandValue",
        "improvement_value": "ImprovementValue",
        "year_built": "YearBuilt",
        "square_footage": "SquareFootage",
        "bedrooms": "Bedrooms",
        "bathrooms": "Bathrooms",
        "last_sale_date": "LastSaleDate",
        "last_sale_price": "LastSalePrice",
        "latitude": "Latitude",
        "longitude": "Longitude",
        "legal_description": "LegalDescription",
        "zoning": "ZoningCode",
        "neighborhood_code": "NeighborhoodCode",
        "tax_code_area": "TaxCodeArea"
    }
    
    # Transform the data manually first to debug the issue
    transformed_data = etl.transform_data(
        source_data=source_data,
        target_schema=target_schema,
        field_mapping=field_mapping
    )
    
    print("\nTransformed data shape:", transformed_data.shape)
    if not transformed_data.empty:
        print("Transformed data columns:", list(transformed_data.columns))
        print("First transformed row:", transformed_data.iloc[0].to_dict())
    
    # Now execute the pipeline
    results = etl.execute_etl_pipeline(
        source_connection=file_path,
        source_query="",
        data_type="property",
        source_type="file",
        field_mapping=field_mapping  # Add the field mapping
    )
    
    # Print results
    print("\nETL Pipeline Results:")
    print(f"Status: {results['status']}")
    print(f"Message: {results['message']}")
    print("\nExtract Phase:")
    print(f"Success: {results['extract']['success']}")
    print(f"Records: {results['extract']['records']}")
    print(f"Message: {results['extract']['message']}")
    print("\nTransform Phase:")
    print(f"Success: {results['transform']['success']}")
    print(f"Records: {results['transform']['records']}")
    print(f"Message: {results['transform']['message']}")
    print("\nValidate Phase:")
    print(f"Success: {results['validate']['success']}")
    print(f"Valid Records: {results['validate']['valid_records']}")
    print(f"Invalid Records: {results['validate']['invalid_records']}")
    print(f"Message: {results['validate']['message']}")
    print("\nLoad Phase:")
    print(f"Success: {results['load']['success']}")
    print(f"Records: {results['load']['records']}")
    print(f"Message: {results['load']['message']}")
    
    # Final result
    if results['status'] == 'success':
        print("\nETL import test completed successfully!")
        return True
    else:
        print("\nETL import test failed.")
        return False

def check_imported_data():
    """Check if data was correctly imported to database"""
    try:
        from app import db
        
        # Query the property_data table
        query = "SELECT COUNT(*) FROM property_data"
        result = db.session.execute(query).scalar()
        
        print(f"\nVerifying imported data...")
        print(f"Records in property_data table: {result}")
        
        if result > 0:
            # Get a sample record
            query = "SELECT * FROM property_data LIMIT 1"
            row = db.session.execute(query).fetchone()
            
            # Print sample record
            print("\nSample record:")
            for column, value in row._mapping.items():
                print(f"{column}: {value}")
                
            return True
        else:
            print("No records found in property_data table.")
            return False
    except Exception as e:
        print(f"Error checking imported data: {str(e)}")
        return False

if __name__ == "__main__":
    # Initialize Flask app context
    try:
        from app import app
        with app.app_context():
            # Run tests
            if test_etl_import():
                check_imported_data()
    except ImportError:
        print("Error: Could not import Flask app.")
        sys.exit(1)
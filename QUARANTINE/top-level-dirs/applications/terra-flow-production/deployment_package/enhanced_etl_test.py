"""
Enhanced ETL Test with Mapping Loader

This script tests the enhanced ETL functionality with mapping loader.
"""

import os
import sys
from sync_service.enhanced_etl import get_enhanced_etl

def main():
    """Run ETL test with enhanced ETL and mapping loader"""
    print("=== Enhanced ETL Test with Mapping ===")
    
    # Get sample data file path
    file_path = os.path.join(os.getcwd(), 'uploads', 'sample_property_data.csv')
    if not os.path.exists(file_path):
        print(f"Error: Sample data file not found at {file_path}")
        return
    
    print(f"\nUsing sample data from: {file_path}")
    
    # Check available mappings
    print("\nAvailable mappings:")
    from sync_service.mapping_loader import get_mapping_loader
    mapping_loader = get_mapping_loader()
    mappings = mapping_loader.list_mappings()
    
    for data_type, mapping_names in mappings.items():
        print(f"Data type: {data_type}")
        for name in mapping_names:
            print(f"  - {name}")
    
    # Create ETL instance
    print("\nInitializing Enhanced ETL...")
    etl = get_enhanced_etl()
    
    # Execute ETL pipeline using simple_test mapping
    print("\nExecuting ETL pipeline with simple_test mapping...")
    results = etl.execute_etl_pipeline(
        source_connection=file_path,
        source_query="",
        data_type="property",
        source_type="file",
        mapping_name="simple_test"  # Use the simple_test mapping
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
    
    # Verify imported data
    print("\nVerifying imported data...")
    
    try:
        from app import db
        
        # Query the property_data table
        query = "SELECT COUNT(*) FROM property_data"
        result = db.session.execute(query).scalar()
        print(f"Records in property_data table: {result}")
        
        if result > 0:
            # Get a sample record
            query = "SELECT * FROM property_data LIMIT 1"
            row = db.session.execute(query).fetchone()
            
            # Print sample record
            print("\nSample record:")
            for column, value in row._mapping.items():
                print(f"{column}: {value}")
        else:
            print("No records found in property_data table.")
    except Exception as e:
        print(f"Error verifying data: {str(e)}")
    
    print("\nTest completed!")

if __name__ == "__main__":
    # Initialize Flask app context
    try:
        from app import app
        with app.app_context():
            main()
    except ImportError:
        print("Error: Could not import Flask app.")
        sys.exit(1)
"""
Test ETL with Mapping Loader

This script tests the enhanced ETL functionality with the mapping loader.
"""

import os
import sys
import logging
from sync_service.enhanced_etl import get_enhanced_etl
from sync_service.mapping_loader import get_mapping_loader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_test_mapping():
    """Set up test mapping for property data"""
    logger.info("Setting up test mapping...")
    
    # Get mapping loader
    mapping_loader = get_mapping_loader()
    
    # Create field mapping
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
    
    # Check if mapping already exists
    existing_mappings = mapping_loader.list_mappings("property")
    
    if "property" in existing_mappings and "test" in existing_mappings["property"]:
        logger.info("Updating existing test mapping...")
        success = mapping_loader.update_mapping("property", "test", field_mapping)
    else:
        logger.info("Creating new test mapping...")
        success = mapping_loader.create_mapping("property", "test", field_mapping)
    
    if success:
        logger.info("Test mapping setup successful")
    else:
        logger.error("Failed to set up test mapping")
    
    return success

def test_etl_with_mapping():
    """Test ETL pipeline with mapping loader"""
    logger.info("Testing ETL with mapping loader...")
    
    # Set up test mapping
    setup_test_mapping()
    
    # Get sample data file path
    file_path = os.path.join(os.getcwd(), 'uploads', 'sample_property_data.csv')
    if not os.path.exists(file_path):
        logger.error(f"Sample data file not found at {file_path}")
        return False
    
    # Create ETL instance
    etl = get_enhanced_etl()
    
    # Execute ETL pipeline with mapping name
    results = etl.execute_etl_pipeline(
        source_connection=file_path,
        source_query="",
        data_type="property",
        source_type="file",
        mapping_name="test"  # Use the test mapping we created
    )
    
    # Print results
    logger.info("\nETL Pipeline Results:")
    logger.info(f"Status: {results['status']}")
    logger.info(f"Message: {results['message']}")
    
    logger.info("\nExtract Phase:")
    logger.info(f"Success: {results['extract']['success']}")
    logger.info(f"Records: {results['extract']['records']}")
    logger.info(f"Message: {results['extract']['message']}")
    
    logger.info("\nTransform Phase:")
    logger.info(f"Success: {results['transform']['success']}")
    logger.info(f"Records: {results['transform']['records']}")
    logger.info(f"Message: {results['transform']['message']}")
    
    logger.info("\nValidate Phase:")
    logger.info(f"Success: {results['validate']['success']}")
    logger.info(f"Valid Records: {results['validate']['valid_records']}")
    logger.info(f"Invalid Records: {results['validate']['invalid_records']}")
    logger.info(f"Message: {results['validate']['message']}")
    
    logger.info("\nLoad Phase:")
    logger.info(f"Success: {results['load']['success']}")
    logger.info(f"Records: {results['load']['records']}")
    logger.info(f"Message: {results['load']['message']}")
    
    # Final result
    if results['status'] == 'success':
        logger.info("\nETL import test with mapping completed successfully!")
        return True
    else:
        logger.error("\nETL import test with mapping failed.")
        return False

def check_imported_data():
    """Check if data was correctly imported to database"""
    try:
        from app import db
        
        # Query the property_data table
        query = "SELECT COUNT(*) FROM property_data"
        result = db.session.execute(query).scalar()
        
        logger.info(f"\nVerifying imported data...")
        logger.info(f"Records in property_data table: {result}")
        
        if result > 0:
            # Get a sample record
            query = "SELECT * FROM property_data LIMIT 1"
            row = db.session.execute(query).fetchone()
            
            # Print sample record
            logger.info("\nSample record:")
            for column, value in row._mapping.items():
                logger.info(f"{column}: {value}")
                
            return True
        else:
            logger.warning("No records found in property_data table.")
            return False
    except Exception as e:
        logger.error(f"Error checking imported data: {str(e)}")
        return False

def list_available_mappings():
    """List available mappings from the mapping loader"""
    logger.info("\nListing available mappings:")
    
    # Get mapping loader
    mapping_loader = get_mapping_loader()
    
    # List all mappings
    mappings = mapping_loader.list_mappings()
    
    for data_type, mapping_names in mappings.items():
        logger.info(f"Data type: {data_type}")
        for name in mapping_names:
            mapping = mapping_loader.get_mapping(data_type, name)
            logger.info(f"  - {name}: {len(mapping)} fields")
    
    return True

if __name__ == "__main__":
    # Initialize Flask app context
    try:
        from app import app
        with app.app_context():
            # Run tests
            list_available_mappings()
            if test_etl_with_mapping():
                check_imported_data()
    except ImportError:
        logger.error("Error: Could not import Flask app.")
        sys.exit(1)
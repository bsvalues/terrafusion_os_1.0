"""
Test Chunked ETL Processor

This script tests the chunked ETL processor for handling large datasets.
"""

import os
import sys
import logging
import time
import pandas as pd
from sync_service.chunked_etl import get_chunked_etl_processor

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def generate_test_data(rows=1000, output_file="uploads/large_test_data.csv"):
    """Generate a large test dataset for ETL testing"""
    logger.info(f"Generating test dataset with {rows} rows")
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Generate sample property data
    data = {
        'PropertyID': [f'P{i:05d}' for i in range(1, rows + 1)],
        'ParcelNumber': [f'{i//100:03d}-{i%100:02d}-{(i*7)%1000:03d}' for i in range(1, rows + 1)],
        'PropertyType': [['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Vacant'][i % 5] for i in range(1, rows + 1)],
        'StreetAddress': [f'{(i*17)%9999 + 1} Main St' for i in range(1, rows + 1)],
        'City': ['Benton City' for _ in range(rows)],
        'State': ['WA' for _ in range(rows)],
        'ZipCode': [f'9{i%10}123' for i in range(1, rows + 1)],
        'LandValue': [(i * 1000) % 500000 + 50000 for i in range(1, rows + 1)],
        'ImprovementValue': [(i * 1500) % 750000 + 75000 for i in range(1, rows + 1)],
        'TotalValue': [(i * 2500) % 1250000 + 125000 for i in range(1, rows + 1)],
        'YearBuilt': [1960 + (i % 60) for i in range(1, rows + 1)],
        'Bedrooms': [(i % 5) + 1 for i in range(1, rows + 1)],
        'Bathrooms': [(i % 4) + 1 for i in range(1, rows + 1)],
        'SquareFeet': [(i * 100) % 4000 + 1000 for i in range(1, rows + 1)]
    }
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Save to CSV
    df.to_csv(output_file, index=False)
    logger.info(f"Test dataset generated and saved to {output_file}")
    
    return output_file

def test_chunked_etl_with_file():
    """Test chunked ETL with a large CSV file"""
    logger.info("=== Testing Chunked ETL with Large CSV File ===")
    
    # Generate test data if it doesn't exist
    data_file = "uploads/large_test_data.csv"
    if not os.path.exists(data_file):
        generate_test_data(rows=1000, output_file=data_file)
    
    # Create mapping for the test data
    from sync_service.mapping_loader import get_mapping_loader
    mapping_loader = get_mapping_loader()
    
    mapping = {
        "property_id": "PropertyID",
        "parcel_number": "ParcelNumber",
        "property_type": "PropertyType",
        "address": "StreetAddress",
        "city": "City",
        "state": "State",
        "zip": "ZipCode",
        "land_value": "LandValue",
        "improvement_value": "ImprovementValue",
        "total_value": "TotalValue",
        "year_built": "YearBuilt",
        "bedrooms": "Bedrooms",
        "bathrooms": "Bathrooms",
        "square_footage": "SquareFeet"
    }
    
    # Create or update the mapping
    mapping_name = "large_test"
    mapping_exists = mapping_loader.get_mapping("property", mapping_name)
    
    if mapping_exists:
        mapping_loader.update_mapping("property", mapping_name, mapping)
        logger.info(f"Updated existing mapping: property/{mapping_name}")
    else:
        mapping_loader.create_mapping("property", mapping_name, mapping)
        logger.info(f"Created new mapping: property/{mapping_name}")
    
    # Initialize chunked ETL processor
    processor = get_chunked_etl_processor(chunk_size=1000)
    
    # Process the file
    start_time = time.time()
    results = processor.execute_chunked_etl(
        source_connection=data_file,
        source_query="",
        data_type="property",
        source_type="file",
        mapping_name=mapping_name,
        target_table="property_test_chunked"
    )
    end_time = time.time()
    
    # Log results
    logger.info(f"Chunked ETL completed in {end_time - start_time:.2f} seconds")
    logger.info(f"Status: {results['status']}")
    logger.info(f"Message: {results['message']}")
    logger.info(f"Extract: {results['extract']['records']} records")
    logger.info(f"Transform: {results['transform']['records']} records")
    logger.info(f"Validate: {results['validate']['valid_records']} valid, {results['validate']['invalid_records']} invalid")
    logger.info(f"Load: {results['load']['records']} records")
    logger.info(f"Chunks: {results['chunking']['processed_chunks']}/{results['chunking']['total_chunks']} (size: {results['chunking']['chunk_size']})")
    
    # Verify data in database
    try:
        from app import db
        query = "SELECT COUNT(*) FROM property_test_chunked"
        count = db.session.execute(query).scalar()
        logger.info(f"Records in database: {count}")
        
        query = "SELECT * FROM property_test_chunked LIMIT 1"
        row = db.session.execute(query).fetchone()
        logger.info("Sample record:")
        for i, column in enumerate(row._mapping.keys()):
            logger.info(f"  {column}: {row[i]}")
            
    except Exception as e:
        logger.error(f"Error verifying data: {str(e)}")
    
    return results

def test_chunked_etl_with_database():
    """Test chunked ETL with a database source"""
    logger.info("=== Testing Chunked ETL with Database Source ===")
    
    # Get database URL from environment variable
    import os
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        logger.error("DATABASE_URL environment variable not set")
        return None
    
    # Initialize chunked ETL processor
    processor = get_chunked_etl_processor(chunk_size=1000)
    
    # Process data from existing property_test_chunked table
    query = "SELECT * FROM property_test_chunked"
    
    start_time = time.time()
    results = processor.execute_chunked_etl(
        source_connection=db_url,
        source_query=query,
        data_type="property",
        source_type="database",
        target_table="property_test_copy"
    )
    end_time = time.time()
    
    # Log results
    logger.info(f"Chunked ETL from database completed in {end_time - start_time:.2f} seconds")
    logger.info(f"Status: {results['status']}")
    logger.info(f"Message: {results['message']}")
    logger.info(f"Extract: {results['extract']['records']} records")
    logger.info(f"Transform: {results['transform']['records']} records")
    logger.info(f"Validate: {results['validate']['valid_records']} valid, {results['validate']['invalid_records']} invalid")
    logger.info(f"Load: {results['load']['records']} records")
    logger.info(f"Chunks: {results['chunking']['processed_chunks']}/{results['chunking']['total_chunks']} (size: {results['chunking']['chunk_size']})")
    
    return results

def main():
    """Main function to run tests"""
    logger.info("Starting chunked ETL tests")
    
    # Test with file first
    file_results = test_chunked_etl_with_file()
    
    # If file test succeeded, test with database
    if file_results and file_results['status'] in ('success', 'partial'):
        db_results = test_chunked_etl_with_database()
    
    logger.info("Chunked ETL tests completed")

if __name__ == "__main__":
    # Initialize Flask app context
    try:
        from app import app
        with app.app_context():
            main()
    except ImportError:
        logger.error("Could not import Flask app.")
        sys.exit(1)
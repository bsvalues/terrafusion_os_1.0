"""
Simple ETL import test using mapping loader
"""

import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text

# Configure database
DB_URL = os.environ.get('DATABASE_URL')

def main():
    """Run ETL test with mapping"""
    print("=== Simple ETL Test with Mapping ===")
    
    # Test DB connection
    print("\nTesting database connection...")
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Database connection successful!")
    except Exception as e:
        print(f"Database connection error: {str(e)}")
        return
    
    # Create table
    print("\nCreating property_test table...")
    try:
        sql = """
        CREATE TABLE IF NOT EXISTS property_test (
            id SERIAL PRIMARY KEY,
            property_id VARCHAR(50),
            parcel_number VARCHAR(50),
            property_type VARCHAR(50),
            address VARCHAR(255),
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        with engine.connect() as conn:
            conn.execute(text(sql))
            conn.commit()
        print("Table created successfully!")
    except Exception as e:
        print(f"Error creating table: {str(e)}")
        return
    
    # Load the CSV
    print("\nLoading sample data...")
    file_path = os.path.join(os.getcwd(), 'uploads', 'sample_property_data.csv')
    try:
        df = pd.read_csv(file_path)
        print(f"Loaded {len(df)} rows from CSV")
    except Exception as e:
        print(f"Error loading CSV: {str(e)}")
        return
    
    # Load mapping
    print("\nLoading mapping...")
    try:
        from sync_service.mapping_loader import get_mapping_loader
        mapping_loader = get_mapping_loader()
        field_mapping = mapping_loader.get_mapping("property", "simple_test")
        
        if not field_mapping:
            print("Mapping not found!")
            return
            
        print(f"Loaded mapping with {len(field_mapping)} fields")
    except Exception as e:
        print(f"Error loading mapping: {str(e)}")
        return
    
    # Transform data
    print("\nTransforming data with mapping...")
    try:
        # Create a new DataFrame with mapped columns
        transformed_df = pd.DataFrame()
        
        # Apply mapping
        for target_field, source_field in field_mapping.items():
            if source_field in df.columns:
                transformed_df[target_field] = df[source_field]
        
        print(f"Transformed data has {len(transformed_df)} rows and {len(transformed_df.columns)} columns")
        print("Columns:", list(transformed_df.columns))
    except Exception as e:
        print(f"Error transforming data: {str(e)}")
        return
    
    # Import to database
    print("\nImporting data to database...")
    try:
        transformed_df.to_sql('property_test', engine, if_exists='append', index=False)
        print(f"Successfully imported {len(transformed_df)} rows to database!")
    except Exception as e:
        print(f"Error importing data: {str(e)}")
        return
    
    # Verify import
    print("\nVerifying imported data...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM property_test"))
            count = result.scalar()
            print(f"Records in property_test table: {count}")
            
            if count > 0:
                result = conn.execute(text("SELECT * FROM property_test LIMIT 1"))
                row = result.fetchone()
                print("\nSample record:")
                for i, column in enumerate(result.keys()):
                    print(f"{column}: {row[i]}")
    except Exception as e:
        print(f"Error verifying data: {str(e)}")
        return
    
    print("\nTest completed successfully!")

if __name__ == "__main__":
    main()
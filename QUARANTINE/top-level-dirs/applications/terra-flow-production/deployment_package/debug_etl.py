"""
Debug ETL Import Script

Simple script to debug ETL functionality with detailed logging.
"""

import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text

# Use DATABASE_URL environment variable
DB_URL = os.environ.get('DATABASE_URL')

def test_db_connection():
    """Test database connection"""
    print("Testing database connection...")
    
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Database connection successful!")
            return True
    except Exception as e:
        print(f"Database connection error: {str(e)}")
        return False

def load_csv_file():
    """Load CSV file directly"""
    print("Loading CSV file...")
    
    # Get sample data file path
    file_path = os.path.join(os.getcwd(), 'uploads', 'sample_property_data.csv')
    if not os.path.exists(file_path):
        print(f"Error: Sample data file not found at {file_path}")
        return None
    
    try:
        # Load CSV into pandas DataFrame
        df = pd.read_csv(file_path)
        print(f"CSV file loaded successfully with {len(df)} rows and {len(df.columns)} columns")
        print("Columns:", list(df.columns))
        print("First row:", df.iloc[0].to_dict())
        return df
    except Exception as e:
        print(f"Error loading CSV file: {str(e)}")
        return None

def create_property_table():
    """Create property_data table"""
    print("Creating property_data table...")
    
    try:
        engine = create_engine(DB_URL)
        
        # Define the table schema
        sql = """
        CREATE TABLE IF NOT EXISTS property_data (
            id SERIAL PRIMARY KEY,
            property_id VARCHAR(50),
            parcel_number VARCHAR(50),
            property_type VARCHAR(50),
            address VARCHAR(255),
            city VARCHAR(100),
            state VARCHAR(50),
            zip VARCHAR(20),
            owner_name VARCHAR(255),
            owner_address VARCHAR(255),
            assessed_value DECIMAL(15, 2),
            land_value DECIMAL(15, 2),
            improvement_value DECIMAL(15, 2),
            year_built INTEGER,
            square_footage DECIMAL(10, 2),
            bedrooms INTEGER,
            bathrooms DECIMAL(5, 2),
            last_sale_date DATE,
            last_sale_price DECIMAL(15, 2),
            latitude DECIMAL(10, 6),
            longitude DECIMAL(10, 6),
            legal_description TEXT,
            zoning VARCHAR(50),
            neighborhood_code VARCHAR(50),
            tax_code_area VARCHAR(50),
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        
        with engine.connect() as conn:
            conn.execute(text(sql))
            conn.commit()
            
        print("Property data table created successfully!")
        return True
    except Exception as e:
        print(f"Error creating table: {str(e)}")
        return False

def import_data_directly(df):
    """Import data directly to database"""
    print("Importing data directly to database...")
    
    if df is None or df.empty:
        print("No data to import!")
        return False
    
    try:
        # Rename columns to match the database schema
        mapping = {
            'PropertyID': 'property_id',
            'ParcelNumber': 'parcel_number',
            'PropertyType': 'property_type',
            'StreetAddress': 'address',
            'City': 'city',
            'State': 'state',
            'ZipCode': 'zip',
            'OwnerName': 'owner_name',
            'OwnerAddress': 'owner_address',
            'AssessedValue': 'assessed_value',
            'LandValue': 'land_value',
            'ImprovementValue': 'improvement_value',
            'YearBuilt': 'year_built',
            'SquareFootage': 'square_footage',
            'Bedrooms': 'bedrooms',
            'Bathrooms': 'bathrooms',
            'LastSaleDate': 'last_sale_date',
            'LastSalePrice': 'last_sale_price',
            'Latitude': 'latitude',
            'Longitude': 'longitude',
            'LegalDescription': 'legal_description',
            'ZoningCode': 'zoning',
            'NeighborhoodCode': 'neighborhood_code',
            'TaxCodeArea': 'tax_code_area'
        }
        
        # Rename the columns
        df_renamed = df.rename(columns=mapping)
        print("Columns after rename:", list(df_renamed.columns))
        
        # Convert date fields
        if 'last_sale_date' in df_renamed.columns:
            df_renamed['last_sale_date'] = pd.to_datetime(df_renamed['last_sale_date'])
        
        # Connect to the database
        engine = create_engine(DB_URL)
        
        # Import data
        df_renamed.to_sql('property_data', engine, index=False, if_exists='append')
        
        print(f"Successfully imported {len(df_renamed)} rows to property_data table!")
        return True
    except Exception as e:
        print(f"Error importing data: {str(e)}")
        return False

def verify_imported_data():
    """Verify imported data in the database"""
    print("Verifying imported data...")
    
    try:
        engine = create_engine(DB_URL)
        
        with engine.connect() as conn:
            # Count records
            result = conn.execute(text("SELECT COUNT(*) FROM property_data"))
            count = result.scalar()
            print(f"Records in property_data table: {count}")
            
            if count > 0:
                # Get a sample record
                result = conn.execute(text("SELECT * FROM property_data LIMIT 1"))
                row = result.fetchone()
                
                print("Sample record:")
                for i, column in enumerate(result.keys()):
                    print(f"{column}: {row[i]}")
                
                return True
            else:
                print("No records found in property_data table.")
                return False
    except Exception as e:
        print(f"Error verifying data: {str(e)}")
        return False

if __name__ == "__main__":
    print("=== ETL Debug Tool ===")
    print(f"Database URL: {DB_URL}")
    print("")
    
    # Run the tests
    if test_db_connection():
        create_property_table()
        df = load_csv_file()
        if df is not None:
            import_data_directly(df)
            verify_imported_data()
    
    print("\nDebug completed!")
"""
Create Parcels Table

This script creates the parcels table with geometry support for storing
property parcel data with geospatial information.
"""

import logging
from app import db, app
from sqlalchemy import text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_parcels_table():
    """
    Create the parcels table with PostGIS geometry support.
    """
    with app.app_context():
        try:
            # Check if PostGIS extension is available
            postgis_check = """
            SELECT EXISTS (
                SELECT 1 FROM pg_extension WHERE extname = 'postgis'
            );
            """
            
            result = db.session.execute(text(postgis_check))
            has_postgis = result.scalar()
            
            # Create PostGIS extension if not available
            if not has_postgis:
                db.session.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                db.session.commit()
                logger.info("PostGIS extension created")
            
            # Create parcels table with geometry column
            query = """
            CREATE TABLE IF NOT EXISTS parcels (
                id SERIAL PRIMARY KEY,
                parcel_id VARCHAR(50) UNIQUE NOT NULL,
                apn VARCHAR(50),
                account_number VARCHAR(50),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(20) DEFAULT 'WA',
                zip VARCHAR(20),
                property_type VARCHAR(50),
                zoning VARCHAR(50),
                year_built INTEGER,
                total_value NUMERIC(15, 2),
                land_value NUMERIC(15, 2),
                improvement_value NUMERIC(15, 2),
                tax_year INTEGER,
                square_footage NUMERIC(12, 2),
                acreage NUMERIC(10, 4),
                bedrooms INTEGER,
                bathrooms NUMERIC(5, 2),
                last_sale_date DATE,
                last_sale_price NUMERIC(15, 2),
                geometry GEOMETRY(GEOMETRY, 4326),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_source VARCHAR(100),
                metadata JSONB
            );
            
            -- Create spatial index
            CREATE INDEX IF NOT EXISTS idx_parcels_geometry ON parcels USING GIST(geometry);
            
            -- Create regular indexes
            CREATE INDEX IF NOT EXISTS idx_parcels_parcel_id ON parcels(parcel_id);
            CREATE INDEX IF NOT EXISTS idx_parcels_address ON parcels(address);
            CREATE INDEX IF NOT EXISTS idx_parcels_property_type ON parcels(property_type);
            CREATE INDEX IF NOT EXISTS idx_parcels_total_value ON parcels(total_value);
            """
            
            db.session.execute(text(query))
            db.session.commit()
            
            logger.info("Parcels table created successfully")
            
            return True
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating parcels table: {str(e)}")
            return False

if __name__ == "__main__":
    create_parcels_table()
-- Remove existing Benton County data if it exists to ensure a clean slate.
DROP TABLE IF EXISTS benton_county_properties;

-- Define the schema for a large, realistic set of Benton County properties.
CREATE TABLE benton_county_properties (
    id SERIAL PRIMARY KEY,
    parcel_number VARCHAR(20) UNIQUE NOT NULL,
    address VARCHAR(255) NOT NULL,
    owner_name VARCHAR(100),
    property_type VARCHAR(50),
    assessed_value NUMERIC(15, 2),
    land_value NUMERIC(15, 2),
    improvement_value NUMERIC(15, 2),
    tax_year INT,
    lot_size_acres NUMERIC(10, 2),
    year_built INT,
    bedrooms INT,
    bathrooms NUMERIC(3, 1),
    sqft INT,
    zoning VARCHAR(20),
    school_district VARCHAR(100),
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index for faster searching by parcel number
CREATE INDEX idx_parcel_number ON benton_county_properties(parcel_number);

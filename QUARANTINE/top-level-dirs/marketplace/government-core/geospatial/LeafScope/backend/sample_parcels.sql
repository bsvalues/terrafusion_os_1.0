-- Sample Parcels Data for LeafScope
-- Creates PostGIS-enabled table with sample property parcels

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create parcels table
CREATE TABLE IF NOT EXISTS leafscope_parcels (
    id SERIAL PRIMARY KEY,
    parcel_id VARCHAR(50) UNIQUE NOT NULL,
    address VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    property_type VARCHAR(50),
    zoning VARCHAR(20),
    assessed_value DECIMAL(12, 2),
    land_area_sqft INTEGER,
    building_area_sqft INTEGER,
    year_built INTEGER,
    last_sale_date DATE,
    last_sale_price DECIMAL(12, 2),
    geometry GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index
CREATE INDEX idx_leafscope_parcels_geometry ON leafscope_parcels USING GIST(geometry);

-- Insert sample parcels in NYC area
INSERT INTO leafscope_parcels (parcel_id, address, owner_name, property_type, zoning, assessed_value, land_area_sqft, building_area_sqft, year_built, last_sale_date, last_sale_price, geometry) VALUES
-- Manhattan parcels
('MAN-001', '123 Broadway, New York, NY 10007', 'Broadway Properties LLC', 'Commercial', 'C5-5', 12500000, 8500, 45000, 1985, '2022-03-15', 11000000, 
    ST_GeomFromText('POLYGON((-74.0060 40.7128, -74.0058 40.7128, -74.0058 40.7130, -74.0060 40.7130, -74.0060 40.7128))', 4326)),

('MAN-002', '456 Park Avenue, New York, NY 10022', 'Park Ave Holdings', 'Mixed-Use', 'C5-3', 25000000, 12000, 85000, 1962, '2021-07-20', 23500000,
    ST_GeomFromText('POLYGON((-73.9712 40.7589, -73.9710 40.7589, -73.9710 40.7591, -73.9712 40.7591, -73.9712 40.7589))', 4326)),

('MAN-003', '789 Wall Street, New York, NY 10005', 'Financial District Realty', 'Office', 'C5-5', 35000000, 15000, 120000, 1988, '2023-01-10', 34000000,
    ST_GeomFromText('POLYGON((-74.0089 40.7074, -74.0087 40.7074, -74.0087 40.7076, -74.0089 40.7076, -74.0089 40.7074))', 4326)),

-- Brooklyn parcels
('BRK-001', '321 Atlantic Avenue, Brooklyn, NY 11201', 'Brooklyn Development Corp', 'Residential', 'R7A', 3500000, 6000, 24000, 2010, '2022-11-05', 3200000,
    ST_GeomFromText('POLYGON((-73.9856 40.6895, -73.9854 40.6895, -73.9854 40.6897, -73.9856 40.6897, -73.9856 40.6895))', 4326)),

('BRK-002', '654 Fulton Street, Brooklyn, NY 11217', 'Fulton Street Partners', 'Retail', 'C4-4A', 4800000, 7500, 18000, 1955, '2021-05-12', 4500000,
    ST_GeomFromText('POLYGON((-73.9830 40.6881, -73.9828 40.6881, -73.9828 40.6883, -73.9830 40.6883, -73.9830 40.6881))', 4326)),

-- Queens parcels
('QNS-001', '987 Queens Boulevard, Queens, NY 11373', 'Queens Plaza LLC', 'Mixed-Use', 'C4-3', 6200000, 10000, 35000, 1975, '2023-02-28', 5900000,
    ST_GeomFromText('POLYGON((-73.8703 40.7343, -73.8701 40.7343, -73.8701 40.7345, -73.8703 40.7345, -73.8703 40.7343))', 4326)),

-- Industrial parcel
('IND-001', '1500 Industrial Way, Brooklyn, NY 11232', 'Industrial Properties Inc', 'Industrial', 'M1-2', 8500000, 25000, 40000, 1965, '2022-08-17', 8000000,
    ST_GeomFromText('POLYGON((-74.0165 40.6525, -74.0160 40.6525, -74.0160 40.6530, -74.0165 40.6530, -74.0165 40.6525))', 4326)),

-- Vacant land
('VAC-001', 'Lot 45 Shore Road, Staten Island, NY 10301', 'Shore Development Group', 'Vacant Land', 'R3-2', 1200000, 15000, 0, NULL, '2023-04-01', 1100000,
    ST_GeomFromText('POLYGON((-74.0950 40.6420, -74.0945 40.6420, -74.0945 40.6425, -74.0950 40.6425, -74.0950 40.6420))', 4326));

-- Create view for LeafScope API
CREATE OR REPLACE VIEW leafscope_properties AS
SELECT 
    id,
    parcel_id as id,
    address,
    ST_Y(ST_Centroid(geometry)) as lat,
    ST_X(ST_Centroid(geometry)) as lng,
    assessed_value as value,
    property_type as type,
    ST_AsGeoJSON(geometry) as geojson
FROM leafscope_parcels;

-- Grant permissions (adjust based on your user)
GRANT SELECT ON leafscope_properties TO PUBLIC;
GRANT ALL ON leafscope_parcels TO PUBLIC;
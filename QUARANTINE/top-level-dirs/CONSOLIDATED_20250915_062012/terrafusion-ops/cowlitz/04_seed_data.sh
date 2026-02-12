#!/usr/bin/env bash
set -Eeuo pipefail

echo "📊 Seeding Cowlitz County data..."

# Create Cowlitz County schema
cat <<SQL | docker exec -i cowlitz-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
CREATE EXTENSION IF NOT EXISTS postgis;

-- Cowlitz County specific tables
CREATE TABLE IF NOT EXISTS cowlitz_parcels (
  parcel_id TEXT PRIMARY KEY,
  situs_address TEXT,
  city TEXT DEFAULT 'Longview',
  state TEXT DEFAULT 'WA',
  zip TEXT,
  land_sqft INT,
  bldg_sqft INT,
  year_built INT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  zoning TEXT,
  cowlitz_district TEXT
);

CREATE TABLE IF NOT EXISTS cowlitz_assessments (
  parcel_id TEXT REFERENCES cowlitz_parcels(parcel_id),
  assessed_value BIGINT,
  tax_year INT,
  land_value BIGINT,
  improvement_value BIGINT,
  PRIMARY KEY(parcel_id, tax_year)
);

CREATE TABLE IF NOT EXISTS cowlitz_sales (
  parcel_id TEXT REFERENCES cowlitz_parcels(parcel_id),
  sale_date DATE,
  sale_price BIGINT,
  sale_type TEXT
);

-- Insert sample Cowlitz data
INSERT INTO cowlitz_parcels (parcel_id, situs_address, city, zip, land_sqft, bldg_sqft, year_built, lat, lon, zoning) VALUES
('CWL001', '123 Championship Way', 'Longview', '98632', 7200, 2100, 1995, 46.1382, -122.9382, 'R1'),
('CWL002', '456 Government Plaza', 'Kelso', '98626', 8500, 2800, 2001, 46.1479, -122.9079, 'R2'),
('CWL003', '789 County Road', 'Castle Rock', '98611', 12000, 3200, 1988, 46.2751, -122.9068, 'R1');

INSERT INTO cowlitz_assessments (parcel_id, assessed_value, tax_year, land_value, improvement_value) VALUES
('CWL001', 485000, 2024, 185000, 300000),
('CWL002', 625000, 2024, 225000, 400000),
('CWL003', 745000, 2024, 285000, 460000);

INSERT INTO cowlitz_sales (parcel_id, sale_date, sale_price, sale_type) VALUES
('CWL001', '2024-03-15', 495000, 'ARM'),
('CWL002', '2024-06-22', 635000, 'ARM');
SQL

echo "✅ Cowlitz County data seeded."

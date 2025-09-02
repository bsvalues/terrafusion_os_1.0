#!/usr/bin/env bash
set -Eeuo pipefail

echo "📊 YAKIMA FLAGSHIP - Seeding Championship Data"
echo "═══════════════════════════════════════════════════════════"

# Create comprehensive Yakima County schema
cat <<SQL | docker exec -i yakima-postgres-flagship psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
CREATE EXTENSION IF NOT EXISTS postgis;

-- Yakima County flagship tables with championship features
CREATE TABLE IF NOT EXISTS yakima_parcels (
  parcel_id TEXT PRIMARY KEY,
  situs_address TEXT,
  city TEXT,
  state TEXT DEFAULT 'WA',
  zip TEXT,
  land_sqft INT,
  bldg_sqft INT,
  year_built INT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  property_type TEXT,
  zoning TEXT,
  agricultural_classification TEXT,
  wine_appellation TEXT,
  orchard_type TEXT,
  irrigation_rights BOOLEAN DEFAULT FALSE,
  yakima_district TEXT,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yakima_assessments (
  parcel_id TEXT REFERENCES yakima_parcels(parcel_id),
  assessed_value BIGINT,
  tax_year INT,
  land_value BIGINT,
  improvement_value BIGINT,
  agricultural_value BIGINT,
  exemptions JSONB,
  assessment_date DATE,
  PRIMARY KEY(parcel_id, tax_year)
);

CREATE TABLE IF NOT EXISTS yakima_sales (
  parcel_id TEXT REFERENCES yakima_parcels(parcel_id),
  sale_date DATE,
  sale_price BIGINT,
  sale_type TEXT,
  buyer_type TEXT,
  agricultural_sale BOOLEAN DEFAULT FALSE,
  wine_related BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS yakima_agricultural_zones (
  zone_id SERIAL PRIMARY KEY,
  zone_name TEXT,
  crop_type TEXT,
  irrigation_district TEXT,
  appellation TEXT,
  geometry GEOMETRY(POLYGON, 4326)
);

-- Insert championship sample data for Yakima
INSERT INTO yakima_parcels (parcel_id, situs_address, city, zip, land_sqft, bldg_sqft, year_built, lat, lon, property_type, zoning, agricultural_classification, orchard_type) VALUES
('YAK001', '123 Championship Way', 'Yakima', '98901', 7500, 2200, 1995, 46.6021, -120.5059, 'Residential', 'R1', NULL, NULL),
('YAK002', '456 Government Plaza', 'Yakima', '98902', 9200, 3100, 2001, 46.6034, -120.5086, 'Residential', 'R2', NULL, NULL),
('YAK003', '789 Apple Orchard Lane', 'Selah', '98942', 435600, 4500, 1988, 46.6537, -120.5326, 'Agricultural', 'AG', 'Orchard', 'Apple'),
('YAK004', '321 Wine Country Drive', 'Zillah', '98953', 217800, 6200, 2005, 46.4014, -120.2593, 'Agricultural', 'AG-W', 'Vineyard', 'Wine Grapes'),
('YAK005', '654 Commercial Boulevard', 'Union Gap', '98903', 21780, 8900, 1992, 46.5607, -120.4718, 'Commercial', 'C1', NULL, NULL),
('YAK006', '987 Flagship Demo Street', 'Yakima', '98901', 8800, 2800, 2010, 46.6055, -120.5045, 'Residential', 'R1', NULL, NULL);

INSERT INTO yakima_assessments (parcel_id, assessed_value, tax_year, land_value, improvement_value, agricultural_value) VALUES
('YAK001', 485000, 2024, 185000, 300000, 0),
('YAK002', 625000, 2024, 225000, 400000, 0),
('YAK003', 1850000, 2024, 1200000, 450000, 200000),
('YAK004', 2400000, 2024, 1800000, 600000, 0),
('YAK005', 1200000, 2024, 400000, 800000, 0),
('YAK006', 545000, 2024, 195000, 350000, 0);

INSERT INTO yakima_sales (parcel_id, sale_date, sale_price, sale_type, agricultural_sale, wine_related) VALUES
('YAK001', '2024-03-15', 495000, 'ARM', FALSE, FALSE),
('YAK002', '2024-06-22', 635000, 'ARM', FALSE, FALSE),
('YAK003', '2024-08-10', 1950000, 'ARM', TRUE, FALSE),
('YAK004', '2024-09-05', 2500000, 'ARM', TRUE, TRUE),
('YAK006', '2024-07-18', 555000, 'ARM', FALSE, FALSE);

-- Create indexes for championship performance
CREATE INDEX IF NOT EXISTS idx_yakima_parcels_city ON yakima_parcels(city);
CREATE INDEX IF NOT EXISTS idx_yakima_parcels_zoning ON yakima_parcels(zoning);
CREATE INDEX IF NOT EXISTS idx_yakima_parcels_property_type ON yakima_parcels(property_type);
CREATE INDEX IF NOT EXISTS idx_yakima_assessments_tax_year ON yakima_assessments(tax_year);
CREATE INDEX IF NOT EXISTS idx_yakima_sales_date ON yakima_sales(sale_date);
SQL

echo "🏆 Yakima County flagship data seeded with championship performance!"

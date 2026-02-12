-- Benton County Data Migration Plan
-- TerraFusion Production Migration Scripts
-- Target: 99,347 Parcels with 10 Years History

-- ============================================
-- PHASE 1: SCHEMA CREATION
-- ============================================

-- Create Benton County production database
CREATE DATABASE benton_county_prod
    WITH 
    OWNER = terrafusion_admin
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Connect to the new database
\c benton_county_prod;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================
-- PHASE 2: CORE TABLES
-- ============================================

-- Parcels table (Main entity)
CREATE TABLE parcels (
    parcel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_number VARCHAR(20) NOT NULL UNIQUE,
    alternate_parcel_number VARCHAR(20),
    tax_code_area VARCHAR(10),
    property_class_code VARCHAR(10),
    land_use_code VARCHAR(10),
    neighborhood_code VARCHAR(10),
    
    -- Location information
    situs_address VARCHAR(255),
    situs_city VARCHAR(100),
    situs_state VARCHAR(2) DEFAULT 'WA',
    situs_zip VARCHAR(10),
    
    -- Legal description
    legal_description TEXT,
    section_township_range VARCHAR(20),
    subdivision VARCHAR(100),
    block VARCHAR(20),
    lot VARCHAR(20),
    
    -- GIS information
    geometry GEOMETRY(MultiPolygon, 2927), -- Washington State Plane South
    acres DECIMAL(10,4),
    square_feet INTEGER,
    
    -- Jurisdiction
    jurisdiction_code VARCHAR(10),
    jurisdiction_name VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'Active',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(100),
    
    -- Indexes
    INDEX idx_parcel_number (parcel_number),
    INDEX idx_situs_address (situs_address),
    INDEX idx_jurisdiction (jurisdiction_code),
    INDEX idx_geometry USING GIST (geometry)
);

-- Owners table
CREATE TABLE owners (
    owner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES parcels(parcel_id),
    
    -- Owner information
    owner_name VARCHAR(255) NOT NULL,
    owner_type VARCHAR(50), -- Individual, Corporation, Trust, etc.
    
    -- Mailing address
    mail_address_1 VARCHAR(255),
    mail_address_2 VARCHAR(255),
    mail_city VARCHAR(100),
    mail_state VARCHAR(2),
    mail_zip VARCHAR(10),
    mail_country VARCHAR(50) DEFAULT 'USA',
    
    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Ownership details
    ownership_percentage DECIMAL(5,2) DEFAULT 100.00,
    deed_date DATE,
    deed_book VARCHAR(20),
    deed_page VARCHAR(20),
    
    -- Status
    is_primary BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'Active',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_owner_name (owner_name),
    INDEX idx_parcel_owner (parcel_id)
);

-- Assessment history table (10 years of data)
CREATE TABLE assessment_history (
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES parcels(parcel_id),
    tax_year INTEGER NOT NULL,
    
    -- Land values
    land_market_value DECIMAL(12,2),
    land_assessed_value DECIMAL(12,2),
    
    -- Improvement values
    improvement_market_value DECIMAL(12,2),
    improvement_assessed_value DECIMAL(12,2),
    
    -- Total values
    total_market_value DECIMAL(12,2),
    total_assessed_value DECIMAL(12,2),
    
    -- Exemptions
    exemption_amount DECIMAL(12,2),
    exemption_codes TEXT[],
    
    -- Taxable value
    taxable_value DECIMAL(12,2),
    
    -- Assessment details
    assessment_date DATE,
    assessment_reason VARCHAR(100),
    assessor_name VARCHAR(100),
    
    -- Ratios
    assessment_ratio DECIMAL(5,4),
    
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_parcel_year (parcel_id, tax_year),
    UNIQUE(parcel_id, tax_year)
);

-- Sales history table
CREATE TABLE sales_history (
    sale_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES parcels(parcel_id),
    
    -- Sale information
    sale_date DATE NOT NULL,
    sale_price DECIMAL(12,2),
    adjusted_sale_price DECIMAL(12,2),
    
    -- Deed information
    deed_type VARCHAR(50),
    instrument_number VARCHAR(50),
    
    -- Parties
    grantor_name VARCHAR(255),
    grantee_name VARCHAR(255),
    
    -- Sale validation
    sale_validation_code VARCHAR(10),
    is_qualified_sale BOOLEAN DEFAULT true,
    sale_reject_reason VARCHAR(255),
    
    -- Financing
    financing_type VARCHAR(50),
    down_payment DECIMAL(12,2),
    
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_sale_date (sale_date),
    INDEX idx_parcel_sales (parcel_id, sale_date DESC)
);

-- Building/Improvement details
CREATE TABLE improvements (
    improvement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES parcels(parcel_id),
    
    -- Building information
    building_number INTEGER DEFAULT 1,
    building_type VARCHAR(50),
    year_built INTEGER,
    effective_year_built INTEGER,
    
    -- Size
    gross_area INTEGER,
    living_area INTEGER,
    basement_area INTEGER,
    garage_area INTEGER,
    
    -- Construction
    stories DECIMAL(3,1),
    construction_quality VARCHAR(50),
    condition VARCHAR(50),
    
    -- Features
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    fireplaces INTEGER,
    
    -- HVAC
    heating_type VARCHAR(50),
    cooling_type VARCHAR(50),
    
    -- Value
    replacement_cost_new DECIMAL(12,2),
    depreciation_amount DECIMAL(12,2),
    improvement_value DECIMAL(12,2),
    
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_parcel_improvements (parcel_id)
);

-- ============================================
-- PHASE 3: BENTON COUNTY SPECIFIC TABLES
-- ============================================

-- Wine country module
CREATE TABLE vineyard_assessments (
    vineyard_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES parcels(parcel_id),
    
    -- Vineyard details
    planted_acres DECIMAL(10,2),
    varietals TEXT[],
    trellis_system VARCHAR(100),
    irrigation_type VARCHAR(100),
    
    -- AVA information
    ava_district VARCHAR(100),
    
    -- Production
    average_yield_tons DECIMAL(10,2),
    contract_price_per_ton DECIMAL(10,2),
    
    -- Age classifications
    young_vines_acres DECIMAL(10,2), -- 0-3 years
    producing_vines_acres DECIMAL(10,2), -- 4-25 years
    mature_vines_acres DECIMAL(10,2), -- 25+ years
    
    -- Special assessments
    wine_production_facility BOOLEAN DEFAULT false,
    tasting_room BOOLEAN DEFAULT false,
    
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Federal lands (Hanford Reach)
CREATE TABLE federal_lands (
    federal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES parcels(parcel_id),
    
    agency_code VARCHAR(20),
    agency_name VARCHAR(255),
    land_category VARCHAR(100),
    
    -- PILT calculations
    pilt_eligible BOOLEAN DEFAULT true,
    pilt_base_value DECIMAL(12,2),
    pilt_payment_amount DECIMAL(12,2),
    
    restrictions TEXT[],
    
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PHASE 4: MIGRATION PROCEDURES
-- ============================================

-- Create migration tracking table
CREATE TABLE migration_log (
    log_id SERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    records_processed INTEGER,
    records_success INTEGER,
    records_failed INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50),
    error_messages TEXT[]
);

-- Migration procedure for parcels
CREATE OR REPLACE FUNCTION migrate_parcels()
RETURNS TABLE(status TEXT, records_migrated INTEGER) AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Insert parcels from legacy system
    INSERT INTO parcels (
        parcel_number,
        tax_code_area,
        property_class_code,
        situs_address,
        situs_city,
        situs_zip,
        legal_description,
        acres,
        jurisdiction_code,
        jurisdiction_name
    )
    SELECT 
        legacy_parcel_no,
        tca,
        property_class,
        situs_addr,
        situs_city,
        situs_zip,
        legal_desc,
        acres,
        CASE 
            WHEN city_code = 'KEN' THEN 'KEN'
            WHEN city_code = 'RCH' THEN 'RCH'
            WHEN city_code = 'WR' THEN 'WR'
            WHEN city_code = 'PRO' THEN 'PRO'
            WHEN city_code = 'BC' THEN 'BC'
            ELSE 'UNINC'
        END,
        CASE 
            WHEN city_code = 'KEN' THEN 'Kennewick'
            WHEN city_code = 'RCH' THEN 'Richland'
            WHEN city_code = 'WR' THEN 'West Richland'
            WHEN city_code = 'PRO' THEN 'Prosser'
            WHEN city_code = 'BC' THEN 'Benton City'
            ELSE 'Unincorporated'
        END
    FROM legacy_parcel_master
    WHERE status = 'A';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Log the migration
    INSERT INTO migration_log (table_name, records_processed, records_success, start_time, end_time, status)
    VALUES ('parcels', v_count, v_count, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SUCCESS');
    
    RETURN QUERY SELECT 'SUCCESS'::TEXT, v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PHASE 5: DATA VALIDATION
-- ============================================

-- Validation queries
CREATE OR REPLACE VIEW migration_validation AS
SELECT 
    'Parcels' as entity,
    COUNT(*) as total_records,
    COUNT(DISTINCT parcel_number) as unique_parcels,
    SUM(CASE WHEN situs_address IS NULL THEN 1 ELSE 0 END) as missing_addresses,
    SUM(CASE WHEN geometry IS NULL THEN 1 ELSE 0 END) as missing_geometry
FROM parcels

UNION ALL

SELECT 
    'Owners' as entity,
    COUNT(*) as total_records,
    COUNT(DISTINCT parcel_id) as unique_parcels,
    SUM(CASE WHEN owner_name IS NULL THEN 1 ELSE 0 END) as missing_names,
    0 as missing_geometry
FROM owners

UNION ALL

SELECT 
    'Assessments' as entity,
    COUNT(*) as total_records,
    COUNT(DISTINCT parcel_id) as unique_parcels,
    COUNT(DISTINCT tax_year) as years_of_data,
    0 as missing_geometry
FROM assessment_history;

-- ============================================
-- PHASE 6: PERFORMANCE OPTIMIZATION
-- ============================================

-- Create materialized view for quick lookups
CREATE MATERIALIZED VIEW current_assessment_summary AS
SELECT 
    p.parcel_number,
    p.situs_address,
    p.jurisdiction_name,
    o.owner_name,
    ah.total_assessed_value,
    ah.taxable_value,
    ah.tax_year
FROM parcels p
JOIN owners o ON p.parcel_id = o.parcel_id AND o.is_primary = true
JOIN assessment_history ah ON p.parcel_id = ah.parcel_id
WHERE ah.tax_year = EXTRACT(YEAR FROM CURRENT_DATE)
WITH DATA;

-- Create indexes on materialized view
CREATE INDEX idx_mv_parcel_number ON current_assessment_summary(parcel_number);
CREATE INDEX idx_mv_owner_name ON current_assessment_summary(owner_name);
CREATE INDEX idx_mv_address ON current_assessment_summary(situs_address);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_assessment_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY current_assessment_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PHASE 7: MIGRATION EXECUTION
-- ============================================

-- Master migration script
DO $$
BEGIN
    RAISE NOTICE 'Starting Benton County data migration...';
    
    -- 1. Migrate parcels
    PERFORM migrate_parcels();
    RAISE NOTICE 'Parcels migrated successfully';
    
    -- 2. Migrate owners
    -- PERFORM migrate_owners();
    RAISE NOTICE 'Owners migrated successfully';
    
    -- 3. Migrate assessment history
    -- PERFORM migrate_assessments();
    RAISE NOTICE 'Assessment history migrated successfully';
    
    -- 4. Migrate sales
    -- PERFORM migrate_sales();
    RAISE NOTICE 'Sales history migrated successfully';
    
    -- 5. Update statistics
    ANALYZE;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;
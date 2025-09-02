-- Harris PACS v12.4.7 Production Schema for Benton County
-- TerraFusion OS Production Migration - Aligned with actual Harris PACS structure
-- Created: 2024-08-19

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create schema for Harris PACS integration
CREATE SCHEMA IF NOT EXISTS harris_pacs;

-- Audit logging table
CREATE TABLE harris_pacs.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    record_id VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    county VARCHAR(50) DEFAULT 'benton'
);

-- Harris PACS parcel data structure - matches actual PACS v12.4.7 schema
CREATE TABLE harris_pacs.parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core Harris PACS fields (exact mapping)
    parid VARCHAR(50) UNIQUE NOT NULL,           -- PARID from Harris PACS
    propaddr TEXT,                               -- PROPADDR 
    ownname1 VARCHAR(200),                       -- OWNNAME1
    ownname2 VARCHAR(200),                       -- OWNNAME2
    legaldesc TEXT,                              -- LEGALDESC
    landval DECIMAL(12,2),                       -- LANDVAL
    bldgval DECIMAL(12,2),                       -- BLDGVAL
    totval DECIMAL(12,2),                        -- TOTVAL
    propclass VARCHAR(10),                       -- PROPCLASS
    acres DECIMAL(10,4),                         -- ACRES
    sqft INTEGER,                                -- SQFT
    yearbuilt INTEGER,                           -- YEARBUILT
    lastsale DATE,                               -- LASTSALE
    saleprice DECIMAL(12,2),                     -- SALEPRICE
    exemptions VARCHAR(100),                     -- EXEMPTIONS
    taxdist VARCHAR(200),                        -- TAXDIST
    zoning VARCHAR(20),                          -- ZONING
    nbhd VARCHAR(20),                            -- NBHD
    lastupdate TIMESTAMP WITH TIME ZONE,         -- LASTUPDATE
    
    -- TerraFusion OS integration fields
    terrafusion_parcel_id UUID DEFAULT uuid_generate_v4(),
    
    -- Import metadata
    import_batch_id UUID,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status VARCHAR(20) DEFAULT 'pending',
    county VARCHAR(50) DEFAULT 'benton',
    
    -- Validation status
    validation_status VARCHAR(20) DEFAULT 'pending',
    validation_errors JSONB,
    
    -- GIS data (Washington State Plane South - EPSG:2927)
    geometry GEOMETRY(POLYGON, 2927),
    
    CONSTRAINT valid_property_class CHECK (propclass IN ('R', 'C', 'I', 'A', 'E', 'U', 'M', 'X')),
    CONSTRAINT valid_validation_status CHECK (validation_status IN ('pending', 'valid', 'invalid', 'review')),
    CONSTRAINT valid_sync_status CHECK (sync_status IN ('pending', 'synced', 'error', 'conflict'))
);

-- Harris PACS Assessment History
CREATE TABLE harris_pacs.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parid VARCHAR(50) NOT NULL,                  -- Property identifier
    taxyear INTEGER NOT NULL,                    -- Assessment year
    landval DECIMAL(12,2),                       -- Land value for year
    bldgval DECIMAL(12,2),                       -- Building value for year
    totval DECIMAL(12,2),                        -- Total assessed value
    appstatus VARCHAR(20),                       -- Appeal status
    appdate DATE,                                -- Appeal date if applicable
    appresult VARCHAR(100),                      -- Appeal resolution
    assessor VARCHAR(100),                       -- Assessing staff member
    valmethod VARCHAR(50),                       -- Valuation methodology
    compdate DATE,                               -- Assessment completion date
    notes TEXT,                                  -- Assessor notes
    
    -- TerraFusion integration
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status VARCHAR(20) DEFAULT 'pending',
    county VARCHAR(50) DEFAULT 'benton',
    
    CONSTRAINT fk_assessment_parcel FOREIGN KEY (parid) REFERENCES harris_pacs.parcels(parid),
    CONSTRAINT valid_sync_status_assess CHECK (sync_status IN ('pending', 'synced', 'error', 'conflict'))
);

-- Harris PACS Tax Records
CREATE TABLE harris_pacs.tax_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parid VARCHAR(50) NOT NULL,                  -- Property identifier
    taxyear INTEGER NOT NULL,                    -- Tax year
    totaltax DECIMAL(12,2),                      -- Total tax amount
    paidamt DECIMAL(12,2),                       -- Amount paid
    paiddate DATE,                               -- Payment date
    balance DECIMAL(12,2),                       -- Outstanding balance
    penalty DECIMAL(12,2),                       -- Penalty amount
    interest DECIMAL(12,2),                      -- Interest amount
    delqdate DATE,                               -- Delinquency date
    payplan VARCHAR(50),                         -- Payment plan ID
    status VARCHAR(20),                          -- Collection status
    collector VARCHAR(100),                      -- Collecting agency
    
    -- TerraFusion integration
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status VARCHAR(20) DEFAULT 'pending',
    county VARCHAR(50) DEFAULT 'benton',
    
    CONSTRAINT fk_tax_parcel FOREIGN KEY (parid) REFERENCES harris_pacs.parcels(parid),
    CONSTRAINT valid_sync_status_tax CHECK (sync_status IN ('pending', 'synced', 'error', 'conflict'))
);
-- Indexes for performance
CREATE INDEX idx_parcels_parid ON harris_pacs.parcels(parid);
CREATE INDEX idx_parcels_county ON harris_pacs.parcels(county);
CREATE INDEX idx_parcels_sync_status ON harris_pacs.parcels(sync_status);
CREATE INDEX idx_parcels_geometry ON harris_pacs.parcels USING GIST(geometry);
CREATE INDEX idx_assessments_parid_year ON harris_pacs.assessments(parid, taxyear);
CREATE INDEX idx_tax_records_parid_year ON harris_pacs.tax_records(parid, taxyear);

-- Audit trigger function for Harris PACS tables
CREATE OR REPLACE FUNCTION harris_pacs.log_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO harris_pacs.audit_log (table_name, operation, record_id, old_values, changed_by)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.parid, row_to_json(OLD), current_user);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO harris_pacs.audit_log (table_name, operation, record_id, old_values, new_values, changed_by)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.parid, row_to_json(OLD), row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO harris_pacs.audit_log (table_name, operation, record_id, new_values, changed_by)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.parid, row_to_json(NEW), current_user);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to Harris PACS tables
CREATE TRIGGER audit_harris_parcels 
    AFTER INSERT OR UPDATE OR DELETE ON harris_pacs.parcels
    FOR EACH ROW EXECUTE FUNCTION harris_pacs.log_change();

CREATE TRIGGER audit_harris_assessments 
    AFTER INSERT OR UPDATE OR DELETE ON harris_pacs.assessments
    FOR EACH ROW EXECUTE FUNCTION harris_pacs.log_change();

CREATE TRIGGER audit_harris_tax_records 
    AFTER INSERT OR UPDATE OR DELETE ON harris_pacs.tax_records
    FOR EACH ROW EXECUTE FUNCTION harris_pacs.log_change();

-- Validation function for Harris PACS data
CREATE OR REPLACE FUNCTION harris_pacs.validate_parcel_data(p_parid VARCHAR(50))
RETURNS JSONB AS $$
DECLARE
    v_record RECORD;
    v_errors JSONB := '[]'::JSONB;
BEGIN
    SELECT * INTO v_record FROM harris_pacs.parcels WHERE parid = p_parid;
    
    -- Required field validation
    IF v_record.parid IS NULL OR LENGTH(v_record.parid) = 0 THEN
        v_errors := v_errors || '["Missing PARID"]'::JSONB;
    END IF;
    
    IF v_record.ownname1 IS NULL OR LENGTH(v_record.ownname1) = 0 THEN
        v_errors := v_errors || '["Missing Primary Owner Name"]'::JSONB;
    END IF;
    
    IF v_record.totval IS NULL OR v_record.totval <= 0 THEN
        v_errors := v_errors || '["Invalid Total Assessed Value"]'::JSONB;
    END IF;
    
    -- Property class validation
    IF v_record.propclass IS NULL OR v_record.propclass NOT IN ('R', 'C', 'I', 'A', 'E', 'U', 'M', 'X') THEN
        v_errors := v_errors || '["Invalid Property Class"]'::JSONB;
    END IF;
    
    -- Update validation status
    IF jsonb_array_length(v_errors) = 0 THEN
        UPDATE harris_pacs.parcels 
        SET validation_status = 'valid', validation_errors = NULL
        WHERE parid = p_parid;
        RETURN '{"status": "valid", "errors": []}'::JSONB;
    ELSE
        UPDATE harris_pacs.parcels 
        SET validation_status = 'invalid', validation_errors = v_errors
        WHERE parid = p_parid;
        RETURN json_build_object('status', 'invalid', 'errors', v_errors);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Sample Benton County Harris PACS data for testing (first 5 parcels)
INSERT INTO harris_pacs.parcels (
    parid, propaddr, ownname1, ownname2, legaldesc, landval, bldgval, totval, 
    propclass, acres, sqft, yearbuilt, lastsale, saleprice, exemptions, 
    taxdist, zoning, nbhd, lastupdate, sync_status, validation_status
) VALUES 
('R123456789', '123 Main St, Richland WA 99352', 'SMITH JOHN A', 'SMITH MARY B', 
 'LOT 1 BLK 2 RICHLAND HEIGHTS', 85000.00, 165000.00, 250000.00, 'R', 
 0.25, 1850, 1995, '2023-05-15', 245000.00, '', 'RICHLAND SCHOOL DIST', 'R1', 'RH01', 
 NOW(), 'pending', 'pending'),
 
('C987654321', '456 Commercial Ave, Kennewick WA 99336', 'BENTON RETAIL LLC', '', 
 'PARCEL A KENNEWICK COMMERCIAL CENTER', 120000.00, 380000.00, 500000.00, 'C', 
 0.75, 4200, 2001, '2022-11-20', 485000.00, '', 'KENNEWICK SCHOOL DIST', 'C2', 'KC02', 
 NOW(), 'pending', 'pending'),
 
('A555444333', '789 Farm Rd, West Richland WA 99353', 'JOHNSON FARMS INC', '', 
 'SW 1/4 SEC 15 T10N R28E WM', 450000.00, 85000.00, 535000.00, 'A', 
 40.5, 2400, 1978, '2021-08-10', 520000.00, 'AG EXEMPT', 'WEST RICHLAND SCHOOL DIST', 'AG', 'WR03', 
 NOW(), 'pending', 'pending');

-- Grant permissions for TerraFusion OS integration
GRANT USAGE ON SCHEMA harris_pacs TO terrafusion_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA harris_pacs TO terrafusion_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA harris_pacs TO terrafusion_api;

-- Create view for TerraFusion OS integration
CREATE VIEW harris_pacs.v_active_parcels AS
SELECT 
    parid,
    propaddr,
    ownname1,
    ownname2,
    totval,
    landval,
    bldgval,
    propclass,
    acres,
    sqft,
    yearbuilt,
    zoning,
    nbhd,
    sync_status,
    validation_status,
    lastupdate
FROM harris_pacs.parcels 
WHERE validation_status = 'valid' 
  AND county = 'benton'
ORDER BY parid;

-- Migration status view
CREATE VIEW harris_import.migration_status AS
SELECT 
    validation_status,
    COUNT(*) as record_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM harris_import.pacs_parcels
GROUP BY validation_status
ORDER BY validation_status;

-- Sample data for testing (Benton County mock data)
INSERT INTO harris_import.pacs_parcels (
    pacs_parcel_id, owner_name, property_address, legal_desc,
    assessed_value, market_value, acres, property_class, zoning
) VALUES 
('123456001', 'John & Jane Doe', '123 Main St, Richland, WA', 'LOT 1 BLK 2 RICHLAND HEIGHTS', 285000, 320000, 0.25, 'RES', 'R1'),
('123456002', 'Smith Family Trust', '125 Main St, Richland, WA', 'LOT 2 BLK 2 RICHLAND HEIGHTS', 295000, 335000, 0.30, 'RES', 'R1'),
('123456003', 'Benton County', '200 Admin Way, Prosser, WA', 'GOV ADMIN BUILDING PARCEL', 1250000, 1250000, 2.50, 'GOV', 'PUB');

-- Grant permissions for TerraFusion OS service account
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA harris_import TO terrafusion_service;
-- GRANT SELECT ON ALL TABLES IN SCHEMA audit TO terrafusion_service;

COMMENT ON SCHEMA harris_import IS 'Harris PACS 9.0 import schema for Benton County migration to TerraFusion OS';
COMMENT ON TABLE harris_import.pacs_parcels IS 'Main parcel data imported from Harris PACS 9.0 system';
COMMENT ON TABLE audit.change_log IS 'Audit trail for all data changes during migration process';

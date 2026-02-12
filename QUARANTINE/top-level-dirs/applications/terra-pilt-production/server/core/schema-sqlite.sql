-- TerraFusionPilt V2.0.0 - Benton County MVP Database Schema (SQLite)

-- PILT Receipts Table
CREATE TABLE IF NOT EXISTS pilt_receipts (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    county TEXT NOT NULL,
    state TEXT NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    federal_fiscal_year INTEGER NOT NULL,
    received_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Federal Properties Table
CREATE TABLE IF NOT EXISTS federal_properties (
    id TEXT PRIMARY KEY,
    receipt_id TEXT REFERENCES pilt_receipts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    acres DECIMAL(15,2) NOT NULL,
    agency TEXT NOT NULL,
    land_type TEXT NOT NULL,
    assessed_value DECIMAL(15,2) NOT NULL,
    current_use_value DECIMAL(15,2),
    year INTEGER NOT NULL,
    coordinates TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- School Districts Table
CREATE TABLE IF NOT EXISTS districts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    county TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Washington',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Assessed Values Table (by year and district)
CREATE TABLE IF NOT EXISTS assessed_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_id TEXT REFERENCES districts(id),
    year INTEGER NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(district_id, year)
);

-- Levy Rates Table (by year and district)
CREATE TABLE IF NOT EXISTS levy_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_id TEXT REFERENCES districts(id),
    year INTEGER NOT NULL,
    rate DECIMAL(10,7) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(district_id, year)
);

-- PILT Calculations Table
CREATE TABLE IF NOT EXISTS pilt_calculations (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    county TEXT NOT NULL,
    total_federal_acres DECIMAL(15,2) NOT NULL,
    total_assessed_value DECIMAL(15,2) NOT NULL,
    total_levy_amount DECIMAL(15,2) NOT NULL,
    calculation_date DATETIME NOT NULL,
    approved_by TEXT,
    approved_date DATETIME,
    status TEXT NOT NULL DEFAULT 'calculated',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Distributions Table
CREATE TABLE IF NOT EXISTS distributions (
    id TEXT PRIMARY KEY,
    calculation_id TEXT REFERENCES pilt_calculations(id) ON DELETE CASCADE,
    district_id TEXT REFERENCES districts(id),
    district_name TEXT NOT NULL,
    calculated_amount DECIMAL(15,2) NOT NULL,
    percentage DECIMAL(8,4) NOT NULL,
    levy_rate DECIMAL(10,7) NOT NULL,
    assessed_value DECIMAL(15,2) NOT NULL,
    distribution_date DATE,
    status TEXT NOT NULL DEFAULT 'calculated',
    calculation_method TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_values TEXT,
    new_values TEXT,
    user_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_pilt_receipts_year ON pilt_receipts(year);
CREATE INDEX IF NOT EXISTS idx_pilt_receipts_county ON pilt_receipts(county);
CREATE INDEX IF NOT EXISTS idx_federal_properties_receipt ON federal_properties(receipt_id);
CREATE INDEX IF NOT EXISTS idx_assessed_values_year ON assessed_values(year);
CREATE INDEX IF NOT EXISTS idx_levy_rates_year ON levy_rates(year);
CREATE INDEX IF NOT EXISTS idx_distributions_calculation ON distributions(calculation_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- Create Views for Common Queries
CREATE VIEW IF NOT EXISTS v_district_summary AS
SELECT 
    d.id,
    d.name,
    d.code,
    d.county,
    av.year,
    av.total_value as assessed_value,
    lr.rate as levy_rate,
    (av.total_value * lr.rate / 1000) as estimated_levy
FROM districts d
LEFT JOIN assessed_values av ON d.id = av.district_id
LEFT JOIN levy_rates lr ON d.id = lr.district_id AND av.year = lr.year
WHERE d.county = 'Benton County';

CREATE VIEW IF NOT EXISTS v_pilt_summary AS
SELECT 
    pr.year,
    pr.county,
    pr.total_amount as pilt_received,
    COUNT(d.id) as districts_count,
    SUM(d.calculated_amount) as total_distributed,
    AVG(d.percentage) as avg_percentage,
    pc.status as calculation_status,
    pc.approved_by,
    pc.approved_date
FROM pilt_receipts pr
LEFT JOIN pilt_calculations pc ON pr.year = pc.year AND pr.county = pc.county
LEFT JOIN distributions d ON pc.id = d.calculation_id
WHERE pr.county = 'Benton County'
GROUP BY pr.year, pr.county, pr.total_amount, pc.status, pc.approved_by, pc.approved_date; 
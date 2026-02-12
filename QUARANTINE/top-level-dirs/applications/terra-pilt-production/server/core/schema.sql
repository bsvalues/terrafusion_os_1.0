-- TerraFusionPilt V2.0.0 - Benton County MVP Database Schema

-- PILT Receipts Table
CREATE TABLE IF NOT EXISTS pilt_receipts (
    id VARCHAR(255) PRIMARY KEY,
    year INTEGER NOT NULL,
    county VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    federal_fiscal_year INTEGER NOT NULL,
    received_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Federal Properties Table
CREATE TABLE IF NOT EXISTS federal_properties (
    id VARCHAR(255) PRIMARY KEY,
    receipt_id VARCHAR(255) REFERENCES pilt_receipts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    acres DECIMAL(15,2) NOT NULL,
    agency VARCHAR(255) NOT NULL,
    land_type VARCHAR(100) NOT NULL,
    assessed_value DECIMAL(15,2) NOT NULL,
    current_use_value DECIMAL(15,2),
    year INTEGER NOT NULL,
    coordinates TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- School Districts Table
CREATE TABLE IF NOT EXISTS districts (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    county VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL DEFAULT 'Washington',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessed Values Table (by year and district)
CREATE TABLE IF NOT EXISTS assessed_values (
    id SERIAL PRIMARY KEY,
    district_id VARCHAR(255) REFERENCES districts(id),
    year INTEGER NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(district_id, year)
);

-- Levy Rates Table (by year and district)
CREATE TABLE IF NOT EXISTS levy_rates (
    id SERIAL PRIMARY KEY,
    district_id VARCHAR(255) REFERENCES districts(id),
    year INTEGER NOT NULL,
    rate DECIMAL(10,7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(district_id, year)
);

-- PILT Calculations Table
CREATE TABLE IF NOT EXISTS pilt_calculations (
    id VARCHAR(255) PRIMARY KEY,
    year INTEGER NOT NULL,
    county VARCHAR(100) NOT NULL,
    total_federal_acres DECIMAL(15,2) NOT NULL,
    total_assessed_value DECIMAL(15,2) NOT NULL,
    total_levy_amount DECIMAL(15,2) NOT NULL,
    calculation_date TIMESTAMP NOT NULL,
    approved_by VARCHAR(255),
    approved_date TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'calculated',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distributions Table
CREATE TABLE IF NOT EXISTS distributions (
    id VARCHAR(255) PRIMARY KEY,
    calculation_id VARCHAR(255) REFERENCES pilt_calculations(id) ON DELETE CASCADE,
    district_id VARCHAR(255) REFERENCES districts(id),
    district_name VARCHAR(255) NOT NULL,
    calculated_amount DECIMAL(15,2) NOT NULL,
    percentage DECIMAL(8,4) NOT NULL,
    levy_rate DECIMAL(10,7) NOT NULL,
    assessed_value DECIMAL(15,2) NOT NULL,
    distribution_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'calculated',
    calculation_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    old_values TEXT,
    new_values TEXT,
    user_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Benton County School Districts
INSERT INTO districts (id, name, code, county) VALUES 
    ('richland_sd', 'Richland School District', '400', 'Benton County'),
    ('kennewick_sd', 'Kennewick School District', '017', 'Benton County'),
    ('pasco_sd', 'Pasco School District', '001', 'Benton County'),
    ('finley_sd', 'Finley School District', '053', 'Benton County'),
    ('kiona_benton_sd', 'Kiona-Benton City School District', '052', 'Benton County')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample 2024 Assessed Values (in millions)
INSERT INTO assessed_values (district_id, year, total_value) VALUES 
    ('richland_sd', 2024, 3200000000.00),
    ('kennewick_sd', 2024, 2800000000.00),
    ('pasco_sd', 2024, 1200000000.00),
    ('finley_sd', 2024, 180000000.00),
    ('kiona_benton_sd', 2024, 120000000.00)
ON CONFLICT (district_id, year) DO UPDATE SET total_value = EXCLUDED.total_value;

-- Insert Sample 2024 Levy Rates (per $1,000 of assessed value)
INSERT INTO levy_rates (district_id, year, rate) VALUES 
    ('richland_sd', 2024, 0.0025000),
    ('kennewick_sd', 2024, 0.0023500),
    ('pasco_sd', 2024, 0.0027000),
    ('finley_sd', 2024, 0.0032000),
    ('kiona_benton_sd', 2024, 0.0035000)
ON CONFLICT (district_id, year) DO UPDATE SET rate = EXCLUDED.rate;

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_pilt_receipts_year ON pilt_receipts(year);
CREATE INDEX IF NOT EXISTS idx_pilt_receipts_county ON pilt_receipts(county);
CREATE INDEX IF NOT EXISTS idx_federal_properties_receipt ON federal_properties(receipt_id);
CREATE INDEX IF NOT EXISTS idx_assessed_values_year ON assessed_values(year);
CREATE INDEX IF NOT EXISTS idx_levy_rates_year ON levy_rates(year);
CREATE INDEX IF NOT EXISTS idx_distributions_calculation ON distributions(calculation_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- Create Views for Common Queries
CREATE OR REPLACE VIEW v_district_summary AS
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

CREATE OR REPLACE VIEW v_pilt_summary AS
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

-- Sample Data Comments
COMMENT ON TABLE pilt_receipts IS 'Federal PILT receipts received by Benton County';
COMMENT ON TABLE federal_properties IS 'Federal properties within Benton County (primarily Hanford Site)';
COMMENT ON TABLE districts IS 'School districts within Benton County eligible for PILT distribution';
COMMENT ON TABLE distributions IS 'Calculated PILT distributions to school districts';
COMMENT ON VIEW v_district_summary IS 'Summary view of districts with current assessed values and levy rates';
COMMENT ON VIEW v_pilt_summary IS 'Summary view of PILT receipts and distributions by year'; 
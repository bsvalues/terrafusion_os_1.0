-- 🚀 TERRAFUSION ETL PIPELINE ENHANCEMENT
-- Enhanced staging tables for systematic PILT data processing
-- Based on architectural review recommendations

-- Staging table for PILT acres data (from CSV imports)
CREATE TABLE IF NOT EXISTS stg_pilt_acres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Dryland', 'Irrigable', 'Lesser Riverfront', etc.
    unit VARCHAR(20) NOT NULL, -- 'acre' or 'linear_foot'
    quantity DECIMAL(15,2) NOT NULL,
    source_file VARCHAR(255),
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    import_batch_id VARCHAR(50),
    validation_status VARCHAR(20) DEFAULT 'pending' -- 'pending', 'validated', 'error'
);

-- Dimension table for PILT value rates (per-unit values)
CREATE TABLE IF NOT EXISTS dim_pilt_value_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    value_rate DECIMAL(10,2) NOT NULL,
    effective_date DATE NOT NULL,
    expiration_date DATE,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, unit, effective_date)
);

-- Staging table for PILT deductions (81-874 federal education payments)
CREATE TABLE IF NOT EXISTS stg_pilt_deductions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_name VARCHAR(255) NOT NULL,
    deduction_81_874 DECIMAL(15,2) DEFAULT 0,
    year INTEGER NOT NULL,
    source VARCHAR(100),
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(district_name, year)
);

-- Enhanced levy rates staging with additional metadata
CREATE TABLE IF NOT EXISTS stg_levy_rates_enhanced (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_name VARCHAR(255) NOT NULL,
    levy_type VARCHAR(50) NOT NULL, -- 'regular', 'bond', 'maintenance', etc.
    levy_rate_per_1000 DECIMAL(10,7) NOT NULL,
    budget_amount DECIMAL(15,2),
    tax_base DECIMAL(18,2),
    year INTEGER NOT NULL,
    voted BOOLEAN DEFAULT FALSE,
    source_file VARCHAR(255),
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validation_status VARCHAR(20) DEFAULT 'pending'
);

-- Insert standard PILT value rates based on current data
INSERT OR IGNORE INTO dim_pilt_value_rates (category, unit, value_rate, effective_date, source) VALUES
('Dryland', 'acre', 223.57, '2024-01-01', 'Benton County Assessor 2024'),
('Irrigable', 'acre', 2635.91, '2024-01-01', 'Benton County Assessor 2024'),
('Lesser Riverfront', 'linear_foot', 50.00, '2024-01-01', 'Benton County Assessor 2024'),
('Prime Riverfront', 'linear_foot', 1965.00, '2024-01-01', 'Benton County Assessor 2024'),
('Rural Residential', 'acre', 37069.81, '2024-01-01', 'Benton County Assessor 2024'),
('Town Plats', 'acre', 122469.84, '2024-01-01', 'Benton County Assessor 2024');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stg_pilt_acres_district ON stg_pilt_acres(district_name);
CREATE INDEX IF NOT EXISTS idx_stg_pilt_acres_category ON stg_pilt_acres(category);
CREATE INDEX IF NOT EXISTS idx_stg_pilt_acres_import_date ON stg_pilt_acres(import_date);
CREATE INDEX IF NOT EXISTS idx_dim_value_rates_category_unit ON dim_pilt_value_rates(category, unit);
CREATE INDEX IF NOT EXISTS idx_stg_levy_rates_district_year ON stg_levy_rates_enhanced(district_name, year); 
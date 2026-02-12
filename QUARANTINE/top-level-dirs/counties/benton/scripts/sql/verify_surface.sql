-- PostgreSQL-compatible PACS twin verification placeholder for Benton County
SELECT 1 AS ok;

-- Create basic TerraFusion tables if they don't exist
CREATE TABLE IF NOT EXISTS property_assessments (
    id SERIAL PRIMARY KEY,
    county_id VARCHAR(50) NOT NULL DEFAULT 'benton',
    parcel_id VARCHAR(100) NOT NULL,
    assessed_value DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create basic audit table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_assessments_county_parcel
ON property_assessments(county_id, parcel_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
ON audit_logs(timestamp);

-- Verify setup
SELECT 'TerraFusion PostgreSQL setup complete for Benton County' AS status;

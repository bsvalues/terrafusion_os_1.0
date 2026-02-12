-- TerraFusion Production Database Schema
-- Comprehensive property assessment platform for Benton County

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Properties table with comprehensive indexing
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    owner_name VARCHAR(255),
    assessed_value DECIMAL(12,2),
    square_footage INTEGER,
    year_built INTEGER,
    property_type VARCHAR(100),
    land_value DECIMAL(12,2),
    improvement_value DECIMAL(12,2),
    tax_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    location GEOGRAPHY(POINT, 4326),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales comparables table
CREATE TABLE IF NOT EXISTS sales_comparables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id),
    sale_date DATE NOT NULL,
    sale_price DECIMAL(12,2) NOT NULL,
    sale_type VARCHAR(50) DEFAULT 'market',
    buyer_name VARCHAR(255),
    seller_name VARCHAR(255),
    document_number VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    adjustment_factors JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent jobs table for AI processing
CREATE TABLE IF NOT EXISTS agent_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(100) NOT NULL,
    property_id UUID REFERENCES properties(id),
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- System health monitoring
CREATE TABLE IF NOT EXISTS system_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Audit log for compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_properties_parcel_id ON properties(parcel_id);
CREATE INDEX IF NOT EXISTS idx_properties_address_gin ON properties USING GIN(to_tsvector('english', address));
CREATE INDEX IF NOT EXISTS idx_properties_owner_gin ON properties USING GIN(to_tsvector('english', owner_name));
CREATE INDEX IF NOT EXISTS idx_properties_assessed_value ON properties(assessed_value);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

CREATE INDEX IF NOT EXISTS idx_sales_property_id ON sales_comparables(property_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales_comparables(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_sale_price ON sales_comparables(sale_price);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_agent_id ON agent_jobs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_property_id ON agent_jobs(property_id);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status ON agent_jobs(status);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_created_at ON agent_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON system_health(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_health_service ON system_health(service_name);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for full-text search
CREATE OR REPLACE FUNCTION search_properties(search_query TEXT, limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
    id UUID,
    parcel_id VARCHAR(50),
    address TEXT,
    owner_name VARCHAR(255),
    assessed_value DECIMAL(12,2),
    property_type VARCHAR(100),
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.parcel_id,
        p.address,
        p.owner_name,
        p.assessed_value,
        p.property_type,
        GREATEST(
            ts_rank(to_tsvector('english', p.address), plainto_tsquery('english', search_query)),
            ts_rank(to_tsvector('english', COALESCE(p.owner_name, '')), plainto_tsquery('english', search_query))
        ) as rank
    FROM properties p
    WHERE 
        to_tsvector('english', p.address) @@ plainto_tsquery('english', search_query)
        OR to_tsvector('english', COALESCE(p.owner_name, '')) @@ plainto_tsquery('english', search_query)
        OR p.parcel_id ILIKE '%' || search_query || '%'
    ORDER BY rank DESC, p.assessed_value DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Data retention policy (remove old health checks)
CREATE OR REPLACE FUNCTION cleanup_old_health_data()
RETURNS void AS $$
BEGIN
    DELETE FROM system_health 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    DELETE FROM audit_log 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for application user
-- Note: In production, create a dedicated user with limited permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO terrafusion_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO terrafusion_app;
-- TerraFusion Performance Optimization Script
-- PostgreSQL tuning for 94,149+ Benton County property records

-- Connection and memory settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET work_mem = '64MB';

-- WAL and checkpoint settings
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET checkpoint_timeout = '10min';
ALTER SYSTEM SET max_wal_size = '2GB';
ALTER SYSTEM SET min_wal_size = '1GB';

-- Query planner settings
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Parallel processing
ALTER SYSTEM SET max_worker_processes = 8;
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET max_parallel_workers = 8;
ALTER SYSTEM SET max_parallel_maintenance_workers = 4;

-- Logging for monitoring
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET log_statement = 'ddl';

-- Auto vacuum settings for large tables
ALTER SYSTEM SET autovacuum_max_workers = 6;
ALTER SYSTEM SET autovacuum_naptime = '30s';
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;

-- Apply configuration changes
SELECT pg_reload_conf();

-- Create partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_active_assessed 
ON properties(assessed_value) 
WHERE deleted_at IS NULL AND assessed_value > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_recent_sales 
ON properties(last_sale_date, last_sale_price) 
WHERE deleted_at IS NULL AND last_sale_date >= CURRENT_DATE - INTERVAL '2 years';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_location_class 
ON properties(property_class, situs_address) 
WHERE deleted_at IS NULL;

-- Update table statistics for optimal query planning
ANALYZE properties;
ANALYZE assessments;
ANALYZE counties;

-- Vacuum analyze all tables
VACUUM ANALYZE properties;
VACUUM ANALYZE assessments;
VACUUM ANALYZE counties;

-- Create materialized view for dashboard performance
DROP MATERIALIZED VIEW IF EXISTS dashboard_performance_stats;
CREATE MATERIALIZED VIEW dashboard_performance_stats AS
SELECT 
    COUNT(*) as total_properties,
    SUM(assessed_value) as total_assessed_value,
    AVG(assessed_value) as avg_assessed_value,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY assessed_value) as median_assessed_value,
    COUNT(DISTINCT property_class) as unique_property_classes,
    COUNT(*) FILTER (WHERE last_sale_date >= CURRENT_DATE - INTERVAL '1 year') as recent_sales,
    MAX(updated_at) as last_data_update,
    NOW() as stats_generated_at
FROM properties
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX ON dashboard_performance_stats (stats_generated_at);

-- Function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_performance_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_performance_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic stats refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-dashboard-stats', '*/5 * * * *', 'SELECT refresh_dashboard_performance_stats();');

-- Property search optimization
CREATE OR REPLACE FUNCTION search_properties_optimized(
    search_term TEXT DEFAULT NULL,
    property_class_filter TEXT DEFAULT NULL,
    min_value DECIMAL DEFAULT NULL,
    max_value DECIMAL DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    parcel_id VARCHAR(50),
    parcel_number VARCHAR(30),
    owner_name VARCHAR(200),
    situs_address VARCHAR(300),
    property_class VARCHAR(10),
    total_value DECIMAL(12,2),
    assessed_value DECIMAL(12,2),
    last_sale_date DATE,
    last_sale_price DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.parcel_id,
        p.parcel_number,
        p.owner_name,
        p.situs_address,
        p.property_class,
        p.total_value,
        p.assessed_value,
        p.last_sale_date,
        p.last_sale_price
    FROM properties p
    WHERE p.deleted_at IS NULL
        AND (search_term IS NULL OR 
             p.owner_name ILIKE '%' || search_term || '%' OR
             p.situs_address ILIKE '%' || search_term || '%' OR
             p.parcel_number ILIKE '%' || search_term || '%')
        AND (property_class_filter IS NULL OR p.property_class = property_class_filter)
        AND (min_value IS NULL OR p.assessed_value >= min_value)
        AND (max_value IS NULL OR p.assessed_value <= max_value)
    ORDER BY p.assessed_value DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Bulk assessment update function
CREATE OR REPLACE FUNCTION bulk_update_assessments(
    assessment_data JSONB
)
RETURNS INTEGER AS $$
DECLARE
    update_count INTEGER := 0;
    assessment_record RECORD;
BEGIN
    FOR assessment_record IN
        SELECT * FROM jsonb_to_recordset(assessment_data) AS x(
            parcel_id VARCHAR(50),
            assessed_value DECIMAL(12,2),
            land_value DECIMAL(12,2),
            improvement_value DECIMAL(12,2),
            total_value DECIMAL(12,2),
            tax_year INTEGER
        )
    LOOP
        UPDATE properties 
        SET 
            assessed_value = assessment_record.assessed_value,
            land_value = assessment_record.land_value,
            improvement_value = assessment_record.improvement_value,
            total_value = assessment_record.total_value,
            tax_year = assessment_record.tax_year,
            updated_at = NOW()
        WHERE parcel_id = assessment_record.parcel_id
            AND deleted_at IS NULL;
        
        GET DIAGNOSTICS update_count = ROW_COUNT;
    END LOOP;
    
    RETURN update_count;
END;
$$ LANGUAGE plpgsql;

-- Performance monitoring views
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    rows,
    mean_time,
    stddev_time,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;

CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY size_bytes DESC;

-- Connection monitoring
CREATE OR REPLACE VIEW active_connections AS
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start DESC;

-- Log performance optimization completion
INSERT INTO system_stats (stat_name, stat_value, stat_data, calculated_at)
VALUES (
    'performance_optimization_applied',
    1,
    jsonb_build_object(
        'applied_at', NOW(),
        'configuration', 'production_tuning',
        'target_records', 94149,
        'indexes_created', 3,
        'functions_created', 3
    ),
    NOW()
);
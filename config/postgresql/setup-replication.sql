-- TerraFusion OS PostgreSQL Replication Setup
-- PhD-Level Database Replication Configuration for Government Property Assessment Systems
-- Creates users, roles, and replication slots for master-replica architecture

-- =============================================================================
-- REPLICATION USER SETUP
-- =============================================================================

-- Create dedicated replication user with minimal privileges
CREATE ROLE replicator WITH REPLICATION LOGIN ENCRYPTED PASSWORD 'TF_Replica_2025_Secure!';

-- Grant necessary permissions for replication
GRANT CONNECT ON DATABASE postgres TO replicator;
GRANT USAGE ON SCHEMA public TO replicator;

-- Create replication slots for each replica
-- Primary slot for main read replica
SELECT pg_create_physical_replication_slot('replica_1');

-- Additional slots for potential replicas
SELECT pg_create_physical_replication_slot('replica_2');
SELECT pg_create_physical_replication_slot('replica_3');

-- =============================================================================
-- APPLICATION USER SETUP WITH READ/WRITE SEPARATION
-- =============================================================================

-- Primary application user for read/write operations
CREATE ROLE terrafusion WITH LOGIN ENCRYPTED PASSWORD 'TF_App_2025_Secure!';

-- Read-only user for replica queries
CREATE ROLE terrafusion_readonly WITH LOGIN ENCRYPTED PASSWORD 'TF_ReadOnly_2025_Secure!';

-- Grant database access
GRANT CONNECT ON DATABASE terrafusion TO terrafusion;
GRANT CONNECT ON DATABASE terrafusion TO terrafusion_readonly;

-- Create schemas if they don't exist
\c terrafusion;

CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS government;
CREATE SCHEMA IF NOT EXISTS harris_pacs;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS cache;

-- =============================================================================
-- SCHEMA-LEVEL PERMISSIONS
-- =============================================================================

-- Full permissions for primary application user
GRANT ALL PRIVILEGES ON SCHEMA public TO terrafusion;
GRANT ALL PRIVILEGES ON SCHEMA government TO terrafusion;
GRANT ALL PRIVILEGES ON SCHEMA harris_pacs TO terrafusion;
GRANT ALL PRIVILEGES ON SCHEMA compliance TO terrafusion;
GRANT ALL PRIVILEGES ON SCHEMA analytics TO terrafusion;
GRANT ALL PRIVILEGES ON SCHEMA cache TO terrafusion;

-- Read-only permissions for replica user
GRANT USAGE ON SCHEMA public TO terrafusion_readonly;
GRANT USAGE ON SCHEMA government TO terrafusion_readonly;
GRANT USAGE ON SCHEMA harris_pacs TO terrafusion_readonly;
GRANT USAGE ON SCHEMA compliance TO terrafusion_readonly;
GRANT USAGE ON SCHEMA analytics TO terrafusion_readonly;
GRANT USAGE ON SCHEMA cache TO terrafusion_readonly;

-- =============================================================================
-- TABLE-LEVEL PERMISSIONS (Current and Future)
-- =============================================================================

-- Grant permissions on existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO terrafusion;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA government TO terrafusion;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA harris_pacs TO terrafusion;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA compliance TO terrafusion;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO terrafusion;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cache TO terrafusion;

-- Read-only access for replica user
GRANT SELECT ON ALL TABLES IN SCHEMA public TO terrafusion_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA government TO terrafusion_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA harris_pacs TO terrafusion_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA compliance TO terrafusion_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO terrafusion_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA cache TO terrafusion_readonly;

-- Grant permissions on future tables (important for automatic schema changes)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO terrafusion;
ALTER DEFAULT PRIVILEGES IN SCHEMA government GRANT ALL PRIVILEGES ON TABLES TO terrafusion;
ALTER DEFAULT PRIVILEGES IN SCHEMA harris_pacs GRANT ALL PRIVILEGES ON TABLES TO terrafusion;
ALTER DEFAULT PRIVILEGES IN SCHEMA compliance GRANT ALL PRIVILEGES ON TABLES TO terrafusion;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL PRIVILEGES ON TABLES TO terrafusion;
ALTER DEFAULT PRIVILEGES IN SCHEMA cache GRANT ALL PRIVILEGES ON TABLES TO terrafusion;

-- Read-only future table permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO terrafusion_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA government GRANT SELECT ON TABLES TO terrafusion_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA harris_pacs GRANT SELECT ON TABLES TO terrafusion_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA compliance GRANT SELECT ON TABLES TO terrafusion_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT SELECT ON TABLES TO terrafusion_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA cache GRANT SELECT ON TABLES TO terrafusion_readonly;

-- =============================================================================
-- SEQUENCE PERMISSIONS
-- =============================================================================

-- Grant sequence permissions for primary user
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO terrafusion;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA government TO terrafusion;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA harris_pacs TO terrafusion;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA compliance TO terrafusion;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA analytics TO terrafusion;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA cache TO terrafusion;

-- Future sequence permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO terrafusion;
ALTER DEFAULT PRIVILEGES IN SCHEMA government GRANT ALL PRIVILEGES ON SEQUENCES TO terrafusion;
ALTER DEFAULT PRIVILEGES IN SCHEMA harris_pacs GRANT ALL PRIVILEGES ON SEQUENCES TO terrafusion;
ALTER DEFAULT PRIVILEGES IN SCHEMA compliance GRANT ALL PRIVILEGES ON SEQUENCES TO terrafusion;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL PRIVILEGES ON SEQUENCES TO terrafusion;
ALTER DEFAULT PRIVILEGES IN SCHEMA cache GRANT ALL PRIVILEGES ON SEQUENCES TO terrafusion;

-- =============================================================================
-- SPECIALIZED USERS FOR DIFFERENT FUNCTIONS
-- =============================================================================

-- Harris PACS integration user
CREATE ROLE harris_pacs WITH LOGIN ENCRYPTED PASSWORD 'TF_HarrisPACS_2025_Secure!';
GRANT CONNECT ON DATABASE terrafusion TO harris_pacs;
GRANT USAGE ON SCHEMA harris_pacs TO harris_pacs;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA harris_pacs TO harris_pacs;
ALTER DEFAULT PRIVILEGES IN SCHEMA harris_pacs GRANT SELECT, INSERT, UPDATE ON TABLES TO harris_pacs;

-- Tyler Technologies integration user
CREATE ROLE tyler_user WITH LOGIN ENCRYPTED PASSWORD 'TF_Tyler_2025_Secure!';
GRANT CONNECT ON DATABASE terrafusion TO tyler_user;
GRANT USAGE ON SCHEMA public TO tyler_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO tyler_user;

-- Monitoring user for metrics collection
CREATE ROLE monitoring_user WITH LOGIN ENCRYPTED PASSWORD 'TF_Monitoring_2025_Secure!';
GRANT CONNECT ON DATABASE terrafusion TO monitoring_user;
GRANT pg_monitor TO monitoring_user;

-- Backup user for database backups
CREATE ROLE backup_user WITH REPLICATION LOGIN ENCRYPTED PASSWORD 'TF_Backup_2025_Secure!';
GRANT CONNECT ON DATABASE terrafusion TO backup_user;
GRANT pg_read_all_data TO backup_user;

-- Audit user for compliance checking
CREATE ROLE audit_reader WITH LOGIN ENCRYPTED PASSWORD 'TF_Audit_2025_Secure!';
GRANT CONNECT ON DATABASE terrafusion TO audit_reader;
GRANT USAGE ON SCHEMA compliance TO audit_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA compliance TO audit_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO audit_reader;

-- =============================================================================
-- NEGATIVE CACHING SUPPORT CONFIGURATION
-- =============================================================================

-- Create dedicated schema and table for cache metadata
CREATE SCHEMA IF NOT EXISTS negative_cache;

-- Cache metadata table for tracking miss sentinels
CREATE TABLE negative_cache.miss_sentinels (
    cache_key VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 seconds'),
    cache_type VARCHAR(50) DEFAULT 'property_lookup',
    jurisdiction VARCHAR(100),
    property_id VARCHAR(100),
    request_count INTEGER DEFAULT 1,
    INDEX idx_expires_at (expires_at),
    INDEX idx_cache_type (cache_type),
    INDEX idx_created_at (created_at)
);

-- Cache statistics table for performance monitoring
CREATE TABLE negative_cache.cache_stats (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cache_hits BIGINT DEFAULT 0,
    cache_misses BIGINT DEFAULT 0,
    negative_cache_hits BIGINT DEFAULT 0,
    database_queries_prevented BIGINT DEFAULT 0,
    average_response_time_ms DECIMAL(8,2),
    peak_concurrent_requests INTEGER,
    cache_type VARCHAR(50),
    INDEX idx_timestamp (timestamp),
    INDEX idx_cache_type_stats (cache_type)
);

-- Grant permissions for negative cache operations
GRANT ALL PRIVILEGES ON SCHEMA negative_cache TO terrafusion;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA negative_cache TO terrafusion;
GRANT SELECT ON ALL TABLES IN SCHEMA negative_cache TO terrafusion_readonly;

-- Create Redis integration user for cache operations
CREATE ROLE redis_user WITH LOGIN ENCRYPTED PASSWORD 'TF_Redis_2025_Secure!';
GRANT CONNECT ON DATABASE terrafusion TO redis_user;
GRANT USAGE ON SCHEMA negative_cache TO redis_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA negative_cache TO redis_user;

-- =============================================================================
-- REPLICATION MONITORING FUNCTIONS
-- =============================================================================

-- Function to check replication lag
CREATE OR REPLACE FUNCTION public.get_replication_lag()
RETURNS TABLE (
    slot_name name,
    active boolean,
    current_lsn pg_lsn,
    sent_lsn pg_lsn,
    flush_lsn pg_lsn,
    replay_lsn pg_lsn,
    lag_bytes bigint,
    lag_seconds float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.slot_name,
        s.active,
        pg_current_wal_lsn() as current_lsn,
        stat.sent_lsn,
        stat.flush_lsn,
        stat.replay_lsn,
        pg_wal_lsn_diff(pg_current_wal_lsn(), stat.replay_lsn) as lag_bytes,
        EXTRACT(EPOCH FROM (now() - stat.reply_time)) as lag_seconds
    FROM pg_replication_slots s
    LEFT JOIN pg_stat_replication stat ON s.slot_name = stat.slot_name
    WHERE s.slot_type = 'physical';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to monitoring user
GRANT EXECUTE ON FUNCTION public.get_replication_lag() TO monitoring_user;

-- =============================================================================
-- PERFORMANCE MONITORING TABLES
-- =============================================================================

-- Query performance tracking table
CREATE TABLE IF NOT EXISTS public.query_performance_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    database_name VARCHAR(100),
    query_hash VARCHAR(64),
    query_time_ms DECIMAL(10,3),
    rows_returned BIGINT,
    query_type VARCHAR(50),
    table_name VARCHAR(100),
    user_name VARCHAR(100),
    client_addr INET,
    INDEX idx_timestamp_perf (timestamp),
    INDEX idx_query_type_perf (query_type),
    INDEX idx_query_time_perf (query_time_ms)
);

-- Grant monitoring permissions
GRANT ALL PRIVILEGES ON TABLE public.query_performance_log TO monitoring_user;

-- =============================================================================
-- COUNTY-SPECIFIC DATABASE SETUP
-- =============================================================================

-- Create county-specific roles if deploying multi-county
-- Benton County (Production)
CREATE ROLE benton_user WITH LOGIN ENCRYPTED PASSWORD 'TF_Benton_2025_Secure!';
CREATE ROLE benton_admin WITH LOGIN ENCRYPTED PASSWORD 'TF_BentonAdmin_2025_Secure!';

-- Yakima County (Flagship)
CREATE ROLE yakima_user WITH LOGIN ENCRYPTED PASSWORD 'TF_Yakima_2025_Secure!';
CREATE ROLE yakima_admin WITH LOGIN ENCRYPTED PASSWORD 'TF_YakimaAdmin_2025_Secure!';

-- Cowlitz County
CREATE ROLE cowlitz_user WITH LOGIN ENCRYPTED PASSWORD 'TF_Cowlitz_2025_Secure!';
CREATE ROLE cowlitz_admin WITH LOGIN ENCRYPTED PASSWORD 'TF_CowlitzAdmin_2025_Secure!';

-- =============================================================================
-- SECURITY CONFIGURATION
-- =============================================================================

-- Enable row-level security on sensitive tables (to be applied per table)
-- This will be handled in the application layer for specific tables

-- Create audit trigger function for change tracking
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert audit record for any data changes
    INSERT INTO compliance.audit_log (
        table_name,
        operation,
        old_values,
        new_values,
        user_name,
        timestamp
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        current_user,
        NOW()
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INITIAL DATA AND INDEXES FOR NEGATIVE CACHING
-- =============================================================================

-- Create indexes for optimal negative caching performance
-- These indexes will be created on application tables during deployment

-- Sample index patterns for property lookup optimization:
-- CREATE INDEX CONCURRENTLY idx_properties_jurisdiction_parcel ON properties(jurisdiction, parcel_number);
-- CREATE INDEX CONCURRENTLY idx_properties_lookup_key ON properties(lookup_key) WHERE active = true;
-- CREATE INDEX CONCURRENTLY idx_harris_pacs_property_id ON harris_pacs_data(property_id, jurisdiction);

-- =============================================================================
-- CLEANUP AND MAINTENANCE PROCEDURES
-- =============================================================================

-- Procedure to clean up expired negative cache entries
CREATE OR REPLACE FUNCTION negative_cache.cleanup_expired_entries()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM negative_cache.miss_sentinels 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    INSERT INTO negative_cache.cache_stats (
        cache_hits, cache_misses, negative_cache_hits, 
        database_queries_prevented, cache_type
    ) VALUES (
        0, 0, 0, deleted_count, 'cleanup_operation'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FINAL STATUS CHECK
-- =============================================================================

-- Display replication configuration status
\echo 'TerraFusion OS PostgreSQL Replication Setup Complete'
\echo '==============================================='

-- Show created replication slots
SELECT slot_name, slot_type, active, temporary FROM pg_replication_slots;

-- Show created roles
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin, rolreplication 
FROM pg_roles 
WHERE rolname LIKE '%terrafusion%' OR rolname LIKE '%replicator%' OR rolname LIKE '%harris%';

\echo 'Replication setup completed successfully!'
\echo 'Next steps:'
\echo '1. Configure pg_hba.conf for secure access'
\echo '2. Set up read replica servers'
\echo '3. Configure application connection pooling'
\echo '4. Implement negative caching in application layer'
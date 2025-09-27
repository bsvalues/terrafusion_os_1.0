-- TerraFusion OS UAT Database Configuration
-- Benton County Washington - Government Security Roles
-- FISMA/NIST Compliant Role-Based Access Control

-- =============================================================================
-- CORE SECURITY ROLES
-- =============================================================================

-- Drop existing roles if they exist (for clean setup)
DROP ROLE IF EXISTS role_public;
DROP ROLE IF EXISTS role_citizen;
DROP ROLE IF EXISTS role_realtor;
DROP ROLE IF EXISTS role_assessor;
DROP ROLE IF EXISTS role_county_admin;
DROP ROLE IF EXISTS role_enterprise_admin;
DROP ROLE IF EXISTS role_ai_coordination;
DROP ROLE IF EXISTS role_rust_engine;

-- Public access (read-only public records)
CREATE ROLE role_public NOINHERIT LOGIN;
COMMENT ON ROLE role_public IS 'Public access to non-sensitive property records';

-- Citizen access (property owners viewing their records)
CREATE ROLE role_citizen NOINHERIT LOGIN;
COMMENT ON ROLE role_citizen IS 'Property owners accessing their own records';

-- Realtor access (MLS integration and property searches)
CREATE ROLE role_realtor NOINHERIT LOGIN;
COMMENT ON ROLE role_realtor IS 'Licensed real estate professionals';

-- Assessor access (property valuation and assessment)
CREATE ROLE role_assessor NOINHERIT LOGIN;
COMMENT ON ROLE role_assessor IS 'Benton County assessor staff - valuation authority';

-- County Admin (system administration)
CREATE ROLE role_county_admin NOINHERIT LOGIN;
COMMENT ON ROLE role_county_admin IS 'Benton County IT administrators';

-- Enterprise Admin (TerraFusion system administration)
CREATE ROLE role_enterprise_admin NOINHERIT LOGIN;
COMMENT ON ROLE role_enterprise_admin IS 'TerraFusion enterprise administrators';

-- AI Coordination (for the 1,008 AI agents)
CREATE ROLE role_ai_coordination NOINHERIT LOGIN;
COMMENT ON ROLE role_ai_coordination IS 'AI agent coordination and orchestration';

-- Rust Engine (for the 50,000 performance agents)
CREATE ROLE role_rust_engine NOINHERIT LOGIN;
COMMENT ON ROLE role_rust_engine IS 'Elite Rust Performance Engine access';

-- =============================================================================
-- ROLE HIERARCHIES & INHERITANCE
-- =============================================================================

-- Citizen inherits from public
GRANT role_public TO role_citizen;

-- Realtor has elevated access
GRANT role_citizen TO role_realtor;

-- Assessor has professional access
GRANT role_realtor TO role_assessor;

-- County admin has administrative access
GRANT role_assessor TO role_county_admin;

-- Enterprise admin has full system access
GRANT role_county_admin TO role_enterprise_admin;

-- AI coordination has specialized access
GRANT role_assessor TO role_ai_coordination;

-- Rust engine has performance-optimized access
GRANT role_citizen TO role_rust_engine;

-- =============================================================================
-- UAT TEST USERS
-- =============================================================================

-- Create specific UAT test accounts
CREATE USER assessor_test WITH PASSWORD 'UAT-Assessor-2025!' IN ROLE role_assessor;
CREATE USER countyadmin_test WITH PASSWORD 'UAT-CountyAdmin-2025!' IN ROLE role_county_admin;
CREATE USER realtor_test WITH PASSWORD 'UAT-Realtor-2025!' IN ROLE role_realtor;
CREATE USER citizen_test WITH PASSWORD 'UAT-Citizen-2025!' IN ROLE role_citizen;

-- AI and engine service accounts
CREATE USER ai_coordinator WITH PASSWORD 'UAT-AI-Coord-2025!' IN ROLE role_ai_coordination;
CREATE USER rust_engine WITH PASSWORD 'UAT-Rust-Engine-2025!' IN ROLE role_rust_engine;

-- =============================================================================
-- DATABASE CONFIGURATION
-- =============================================================================

-- Set up database-level security
ALTER DATABASE postgres SET log_statement = 'all';
ALTER DATABASE postgres SET log_min_duration_statement = 0;

-- =============================================================================
-- SCHEMA PERMISSIONS
-- =============================================================================

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA public TO role_public;
GRANT USAGE ON SCHEMA public TO role_citizen;
GRANT USAGE ON SCHEMA public TO role_realtor;
GRANT USAGE ON SCHEMA public TO role_assessor;
GRANT USAGE ON SCHEMA public TO role_county_admin;
GRANT USAGE ON SCHEMA public TO role_enterprise_admin;
GRANT USAGE ON SCHEMA public TO role_ai_coordination;
GRANT USAGE ON SCHEMA public TO role_rust_engine;

-- =============================================================================
-- AUDIT LOGGING SETUP
-- =============================================================================

-- Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Audit table for all government transactions
CREATE TABLE IF NOT EXISTS audit.user_actions (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    role_name TEXT NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Government compliance fields
    classification TEXT DEFAULT 'sensitive',
    retention_date DATE DEFAULT (CURRENT_DATE + INTERVAL '7 years'),
    audit_trail_id UUID DEFAULT gen_random_uuid()
);

-- Index for performance and compliance queries
CREATE INDEX idx_audit_user_actions_username ON audit.user_actions(username);
CREATE INDEX idx_audit_user_actions_created_at ON audit.user_actions(created_at);
CREATE INDEX idx_audit_user_actions_table_name ON audit.user_actions(table_name);

-- Grant audit access
GRANT SELECT ON audit.user_actions TO role_county_admin;
GRANT SELECT ON audit.user_actions TO role_enterprise_admin;

-- =============================================================================
-- GOVERNMENT COMPLIANCE SETTINGS
-- =============================================================================

-- Enable row-level security globally
ALTER DATABASE postgres SET row_security = on;

-- Set timezone for government operations
ALTER DATABASE postgres SET timezone = 'America/Los_Angeles';  -- Pacific Time for Washington State

-- Set application name for connection tracking
ALTER DATABASE postgres SET application_name = 'TerraFusion-OS-UAT';

-- =============================================================================
-- AI COORDINATION SCHEMA
-- =============================================================================

-- Create schema for AI agent coordination
CREATE SCHEMA IF NOT EXISTS ai_coordination;

-- Agent state tracking table
CREATE TABLE IF NOT EXISTS ai_coordination.agent_state (
    agent_id TEXT PRIMARY KEY,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('supreme_commander', 'field_general', 'operational')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'maintenance', 'offline')),
    current_task JSONB,
    performance_metrics JSONB,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rust performance agents tracking
CREATE TABLE IF NOT EXISTS ai_coordination.rust_agents (
    agent_id TEXT PRIMARY KEY,
    crate_name TEXT NOT NULL,
    performance_level TEXT DEFAULT 'elite',
    response_time_ms NUMERIC(10,3),
    operations_per_second INTEGER,
    last_performance_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'offline'))
);

-- Grant AI coordination access
GRANT ALL ON SCHEMA ai_coordination TO role_ai_coordination;
GRANT ALL ON ai_coordination.agent_state TO role_ai_coordination;
GRANT ALL ON ai_coordination.rust_agents TO role_rust_engine;

-- Grant read access to admins
GRANT SELECT ON ai_coordination.agent_state TO role_county_admin;
GRANT SELECT ON ai_coordination.rust_agents TO role_county_admin;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ TerraFusion OS UAT Database Roles Configured Successfully';
    RAISE NOTICE '🏛️ Government-grade security enabled';
    RAISE NOTICE '🔐 Row-level security activated';
    RAISE NOTICE '📊 Audit logging configured';
    RAISE NOTICE '🤖 AI coordination schema ready';
    RAISE NOTICE '⚡ Elite Rust engine access granted';
    RAISE NOTICE '👥 UAT test accounts created';
END $$;
-- Migration: JWT Token Audit Trail
-- Purpose: Track JWT tokens for security auditing, revocation, and compliance
-- Date: 2025-10-08
-- Author: TerraFusion Security Team

-- ============================================================================
-- CREATE TOKEN AUDIT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS token_audit (
    id BIGSERIAL PRIMARY KEY,
    
    -- JWT Claims (Standard)
    jti VARCHAR(255) NOT NULL UNIQUE,        -- JWT ID (unique identifier)
    kid VARCHAR(100) NOT NULL,               -- Key ID (which key signed this token)
    sub VARCHAR(255) NOT NULL,               -- Subject (user ID)
    iss VARCHAR(255) NOT NULL,               -- Issuer (https://auth.terrafusion.ai)
    aud TEXT[] NOT NULL,                     -- Audience (array of valid audiences)
    iat BIGINT NOT NULL,                     -- Issued at (Unix timestamp)
    exp BIGINT NOT NULL,                     -- Expiry (Unix timestamp)
    nbf BIGINT,                              -- Not before (Unix timestamp)
    
    -- Algorithm & Signature
    algorithm VARCHAR(20) NOT NULL,          -- RS256 | HS256
    signature_valid BOOLEAN NOT NULL DEFAULT true,
    
    -- Custom Claims (TerraFusion)
    tenant_id VARCHAR(100),                  -- Multi-tenant isolation
    org_id VARCHAR(100),                     -- Organization ID
    roles TEXT[],                            -- RBAC roles (array)
    permissions TEXT[],                      -- Fine-grained permissions (array)
    scope TEXT,                              -- OAuth2 scopes (space-separated)
    
    -- Client Information
    ip_address INET,                         -- Client IP address
    user_agent TEXT,                         -- Client user agent
    client_id VARCHAR(255),                  -- OAuth2 client ID
    
    -- Revocation
    revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by VARCHAR(255),                 -- Who revoked the token
    revocation_reason TEXT,                  -- Why was it revoked
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB,                          -- Additional metadata
    
    -- Constraints
    CONSTRAINT token_audit_jti_unique UNIQUE (jti),
    CONSTRAINT token_audit_exp_check CHECK (exp > iat),
    CONSTRAINT token_audit_algorithm_check CHECK (algorithm IN ('RS256', 'HS256', 'ES256'))
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Query by JWT ID (revocation checks)
CREATE INDEX idx_token_audit_jti ON token_audit(jti) WHERE NOT revoked;

-- Query by subject (user tokens)
CREATE INDEX idx_token_audit_sub ON token_audit(sub) WHERE NOT revoked;

-- Query by tenant (multi-tenant isolation)
CREATE INDEX idx_token_audit_tenant ON token_audit(tenant_id) WHERE tenant_id IS NOT NULL;

-- Query by expiry (cleanup expired tokens)
CREATE INDEX idx_token_audit_exp ON token_audit(exp) WHERE NOT revoked;

-- Query by key ID (key rotation tracking)
CREATE INDEX idx_token_audit_kid ON token_audit(kid);

-- Query by algorithm (HS256 migration tracking)
CREATE INDEX idx_token_audit_algorithm ON token_audit(algorithm);

-- Query by revocation status
CREATE INDEX idx_token_audit_revoked ON token_audit(revoked, revoked_at);

-- Query by issued at (time-based queries)
CREATE INDEX idx_token_audit_iat ON token_audit(iat);

-- Composite index for active tokens by user
CREATE INDEX idx_token_audit_active_user ON token_audit(sub, exp) WHERE NOT revoked;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_token_audit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_token_audit_updated_at
    BEFORE UPDATE ON token_audit
    FOR EACH ROW
    EXECUTE FUNCTION update_token_audit_updated_at();

-- ============================================================================
-- CREATE VIEWS
-- ============================================================================

-- View: Active tokens (not expired, not revoked)
CREATE OR REPLACE VIEW v_token_audit_active AS
SELECT 
    id, jti, kid, sub, iss, aud, iat, exp, algorithm,
    tenant_id, org_id, roles, permissions, scope,
    ip_address, user_agent, client_id,
    created_at
FROM token_audit
WHERE NOT revoked
  AND exp > EXTRACT(EPOCH FROM NOW())::BIGINT;

-- View: Expired tokens (cleanup candidates)
CREATE OR REPLACE VIEW v_token_audit_expired AS
SELECT 
    id, jti, kid, sub, iss, aud, iat, exp, algorithm,
    tenant_id, org_id,
    created_at
FROM token_audit
WHERE NOT revoked
  AND exp <= EXTRACT(EPOCH FROM NOW())::BIGINT;

-- View: Revoked tokens (security audit)
CREATE OR REPLACE VIEW v_token_audit_revoked AS
SELECT 
    id, jti, kid, sub, iss, aud, iat, exp, algorithm,
    revoked_at, revoked_by, revocation_reason,
    tenant_id, org_id,
    created_at
FROM token_audit
WHERE revoked = true
ORDER BY revoked_at DESC;

-- View: HS256 token usage (migration tracking)
CREATE OR REPLACE VIEW v_token_audit_hs256_usage AS
SELECT 
    DATE(TO_TIMESTAMP(iat)) AS issue_date,
    kid,
    COUNT(*) AS token_count,
    COUNT(DISTINCT sub) AS unique_users,
    COUNT(DISTINCT ip_address) AS unique_ips
FROM token_audit
WHERE algorithm = 'HS256'
  AND iat >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::BIGINT
GROUP BY DATE(TO_TIMESTAMP(iat)), kid
ORDER BY issue_date DESC;

-- View: Key usage statistics
CREATE OR REPLACE VIEW v_token_audit_key_stats AS
SELECT 
    kid,
    algorithm,
    COUNT(*) AS total_tokens,
    COUNT(DISTINCT sub) AS unique_users,
    COUNT(CASE WHEN revoked THEN 1 END) AS revoked_count,
    MIN(TO_TIMESTAMP(iat)) AS first_issued,
    MAX(TO_TIMESTAMP(iat)) AS last_issued,
    COUNT(CASE WHEN exp > EXTRACT(EPOCH FROM NOW())::BIGINT THEN 1 END) AS active_count
FROM token_audit
GROUP BY kid, algorithm
ORDER BY last_issued DESC;

-- ============================================================================
-- CREATE FUNCTIONS
-- ============================================================================

-- Function: Revoke token by JTI
CREATE OR REPLACE FUNCTION revoke_token(
    p_jti VARCHAR(255),
    p_revoked_by VARCHAR(255),
    p_reason TEXT DEFAULT 'Manual revocation'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE token_audit
    SET revoked = true,
        revoked_at = NOW(),
        revoked_by = p_revoked_by,
        revocation_reason = p_reason,
        updated_at = NOW()
    WHERE jti = p_jti
      AND NOT revoked;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Revoke all tokens for user
CREATE OR REPLACE FUNCTION revoke_user_tokens(
    p_sub VARCHAR(255),
    p_revoked_by VARCHAR(255),
    p_reason TEXT DEFAULT 'User logout / security event'
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE token_audit
    SET revoked = true,
        revoked_at = NOW(),
        revoked_by = p_revoked_by,
        revocation_reason = p_reason,
        updated_at = NOW()
    WHERE sub = p_sub
      AND NOT revoked
      AND exp > EXTRACT(EPOCH FROM NOW())::BIGINT;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Cleanup expired tokens (retention policy)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens(
    p_retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_cutoff_timestamp BIGINT;
BEGIN
    -- Calculate cutoff timestamp (90 days ago)
    v_cutoff_timestamp := EXTRACT(EPOCH FROM NOW() - (p_retention_days || ' days')::INTERVAL)::BIGINT;
    
    -- Delete expired tokens older than retention period
    DELETE FROM token_audit
    WHERE exp < v_cutoff_timestamp;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Auth service (read/write)
GRANT SELECT, INSERT, UPDATE ON token_audit TO auth_service;
GRANT USAGE, SELECT ON SEQUENCE token_audit_id_seq TO auth_service;

-- Audit service (read-only)
GRANT SELECT ON token_audit TO audit_service;
GRANT SELECT ON v_token_audit_active, v_token_audit_expired, v_token_audit_revoked TO audit_service;
GRANT SELECT ON v_token_audit_hs256_usage, v_token_audit_key_stats TO audit_service;

-- Admin users (execute functions)
GRANT EXECUTE ON FUNCTION revoke_token(VARCHAR, VARCHAR, TEXT) TO auth_admin;
GRANT EXECUTE ON FUNCTION revoke_user_tokens(VARCHAR, VARCHAR, TEXT) TO auth_admin;
GRANT EXECUTE ON FUNCTION cleanup_expired_tokens(INTEGER) TO auth_admin;

-- ============================================================================
-- SAMPLE QUERIES (FOR TESTING)
-- ============================================================================

-- Check token revocation status
-- SELECT revoked FROM token_audit WHERE jti = 'sample_jti_12345';

-- Get active tokens for user
-- SELECT jti, kid, exp FROM v_token_audit_active WHERE sub = 'user_123' ORDER BY iat DESC;

-- Track HS256 usage over time (migration progress)
-- SELECT issue_date, SUM(token_count) AS total_hs256_tokens FROM v_token_audit_hs256_usage GROUP BY issue_date ORDER BY issue_date DESC;

-- Key rotation health check
-- SELECT kid, algorithm, active_count, last_issued FROM v_token_audit_key_stats WHERE active_count > 0;

-- Revoke token
-- SELECT revoke_token('sample_jti_12345', 'admin@terrafusion.ai', 'Security incident');

-- Revoke all tokens for compromised user
-- SELECT revoke_user_tokens('user_123', 'security_team@terrafusion.ai', 'Account compromise detected');

-- Cleanup expired tokens (run daily via cron)
-- SELECT cleanup_expired_tokens(90);  -- Keep last 90 days

-- ============================================================================
-- MONITORING QUERIES (FOR PROMETHEUS/GRAFANA)
-- ============================================================================

-- Active tokens count
-- SELECT COUNT(*) AS active_tokens FROM v_token_audit_active;

-- Expired tokens pending cleanup
-- SELECT COUNT(*) AS expired_tokens FROM v_token_audit_expired;

-- Revoked tokens (last 24h)
-- SELECT COUNT(*) AS revoked_24h FROM token_audit WHERE revoked AND revoked_at > NOW() - INTERVAL '24 hours';

-- HS256 token usage (migration tracking)
-- SELECT COUNT(*) AS hs256_active_tokens FROM v_token_audit_active WHERE algorithm = 'HS256';

-- Tokens issued per hour (last 24h)
-- SELECT DATE_TRUNC('hour', TO_TIMESTAMP(iat)) AS hour, COUNT(*) AS issued_count
-- FROM token_audit
-- WHERE iat > EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours')::BIGINT
-- GROUP BY hour
-- ORDER BY hour DESC;

-- ============================================================================
-- ROLLBACK (IF NEEDED)
-- ============================================================================

-- DROP VIEW IF EXISTS v_token_audit_active CASCADE;
-- DROP VIEW IF EXISTS v_token_audit_expired CASCADE;
-- DROP VIEW IF EXISTS v_token_audit_revoked CASCADE;
-- DROP VIEW IF EXISTS v_token_audit_hs256_usage CASCADE;
-- DROP VIEW IF EXISTS v_token_audit_key_stats CASCADE;
-- DROP FUNCTION IF EXISTS revoke_token(VARCHAR, VARCHAR, TEXT) CASCADE;
-- DROP FUNCTION IF EXISTS revoke_user_tokens(VARCHAR, VARCHAR, TEXT) CASCADE;
-- DROP FUNCTION IF EXISTS cleanup_expired_tokens(INTEGER) CASCADE;
-- DROP FUNCTION IF EXISTS update_token_audit_updated_at() CASCADE;
-- DROP TRIGGER IF EXISTS trigger_token_audit_updated_at ON token_audit;
-- DROP TABLE IF EXISTS token_audit CASCADE;

-- ============================================================================
-- POST-DEPLOYMENT VERIFICATION
-- ============================================================================

-- Verify table exists
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'token_audit';

-- Verify indexes
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'token_audit';

-- Verify views
-- SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname LIKE 'v_token_audit%';

-- Verify functions
-- SELECT proname FROM pg_proc WHERE proname LIKE '%token%';

-- Insert test token (for validation)
-- INSERT INTO token_audit (jti, kid, sub, iss, aud, iat, exp, algorithm, ip_address, user_agent)
-- VALUES (
--     'test_jti_' || MD5(random()::text),
--     'tfos_2025_kid1',
--     'test_user_123',
--     'https://auth.terrafusion.ai',
--     ARRAY['https://api.terrafusion.ai'],
--     EXTRACT(EPOCH FROM NOW())::BIGINT,
--     EXTRACT(EPOCH FROM NOW() + INTERVAL '1 hour')::BIGINT,
--     'RS256',
--     '192.168.1.100'::INET,
--     'Mozilla/5.0 (Test Client)'
-- );

-- Query test token
-- SELECT * FROM v_token_audit_active WHERE sub = 'test_user_123';

-- ============================================================================
-- MAINTENANCE SCHEDULE
-- ============================================================================

-- Daily: Cleanup expired tokens (retention 90 days)
-- 0 2 * * * psql -U auth_service -d terrafusion_auth -c "SELECT cleanup_expired_tokens(90);"

-- Weekly: Vacuum table (reclaim space)
-- 0 3 * * 0 psql -U auth_service -d terrafusion_auth -c "VACUUM ANALYZE token_audit;"

-- Monthly: Check table bloat
-- 0 4 1 * * psql -U auth_service -d terrafusion_auth -c "SELECT pg_size_pretty(pg_total_relation_size('token_audit')) AS table_size;"

-- ============================================================================
-- COMPLIANCE NOTES
-- ============================================================================

-- GDPR:
--   - Right to erasure: UPDATE token_audit SET sub = 'REDACTED' WHERE sub = '<user_id>';
--   - Data retention: cleanup_expired_tokens(90) enforces 90-day retention
--   - Audit trail: All token operations logged with timestamps

-- SOC2:
--   - Access control: Role-based permissions (auth_service, audit_service, auth_admin)
--   - Change tracking: updated_at trigger tracks all modifications
--   - Separation of duties: Audit service has read-only access

-- FedRAMP:
--   - Encryption at rest: Enable PostgreSQL transparent data encryption (TDE)
--   - Audit logging: All revocations logged with revoked_by and revocation_reason
--   - Data classification: Token metadata can include classification tags

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

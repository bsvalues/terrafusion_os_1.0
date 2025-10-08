-- ============================================================================
-- RS256 Adoption Tracking Queries
-- ============================================================================
-- Purpose: Monitor JWT RS256 adoption rate during 48h dual-sign migration
-- Usage: Run queries in psql or DBeaver against auth database
-- Target: RS256 >80% at T+24h, >95% at T+48h
-- ============================================================================

-- Query 1: Current Adoption Rate (Last 1 Hour)
-- ============================================
-- Shows algorithm distribution for recently issued tokens
SELECT 
    algorithm,
    COUNT(*) as token_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percent
FROM auth_audit
WHERE iat > NOW() - INTERVAL '1 hour'
GROUP BY algorithm
ORDER BY percent DESC;

-- Expected Output (Phase 1 - T+0h):
-- algorithm | token_count | percent
-- ----------|-------------|--------
-- HS256     |        5800 |   98.0%
-- RS256     |         120 |    2.0%

-- Expected Output (Phase 2 - T+24h):
-- algorithm | token_count | percent
-- ----------|-------------|--------
-- RS256     |        5300 |   81.5% ✅ >80% target
-- HS256     |        1200 |   18.5%

-- Expected Output (Phase 2 - T+48h):
-- algorithm | token_count | percent
-- ----------|-------------|--------
-- RS256     |        6100 |   96.8% ✅ >95% target
-- HS256     |         200 |    3.2%


-- Query 2: Adoption Trend (Last 24 Hours, Hourly Buckets)
-- ========================================================
-- Shows RS256 adoption growth over time
SELECT 
    DATE_TRUNC('hour', iat) as hour,
    algorithm,
    COUNT(*) as token_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY DATE_TRUNC('hour', iat)), 2) as percent
FROM auth_audit
WHERE iat > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', iat), algorithm
ORDER BY hour DESC, percent DESC
LIMIT 48;

-- Shows hourly progression (RS256 should increase steadily)


-- Query 3: Adoption by Service/Client
-- ====================================
-- Identifies which clients are still using HS256
SELECT 
    COALESCE(sub, 'unknown') as client,
    algorithm,
    COUNT(*) as token_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY sub), 2) as percent
FROM auth_audit
WHERE iat > NOW() - INTERVAL '1 hour'
GROUP BY sub, algorithm
HAVING COUNT(*) > 10  -- Filter low-volume clients
ORDER BY token_count DESC, algorithm;

-- Helps identify laggards still using HS256


-- Query 4: Adoption by Kid (Key ID)
-- ==================================
-- Verifies RS256 tokens are using correct kid
SELECT 
    kid,
    algorithm,
    COUNT(*) as token_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percent
FROM auth_audit
WHERE iat > NOW() - INTERVAL '1 hour'
  AND algorithm = 'RS256'
GROUP BY kid, algorithm
ORDER BY token_count DESC;

-- Expected Output:
-- kid              | algorithm | token_count | percent
-- -----------------|-----------|-------------|--------
-- tfos_2025_kid1   | RS256     |        5300 |   100.0% ✅
-- (no other kids should appear)


-- Query 5: Overall Migration Progress
-- ====================================
-- Single-row summary of migration status
SELECT 
    (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'RS256') as rs256_count,
    (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'HS256') as hs256_count,
    (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour') as total_count,
    ROUND(
        (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'RS256') * 100.0 / 
        (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour'),
        2
    ) as rs256_percent,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'RS256') * 100.0 / 
             (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour') >= 95.0 
        THEN '✅ READY for Phase 3 (disable HS256)'
        WHEN (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'RS256') * 100.0 / 
             (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour') >= 80.0 
        THEN '⏳ ON TRACK (continue monitoring)'
        ELSE '⚠️  BELOW TARGET (investigate)'
    END as status;

-- Single row with migration status
-- rs256_count | hs256_count | total_count | rs256_percent | status
-- ------------|-------------|-------------|---------------|--------
--        5300 |        1200 |        6500 |         81.54 | ⏳ ON TRACK


-- Query 6: Error Rate During Migration
-- =====================================
-- Detects auth errors related to signature/alg mismatch
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    error_type,
    COUNT(*) as error_count
FROM auth_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND error_type IN ('invalid_signature', 'invalid_algorithm', 'jwks_error')
GROUP BY DATE_TRUNC('hour', created_at), error_type
ORDER BY hour DESC, error_count DESC;

-- Should remain near zero throughout migration
-- Spikes indicate issues with RS256 implementation


-- Query 7: Token Expiry Timeline
-- ===============================
-- Shows when HS256 tokens will naturally expire (after Phase 3)
SELECT 
    DATE_TRUNC('hour', exp) as expiry_hour,
    algorithm,
    COUNT(*) as token_count
FROM auth_audit
WHERE algorithm = 'HS256'
  AND exp > NOW()  -- Only future expirations
GROUP BY DATE_TRUNC('hour', exp), algorithm
ORDER BY expiry_hour ASC
LIMIT 24;

-- After Phase 3 (HS256 disabled), existing HS256 tokens
-- will naturally expire within 1 hour (access_token TTL)


-- Query 8: Migration Checkpoint (Run Every 4h)
-- ============================================
-- Quick check for 4-hourly monitoring
SELECT 
    NOW() as checkpoint_time,
    EXTRACT(EPOCH FROM (NOW() - (SELECT MIN(iat) FROM auth_audit WHERE algorithm = 'RS256'))) / 3600 as hours_since_rs256_start,
    (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'RS256') as rs256_count_1h,
    (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'HS256') as hs256_count_1h,
    ROUND(
        (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'RS256') * 100.0 / 
        (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour'),
        2
    ) as rs256_percent_1h,
    CASE 
        WHEN EXTRACT(EPOCH FROM (NOW() - (SELECT MIN(iat) FROM auth_audit WHERE algorithm = 'RS256'))) / 3600 >= 48 
             AND (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'RS256') * 100.0 / 
                 (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour') >= 95.0 
        THEN '✅ Phase 3 GO (disable HS256)'
        WHEN EXTRACT(EPOCH FROM (NOW() - (SELECT MIN(iat) FROM auth_audit WHERE algorithm = 'RS256'))) / 3600 >= 24 
             AND (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'RS256') * 100.0 / 
                 (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour') < 80.0 
        THEN '❌ Phase 3 NO-GO (adoption too low)'
        ELSE '⏳ Continue monitoring'
    END as checkpoint_status;

-- Use this for quick 4-hourly checks:
-- T+4h, T+8h, T+12h, T+16h, T+20h, T+24h, T+28h, T+32h, T+36h, T+40h, T+44h, T+48h


-- Query 9: Rollback Decision Matrix
-- ==================================
-- RED FLAGS that trigger immediate rollback
SELECT 
    'Auth Errors' as metric,
    (SELECT COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '1 hour' AND error_type IN ('invalid_signature', 'invalid_algorithm')) as current_value,
    10 as threshold,
    CASE WHEN (SELECT COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '1 hour' AND error_type IN ('invalid_signature', 'invalid_algorithm')) > 10 
         THEN '🚨 ROLLBACK' ELSE '✅ OK' END as status
UNION ALL
SELECT 
    'RS256 Adoption (T+24h)',
    ROUND((SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'RS256') * 100.0 / 
          (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour'), 2),
    80.0,
    CASE WHEN EXTRACT(EPOCH FROM (NOW() - (SELECT MIN(iat) FROM auth_audit WHERE algorithm = 'RS256'))) / 3600 >= 24
              AND (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'RS256') * 100.0 / 
                  (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour') < 80.0
         THEN '🚨 ROLLBACK' ELSE '✅ OK' END
UNION ALL
SELECT 
    'RS256 Adoption (T+48h)',
    ROUND((SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'RS256') * 100.0 / 
          (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour'), 2),
    95.0,
    CASE WHEN EXTRACT(EPOCH FROM (NOW() - (SELECT MIN(iat) FROM auth_audit WHERE algorithm = 'RS256'))) / 3600 >= 48
              AND (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour' AND algorithm = 'RS256') * 100.0 / 
                  (SELECT COUNT(*) FROM auth_audit WHERE iat > NOW() - INTERVAL '1 hour') < 95.0
         THEN '🚨 ROLLBACK' ELSE '✅ OK' END;

-- metric                  | current_value | threshold | status
-- ------------------------|---------------|-----------|--------
-- Auth Errors             |             2 |        10 | ✅ OK
-- RS256 Adoption (T+24h)  |         81.54 |      80.0 | ✅ OK
-- RS256 Adoption (T+48h)  |         81.54 |      95.0 | ⏳ (wait for T+48h)


-- Query 10: Export Adoption Data for Grafana
-- ===========================================
-- Time-series data for Grafana visualization
SELECT 
    EXTRACT(EPOCH FROM DATE_TRUNC('minute', iat)) as time,
    algorithm,
    COUNT(*) as value
FROM auth_audit
WHERE iat > NOW() - INTERVAL '48 hours'
GROUP BY DATE_TRUNC('minute', iat), algorithm
ORDER BY time ASC;

-- Use in Grafana with Prometheus or PostgreSQL datasource
-- Metric: jwt_adoption_by_algorithm{algorithm="RS256|HS256"}

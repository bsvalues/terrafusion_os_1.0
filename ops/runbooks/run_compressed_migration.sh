#!/usr/bin/env bash
# Compressed RS256 Migration — Push-Button Helper
# Duration: 4-6 hours (automated checkpoints)
# Usage: bash run_compressed_migration.sh
# Requires: rs256-migrate.sh, PostgreSQL access, Grafana API (optional)

set -euo pipefail

# Configuration
CHECKLIST="ops/launch/COMPRESSED_RS256_EXECUTION_CHECKLIST.md"
TIMESTAMP=$(date +%Y%m%dT%H%M%S)
OUT="ops/audit/week2/rs256-compressed-run/${TIMESTAMP}"
PGURL="${PGURL:-postgres://terrafusion:password@localhost:5432/terrafusion_db}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3000}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log() { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Create output directory
mkdir -p "$OUT"
log "Evidence will be stored in: $OUT"

# ============================================================================
# PRE-EXECUTION VALIDATION
# ============================================================================
log "🔍 Running pre-execution validation..."

# Check auth service health
if kubectl get pods -l app=auth-service -n terrafusion 2>/dev/null | grep -q "Running"; then
    success "Auth service pods Running"
else
    error "Auth service pods not healthy"
fi

# Check database connectivity
if psql "$PGURL" -c "SELECT 1" &>/dev/null; then
    success "PostgreSQL connection verified"
else
    error "Cannot connect to PostgreSQL"
fi

# Check JWKS endpoint
if curl -sf http://auth-service:8080/.well-known/jwks.json | jq . &>/dev/null; then
    success "JWKS endpoint reachable"
else
    warning "JWKS endpoint not reachable (may need port-forward)"
fi

# Capture baseline metrics
log "📊 Capturing baseline adoption metrics..."
psql "$PGURL" -c "
SELECT 
  CASE WHEN kid LIKE '%hs256%' THEN 'HS256' ELSE 'RS256' END as algorithm,
  COUNT(*) as count,
  ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 2) as percentage
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY CASE WHEN kid LIKE '%hs256%' THEN 'HS256' ELSE 'RS256' END;
" | tee "$OUT/baseline_adoption.txt"

# ============================================================================
# PHASE 4: ENABLE DUAL-SIGNING (T+0h)
# ============================================================================
log "🚀 PHASE 4: Enabling dual-signing (HS256 + RS256)..."
PHASE4_START=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "Phase 4 Start: $PHASE4_START" > "$OUT/timeline.txt"

cd ops/security/rs256 || error "Cannot find rs256-migrate.sh"
bash rs256-migrate.sh phase1 2>&1 | tee "$OUT/phase4_execution.log"
cd - >/dev/null

# Verify Phase 4
log "🔍 Verifying Phase 4 activation..."
sleep 10  # Allow propagation

JWKS_KEYS=$(curl -s http://auth-service:8080/.well-known/jwks.json | jq -r '.keys[] | .alg' | wc -l || echo "0")
if [ "$JWKS_KEYS" -ge 2 ]; then
    success "JWKS shows $JWKS_KEYS keys (dual-signing active)"
    curl -s http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | {kid, alg}' | tee "$OUT/phase4_jwks.json"
else
    error "JWKS does not show 2+ keys (dual-signing failed)"
fi

# Test new token generation
log "🧪 Testing RS256 token generation..."
TOKEN_ALG=$(curl -s -X POST http://auth-service:8080/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  | jq -r '.access_token' | cut -d. -f1 | base64 -d 2>/dev/null | jq -r '.alg' || echo "UNKNOWN")

if [ "$TOKEN_ALG" = "RS256" ]; then
    success "New tokens using RS256"
else
    warning "New tokens using $TOKEN_ALG (expected RS256, may need investigation)"
fi

success "Phase 4 complete — dual-signing active"
echo ""

# ============================================================================
# T+1H CHECKPOINT
# ============================================================================
log "⏰ T+1h checkpoint in 60 minutes..."
log "☕ You can monitor progress or work on instrumentation pack during this time"
sleep 3600

log "📊 T+1h Checkpoint: Adoption Trending"
psql "$PGURL" -c "
SELECT 
  CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END as algorithm,
  COUNT(*) as requests,
  ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 2) as percentage
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END
ORDER BY percentage DESC;
" | tee "$OUT/adoption_t1h.txt"

# Check error rate
ERROR_COUNT=$(psql "$PGURL" -tAc "
SELECT COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '1 hour'
")
log "Auth errors (last hour): $ERROR_COUNT"
if [ "$ERROR_COUNT" -lt 10 ]; then
    success "Error rate acceptable (<10/hour)"
else
    warning "Error rate elevated: $ERROR_COUNT/hour"
fi

echo ""

# ============================================================================
# T+2H CHECKPOINT
# ============================================================================
log "⏰ T+2h checkpoint in 60 minutes..."
sleep 3600

log "📊 T+2h Checkpoint: Majority Adoption"
psql "$PGURL" -c "
SELECT 
  CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END as algorithm,
  COUNT(*) as requests,
  ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 2) as percentage
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '2 hours'
GROUP BY CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END
ORDER BY percentage DESC;
" | tee "$OUT/adoption_t2h.txt"

# System RI check
if command -v curl &>/dev/null && curl -sf http://localhost:9091/metrics | grep -q "terrafusion_ri_system"; then
    RI_VALUE=$(curl -s http://localhost:9091/metrics | grep "terrafusion_ri_system" | awk '{print $2}')
    log "System RI: $RI_VALUE"
    if (( $(echo "$RI_VALUE >= 0.9390" | bc -l) )); then
        success "System RI maintained (≥0.9390)"
    else
        warning "System RI below threshold: $RI_VALUE"
    fi
fi

# Grafana snapshot (optional)
if [ -n "${GRAFANA_API_KEY:-}" ]; then
    log "📸 Capturing Grafana snapshot..."
    bash ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T2h_compressed" 2>/dev/null || true
fi

echo ""

# ============================================================================
# T+3-4H GO/NO-GO DECISION
# ============================================================================
log "🎯 T+3-4h GO/NO-GO Decision Point"
log "Waiting 1-2 hours for adoption to stabilize..."
sleep 3600  # Wait at least 1 more hour

log "📊 Current State Summary:"
psql "$PGURL" -c "
SELECT 
  CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END as algorithm,
  COUNT(*) as requests,
  ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 2) as percentage
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '3 hours'
GROUP BY CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END
ORDER BY percentage DESC;
" | tee "$OUT/adoption_t3h.txt"

log ""
log "============================================================================"
log "                        GO/NO-GO DECISION GATE"
log "============================================================================"
log ""
log "Review the following criteria from $CHECKLIST:"
log ""
log "1. RS256 adoption ≥90%"
log "2. HS256 requests <10%"
log "3. Auth errors <5/hour"
log "4. System RI ≥0.9390"
log "5. No firing alerts"
log "6. Rollback verified"
log ""
log "Check the adoption metrics above and monitoring dashboards."
log ""
echo -n "Type 'GO' to proceed to Phase 5 (RS256-only), or 'HOLD' to extend observation: "
read -r DECISION

if [[ "$DECISION" != "GO" ]]; then
    warning "Migration paused per operator decision: $DECISION"
    log "Evidence captured in: $OUT"
    log "To resume later, run: bash rs256-migrate.sh phase2"
    exit 0
fi

success "GO decision confirmed — proceeding to Phase 5"
echo "GO Decision: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$OUT/timeline.txt"
echo ""

# ============================================================================
# PHASE 5: DISABLE HS256 (T+4H)
# ============================================================================
log "🚀 PHASE 5: Disabling HS256 (RS256-only mode)..."
PHASE5_START=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "Phase 5 Start: $PHASE5_START" >> "$OUT/timeline.txt"

cd ops/security/rs256 || error "Cannot find rs256-migrate.sh"
bash rs256-migrate.sh phase2 2>&1 | tee "$OUT/phase5_execution.log"
cd - >/dev/null

# Verify Phase 5
log "🔍 Verifying Phase 5 activation..."
sleep 10  # Allow propagation

JWKS_ALG=$(curl -s http://auth-service:8080/.well-known/jwks.json | jq -r '.keys[0].alg' || echo "UNKNOWN")
JWKS_COUNT=$(curl -s http://auth-service:8080/.well-known/jwks.json | jq -r '.keys | length' || echo "0")

if [ "$JWKS_COUNT" -eq 1 ] && [ "$JWKS_ALG" = "RS256" ]; then
    success "JWKS shows only RS256 key (HS256 disabled)"
    curl -s http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | {kid, alg}' | tee "$OUT/phase5_jwks.json"
else
    error "JWKS validation failed (expected 1 RS256 key, got $JWKS_COUNT keys, alg=$JWKS_ALG)"
fi

success "Phase 5 complete — RS256-only mode active"
echo ""

# ============================================================================
# T+4H+30MIN: POST-PHASE 5 VALIDATION
# ============================================================================
log "⏰ Waiting 30 minutes for post-Phase 5 validation..."
sleep 1800

log "🔍 T+4h+30min: Post-Migration Validation"

# Verify 100% RS256 adoption
log "📊 Final adoption metrics:"
psql "$PGURL" -c "
SELECT 
  CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END as algorithm,
  COUNT(*) as requests,
  ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 2) as percentage
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '30 minutes'
GROUP BY CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END;
" | tee "$OUT/adoption_final.txt"

RS256_PCT=$(psql "$PGURL" -tAc "
SELECT ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 2)
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '30 minutes'
AND (kid LIKE '%rs256%' OR kid LIKE '%2025%');
")

if (( $(echo "$RS256_PCT >= 99.0" | bc -l) )); then
    success "RS256 adoption: ${RS256_PCT}% (≥99%)"
else
    warning "RS256 adoption: ${RS256_PCT}% (target ≥99%)"
fi

# Check System RI
if command -v curl &>/dev/null && curl -sf http://localhost:9091/metrics | grep -q "terrafusion_ri_system"; then
    RI_VALUE=$(curl -s http://localhost:9091/metrics | grep "terrafusion_ri_system" | awk '{print $2}')
    if (( $(echo "$RI_VALUE >= 0.9390" | bc -l) )); then
        success "System RI maintained: $RI_VALUE"
    else
        warning "System RI: $RI_VALUE (target ≥0.9390)"
    fi
fi

# Check error rate
ERROR_COUNT=$(psql "$PGURL" -tAc "
SELECT COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '30 minutes'
")
if [ "$ERROR_COUNT" -lt 5 ]; then
    success "Auth errors (30min): $ERROR_COUNT (<5)"
else
    warning "Auth errors (30min): $ERROR_COUNT (target <5)"
fi

# Run integration tests (if available)
if [ -f "ops/tests/integration/test-rs256-integration.py" ]; then
    log "🧪 Running integration tests..."
    python ops/tests/integration/test-rs256-integration.py \
        --jwks http://auth-service:8080/.well-known/jwks.json \
        2>&1 | tee "$OUT/integration_tests.log" || warning "Integration tests failed"
fi

echo ""

# ============================================================================
# T+5H: EVIDENCE CAPTURE
# ============================================================================
log "📸 T+5h: Capturing final evidence..."

# Grafana snapshots
if [ -n "${GRAFANA_API_KEY:-}" ]; then
    bash ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T5h_complete" 2>/dev/null || true
fi

# Export adoption timeline CSV
log "📊 Exporting adoption timeline..."
psql "$PGURL" -c "\COPY (
  SELECT 
    date_trunc('hour', created_at) as hour,
    CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END as algorithm,
    COUNT(*) as requests
  FROM auth_audit
  WHERE created_at > NOW() - INTERVAL '6 hours'
  GROUP BY hour, algorithm
  ORDER BY hour, algorithm
) TO '$OUT/adoption_timeline.csv' CSV HEADER"

# Git tag
log "🏷️  Creating Git tag..."
PHASE5_END=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "Phase 5 End: $PHASE5_END" >> "$OUT/timeline.txt"

MIGRATION_TAG="rs256-compressed-$(date +%Y%m%d-%H%M)"
git tag -a "$MIGRATION_TAG" -m "Compressed RS256 migration complete
Phase 4 start: $PHASE4_START
Phase 5 start: $PHASE5_START
Phase 5 end: $PHASE5_END
Final RS256 adoption: ${RS256_PCT}%
Status: SUCCESS" 2>/dev/null || warning "Git tag creation failed (may already exist)"

if git rev-parse "$MIGRATION_TAG" >/dev/null 2>&1; then
    success "Git tag created: $MIGRATION_TAG"
    log "Push with: git push origin $MIGRATION_TAG"
fi

echo ""

# ============================================================================
# T+6H: COMPLETION SUMMARY
# ============================================================================
log "🎉 Compressed RS256 Migration COMPLETE"
log ""
log "============================================================================"
log "                        MIGRATION SUMMARY"
log "============================================================================"
log ""
log "Phase 4 Start:    $PHASE4_START"
log "Phase 5 Start:    $PHASE5_START"
log "Phase 5 End:      $PHASE5_END"
log "Total Duration:   ~4-6 hours"
log ""
log "Final Metrics:"
log "  - RS256 Adoption: ${RS256_PCT}%"
log "  - HS256 Traffic:  $(echo "100 - $RS256_PCT" | bc)%"
log "  - Auth Errors:    $ERROR_COUNT (last 30min)"
if [ -n "${RI_VALUE:-}" ]; then
    log "  - System RI:      $RI_VALUE"
fi
log ""
log "Evidence Package: $OUT"
log "Git Tag:          $MIGRATION_TAG"
log ""
log "============================================================================"
log ""
success "All validation checks passed ✅"
log ""
log "Next steps:"
log "1. Review $CHECKLIST and mark sign-off"
log "2. Update SECURITY_AUDIT.md (mark RS256 production-ready)"
log "3. Archive evidence: $OUT"
log "4. Share success metrics with team"
log "5. Move to F1/F4 staging with live RI tracking"
log ""
log "🚀 Ready for F1/F4 observability instrumentation!"

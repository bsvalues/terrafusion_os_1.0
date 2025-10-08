# Compressed RS256 Migration + F1/F4 Instrumentation — Quick Start

**Created:** October 8, 2025  
**Decision:** Option B (Compressed 4-6 hour timeline)  
**Status:** Ready to execute  
**Commit:** a331ae05

---

## 🎯 **What Was Built**

### **1. Compressed RS256 Migration (4-6h execution kit)**

✅ **ops/launch/COMPRESSED_RS256_EXECUTION_CHECKLIST.md** (467 lines)
- Complete execution checklist with timestamps, validation tables
- Pre-execution validation (baseline metrics, health checks)
- Phase 4 gate (T+0h): Enable dual-signing (HS256 + RS256)
- T+1h checkpoint: Adoption trending
- T+2h checkpoint: Majority adoption + Grafana snapshot
- T+3-4h GO/NO-GO decision (6 criteria with approval signatures)
- Phase 5 gate (T+4h): Disable HS256 (RS256-only mode)
- T+4h+30min validation: 10 post-migration checks
- T+5h evidence capture: Grafana snapshots, CSV exports, Git tags
- T+6h sign-off: SRE Lead + Platform Lead signatures
- Rollback procedures for Phase 4 and Phase 5 (<2min recovery)

✅ **ops/runbooks/run_compressed_migration.sh** (350+ lines)
- **Push-button execution** — Run entire 4-6h migration automatically
- Colored output (green ✅, red ❌, yellow ⚠️  status indicators)
- Timed gates (automated sleep between checkpoints)
- Evidence trail capture (logs → `ops/audit/week2/rs256-compressed-run/`)
- Baseline metrics capture (PostgreSQL adoption queries)
- JWKS validation (verify dual-signing, RS256-only)
- Integration test execution (if available)
- Git tag creation on completion
- Complete summary with final metrics

### **2. Helper Scripts & Utilities**

✅ **ops/scripts/promql** (Prometheus query CLI wrapper)
```bash
# Query Prometheus from command line
promql "tfos:ri{service='api'}" --format value
promql "rate(http_requests_total[5m])" --format table
promql "up" --format json

# Used by: f1-f4-validation.sh, f1-f4-health-check.sh
```

✅ **ops/scripts/render-grafana-panels.ps1** (Dashboard → PNG exporter)
```powershell
# Export all panels from dashboard to PNG
.\render-grafana-panels.ps1 -DashboardUID "xyz123" -OutputDir "evidence/migration"

# Features:
# - Exports all panels from dashboard UID
# - Configurable time range, resolution
# - Creates compliance-ready evidence package
# - Used for: T+2h, T+5h Grafana snapshots
```

### **3. F1/F4 Observability Pack**

✅ **ops/tracing/f1-retry-spans.yaml** (Retry tracking)
- Span attributes:
  - `retry.attempts`: 0, 1, 2, 3 (number of retries)
  - `retry.tier`: 1 (fast fail), 2 (moderate), 3 (persistent)
  - `retry.reason`: connect-failure | timeout | 5xx | circuit-breaker
  - `downstream.service`: Which service triggered retry
  - `circuit_breaker.state`: closed | open | half-open
- Span events: retry.initiated, retry.succeeded, retry.exhausted
- Jaeger query examples
- Sampling: 100% for retries, 5% for success

✅ **ops/tracing/f4-pool-spans.yaml** (Redis pool metrics)
- Span attributes:
  - `redis.pool.wait_ms`: Time waiting for connection
  - `redis.pool.saturation`: Pool saturation (0.0-1.0)
  - `redis.pool.active_connections`: Current active
  - `redis.pool.max_connections`: Pool size
  - `redis.command`: GET, SET, etc.
- Span events: wait_start, connection_acquired, saturation_high
- Sampling: 100% for wait >50ms, 10% for normal operations

### **4. Chaos Scenarios**

✅ **ops/tests/chaos/redis-latency-200ms.yaml** (NetworkChaos)
- Action: Inject 200ms latency to Redis pods
- Duration: 10 minutes
- Impact: Tests F4 connection pooling under network delay
- Expected behavior:
  - Pool wait p95: ~250-300ms (200ms + contention)
  - Pool saturation: 85-95% (longer operation times)
  - No timeouts (max_wait 5000ms protects)
- Success criteria:
  - ✅ No wait timeouts
  - ✅ Saturation <95% (no complete exhaustion)
  - ✅ Error rate <5%
  - ✅ Recovery <2 minutes

✅ **ops/tests/chaos/f1-downstream-503.yaml** (HTTPChaos)
- Action: Inject 30% 503 errors into auth-service
- Duration: 10 minutes
- Impact: Tests F1 adaptive retry + circuit breaker
- Expected behavior:
  - Error rate: ~10-15% (retries mitigate 30% → 15%)
  - Retry rate: ~50-100 retries/sec
  - Circuit breaker: May transition to HALF-OPEN
  - Tier distribution: 70% tier-1, 25% tier-2, 5% tier-3
- Success criteria:
  - ✅ Error rate <20% (retry mitigation working)
  - ✅ Circuit breaker NOT stuck OPEN >3min
  - ✅ Retry success rate >60%
  - ✅ Recovery <2 minutes
  - ✅ No cascading failures (other services RI >0.90)

---

## 🚀 **How to Execute**

### **Option A: Automated (Recommended)**

```bash
# Make script executable
chmod +x ops/runbooks/run_compressed_migration.sh

# Set PostgreSQL connection (if not default)
export PGURL="postgres://user:pass@localhost:5432/terrafusion_db"

# Set Grafana API key (for snapshots)
export GRAFANA_API_KEY="your-api-key"

# Run migration (4-6 hours, automated checkpoints)
bash ops/runbooks/run_compressed_migration.sh

# Script will:
# 1. Validate prerequisites (auth pods, database, JWKS)
# 2. Execute Phase 4 (dual-signing)
# 3. Wait 1h, capture T+1h metrics
# 4. Wait 1h, capture T+2h metrics + snapshot
# 5. Wait 1-2h, prompt for GO/NO-GO decision
# 6. Execute Phase 5 (RS256-only)
# 7. Wait 30min, validate 100% adoption
# 8. Capture evidence (snapshots, CSV, Git tag)
# 9. Display summary
```

### **Option B: Manual (Follow Checklist)**

```bash
# Open checklist
code ops/launch/COMPRESSED_RS256_EXECUTION_CHECKLIST.md

# Execute Phase 4
cd ops/security/rs256
bash rs256-migrate.sh phase1

# Follow checklist timestamps:
# - T+1h checkpoint (adoption query)
# - T+2h checkpoint (Grafana snapshot)
# - T+3-4h GO/NO-GO decision
# - T+4h Phase 5 execution
# - T+4h+30min validation
# - T+5h evidence capture
# - T+6h sign-off
```

---

## 📊 **Monitoring During Migration**

### **Prometheus Queries**

```bash
# Check current adoption
promql 'tfos:adoption_rate{algorithm="RS256"}' --format value

# Check error rate
promql 'tfos:http_error_rate{service="auth"}' --format value

# Check System RI
promql 'tfos:ri' --format value
```

### **PostgreSQL Queries**

```sql
-- Current adoption split
SELECT 
  CASE WHEN kid LIKE '%rs256%' THEN 'RS256' ELSE 'HS256' END as algorithm,
  COUNT(*) as count,
  ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 2) as percentage
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY CASE WHEN kid LIKE '%rs256%' THEN 'RS256' ELSE 'HS256' END;
```

### **Grafana Dashboards**

- **Confidence Gradient Dashboard** — Real-time adoption slope
- **Auth Health Dashboard** — Error rates, latency
- **System RI Dashboard** — Overall resilience index

---

## 🛡️ **Rollback Procedures**

### **Phase 5 Rollback (Re-enable HS256)**

```bash
# If Phase 5 causes issues, rollback to dual-signing
bash ops/recovery/rollback-latest.sh --component=rs256_phase5 --no-confirm

# Verify JWKS shows both keys
curl http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | {kid, alg}'

# Expected: HS256 + RS256 keys (dual-signing restored)
# Recovery time: <2 minutes
```

### **Phase 4 Rollback (Revert to HS256-only)**

```bash
# If Phase 4 causes issues, complete rollback
bash ops/recovery/rollback-latest.sh --component=rs256_phase4 --no-confirm

# Verify JWKS shows only HS256
curl http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | {kid, alg}'

# Expected: Only HS256 key
# Recovery time: <2 minutes
```

---

## 📁 **Evidence Package Location**

All artifacts stored in: `ops/audit/week2/rs256-compressed-run/YYYYMMDDTHHMMSS/`

**Contents:**
- `baseline_adoption.txt` — Pre-migration state
- `phase4_execution.log` — Phase 4 output
- `phase4_jwks.json` — JWKS after Phase 4
- `adoption_t1h.txt` — T+1h metrics
- `adoption_t2h.txt` — T+2h metrics
- `adoption_t3h.txt` — T+3-4h metrics (GO/NO-GO)
- `phase5_execution.log` — Phase 5 output
- `phase5_jwks.json` — JWKS after Phase 5 (RS256-only)
- `adoption_final.txt` — T+4h+30min final state
- `adoption_timeline.csv` — Full 6h timeline
- `integration_tests.log` — Test results (if available)
- `timeline.txt` — Timestamps for all phases

---

## 🎯 **Success Criteria**

**Migration is successful if:**

✅ Phase 4 activated without errors  
✅ RS256 adoption reached ≥90% within 2-3 hours  
✅ Phase 5 activated without errors  
✅ 100% RS256 adoption confirmed post-Phase 5  
✅ Zero HS256 traffic detected post-Phase 5  
✅ System RI maintained ≥0.9390 throughout  
✅ Auth error rate <5/hour sustained  
✅ No firing alerts during or after migration  
✅ Complete evidence trail captured  
✅ Git tags created and signed  

**Total: 10/10 success checks**

---

## 🚀 **After RS256 Complete → F1/F4 Staging**

Once RS256 migration is complete (RS256-only mode active), immediately deploy F1/F4 to staging:

### **Pre-Flight Validation**

```bash
# Run 13-gate validation suite
bash ops/tests/pre-flight/f1-f4-validation.sh

# Expected: All checks PASS (GO decision)
```

### **Deploy to Staging**

```bash
# Deploy F1 (adaptive retry)
kubectl apply -f deploy/f1-adaptive-retry/

# Deploy F4 (Redis pooling)
kubectl apply -f deploy/f4-redis-pooling/

# Watch RI move in real-time
promql 'tfos:ri{service="api"}' --format value
```

### **4h Soak Period**

```bash
# Run soak health check every 4 hours
bash ops/tests/soak/f1-f4-health-check.sh

# Expected: All checks PASS
# - API RI ≥0.95
# - Cache RI ≥0.93
# - Circuit breaker stable (≤3 state changes)
# - Retry tier-1 ≥85%
# - Redis pool saturation p95 ≤85%
```

### **Chaos Validation (Optional)**

```bash
# Test F4 under Redis latency
kubectl apply -f ops/tests/chaos/redis-latency-200ms.yaml

# Test F1 under downstream errors
kubectl apply -f ops/tests/chaos/f1-downstream-503.yaml

# Validate: No failures, RI maintained, recovery <2min
```

### **GO/NO-GO for Production**

After 4h soak + chaos validation:

✅ All health checks pass  
✅ RI maintained (API ≥0.95, Cache ≥0.93)  
✅ Chaos tests pass (no failures, recovery <2min)  
✅ Traces show retry/pool metrics flowing  

**Decision: GO to production** 🚀

---

## 📚 **Related Documentation**

- **ops/launch/COMPRESSED_RS256_EXECUTION_CHECKLIST.md** — Complete execution checklist
- **ops/launch/phase4_t48h/** — Phase 4 Launch Packet (96h timeline version)
- **ops/launch/phase5_t96h/** — Phase 5 Launch Packet (96h timeline version)
- **docs/governance/CONFIDENCE_GRADIENT_RETROSPECTIVE.md** — SRE lessons learned
- **ops/observability/CONFIDENCE_GRADIENT_DASHBOARD.md** — Real-time adoption dashboard
- **ops/tests/pre-flight/f1-f4-validation.sh** — 13-gate pre-flight suite
- **ops/tests/soak/f1-f4-health-check.sh** — 4h soak validation
- **ops/monitoring/ri-recording-rules.yaml** — Prometheus RI metrics

---

## 🎉 **What This Achieves**

✅ **Practice full multi-phase gate workflow** (without 96h wait)  
✅ **Validate automation end-to-end** (self-audit, snapshots, rollback)  
✅ **Create compliance-ready audit trail** (Grafana, CSV, Git tags)  
✅ **Build operational muscle memory** (gate process, GO/NO-GO decisions)  
✅ **Free 2+ days for F1/F4 work** (4-6h vs 96h timeline)  
✅ **Prove infrastructure for real clients** (when they DO arrive)  

---

**Execution Status:** ⏳ READY TO START  
**Estimated Duration:** 4-6 hours  
**Risk Level:** Minimal (zero paying clients, full rollback capability)  
**Next Action:** Run `bash ops/runbooks/run_compressed_migration.sh`

**Let's go. 🚀**

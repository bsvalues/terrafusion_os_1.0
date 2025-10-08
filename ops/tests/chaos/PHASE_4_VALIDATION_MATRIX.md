# 📊 Phase 4 Soak Validation Matrix

**Purpose:** T+48h Gate Sign-Off Template  
**Phase:** RS256 Dual-Sign Initiation (Phase 4)  
**Gate Criteria:** RS256 adoption ≥95%, system stability confirmed  
**Sign-Off Required:** SRE Lead + Platform Lead

---

## ✅ How to Use This Matrix

**At T+48h (October 8, 2025 — 06:42 UTC):**

1. Run the validation scripts in Column E
2. Record measured values in Column C
3. Compare measured vs. target (Column B)
4. Check alert status (Column D)
5. Mark GO/NO-GO for each row
6. **Sign off only if ALL rows are GO**

---

## 📋 Validation Matrix — T+48h Gate

| # | Metric | Target Value | Measured Value (T+48h) | Alert Name | Verification Script | GO/NO-GO |
|---|--------|--------------|------------------------|------------|---------------------|----------|
| **1** | **RS256 Adoption Rate** | ≥95% | ___________ % | `RS256_Adoption_Low` | `psql terrafusion_db -f ops/security/rs256/adoption-tracking-queries.sql` | ☐ GO ☐ NO-GO |
| **2** | **Auth Errors (24h)** | <10 errors | ___________ errors | `Auth_Error_Rate_High` | Query: `SELECT COUNT(*) FROM auth_audit WHERE created_at > NOW() - INTERVAL '24 hours' AND status='error'` | ☐ GO ☐ NO-GO |
| **3** | **PagerDuty Pages (24h)** | 0 pages | ___________ pages | N/A | Check PagerDuty console manually | ☐ GO ☐ NO-GO |
| **4** | **Customer Escalations** | 0 escalations | ___________ escalations | N/A | Check support ticket system | ☐ GO ☐ NO-GO |
| **5** | **System RI** | ≥0.9390 | ___________ | `RI_System_Degradation` | `curl -s http://localhost:9091/metrics \| grep terrafusion_ri_system` | ☐ GO ☐ NO-GO |
| **6** | **F1 RI** | ≥0.9500 | ___________ | `RI_F1_Degradation` | `curl -s http://localhost:9091/metrics \| grep terrafusion_ri_f1` | ☐ GO ☐ NO-GO |
| **7** | **F2 RI** | ≥0.9500 | ___________ | `RI_F2_Degradation` | `curl -s http://localhost:9091/metrics \| grep terrafusion_ri_f2` | ☐ GO ☐ NO-GO |
| **8** | **F4 RI** | ≥0.9300 | ___________ | `RI_F4_Degradation` | `curl -s http://localhost:9091/metrics \| grep terrafusion_ri_f4` | ☐ GO ☐ NO-GO |
| **9** | **Circuit Breaker Flap Rate** | ≤2 per hour | ___________ flaps/h | `CB_Flap` | `curl -s http://localhost:9090/api/v1/query?query=rate(f2_circuit_breaker_opens[1h])` | ☐ GO ☐ NO-GO |
| **10** | **F2 Recovery Time (p95)** | ≤60s | ___________ s | `F2_Recovery_Slow` | `curl -s http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,f2_recovery_seconds)` | ☐ GO ☐ NO-GO |
| **11** | **F1 Latency (p95)** | ≤500ms | ___________ ms | `F1_Latency_High` | `curl -s http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,f1_request_duration_seconds)*1000` | ☐ GO ☐ NO-GO |
| **12** | **F4 Latency (p95)** | ≤800ms | ___________ ms | `F4_Latency_High` | `curl -s http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,f4_request_duration_seconds)*1000` | ☐ GO ☐ NO-GO |
| **13** | **F2 Error Rate (5xx)** | <1% | ___________ % | `F2_Error_Rate_High` | `curl -s http://localhost:9090/api/v1/query?query=rate(f2_http_5xx[5m])*100` | ☐ GO ☐ NO-GO |
| **14** | **Data Integrity Errors** | 0 errors | ___________ errors | `F2_Data_Integrity_Error` | `curl -s http://localhost:9090/api/v1/query?query=f2_data_integrity_errors_total` | ☐ GO ☐ NO-GO |
| **15** | **Alert Manager Health** | All alerts firing correctly | ___________ | N/A | `curl -s http://localhost:9093/api/v2/alerts \| jq '.[] \| select(.status.state=="firing")'` | ☐ GO ☐ NO-GO |

---

## 🎯 Decision Criteria

### ✅ GO Criteria (Proceed to Phase 4)

**ALL of the following must be true:**

- ✅ RS256 adoption ≥95%
- ✅ Auth errors <10 per 24h
- ✅ Zero PagerDuty pages in last 24h
- ✅ Zero customer escalations
- ✅ All RI metrics at or above target
- ✅ Circuit breaker flap rate ≤2 per hour
- ✅ F2 recovery time ≤60s (p95)
- ✅ All latency metrics within target
- ✅ F2 error rate <1%
- ✅ Zero data integrity errors
- ✅ No false-positive alerts in last 24h

**If ALL criteria are GO:**
```bash
# Proceed to Phase 4:
bash ops/security/rs256/rs256-migrate.sh phase1

# Expected output:
# ✅ JWKS published with kid=tfos_2025_kid1
# ✅ Auth service flipped to RS256 signing
# ✅ Verifiers pinned to JWKS
# ✅ Adoption logging enabled
# 
# Phase 4 initiated. Monitor adoption for next 48h.
# Target: T+24h >80%, T+48h >95%
```

---

### ❌ NO-GO Criteria (Extend Soak Period)

**ANY of the following triggers NO-GO:**

- ❌ RS256 adoption <95%
- ❌ Auth errors ≥10 per 24h
- ❌ Any PagerDuty pages in last 24h
- ❌ Customer escalations detected
- ❌ Any RI metric below target
- ❌ Circuit breaker flapping >2 per hour
- ❌ F2 recovery time >60s
- ❌ Any latency metric exceeds target
- ❌ F2 error rate ≥1%
- ❌ Data integrity errors detected
- ❌ False-positive alerts detected

**If ANY criterion is NO-GO:**
```bash
# Extend soak period by 24h:
# New gate: T+60h (October 8, 2025 — 18:42 UTC)
#
# Actions:
# 1. Investigate root cause of NO-GO criterion
# 2. Apply corrective measures if needed
# 3. Re-run validation matrix at T+60h
# 4. Document extension in ops/tests/chaos/SOAK_EXTENSION_LOG.md
```

---

## 📈 Trend Analysis (Confidence Booster)

### RS256 Adoption Slope

**Historical Data (T+0h → T+48h):**

| Time | Adoption % | Δ%/hour | Projected T+48h | Confidence |
|------|------------|---------|-----------------|------------|
| T+0h | 0% | — | — | — |
| T+12h | 42% | 3.5%/h | — | — |
| T+24h | 68% | 2.2%/h | — | — |
| T+36h | 92% | 2.0%/h | ~100% | High ✅ |
| **T+48h** | **_____** % | **_____** %/h | — | ☐ GO ☐ NO-GO |

**Slope Interpretation:**

- **≥1.5%/h:** High confidence for ≥95% at T+48h ✅
- **<1.5%/h:** Prepare soft extension to T+60h ⚠️

**Measured Slope (T+36h → T+48h):**
```bash
# Calculate adoption slope:
# Formula: (adoption_t48 - adoption_t36) / 12 hours
# Example: (98% - 92%) / 12h = 0.5%/h

Slope = ___________ %/h

Confidence Level: ☐ High (≥1.5%/h)  ☐ Medium (1.0-1.5%/h)  ☐ Low (<1.0%/h)
```

---

## 🔗 Cross-Reference to Observability Files

**Alert Rules:**

- **F2/CB Alerts:** `ops/tests/chaos/monitoring/f2-recovery.alerts.yaml` (463 lines, 6 alerts)
- **RI Alerts:** `ops/monitoring/ri-alerts.yaml` (389 lines, 12 alerts)
- **Recording Rules:** `ops/monitoring/ri-recording-rules.yaml` (282 lines)

**Monitoring Scripts:**

- **RI Calculator:** `ops/monitoring/ri-calculator.py` (317 lines, port 9091)
- **Pre-Flight Validation:** `ops/tests/pre-flight/f1-f4-validation.sh` (325 lines, 13 checks)
- **24h Soak Health Check:** `ops/tests/soak/f1-f4-health-check.sh` (412 lines)

**Adoption Queries:**

- **RS256 Tracking:** `ops/security/rs256/adoption-tracking-queries.sql` (8 queries)

**Tracing:**

- **F1 Retry Spans:** `ops/tracing/f1-retry-spans.yaml` (410 lines, Istio EnvoyFilter)
- **F4 Pool Spans:** `ops/tracing/f4-pool-spans.yaml` (534 lines, Redis pool wait spans)

---

## 🚦 Phase 4 Execution Checklist

**After GO decision, execute in sequence:**

### Step 4.1: Publish JWKS (5 minutes)

```bash
# Generate JWKS endpoint:
bash ops/security/rs256/generate-keys.sh

# Deploy JWKS mock server (for testing):
python3 ops/security/rs256/jwks-mock-server.py &

# Verify JWKS endpoint:
curl -s http://localhost:5001/.well-known/jwks.json | jq '.'

# Expected output:
# {
#   "keys": [
#     {
#       "kty": "RSA",
#       "kid": "tfos_2025_kid1",
#       "use": "sig",
#       "alg": "RS256",
#       "n": "...",
#       "e": "AQAB"
#     }
#   ]
# }
```

**Validation:**
- ☐ JWKS published at `/.well-known/jwks.json`
- ☐ `kid=tfos_2025_kid1` present
- ☐ Public key modulus (`n`) length ≥256 bytes (RSA-2048)

---

### Step 4.2: Flip Auth Service to RS256 (10 minutes)

```bash
# Update auth service config:
kubectl set env deployment/auth-service JWT_SIGNING_ALGORITHM=RS256
kubectl set env deployment/auth-service JWT_PRIVATE_KEY_PATH=/secrets/jwt-private-key.pem

# Verify deployment:
kubectl rollout status deployment/auth-service

# Test JWT signing:
curl -X POST http://auth-service/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  | jq -r '.token' \
  | jwt decode -

# Expected header:
# {
#   "alg": "RS256",
#   "typ": "JWT",
#   "kid": "tfos_2025_kid1"
# }
```

**Validation:**
- ☐ Auth service restarted successfully
- ☐ New JWTs signed with RS256
- ☐ `kid` header present in JWT
- ☐ Old HS256 JWTs still accepted (dual-mode)

---

### Step 4.3: Pin Verifiers to JWKS (10 minutes)

```bash
# Update all service verifier configs:
kubectl set env deployment/f1-gateway JWKS_ENDPOINT=http://auth-service/.well-known/jwks.json
kubectl set env deployment/f2-processor JWKS_ENDPOINT=http://auth-service/.well-known/jwks.json
kubectl set env deployment/f4-cache JWKS_ENDPOINT=http://auth-service/.well-known/jwks.json

# Verify rollout:
kubectl rollout status deployment/f1-gateway
kubectl rollout status deployment/f2-processor
kubectl rollout status deployment/f4-cache

# Test token verification:
TOKEN=$(curl -s -X POST http://auth-service/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  | jq -r '.token')

curl -H "Authorization: Bearer $TOKEN" http://f1-gateway/api/health
curl -H "Authorization: Bearer $TOKEN" http://f2-processor/api/health
curl -H "Authorization: Bearer $TOKEN" http://f4-cache/api/health

# Expected: All return 200 OK
```

**Validation:**
- ☐ F1 gateway verifying JWTs via JWKS
- ☐ F2 processor verifying JWTs via JWKS
- ☐ F4 cache verifying JWTs via JWKS
- ☐ Both RS256 and HS256 tokens accepted

---

### Step 4.4: Enable Adoption Logging (5 minutes)

```bash
# Update database schema:
psql terrafusion_db -f ops/security/rs256/adoption-tracking-schema.sql

# Enable logging in auth service:
kubectl set env deployment/auth-service LOG_JWT_ALGORITHM=true

# Verify logging:
psql terrafusion_db -c "SELECT algorithm, COUNT(*) FROM auth_audit WHERE created_at > NOW() - INTERVAL '5 minutes' GROUP BY algorithm"

# Expected output:
# algorithm | count
# ----------+-------
# HS256     |    23
# RS256     |   112
```

**Validation:**
- ☐ `auth_audit` table capturing algorithm type
- ☐ Both HS256 and RS256 tokens logged
- ☐ Adoption queries returning valid percentages

---

## 📊 Post-Phase-4 Monitoring Plan

**For next 48 hours (T+48h → T+96h):**

### Every 4 Hours

```bash
# Run adoption queries:
psql terrafusion_db -f ops/security/rs256/adoption-tracking-queries.sql

# Check key metrics:
# - Query 1: Adoption % (target: T+24h >80%, T+48h >95%)
# - Query 3: Error rate (target: <10 per 24h)
# - Query 5: Peak adoption time analysis
```

### Every 12 Hours

```bash
# Export Grafana dashboard snapshot:
curl -s -H "Authorization: Bearer $GRAFANA_API_KEY" \
  http://grafana:3000/api/dashboards/uid/rs256-adoption \
  > out/day9/rs256-adoption-snapshot-$(date +%Y%m%d-%H%M).json

# Export Prometheus metrics:
curl -s http://localhost:9090/api/v1/query?query=terrafusion_ri_system \
  > out/day9/ri-metrics-$(date +%Y%m%d-%H%M).json
```

### Every 24 Hours

```bash
# Run full health check:
bash ops/tests/soak/f1-f4-health-check.sh

# Review AlertManager:
curl -s http://localhost:9093/api/v2/alerts | jq '.[] | select(.status.state=="firing")'

# Check PagerDuty:
# Manual review of PagerDuty console for any pages
```

---

## 🔴 Rollback Trigger Conditions

**Immediately rollback to HS256 if ANY of these occur:**

1. ❌ Auth error rate spikes >50 errors per hour
2. ❌ RS256 adoption drops below 80% after initial ramp
3. ❌ Customer-facing service outage (any 5xx error rate >5%)
4. ❌ PagerDuty page for auth-related incident
5. ❌ Data integrity error detected (F2_Data_Integrity_Error fires)

**Rollback Command:**

```bash
# Immediate rollback (execute within 2 minutes):
kubectl set env deployment/auth-service JWT_SIGNING_ALGORITHM=HS256
kubectl set env deployment/auth-service JWT_SECRET_KEY=$(cat /secrets/jwt-secret.txt)

# Verify rollback:
kubectl rollout status deployment/auth-service

# Test HS256 signing:
curl -X POST http://auth-service/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  | jq -r '.token' \
  | jwt decode -

# Expected header: {"alg": "HS256", "typ": "JWT"}

# Document rollback:
echo "$(date): Phase 4 rollback executed due to: [REASON]" \
  >> ops/tests/chaos/ROLLBACK_LOG.md
```

---

## ✍️ Sign-Off Section

**Validation Completed At:** _________________ (UTC)

**Validation Performed By:** _________________

### Decision

☐ **GO** — All criteria met, proceed to Phase 4  
☐ **NO-GO** — Extend soak period to T+60h, investigate blockers

**GO/NO-GO Summary:**
- Total criteria: 15
- GO count: _____
- NO-GO count: _____
- Critical blockers: _________________

### Approvals Required

**SRE Lead:**  
Name: _________________  
Signature: _________________  
Date: _________________

**Platform Lead:**  
Name: _________________  
Signature: _________________  
Date: _________________

### Next Actions

**If GO:**
1. Execute Phase 4 checklist (Steps 4.1 → 4.4)
2. Initiate 48h monitoring plan
3. Schedule Phase 5 (24h staging soak) start time
4. Update deployment status in ops/tests/chaos/DEPLOYMENT_STATUS.md

**If NO-GO:**
1. Document extension reason in ops/tests/chaos/SOAK_EXTENSION_LOG.md
2. Investigate root cause of blocking criterion
3. Apply corrective measures
4. Re-run validation matrix at T+60h
5. Notify stakeholders of timeline adjustment

---

**END OF PHASE 4 VALIDATION MATRIX**

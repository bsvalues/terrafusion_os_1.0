# 🚨 Emergency Rollback Runbook

**Purpose:** <2min rollback procedures for RS256 + F1/F4 deployments  
**Scope:** Phase 4 (RS256), Phase 5 (24h soak), Day 9 (F1/F4), Day 10 (Production)  
**Target:** Restore service within 120 seconds of rollback decision

---

## 🎯 Rollback Decision Tree

```
Incident Detected
    ↓
Is it critical? ────── NO ──→ Continue monitoring, document in incident log
    ↓ YES
    ↓
Which component?
    ├─ RS256 Auth ──→ Section 1: RS256 Rollback
    ├─ F1 Gateway ──→ Section 2: F1 Rollback
    ├─ F2 Circuit Breaker ──→ Section 3: F2 Rollback
    └─ F4 Cache ──→ Section 4: F4 Rollback
```

---

## 🔴 Critical Rollback Triggers

**Immediately execute rollback if ANY of these occur:**

### RS256 Triggers

- ❌ Auth error rate >50 errors/hour (sustained >5min)
- ❌ RS256 adoption drops below 80% after initial ramp
- ❌ Customer-facing auth failures (login errors)
- ❌ PagerDuty page for auth service outage
- ❌ JWT verification failures >10 per minute

### F1/F2/F4 Triggers

- ❌ Any service RI drops >0.05 below target (e.g., F1 from 0.9500 → 0.8900)
- ❌ Circuit breaker stuck open >5min
- ❌ Circuit breaker flapping >5 per minute
- ❌ 5xx error rate >5% for any service
- ❌ Data integrity error detected (`F2_Data_Integrity_Error` fires)
- ❌ P95 latency exceeds 2× target (F1 >1000ms, F4 >1600ms)
- ❌ HPA thrashing (>10 scale events per minute)

---

## 1️⃣ RS256 Rollback to HS256

**Estimated Time:** <90 seconds  
**Pre-Requisites:** HS256 secret key backed up in `/secrets/jwt-secret.txt`

### Step 1.1: Immediate Rollback (30 seconds)

```bash
# Set context to correct namespace:
kubectl config set-context --current --namespace=terrafusion-production

# Rollback auth service to HS256:
kubectl set env deployment/auth-service \
  JWT_SIGNING_ALGORITHM=HS256 \
  JWT_SECRET_KEY=$(cat /secrets/jwt-secret.txt)

# Remove JWKS config:
kubectl set env deployment/auth-service \
  JWT_PRIVATE_KEY_PATH- \
  JWKS_ENDPOINT-

# Force immediate rollout:
kubectl rollout restart deployment/auth-service

# Expected output:
# deployment.apps/auth-service restarted
```

### Step 1.2: Verify Rollback (30 seconds)

```bash
# Wait for rollout to complete:
kubectl rollout status deployment/auth-service --timeout=60s

# Test HS256 signing:
TOKEN=$(curl -s -X POST http://auth-service/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  | jq -r '.token')

# Decode token header:
echo $TOKEN | cut -d'.' -f1 | base64 -d 2>/dev/null | jq '.'

# Expected output:
# {
#   "alg": "HS256",
#   "typ": "JWT"
# }

# Test token verification:
curl -s -H "Authorization: Bearer $TOKEN" \
  http://f1-gateway/api/health

# Expected: 200 OK
```

### Step 1.3: Revert Verifiers (30 seconds)

```bash
# Remove JWKS endpoints from all services:
kubectl set env deployment/f1-gateway JWKS_ENDPOINT-
kubectl set env deployment/f2-processor JWKS_ENDPOINT-
kubectl set env deployment/f4-cache JWKS_ENDPOINT-

# Restore HS256 secret to verifiers:
kubectl set env deployment/f1-gateway JWT_SECRET_KEY=$(cat /secrets/jwt-secret.txt)
kubectl set env deployment/f2-processor JWT_SECRET_KEY=$(cat /secrets/jwt-secret.txt)
kubectl set env deployment/f4-cache JWT_SECRET_KEY=$(cat /secrets/jwt-secret.txt)

# Force immediate rollout:
kubectl rollout restart deployment/f1-gateway
kubectl rollout restart deployment/f2-processor
kubectl rollout restart deployment/f4-cache

# Wait for all services:
kubectl rollout status deployment/f1-gateway --timeout=30s
kubectl rollout status deployment/f2-processor --timeout=30s
kubectl rollout status deployment/f4-cache --timeout=30s
```

### Step 1.4: Validation (10 seconds)

```bash
# Generate new HS256 token:
TOKEN=$(curl -s -X POST http://auth-service/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  | jq -r '.token')

# Test all service endpoints:
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://f1-gateway/api/health
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://f2-processor/api/health
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://f4-cache/api/health

# All should return: 200
```

### RS256 Rollback Complete ✅

**Total Time:** ~90 seconds  
**Next Action:** Document incident in `ops/tests/chaos/ROLLBACK_LOG.md`

---

## 2️⃣ F1 Retry Budget Rollback

**Estimated Time:** <60 seconds  
**Pre-Requisites:** Backup manifest at `ops/traffic/f1-retry-budget.backup.yaml`

### Step 2.1: Immediate Rollback (30 seconds)

```bash
# Apply backup manifest:
kubectl apply -f ops/traffic/f1-retry-budget.backup.yaml

# Expected output:
# virtualservice.networking.istio.io/f1-gateway configured

# Verify VirtualService:
kubectl get virtualservice f1-gateway -o yaml | grep -A 5 retries

# Expected output (baseline config):
# retries:
#   attempts: 2
#   perTryTimeout: 200ms
#   retryOn: "5xx,reset,connect-failure,refused-stream"
```

### Step 2.2: Validate F1 Metrics (30 seconds)

```bash
# Check F1 RI after rollback:
curl -s http://localhost:9091/metrics | grep terrafusion_ri_f1

# Expected: RI should stabilize within 30s
# Target: ≥0.9250 (baseline before optimization)

# Check retry rate:
curl -s http://localhost:9090/api/v1/query?query=rate(istio_requests_total{destination_service_name="f1-gateway",response_code=~"5..",retry="true"}[1m])

# Expected: Retry rate should decrease from optimized value
```

### F1 Rollback Complete ✅

**Total Time:** ~60 seconds  
**Next Action:** Monitor F1 RI for next 15 minutes, ensure stability at ≥0.9250

---

## 3️⃣ F2 Circuit Breaker Rollback

**Estimated Time:** <60 seconds  
**Pre-Requisites:** Backup manifest at `ops/traffic/f2-circuit-breaker.backup.yaml`

### Step 3.1: Immediate Rollback (30 seconds)

```bash
# Apply backup manifest:
kubectl apply -f ops/traffic/f2-circuit-breaker.backup.yaml

# Expected output:
# destinationrule.networking.istio.io/f2-processor configured

# Verify DestinationRule:
kubectl get destinationrule f2-processor -o yaml | grep -A 5 outlierDetection

# Expected output (baseline config):
# outlierDetection:
#   consecutiveErrors: 5
#   interval: 30s
#   baseEjectionTime: 30s
#   maxEjectionPercent: 50
```

### Step 3.2: Validate F2 Metrics (30 seconds)

```bash
# Check F2 RI after rollback:
curl -s http://localhost:9091/metrics | grep terrafusion_ri_f2

# Expected: RI should stabilize within 30s
# Target: ≥0.9450 (baseline before circuit breaker tuning)

# Check circuit breaker state:
curl -s http://localhost:9090/api/v1/query?query=envoy_cluster_outlier_detection_ejections_active{cluster_name="outbound|8080||f2-processor.terrafusion-production.svc.cluster.local"}

# Expected: 0 (no active ejections)
```

### F2 Rollback Complete ✅

**Total Time:** ~60 seconds  
**Next Action:** Monitor F2 recovery time, ensure <60s (p95)

---

## 4️⃣ F4 Redis Pool Rollback

**Estimated Time:** <90 seconds  
**Pre-Requisites:** Backup manifest at `ops/cache/f4-redis-pool.backup.yaml`

### Step 4.1: Immediate Rollback (45 seconds)

```bash
# Apply backup manifest:
kubectl apply -f ops/cache/f4-redis-pool.backup.yaml

# Expected output:
# configmap/f4-redis-config configured

# Restart F4 deployment to pick up new config:
kubectl rollout restart deployment/f4-cache

# Wait for rollout:
kubectl rollout status deployment/f4-cache --timeout=45s
```

### Step 4.2: Validate F4 Metrics (45 seconds)

```bash
# Check F4 RI after rollback:
curl -s http://localhost:9091/metrics | grep terrafusion_ri_f4

# Expected: RI should stabilize within 45s
# Target: ≥0.9000 (baseline before connection pooling)

# Check Redis pool saturation:
curl -s http://localhost:9090/api/v1/query?query=redis_pool_saturation

# Expected: <90% (baseline saturation level)

# Check Redis connection count:
redis-cli -h redis-master.terrafusion-production.svc.cluster.local \
  INFO clients | grep connected_clients

# Expected: Connection count should return to baseline (~50-100 connections)
```

### F4 Rollback Complete ✅

**Total Time:** ~90 seconds  
**Next Action:** Monitor F4 cache hit rate, ensure ≥85%

---

## 🔄 Multi-Component Rollback

**If multiple components need rollback simultaneously:**

### Parallel Rollback (Fastest — <120 seconds)

```bash
# Create rollback script:
cat > /tmp/emergency-rollback.sh << 'EOF'
#!/bin/bash
set -e

echo "🚨 EMERGENCY ROLLBACK INITIATED"

# RS256 rollback:
kubectl set env deployment/auth-service JWT_SIGNING_ALGORITHM=HS256 JWT_SECRET_KEY=$(cat /secrets/jwt-secret.txt) &

# F1 rollback:
kubectl apply -f ops/traffic/f1-retry-budget.backup.yaml &

# F2 rollback:
kubectl apply -f ops/traffic/f2-circuit-breaker.backup.yaml &

# F4 rollback:
kubectl apply -f ops/cache/f4-redis-pool.backup.yaml &

# Wait for all background jobs:
wait

echo "✅ All rollbacks applied"
echo "⏳ Waiting for service stabilization..."

# Restart services:
kubectl rollout restart deployment/auth-service
kubectl rollout restart deployment/f1-gateway
kubectl rollout restart deployment/f2-processor
kubectl rollout restart deployment/f4-cache

# Wait for rollouts:
kubectl rollout status deployment/auth-service --timeout=60s
kubectl rollout status deployment/f1-gateway --timeout=60s
kubectl rollout status deployment/f2-processor --timeout=60s
kubectl rollout status deployment/f4-cache --timeout=60s

echo "✅ ROLLBACK COMPLETE"
EOF

# Execute:
bash /tmp/emergency-rollback.sh
```

**Total Time:** ~120 seconds for full system rollback

---

## 📋 Post-Rollback Validation Checklist

**After any rollback, verify ALL of these:**

### System Health (5 minutes)

```bash
# 1. Check all pod health:
kubectl get pods -n terrafusion-production | grep -v "Running\|Completed"
# Expected: No output (all pods running)

# 2. Check RI metrics:
curl -s http://localhost:9091/metrics | grep terrafusion_ri

# Expected output:
# terrafusion_ri_f1 ≥0.9250
# terrafusion_ri_f2 ≥0.9450
# terrafusion_ri_f4 ≥0.9000
# terrafusion_ri_system ≥0.9200

# 3. Check alert status:
curl -s http://localhost:9093/api/v2/alerts | jq '.[] | select(.status.state=="firing") | .labels.alertname'
# Expected: [] (no firing alerts after 5min)

# 4. Test end-to-end flow:
TOKEN=$(curl -s -X POST http://auth-service/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' | jq -r '.token')

curl -s -H "Authorization: Bearer $TOKEN" http://f1-gateway/api/properties/12345 | jq '.status'
# Expected: "success"
```

### Traffic Validation (2 minutes)

```bash
# 5. Check 5xx error rate:
curl -s http://localhost:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])*100
# Expected: <1% for all services

# 6. Check latency percentiles:
curl -s http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,http_request_duration_seconds)
# Expected:
# - F1: ≤500ms
# - F2: ≤150ms (recovery latency)
# - F4: ≤800ms

# 7. Check circuit breaker state:
curl -s http://localhost:9090/api/v1/query?query=envoy_cluster_outlier_detection_ejections_active
# Expected: 0 for all clusters
```

### Data Integrity (1 minute)

```bash
# 8. Check for data integrity errors:
curl -s http://localhost:9090/api/v1/query?query=f2_data_integrity_errors_total
# Expected: 0

# 9. Verify database consistency:
psql terrafusion_db -c "SELECT COUNT(*) FROM properties WHERE updated_at > NOW() - INTERVAL '5 minutes'"
# Expected: Non-zero count (data still flowing)

# 10. Check Redis cache consistency:
redis-cli -h redis-master.terrafusion-production.svc.cluster.local \
  GET "property:12345" | jq '.status'
# Expected: Valid JSON response
```

---

## 📝 Rollback Documentation Template

**After rollback, immediately fill this out:**

```markdown
# Rollback Incident Report

**Date/Time:** _________________ (UTC)
**Duration:** _________________ (seconds)
**Executed By:** _________________

## Rollback Details

**Component(s) Rolled Back:**
- ☐ RS256 Auth
- ☐ F1 Retry Budget
- ☐ F2 Circuit Breaker
- ☐ F4 Redis Pool

**Trigger Event:**
_________________

**Alert(s) That Fired:**
_________________

## Impact Assessment

**Customer Impact:**
- ☐ No customer impact (internal detection)
- ☐ Minor impact (<1% requests affected)
- ☐ Moderate impact (1-5% requests affected)
- ☐ Major impact (>5% requests affected)

**Duration of Impact:**
_________________ (seconds/minutes)

**Affected Services:**
_________________

## Root Cause Analysis (Preliminary)

**What Failed:**
_________________

**Why It Failed:**
_________________

**Detection Method:**
- ☐ Alert fired automatically
- ☐ Manual monitoring detected
- ☐ Customer report
- ☐ Other: _________________

## Rollback Execution

**Commands Executed:**
```bash
# Paste actual commands used
```

**Validation Results:**
- ☐ All pods running
- ☐ RI metrics at baseline
- ☐ No firing alerts
- ☐ End-to-end test passed
- ☐ Traffic flowing normally
- ☐ No data integrity issues

**Total Rollback Time:** _________________ (seconds)

## Follow-Up Actions

1. _________________
2. _________________
3. _________________

**Next Deployment Attempt:**
- ☐ After root cause fixed and validated
- ☐ Extended soak period required
- ☐ Design change needed
- ☐ Permanently reverted

**Approver Sign-Off:**
Name: _________________
Date: _________________
```

**Save to:** `ops/tests/chaos/ROLLBACK_LOG.md`

---

## 🔧 Backup Manifest Locations

**Verify these exist BEFORE deployment:**

```bash
# RS256 backups:
ls -lh /secrets/jwt-secret.txt
# Expected: File exists, size >32 bytes

# F1 backup:
ls -lh ops/traffic/f1-retry-budget.backup.yaml
# Expected: File exists, ~200 lines

# F2 backup:
ls -lh ops/traffic/f2-circuit-breaker.backup.yaml
# Expected: File exists, ~150 lines

# F4 backup:
ls -lh ops/cache/f4-redis-pool.backup.yaml
# Expected: File exists, ~180 lines

# Create backups if missing:
kubectl get virtualservice f1-gateway -o yaml > ops/traffic/f1-retry-budget.backup.yaml
kubectl get destinationrule f2-processor -o yaml > ops/traffic/f2-circuit-breaker.backup.yaml
kubectl get configmap f4-redis-config -o yaml > ops/cache/f4-redis-pool.backup.yaml
```

---

## 🚨 Emergency Contacts

**Escalation Tree (if rollback fails):**

1. **SRE On-Call:** [Insert contact]
2. **Platform Lead:** [Insert contact]
3. **VP Engineering:** [Insert contact]

**Communication Channels:**

- **Slack:** `#terrafusion-incidents`
- **PagerDuty:** Incident Management
- **Status Page:** `status.terrafusion.io`

**Incident Declaration:**

```bash
# Declare P1 incident:
curl -X POST https://api.pagerduty.com/incidents \
  -H "Authorization: Token token=$PAGERDUTY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "type": "incident",
      "title": "TerraFusion Production Rollback - [Component]",
      "service": {
        "id": "PXXXXXX",
        "type": "service_reference"
      },
      "urgency": "high"
    }
  }'
```

---

## ✅ Pre-Deployment Rollback Readiness Check

**Run this BEFORE every deployment:**

```bash
#!/bin/bash
# File: ops/tests/chaos/verify-rollback-readiness.sh

echo "🔍 Verifying rollback readiness..."

# Check backup files exist:
FILES=(
    "/secrets/jwt-secret.txt"
    "ops/traffic/f1-retry-budget.backup.yaml"
    "ops/traffic/f2-circuit-breaker.backup.yaml"
    "ops/cache/f4-redis-pool.backup.yaml"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file MISSING - ROLLBACK NOT POSSIBLE"
        exit 1
    fi
done

# Check kubectl access:
if kubectl get pods -n terrafusion-production &>/dev/null; then
    echo "✅ kubectl access verified"
else
    echo "❌ kubectl access FAILED"
    exit 1
fi

# Check Prometheus access:
if curl -s http://localhost:9090/api/v1/query?query=up &>/dev/null; then
    echo "✅ Prometheus access verified"
else
    echo "❌ Prometheus access FAILED"
    exit 1
fi

echo "✅ Rollback readiness verified - SAFE TO DEPLOY"
```

**Add to deployment checklist:** ✅ Rollback readiness verified

---

**END OF ROLLBACK RUNBOOK**

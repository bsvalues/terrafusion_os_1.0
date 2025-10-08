# RS256 Compressed Migration — Execution Log

**Started:** October 8, 2025  
**Approach:** "Do it right" — Compressed timeline (4-6 hours)  
**Environment:** Pre-production staging/demo  
**Client Impact:** Zero (no production clients)

---

## 🎯 **Execution Plan**

### **Phase Mapping**

**rs256-migrate.sh phases:**
- Phase 0: Pre-flight validation (already done in prep)
- **Phase 1: Enable dual-sign** (HS256 + RS256) ← Execute NOW
- Phase 2: Monitor adoption (compressed from 48h → 2-4h)
- **Phase 3: RS256-only mode** (disable HS256) ← Execute after observation

**Compressed timeline execution:**
- T+0h: Execute Phase 1 (dual-signing enabled)
- T+1h: Checkpoint (adoption trending)
- T+2h: Checkpoint (majority adoption, snapshot)
- T+3-4h: GO/NO-GO decision
- T+4h: Execute Phase 3 (RS256-only mode)
- T+4h+30min: Validation (10 checks)
- T+5h: Evidence capture
- T+6h: Sign-off

---

## 📋 **Manual Execution Commands**

### **Option 1: Fully Automated (Recommended)**

```bash
# Set environment variables
export PGURL="postgres://terrafusion:password@localhost:5432/terrafusion_db"
export GRAFANA_URL="http://localhost:3000"
export GRAFANA_API_KEY="your-api-key"

# Run automated migration (4-6 hours)
bash ops/runbooks/run_compressed_migration.sh
```

**Script will:**
- Validate prerequisites
- Execute Phase 1 (dual-signing)
- Wait 1h → Checkpoint
- Wait 1h → Checkpoint + snapshot
- Wait 1-2h → Prompt for GO/NO-GO
- Execute Phase 3 (RS256-only)
- Wait 30min → Validate
- Capture evidence
- Create Git tag
- Display summary

---

### **Option 2: Manual (Step-by-Step)**

**Prerequisites:**
```bash
# Navigate to RS256 directory
cd ops/security/rs256

# Verify environment
echo "Environment: staging (default)"
```

**Phase 1: Enable Dual-Signing (T+0h)**
```bash
# Execute Phase 1
bash rs256-migrate.sh --phase 1 --env staging

# Expected output:
# [INFO] Phase 1: Enable Dual-Sign Mode
# [SUCCESS] JWKS updated with RS256 key
# [SUCCESS] Auth service restarted
# [SUCCESS] Phase 1 complete: Dual-sign mode enabled

# Verify JWKS shows both keys
curl http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | {kid, alg}'

# Expected: 2 keys (HS256 + RS256)
```

**T+1h Checkpoint:**
```bash
# Query adoption rate
psql "$PGURL" -c "
SELECT 
  CASE WHEN kid LIKE '%rs256%' THEN 'RS256' ELSE 'HS256' END as algorithm,
  COUNT(*) as count,
  ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 2) as percentage
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY CASE WHEN kid LIKE '%rs256%' THEN 'RS256' ELSE 'HS256' END;
"

# Expected: RS256 ≥40%, HS256 ≤60%
```

**T+2h Checkpoint:**
```bash
# Query adoption (2h window)
psql "$PGURL" -c "
SELECT 
  CASE WHEN kid LIKE '%rs256%' THEN 'RS256' ELSE 'HS256' END as algorithm,
  COUNT(*) as count,
  ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 2) as percentage
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '2 hours'
GROUP BY CASE WHEN kid LIKE '%rs256%' THEN 'RS256' ELSE 'HS256' END;
"

# Expected: RS256 ≥80%, HS256 ≤20%

# Capture Grafana snapshot (if available)
pwsh ops/scripts/render-grafana-panels.ps1 -DashboardUID "confidence-gradient" -OutputDir "evidence/t2h"
```

**T+3-4h GO/NO-GO Decision:**
```bash
# Check all 6 criteria:
# 1. RS256 adoption ≥90%
# 2. HS256 requests <10%
# 3. Auth errors <5/hour
# 4. System RI ≥0.9390
# 5. No firing alerts
# 6. Rollback verified

# If ALL pass → Proceed to Phase 3
# If 1-2 fail → Extend observation +1-2h
# If 3+ fail → Rollback to Phase 0
```

**Phase 3: RS256-Only Mode (T+4h)**
```bash
# Execute Phase 3
cd ops/security/rs256
bash rs256-migrate.sh --phase 3 --env staging

# Expected output:
# [INFO] Phase 3: RS256-Only Mode
# [SUCCESS] HS256 disabled
# [SUCCESS] JWKS updated (RS256 only)
# [SUCCESS] Phase 3 complete

# Verify JWKS shows only RS256
curl http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | {kid, alg}'

# Expected: 1 key (RS256 only)
```

**T+4h+30min Validation:**
```bash
# Verify 100% RS256 adoption
psql "$PGURL" -c "
SELECT 
  CASE WHEN kid LIKE '%rs256%' THEN 'RS256' ELSE 'HS256' END as algorithm,
  COUNT(*) as requests
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '30 minutes'
GROUP BY CASE WHEN kid LIKE '%rs256%' THEN 'RS256' ELSE 'HS256' END;
"

# Expected: Only RS256 rows, zero HS256

# Check error rate
psql "$PGURL" -c "
SELECT COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '30 minutes'
"

# Expected: <5 errors
```

**T+5h Evidence Capture:**
```bash
# Export adoption timeline
psql "$PGURL" -c "\COPY (
  SELECT 
    date_trunc('hour', created_at) as hour,
    CASE WHEN kid LIKE '%rs256%' THEN 'RS256' ELSE 'HS256' END as algorithm,
    COUNT(*) as requests
  FROM auth_audit
  WHERE created_at > NOW() - INTERVAL '6 hours'
  GROUP BY hour, algorithm
  ORDER BY hour, algorithm
) TO 'evidence/adoption_timeline.csv' CSV HEADER"

# Create Git tag
git tag -a "rs256-compressed-$(date +%Y%m%d)" -m "Compressed RS256 migration complete
Phase 1: [timestamp]
Phase 3: [timestamp]
Final adoption: 100% RS256
Duration: [X hours]
Status: SUCCESS"

git push origin rs256-compressed-$(date +%Y%m%d)
```

---

## 🛡️ **Rollback Procedures**

### **Rollback Phase 3 (Re-enable dual-signing)**
```bash
# Rollback to Phase 1 state
bash rs256-migrate.sh --phase 1 --env staging

# Verify both keys present
curl http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | {kid, alg}'

# Expected: 2 keys (HS256 + RS256)
# Recovery time: <2 minutes
```

### **Complete Rollback (HS256-only)**
```bash
# Rollback to Phase 0 (HS256-only)
bash ops/recovery/rollback-latest.sh --component=rs256 --no-confirm

# Verify only HS256 key
curl http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | {kid, alg}'

# Expected: 1 key (HS256 only)
# Recovery time: <2 minutes
```

---

## 📊 **Monitoring Dashboards**

### **Prometheus Queries**
```bash
# Check RS256 adoption
bash ops/scripts/promql "tfos:adoption_rate{algorithm='RS256'}" --format value

# Check error rate
bash ops/scripts/promql "tfos:http_error_rate{service='auth'}" --format value

# Check System RI
bash ops/scripts/promql "tfos:ri" --format value
```

### **Grafana Dashboards**
- **Confidence Gradient Dashboard** — Real-time adoption slope
- **Auth Health Dashboard** — Error rates, latency
- **System RI Dashboard** — Overall resilience

---

## ✅ **Success Criteria**

Migration successful if:

- [x] Phase 1 executed without errors
- [x] RS256 adoption ≥90% by T+2-3h
- [x] Phase 3 executed without errors
- [x] 100% RS256 adoption post-Phase 3
- [x] Zero HS256 traffic post-Phase 3
- [x] System RI ≥0.9390 maintained
- [x] Auth errors <5/hour sustained
- [x] No firing alerts during migration
- [x] Evidence trail captured
- [x] Git tag created

**Total: 10/10 checks**

---

## 📝 **Execution Notes**

### **T+0h: Phase 1 Execution**
- Timestamp: _______________
- Command: `bash rs256-migrate.sh --phase 1 --env staging`
- Result: ✅ / ❌
- Notes: _______________________________________

### **T+1h: Checkpoint**
- Timestamp: _______________
- RS256 adoption: _______% 
- HS256 adoption: _______%
- Errors (1h): _______
- Status: ✅ / ❌

### **T+2h: Checkpoint**
- Timestamp: _______________
- RS256 adoption: _______% 
- HS256 adoption: _______%
- Errors (2h): _______
- Grafana snapshot: ✅ / ❌
- Status: ✅ / ❌

### **T+3-4h: GO/NO-GO Decision**
- Timestamp: _______________
- Criteria passed: _____ / 6
- Decision: GO / HOLD / NO-GO
- Approver: _______________
- Notes: _______________________________________

### **T+4h: Phase 3 Execution**
- Timestamp: _______________
- Command: `bash rs256-migrate.sh --phase 3 --env staging`
- Result: ✅ / ❌
- Notes: _______________________________________

### **T+4h+30min: Validation**
- Timestamp: _______________
- RS256 adoption: _______% (target 100%)
- HS256 traffic: _______ (target 0)
- Errors (30min): _______ (target <5)
- System RI: _______ (target ≥0.9390)
- Status: ✅ / ❌

### **T+5h: Evidence Capture**
- Timestamp: _______________
- CSV exported: ✅ / ❌
- Git tag created: ✅ / ❌
- Grafana snapshots: ✅ / ❌
- Status: ✅ / ❌

---

## 🚀 **After RS256 Complete**

1. **Mark todo #1 complete** ✅
2. **Move to F1/F4 staging** (todo #4)
3. **Run pre-flight validation:** `bash ops/tests/pre-flight/f1-f4-validation.sh`
4. **Deploy F1/F4 to staging**
5. **4h soak + chaos validation**
6. **GO/NO-GO for production**

---

**Execution Status:** 🚀 READY TO START  
**Next Command:** `bash ops/runbooks/run_compressed_migration.sh` OR manual Phase 1  
**Duration:** 4-6 hours total  
**Environment:** staging  
**Risk:** Minimal (zero clients)

**Let's do this right. 🎯**

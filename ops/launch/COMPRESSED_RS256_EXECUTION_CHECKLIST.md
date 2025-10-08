# Compressed RS256 Migration — Execution Checklist

**Execution Date:** October 8, 2025  
**Mode:** Compressed timeline (4-6 hours total)  
**Environment:** Pre-production pilot (Benton County demo)  
**Risk Level:** Minimal (zero paying clients, full rollback capability)

---

## 📋 **Pre-Execution Validation**

**Before starting, confirm:**

- [ ] **Auth service healthy** — All pods Running, no CrashLoopBackOff
- [ ] **Database accessible** — PostgreSQL connection verified
- [ ] **JWKS endpoint reachable** — `curl http://auth-service:8080/.well-known/jwks.json`
- [ ] **Rollback script tested** — `bash ops/recovery/ROLLBACK_DRY_RUN.sh` (100% pass)
- [ ] **Baseline metrics captured** — Current HS256/RS256 split known
- [ ] **Monitoring active** — Grafana dashboards accessible

**Baseline State (T+0h):**

```sql
-- Current adoption snapshot
SELECT 
  CASE WHEN kid LIKE '%hs256%' THEN 'HS256' ELSE 'RS256' END as algorithm,
  COUNT(*) as count,
  ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 2) as percentage
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY CASE WHEN kid LIKE '%hs256%' THEN 'HS256' ELSE 'RS256' END;
```

**Expected:** ~80-95% HS256, ~5-20% RS256 (passive adoption)

---

## 🚀 **Phase 4: Enable Dual-Signing (T+0h)**

**Time:** 5 minutes  
**Action:** Enable RS256 generation alongside HS256 (both algorithms active)

### Step 1: Execute Phase 4 Migration

```bash
# Navigate to migration directory
cd ops/security/rs256

# Execute Phase 4 (enable dual-signing)
bash rs256-migrate.sh phase1

# Expected output:
# [INFO] Phase 4: Enable RS256 JWT generation
# [INFO] Dual-signing mode: JWKS now advertises both HS256 and RS256 keys
# [INFO] Auth service pods restarted (0/3 → 3/3 Running)
# [SUCCESS] Phase 4 activated
```

**Timestamp (Phase 4 start):** _________________ UTC

### Step 2: Immediate Validation (T+0h+2min)

```bash
# Verify JWKS shows both keys
curl http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | {kid, alg}'

# Expected output:
# {
#   "kid": "tfos_hs256_legacy",
#   "alg": "HS256"
# }
# {
#   "kid": "tfos_2025_kid1",
#   "alg": "RS256"
# }

# Verify auth pods running
kubectl get pods -l app=auth-service -n terrafusion

# Expected: All pods "Running", Age <5m
```

**JWKS validation:** ✅ PASS / ❌ FAIL  
**Pod health:** ✅ PASS / ❌ FAIL

### Step 3: Generate Test Tokens

```bash
# Request new token (should be RS256)
curl -X POST http://auth-service:8080/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  | jq -r '.access_token' | cut -d. -f1 | base64 -d | jq '.alg'

# Expected: "RS256"
```

**New tokens using RS256:** ✅ PASS / ❌ FAIL

---

## 📊 **T+1h Checkpoint: Adoption Trending**

**Time:** 2 minutes  
**Purpose:** Verify RS256 adoption climbing, no auth errors

### Adoption Query

```sql
-- RS256 adoption rate (last hour)
SELECT 
  CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END as algorithm,
  COUNT(*) as requests,
  ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 2) as percentage
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END
ORDER BY percentage DESC;
```

**Expected:** RS256 ≥40%, HS256 ≤60% (rapid adoption)

**T+1h Results:**

| Algorithm | Requests | Percentage | Status |
|-----------|----------|------------|--------|
| RS256 | _______ | _______% | ✅ / ❌ |
| HS256 | _______ | _______% | ✅ / ❌ |

### Error Rate Check

```sql
-- Auth errors (last hour)
SELECT 
  error_type,
  COUNT(*) as count
FROM auth_errors
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY error_type;
```

**Expected:** Total errors <10/hour

**T+1h Error Count:** _______ (Target: <10)  
**Status:** ✅ PASS / ❌ FAIL

---

## 📈 **T+2h Checkpoint: Majority Adoption**

**Time:** 2 minutes  
**Purpose:** Confirm RS256 is dominant algorithm

### Adoption Query (T+2h)

```sql
-- RS256 adoption rate (last 2 hours)
SELECT 
  CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END as algorithm,
  COUNT(*) as requests,
  ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 2) as percentage
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '2 hours'
GROUP BY CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END
ORDER BY percentage DESC;
```

**Expected:** RS256 ≥80%, HS256 ≤20%

**T+2h Results:**

| Algorithm | Requests | Percentage | Status |
|-----------|----------|------------|--------|
| RS256 | _______ | _______% | ✅ / ❌ |
| HS256 | _______ | _______% | ✅ / ❌ |

### System Health Check

```bash
# Check System RI (should be stable)
curl http://localhost:9091/metrics | grep terrafusion_ri_system

# Expected: ≥0.9390 (no degradation)
```

**System RI:** _______ (Target: ≥0.9390)  
**Status:** ✅ PASS / ❌ FAIL

### Grafana Snapshot

```powershell
# Capture T+2h state
pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T2h_compressed"
```

**Snapshot captured:** ✅ PASS / ❌ FAIL

---

## 🎯 **Phase 4 → Phase 5 Gate Decision (T+3h-4h)**

**Time:** 5 minutes  
**Purpose:** Determine if safe to disable HS256

### GO Criteria (All must pass)

1. **RS256 adoption ≥90%** — ✅ / ❌ (Actual: _______%)
2. **HS256 requests <10%** — ✅ / ❌ (Actual: _______%)
3. **Auth errors <5/hour** — ✅ / ❌ (Actual: _______)
4. **System RI ≥0.9390** — ✅ / ❌ (Actual: _______)
5. **No firing alerts** — ✅ / ❌
6. **Rollback verified** — ✅ / ❌ (Dry-run passed)

**Decision:** 

- [ ] **GO** — All 6 criteria pass, proceed to Phase 5
- [ ] **HOLD** — 1-2 criteria fail, extend observation +1-2h
- [ ] **NO-GO** — 3+ criteria fail, rollback Phase 4

**Approver Signature:** _______________  
**Timestamp:** _________________ UTC

---

## 🚀 **Phase 5: Disable HS256 (T+4h)**

**Time:** 5 minutes  
**Action:** Remove HS256 from JWKS, RS256-only mode

### Step 1: Execute Phase 5 Migration

```bash
# Execute Phase 5 (disable HS256)
bash rs256-migrate.sh phase2

# Expected output:
# [INFO] Phase 5: Disable HS256 JWT signing
# [INFO] RS256-only mode: JWKS now advertises single RS256 key
# [INFO] Auth service pods restarted (0/3 → 3/3 Running)
# [SUCCESS] Phase 5 activated
```

**Timestamp (Phase 5 start):** _________________ UTC

### Step 2: Immediate Validation (T+4h+2min)

```bash
# Verify JWKS shows only RS256 key
curl http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | {kid, alg}'

# Expected output (ONLY):
# {
#   "kid": "tfos_2025_kid1",
#   "alg": "RS256"
# }

# Verify auth pods running
kubectl get pods -l app=auth-service -n terrafusion
```

**JWKS RS256-only:** ✅ PASS / ❌ FAIL  
**Pod health:** ✅ PASS / ❌ FAIL

### Step 3: Test HS256 Rejection

```bash
# Attempt to use old HS256 token (should be rejected)
# (If you have a saved HS256 token, test it here)

# Expected: HTTP 401 "Unsupported algorithm" or "Invalid signature"
```

**HS256 tokens rejected:** ✅ PASS / ❌ FAIL

---

## 📊 **T+4h+30min: Post-Phase 5 Validation**

**Time:** 10 minutes  
**Purpose:** Confirm 100% RS256 adoption, zero HS256 traffic

### Phase 1: Immediate Validation (5 minutes)

```sql
-- Verify 100% RS256 adoption
SELECT 
  CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END as algorithm,
  COUNT(*) as requests,
  ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(), 2) as percentage
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '30 minutes'
GROUP BY CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END;
```

**Expected:** RS256 = 100%, HS256 = 0%

**T+4h+30min Results:**

| Algorithm | Requests | Percentage | Status |
|-----------|----------|------------|--------|
| RS256 | _______ | 100% | ✅ / ❌ |
| HS256 | _______ | 0% | ✅ / ❌ |

### Phase 2: System Health Check (3 minutes)

```bash
# System RI maintained
curl http://localhost:9091/metrics | grep terrafusion_ri_system

# Auth error rate
psql -d terrafusion_db -c "SELECT COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '30 minutes'"

# Active auth sessions
psql -d terrafusion_db -c "SELECT COUNT(*) FROM active_sessions WHERE created_at > NOW() - INTERVAL '30 minutes'"
```

**System RI:** _______ (Target: ≥0.9390)  
**Auth errors (30min):** _______ (Target: <5)  
**Active sessions:** _______ (Target: >0)

**Status:** ✅ PASS / ❌ FAIL

### Phase 3: Alert Status (2 minutes)

```bash
# Check for firing alerts
curl http://localhost:9093/api/v1/alerts | jq '.data[] | select(.state=="firing")'

# Expected: Empty array (no firing alerts)
```

**Firing alerts:** _______ (Target: 0)  
**Status:** ✅ PASS / ❌ FAIL

---

## 📸 **T+5h: Evidence Capture**

**Time:** 5 minutes  
**Purpose:** Create audit trail for compliance

### Grafana Snapshots

```powershell
# Capture final state
pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T5h_complete"
```

**Snapshots captured:** ✅ PASS / ❌ FAIL

### Adoption CSV Export

```sql
-- Export full adoption timeline
\COPY (
  SELECT 
    date_trunc('hour', created_at) as hour,
    CASE WHEN kid LIKE '%rs256%' OR kid LIKE '%2025%' THEN 'RS256' ELSE 'HS256' END as algorithm,
    COUNT(*) as requests
  FROM auth_audit
  WHERE created_at > NOW() - INTERVAL '6 hours'
  GROUP BY hour, algorithm
  ORDER BY hour, algorithm
) TO 'evidence/rs256_compressed/adoption_timeline.csv' CSV HEADER;
```

**CSV exported:** ✅ PASS / ❌ FAIL

### Git Tag Migration

```bash
# Tag completion in Git
git tag -a RS256_MIGRATION_COMPLETE -m "Compressed RS256 migration complete
Phase 4 start: [timestamp]
Phase 5 start: [timestamp]
Final adoption: 100% RS256
Duration: [X hours]
Status: SUCCESS"

git push origin RS256_MIGRATION_COMPLETE
```

**Git tag created:** ✅ PASS / ❌ FAIL

---

## 🔍 **T+6h: Final Sign-Off**

**Time:** 2 minutes  
**Purpose:** Document completion

### Migration Summary

**Total Duration:** _______ hours  
**Phase 4 Start:** _________________ UTC  
**Phase 5 Start:** _________________ UTC  
**Completion:** _________________ UTC

**Final Metrics:**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| RS256 Adoption | 100% | _______% | ✅ / ❌ |
| HS256 Traffic | 0% | _______% | ✅ / ❌ |
| System RI | ≥0.9390 | _______ | ✅ / ❌ |
| Auth Errors (6h) | <10 | _______ | ✅ / ❌ |
| Firing Alerts | 0 | _______ | ✅ / ❌ |

**Overall Status:** ✅ SUCCESS / ⚠️ PARTIAL / ❌ FAILURE

### Sign-Off

**SRE Lead:** _______________________  
**Date/Time:** _______________________

**Platform Lead:** _______________________  
**Date/Time:** _______________________

---

## 🛡️ **Rollback Procedures (If Needed)**

### Phase 5 Rollback (Re-enable HS256)

```bash
# Rollback to dual-signing mode
bash ops/recovery/rollback-latest.sh --component=rs256_phase5 --no-confirm

# Verify JWKS shows both keys again
curl http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | {kid, alg}'

# Expected: Both HS256 and RS256 keys
```

**Recovery time:** <2 minutes  
**Verification:** JWKS shows 2 keys, auth errors resolve

### Phase 4 Rollback (Revert to HS256-only)

```bash
# Complete rollback to HS256-only
bash ops/recovery/rollback-latest.sh --component=rs256_phase4 --no-confirm

# Verify JWKS shows only HS256 key
curl http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | {kid, alg}'

# Expected: Only HS256 key
```

**Recovery time:** <2 minutes  
**Verification:** JWKS shows 1 key (HS256), auth errors resolve

---

## 📚 **Evidence Package Location**

**All artifacts stored in:** `evidence/rs256_compressed/`

**Contents:**
- [ ] Grafana snapshots (T+0h, T+2h, T+5h)
- [ ] Adoption timeline CSV
- [ ] Validation query results (screenshots/exports)
- [ ] Git tags (RS256_MIGRATION_COMPLETE)
- [ ] This completed checklist (signed)

**Archive created:** ✅ PASS / ❌ FAIL

---

## 🎯 **Success Criteria Summary**

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

**Total Success Checks:** _______ / 10

---

## 🚀 **Next Steps After Completion**

1. **Update documentation** — Mark RS256 as production-ready in `SECURITY_AUDIT.md`
2. **Archive this checklist** — Store in `docs/governance/migration-logs/`
3. **Share with team** — Slack announcement with success metrics
4. **Schedule retrospective** — Within 24-48h, capture lessons learned
5. **Move to next priority** — F1/F4 observability instrumentation

---

**Checklist Version:** 1.0  
**Created:** October 8, 2025  
**Purpose:** Compressed RS256 migration for pre-production environment  
**Expected Duration:** 4-6 hours  
**Risk Level:** Minimal (zero paying clients, full rollback capability)

**Execution Status:** ⏳ PENDING / 🚀 IN PROGRESS / ✅ COMPLETE / ❌ ROLLED BACK

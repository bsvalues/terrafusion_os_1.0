# Phase 5 Post-Launch Validation (T+96h)

**Purpose:** Validate HS256 signing successfully disabled (RS256-only mode active)  
**Execute At:** T+96h+30min (October 10, 2025 — 07:12 UTC)  
**Duration:** ~10 minutes  
**Approver:** SRE On-Call

---

## 📋 Validation Overview

**Validation Phases:**
1. **Immediate (T+96h+5min):** Verify HS256 disabled, RS256-only active
2. **System Health (T+96h+10min):** Confirm no service degradation
3. **Legacy Client Detection (T+96h+30min):** Detect unexpected HS256 attempts

**Total Checks:** 10 (8 required PASS, 2 optional)

**Rollback Trigger:** 3+ checks fail → Execute immediate rollback

---

## ✅ Phase 1: Immediate Validation (T+96h+5min)

### Check 1: HS256 Signing Disabled

**Target:** `dual_sign_enabled = false`, `hs256_enabled = false`

**Command:**
```powershell
psql terrafusion_db -c "SELECT dual_sign_enabled, hs256_enabled, rs256_enabled FROM rs256_config WHERE active = true"
```

**Expected Output:**
```
dual_sign_enabled | hs256_enabled | rs256_enabled
------------------+---------------+---------------
f                 | f             | t
(1 row)
```

**Validation:**
- `dual_sign_enabled` = `f` (dual-sign mode OFF)
- `hs256_enabled` = `f` (HS256 signing DISABLED)
- `rs256_enabled` = `t` (RS256-only mode ACTIVE)

**Actual Result:**  
dual_sign: `______` | hs256: `______` | rs256: `______`

**Status:** ☐ PASS (f | f | t) | ☐ FAIL (any other combination)

---

### Check 2: JWKS Endpoint Updated (RS256-Only)

**Target:** JWKS contains only RS256 key, no HS256 key

**Command:**
```powershell
curl -s http://auth-service:8080/.well-known/jwks.json | jq '.keys[] | {kid, alg}'
```

**Expected Output:**
```json
{
  "kid": "tfos_2025_kid1",
  "alg": "RS256"
}
```

**Validation:**
- Only 1 key present (RS256)
- `alg` = `RS256`
- `kid` = `tfos_2025_kid1`
- No HS256 key

**Actual Result:**  
Keys found: `______`  
Algorithms: `______`

**Status:** ☐ PASS (1 RS256 key only) | ☐ FAIL (HS256 key still present)

---

### Check 3: Auth Service Restarted (Phase 5 Config)

**Target:** All auth service pods started within 5 minutes (no downtime)

**Command:**
```powershell
kubectl get pods -l app=auth-service -o json | jq '.items[] | {name: .metadata.name, started: .status.startTime, phase: .status.phase}'
```

**Expected Output:**
```json
{
  "name": "auth-service-abc123-xyz",
  "started": "2025-10-10T06:43:00Z",
  "phase": "Running"
}
```

**Validation:**
- All pods in `Running` state
- `startTime` within 5min of Phase 5 execution (T+96h)
- No pods in `CrashLoopBackOff` or `Error` state

**Actual Result:**  
Pods running: `______`  
Started at: `______`

**Status:** ☐ PASS (all running, <5min) | ☐ FAIL (pods crashing or delayed)

---

### Check 4: No Auth Errors Spike (Immediate Impact)

**Target:** <5 auth errors in last 5 minutes (no legacy client failures)

**Command:**
```powershell
psql terrafusion_db -c "SELECT COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '5 minutes'"
```

**Expected Output:**
```
count
-----
0
(1 row)
```

**Validation:**
- Error count <5
- No spike compared to baseline (T+95h: ~0 errors/5min)

**If errors >0, investigate types:**
```sql
SELECT error_type, error_message, COUNT(*) 
FROM auth_errors 
WHERE created_at > NOW() - INTERVAL '5 minutes'
GROUP BY error_type, error_message;
```

**Actual Result:**  
Errors (5min): `______`  
Error types: `______`

**Status:** ☐ PASS (<5 errors) | ☐ FAIL (≥5 errors)

---

## ✅ Phase 2: System Health Check (T+96h+10min)

### Check 5: System RI Maintained

**Target:** System RI ≥0.9390 (HS256 deprecation did not degrade reliability)

**Command:**
```powershell
curl -s http://localhost:9091/metrics | grep "terrafusion_ri_system "
```

**Expected Output:**
```
terrafusion_ri_system 0.9418
```

**Validation:**
- System RI ≥0.9390
- No drop >0.005 from T+95h baseline (expected: 0.9415)

**Actual Result:**  
Current RI: `______`  
Baseline (T+95h): `______`  
Delta: `______`

**Status:** ☐ PASS (≥0.9390, delta <0.005) | ☐ FAIL (<0.9390 or drop >0.005)

---

### Check 6: No New Firing Alerts

**Target:** 0 firing alerts (Phase 5 did not trigger alerts)

**Command:**
```powershell
curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing") | {alertname: .labels.alertname, severity: .labels.severity}'
```

**Expected Output:**
```json
(no output — 0 firing alerts)
```

**Validation:**
- Alert count = 0
- No critical or warning alerts

**If alerts firing:**
```powershell
# Get alert details
curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing")'
```

**Actual Result:**  
Firing alerts: `______`  
Alert names: `______`

**Status:** ☐ PASS (0 firing) | ☐ FAIL (>0 firing)

---

### Check 7: RS256 Token Generation Working

**Target:** New tokens signed with RS256, verifiable via JWKS

**Command:**
```powershell
# Generate test token
$token = Invoke-RestMethod -Uri http://auth-service:8080/auth/token -Method Post -Body @{client_id="test_client"; client_secret="test_secret"} | Select-Object -ExpandProperty access_token

# Decode header (base64)
$header = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($token.Split('.')[0]))
Write-Output $header
```

**Expected Output:**
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "tfos_2025_kid1"
}
```

**Validation:**
- `alg` = `RS256` (not HS256)
- `kid` = `tfos_2025_kid1`

**Actual Result:**  
Algorithm: `______`  
Key ID: `______`

**Status:** ☐ PASS (RS256, correct kid) | ☐ FAIL (HS256 or wrong kid)

---

### Check 8: HS256 Tokens Rejected (Backward Incompatibility Expected)

**Target:** Pre-existing HS256 tokens now rejected with HTTP 401 (expected behavior)

**Command:**
```powershell
# Test HS256 token (generated before Phase 5)
$hs256Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # (saved from Phase 4)

# Attempt verification
Invoke-RestMethod -Uri http://api-gateway:8080/api/properties -Headers @{Authorization="Bearer $hs256Token"} -ErrorAction SilentlyContinue
```

**Expected Output:**
```
HTTP 401 Unauthorized
{"error": "Token validation failed: Unsupported algorithm HS256"}
```

**Validation:**
- HTTP status = 401
- Error message mentions "Unsupported algorithm" or "HS256"

**⚠️ Note:** This is **expected behavior**. HS256 tokens are no longer valid.

**Actual Result:**  
HTTP status: `______`  
Error message: `______`

**Status:** ☐ PASS (401 error) | ☐ FAIL (200 success — HS256 still accepted!)

---

## ✅ Phase 3: Legacy Client Detection (T+96h+30min)

### Check 9: No HS256 Auth Attempts (All Clients Migrated)

**Target:** 0 HS256 authentication attempts in last 30 minutes

**Command:**
```powershell
psql terrafusion_db -c "SELECT COUNT(*) FROM auth_audit WHERE auth_method = 'HS256' AND created_at > NOW() - INTERVAL '30 minutes'"
```

**Expected Output:**
```
count
-----
0
(1 row)
```

**If HS256 attempts >0, identify clients:**
```sql
SELECT 
  client_id, 
  client_name, 
  contact_email,
  COUNT(*) as hs256_attempts
FROM auth_audit
WHERE auth_method = 'HS256'
  AND created_at > NOW() - INTERVAL '30 minutes'
GROUP BY client_id, client_name, contact_email
ORDER BY hs256_attempts DESC;
```

**Actual Result:**  
HS256 attempts (30min): `______`  
Legacy clients: `______`

**Status:** ☐ PASS (0 attempts) | ☐ WARN (>0 attempts — contact clients)

---

### Check 10: RS256 Token Verification Count Increasing

**Target:** RS256 verifications >0 in last 5 minutes (traffic flowing normally)

**Command:**
```powershell
psql terrafusion_db -c "SELECT COUNT(*) FROM auth_audit WHERE auth_method = 'RS256' AND created_at > NOW() - INTERVAL '5 minutes'"
```

**Expected Output:**
```
count
-----
182
(1 row)
```

**Validation:**
- RS256 count >0 (traffic exists)
- Count similar to pre-Phase 5 baseline (~180/5min)

**Actual Result:**  
RS256 verifications (5min): `______`  
Baseline (T+95h): `______`

**Status:** ☐ PASS (>0, similar to baseline) | ☐ WARN (0 verifications — traffic issue?)

---

## 📊 Validation Summary

| Check | Description | Target | Result | Status |
|-------|-------------|--------|--------|--------|
| 1 | HS256 signing disabled | f \| f \| t | ______ | ☐ PASS ☐ FAIL |
| 2 | JWKS RS256-only | 1 RS256 key | ______ | ☐ PASS ☐ FAIL |
| 3 | Auth service restarted | <5min | ______ | ☐ PASS ☐ FAIL |
| 4 | No auth errors spike | <5 errors | ______ | ☐ PASS ☐ FAIL |
| 5 | System RI maintained | ≥0.9390 | ______ | ☐ PASS ☐ FAIL |
| 6 | No new firing alerts | 0 firing | ______ | ☐ PASS ☐ FAIL |
| 7 | RS256 token generation | RS256 alg | ______ | ☐ PASS ☐ FAIL |
| 8 | HS256 tokens rejected | HTTP 401 | ______ | ☐ PASS ☐ FAIL |
| 9 | No HS256 attempts | 0 attempts | ______ | ☐ PASS ☐ WARN |
| 10 | RS256 traffic flowing | >0 verifications | ______ | ☐ PASS ☐ WARN |

**Required PASS:** Checks 1-8 (8/8)  
**Optional PASS:** Checks 9-10 (informational)

**Overall Status:**  
- ☐ **SUCCESS** (8/8 required checks passed)
- ☐ **PARTIAL** (6-7/8 checks passed, investigate failures)
- ☐ **FAILURE** (≤5/8 checks passed, rollback required)

---

## 🚨 Rollback Decision

**Rollback Trigger:** 3+ required checks fail (Checks 1-8)

**If 3+ checks fail:**

1. **Execute Immediate Rollback**
   ```bash
   bash ops/recovery/rollback-latest.sh --component=rs256_phase5 --no-confirm
   ```

2. **Expected Recovery Time:** <2 minutes

3. **Post-Rollback Actions:**
   - Document failure in `evidence/phase5/rollback_T96h.md`
   - Capture Grafana snapshot (rollback state)
   - Slack update: "#rs256-migration: Phase 5 rolled back due to [REASON]"
   - Schedule post-mortem within 4 hours
   - Notify stakeholders (email, PagerDuty if P1)

4. **Post-Rollback Validation (within 5min):**
   ```sql
   -- Verify dual-sign mode re-enabled
   SELECT dual_sign_enabled, hs256_enabled, rs256_enabled 
   FROM rs256_config 
   WHERE active = true;
   ```
   **Expected:** `t | t | t` (both HS256 + RS256 active)

5. **Root Cause Investigation:**
   - Why did HS256 deprecation fail?
   - Were legacy clients detected too late?
   - Was rollback readiness insufficient?

---

## 📸 Evidence Capture

**At T+96h+30min (after validation complete):**

1. **Grafana Snapshot #0018 (Post-Launch)**
   ```powershell
   pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T96h_post"
   ```
   - Snapshot IDs: `______________________________________`
   - Saved to: `evidence/phase5/grafana_T96h_post/`

2. **Validation Results Export**
   ```powershell
   # Export validation summary
   echo "Check,Target,Result,Status" > evidence/phase5/validation_T96h.csv
   echo "1,f|f|t,______,______" >> evidence/phase5/validation_T96h.csv
   # (repeat for all 10 checks)
   ```

3. **System RI Export**
   ```powershell
   curl -s http://localhost:9091/metrics | grep terrafusion_ri > evidence/phase5/system_ri_T96h_post.txt
   ```

4. **Auth Audit Export**
   ```powershell
   psql terrafusion_db -c "SELECT auth_method, COUNT(*) FROM auth_audit WHERE created_at > NOW() - INTERVAL '1 hour' GROUP BY auth_method" -o evidence/phase5/auth_methods_T96h_post.txt
   ```

5. **Alert Status**
   ```powershell
   curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing")' > evidence/phase5/alerts_T96h_post.json
   ```
   - Expected: Empty array (0 firing alerts)

---

## 🔄 Next Checkpoint

**T+100h (4 hours after Phase 5 launch):**

Re-run checks 9-10 to confirm:
- HS256 attempts remain 0
- RS256 adoption 100% sustained
- Auth errors <1/h

**Command:**
```powershell
# Quick health check
psql terrafusion_db -c "
SELECT 
  (SELECT COUNT(*) FROM auth_audit WHERE auth_method = 'HS256' AND created_at > NOW() - INTERVAL '1 hour') as hs256_count,
  (SELECT COUNT(*) FROM auth_audit WHERE auth_method = 'RS256' AND created_at > NOW() - INTERVAL '1 hour') as rs256_count,
  (SELECT COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '1 hour') as error_count;
"
```

**Expected:**
```
hs256_count | rs256_count | error_count
------------+-------------+------------
0           | 720         | 0
(1 row)
```

**Next Grafana Snapshot:** T+120h (24 hours after Phase 5)

---

## 📝 Sign-Off

**Post-Launch Validation Complete:**

| Role | Name | Signature | Timestamp |
|------|------|-----------|-----------|
| SRE On-Call | ______________ | ______________ | ______________ |

**Validation Result:** `_____ / 10` checks passed

**Overall Status:**
- ☐ **SUCCESS** (8/8 required → Phase 5 operational)
- ☐ **PARTIAL** (6-7/8 → investigate, monitor closely)
- ☐ **FAILURE** (≤5/8 → rollback executed)

**Next Action:**
- ☐ Continue monitoring (T+100h, T+120h checkpoints)
- ☐ Investigate partial failures (document findings)
- ☐ Post-rollback analysis (if rollback executed)

---

## 📚 Supporting Documentation

- **Pre-Gate Checklist:** `ops/launch/phase5_t96h/01_PRE_GATE_CHECKLIST.md`
- **GO/NO-GO Form:** `ops/launch/phase5_t96h/02_GO_NO_GO_FORM.md`
- **Rollback Procedure:** `ops/recovery/ROLLBACK_RUNBOOK.md` (Section 6: Phase 5 Rollback)
- **Phase 5 Execution:** `ops/security/rs256/rs256-migrate.sh phase2`
- **Evidence Archive:** `evidence/phase5/`

---

**Validation Complete:** ☐ Yes ☐ No  
**Evidence Captured:** ☐ Yes ☐ No  
**Next Checkpoint Scheduled:** ☐ Yes (T+100h) ☐ No

**Phase 5 Post-Launch Validation: Complete ✅**

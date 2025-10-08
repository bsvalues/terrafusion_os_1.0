# Phase 5 Pre-Gate Checklist (T+96h)

**Purpose:** Validate readiness to disable HS256 signing (RS256-only mode)  
**Execute At:** T+95h (October 10, 2025 — 05:42 UTC)  
**Duration:** ~15 minutes  
**Approvers:** SRE Lead + Platform Lead (both signatures required)

---

## 📋 Execution Summary

**Time Started:** `_______________`  
**Executed By:** `_______________`  
**Environment:** Production

| Check | Target | Result | Status |
|-------|--------|--------|--------|
| 1. RS256 Adoption (48h sustained) | ≥99% for ≥12h | ______% | ☐ PASS ☐ FAIL |
| 2. HS256 Auth Attempts (legacy clients) | 0 attempts/24h | ______ | ☐ PASS ☐ FAIL |
| 3. Auth Errors (migration stability) | <5 errors/24h | ______ | ☐ PASS ☐ FAIL |
| 4. System RI (maintained) | ≥0.9390 | ______ | ☐ PASS ☐ FAIL |
| 5. Rollback Readiness (HS256 re-enable) | 100% verified | ______% | ☐ PASS ☐ FAIL |

**Decision Criteria:**
- **5/5 checks PASS** → GO (proceed to Phase 5)
- **1 check FAIL** → HOLD (extend observation 12-24h, investigate failure)
- **2+ checks FAIL** → NO-GO (abort HS256 deprecation, maintain dual-sign indefinitely)

---

## ✅ Check 1: RS256 Adoption (48h Sustained)

**Target:** ≥99% RS256 adoption maintained for ≥12 consecutive hours

**Command:**
```powershell
# Query last 12h of adoption rates
psql terrafusion_db -c "
SELECT 
  timestamp, 
  adoption_rate,
  hs256_count,
  rs256_count
FROM rs256_adoption_hourly 
WHERE timestamp > NOW() - INTERVAL '12 hours'
ORDER BY timestamp ASC;
"
```

**Expected Output:**
```
timestamp            | adoption_rate | hs256_count | rs256_count
---------------------+---------------+-------------+-------------
2025-10-09 17:42:00 | 0.9910        | 18          | 1982
2025-10-09 18:42:00 | 0.9915        | 17          | 1983
2025-10-09 19:42:00 | 0.9920        | 16          | 1984
...
2025-10-10 05:42:00 | 0.9930        | 14          | 1986
(12 rows)
```

**Validation:**
- All 12 rows show `adoption_rate ≥ 0.9900`
- HS256 count declining or stable (legacy clients phasing out)
- RS256 count stable or increasing

**Actual Result:**  
Minimum adoption rate in last 12h: `_______%`  
HS256 clients remaining: `______`  
RS256 clients active: `______`

**Status:** ☐ PASS (≥99% for 12h) | ☐ FAIL (<99% or <12h sustained)

---

## ✅ Check 2: HS256 Auth Attempts (Legacy Client Detection)

**Target:** 0 HS256 authentication attempts in last 24h (all clients migrated)

**Command:**
```powershell
# Query auth attempts by algorithm
psql terrafusion_db -c "
SELECT 
  auth_method,
  COUNT(*) as attempt_count,
  COUNT(DISTINCT client_id) as unique_clients
FROM auth_audit
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY auth_method
ORDER BY auth_method;
"
```

**Expected Output:**
```
auth_method | attempt_count | unique_clients
------------+---------------+---------------
RS256       | 47856         | 1986
(1 row)
```

**If HS256 appears:**
```sql
-- Identify legacy clients
SELECT 
  client_id, 
  client_name,
  COUNT(*) as hs256_attempts,
  MAX(created_at) as last_attempt
FROM auth_audit
WHERE auth_method = 'HS256'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY client_id, client_name
ORDER BY hs256_attempts DESC;
```

**Actual Result:**  
HS256 attempts (24h): `______`  
Legacy clients identified: `______`  
Action required: ☐ None | ☐ Contact clients | ☐ NO-GO

**Status:** ☐ PASS (0 HS256 attempts) | ☐ FAIL (>0 HS256 attempts)

---

## ✅ Check 3: Auth Errors (Migration Stability)

**Target:** <5 authentication errors in last 24h (stable post-migration)

**Command:**
```powershell
# Query auth errors
psql terrafusion_db -c "
SELECT COUNT(*) as error_count
FROM auth_errors
WHERE created_at > NOW() - INTERVAL '24 hours';
"
```

**Expected Output:**
```
error_count
-----------
2
(1 row)
```

**If errors ≥5, investigate:**
```sql
SELECT 
  error_type,
  COUNT(*) as occurrence_count,
  STRING_AGG(DISTINCT error_message, '; ') as sample_messages
FROM auth_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY occurrence_count DESC;
```

**Actual Result:**  
Auth errors (24h): `______`  
Error types: `______________________________________`  
Root cause: `______________________________________`

**Status:** ☐ PASS (<5 errors) | ☐ FAIL (≥5 errors)

---

## ✅ Check 4: System RI (Maintained)

**Target:** System RI ≥0.9390 (RS256 migration did not degrade reliability)

**Command:**
```powershell
# Query current System RI
curl -s http://localhost:9091/metrics | grep "terrafusion_ri_system "
```

**Expected Output:**
```
terrafusion_ri_system 0.9415
```

**Validate trend (last 48h):**
```powershell
# Check RI stability (should be flat or increasing)
curl -s 'http://localhost:9090/api/v1/query_range?query=terrafusion_ri_system&start=2025-10-08T06:42:00Z&end=2025-10-10T06:42:00Z&step=1h' | jq '.data.result[0].values'
```

**Actual Result:**  
Current System RI: `______`  
48h RI trend: ☐ Stable | ☐ Increasing | ☐ Decreasing  
Minimum RI (48h): `______`

**Status:** ☐ PASS (≥0.9390) | ☐ FAIL (<0.9390)

---

## ✅ Check 5: Rollback Readiness (HS256 Re-Enable)

**Target:** 100% rollback readiness verified (can re-enable HS256 in <2min if needed)

**Command:**
```powershell
# Run rollback dry-run for HS256 re-enablement
pwsh ops/recovery/ROLLBACK_DRY_RUN.ps1 -Component "rs256_phase5"
```

**Expected Output:**
```
========================================
 Rollback Dry-Run Results
========================================
Component: RS256 Phase 5 (HS256 Re-Enable)
Backup Manifest: ops/security/rs256/rs256-dual-sign.backup.yaml
Checksum: 8a3f2e1d9c4b5a6e7f8g9h0i1j2k3l4m (VALID)

Validation Results:
✅ 01. Backup manifest exists
✅ 02. Backup manifest parseable (valid YAML)
✅ 03. Backup contains dual_sign_enabled: true
✅ 04. Backup contains hs256_enabled: true
✅ 05. Backup contains rs256_enabled: true
✅ 06. Auth service deployment manifest accessible
✅ 07. Database rollback script exists (rs256_phase5_rollback.sql)
✅ 08. Rollback can execute without approval gates
✅ 09. Auth service restart verified (kubectl rollout)
✅ 10. Post-rollback validation script exists

Overall: 10/10 checks passed
Rollback Readiness: 100%
Estimated Recovery Time: <120s
```

**Actual Result:**  
Checks passed: `_____ / 10`  
Rollback readiness: `______%`  
Estimated recovery time: `______s`

**Status:** ☐ PASS (100%, <2min) | ☐ FAIL (<100% or >2min)

---

## 📸 Evidence Capture

**At T+95h (after checklist complete):**

1. **Grafana Snapshot #0017 (Pre-Gate)**
   ```powershell
   pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T95h"
   ```
   - Snapshot IDs: `______________________________________`
   - Saved to: `evidence/phase5/grafana_T95h/`

2. **Adoption Trend Export**
   ```powershell
   psql terrafusion_db -c "SELECT * FROM rs256_adoption_hourly WHERE timestamp > NOW() - INTERVAL '48 hours' ORDER BY timestamp" -o evidence/phase5/adoption_48h_T95h.csv
   ```
   - CSV rows: `______` (expected: 48)
   - File size: `______ KB`

3. **Auth Audit Export**
   ```powershell
   psql terrafusion_db -c "SELECT auth_method, COUNT(*) FROM auth_audit WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY auth_method" -o evidence/phase5/auth_methods_T95h.txt
   ```
   - HS256 count: `______`
   - RS256 count: `______`

4. **System RI Export**
   ```powershell
   curl -s http://localhost:9091/metrics | grep terrafusion_ri > evidence/phase5/system_ri_T95h.txt
   ```
   - System RI: `______`

5. **Alert Status**
   ```powershell
   curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing")' > evidence/phase5/alerts_T95h.json
   ```
   - Firing alerts: `______` (expected: 0)

---

## 📝 Sign-Off

**Pre-Gate Validation Complete:**

| Role | Name | Signature | Timestamp |
|------|------|-----------|-----------|
| SRE On-Call | ______________ | ______________ | ______________ |
| Platform On-Call | ______________ | ______________ | ______________ |

**Checklist Result:** `_____ / 5` checks passed

**Recommendation:**
- ☐ **GO** (5/5 checks passed → proceed to Phase 5)
- ☐ **HOLD** (1 check failed → extend observation 12-24h, document failure)
- ☐ **NO-GO** (2+ checks failed → abort HS256 deprecation, maintain dual-sign)

**Handoff to:** SRE Lead + Platform Lead for GO/NO-GO decision

---

## 🚨 If Any Check Fails

**HOLD Criteria (1 check failed):**
- Document failure in `02_GO_NO_GO_FORM.md` (HOLD section)
- Investigate root cause (30min time-box)
- Extend observation period: T+108h (12h) or T+120h (24h)
- Re-run this checklist at extended gate time

**NO-GO Criteria (2+ checks failed):**
- **DO NOT** proceed to Phase 5
- Maintain dual-sign mode indefinitely (HS256 + RS256)
- Schedule post-mortem within 24h to analyze migration blockers
- Update migration strategy document

**Critical Failures (immediate escalation):**
- Check 2 FAIL + HS256 clients >10: Contact clients immediately, delay deprecation
- Check 3 FAIL + errors >20/24h: Potential regression, investigate auth service
- Check 4 FAIL + RI <0.9300: System degradation, consider Phase 4 rollback

---

## 📚 Supporting Documentation

- **Phase 5 Execution:** `ops/launch/phase5_t96h/README.md`
- **GO/NO-GO Decision:** `ops/launch/phase5_t96h/02_GO_NO_GO_FORM.md`
- **Rollback Procedure:** `ops/recovery/ROLLBACK_RUNBOOK.md` (Section 6: Phase 5 Rollback)
- **Phase 4 Evidence:** `evidence/phase4/` (adoption curve, RI stability)
- **Migration Strategy:** `ops/security/rs256/day9-rs256-migration.md`

---

**Checklist Complete:** ☐ Yes ☐ No  
**Evidence Captured:** ☐ Yes ☐ No  
**Handoff Complete:** ☐ Yes ☐ No

**Next Step:** Fill `02_GO_NO_GO_FORM.md` with checklist results

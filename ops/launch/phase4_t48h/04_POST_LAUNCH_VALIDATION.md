# Post-Launch Validation Sheet — Phase 4

**Execute:** After Phase 4 activation (T+48h + 30min)  
**Purpose:** Validate RS256 dual-sign mode activated successfully  
**Duration:** ~10 minutes  
**Validator:** SRE on-call

---

## 🎯 IMMEDIATE VALIDATION (T+48h + 5min)

**Execute within 5 minutes of Phase 4 activation**

### ✅ Check 1: RS256 Dual-Sign Mode Active

**Command:**
```powershell
# Verify RS256 config in database
psql terrafusion_db -t -c "
  SELECT dual_sign_enabled, hs256_enabled, rs256_enabled 
  FROM rs256_config 
  WHERE active = true
" | ForEach-Object { $_.Trim() }
```

**Expected Output:** `t | t | t` (dual-sign enabled, both HS256 and RS256 active)

**If not:** ❌ **ROLLBACK** — Phase 4 activation failed

**Result:** ____________ (fill in actual value)

---

### ✅ Check 2: JWKS Endpoint Updated

**Command:**
```powershell
# Verify JWKS contains RS256 key
curl.exe -s http://auth-service:8080/.well-known/jwks.json | ConvertFrom-Json | Select-Object -ExpandProperty keys | Where-Object { $_.use -eq "sig" -and $_.alg -eq "RS256" }
```

**Expected Output:** Key with `kid=tfos_2025_kid1`, `alg=RS256`, `use=sig`

**If not:** ❌ **ROLLBACK** — JWKS not updated

**Result:** ⬜ PASS / ⬜ FAIL

---

### ✅ Check 3: Auth Service Restarted

**Command:**
```powershell
# Check auth-service pods restarted recently
kubectl get pods -l app=auth-service -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.startTime}{"\n"}{end}'
```

**Expected Output:** All pods started within last 5 minutes

**If not:** ⚠️ **WARNING** — Auth service may not have picked up new config

**Result:** ____________ (fill in pod start times)

---

### ✅ Check 4: No Auth Errors Spike

**Command:**
```powershell
# Check auth errors in last 5 minutes
psql terrafusion_db -t -c "
  SELECT COUNT(*) 
  FROM auth_errors 
  WHERE created_at > NOW() - INTERVAL '5 minutes'
" | ForEach-Object { $_.Trim() }
```

**Expected Output:** `0` (or <5 errors)

**If ≥10:** ❌ **ROLLBACK** — Auth errors spiking

**Result:** ________ errors (fill in actual value)

---

### ✅ Check 5: RS256 Adoption Tracking Enabled

**Command:**
```powershell
# Verify adoption tracking started
psql terrafusion_db -t -c "
  SELECT COUNT(*) 
  FROM rs256_adoption_hourly 
  WHERE timestamp > NOW() - INTERVAL '10 minutes'
" | ForEach-Object { $_.Trim() }
```

**Expected Output:** `1` (or more recent rows)

**If 0:** ⚠️ **WARNING** — Adoption tracking not recording

**Result:** ________ rows (fill in actual value)

---

## 📊 SYSTEM HEALTH CHECK (T+48h + 10min)

**Execute 10 minutes after Phase 4 activation**

### ✅ Check 6: System RI Maintained

**Command:**
```powershell
# Check System RI hasn't dropped
$systemRi = curl.exe -s http://localhost:9091/metrics | Select-String "terrafusion_ri_system " | ForEach-Object { ($_ -split " ")[1] }
Write-Output "System RI: $systemRi"
[double]$systemRi -ge 0.9390
```

**Expected Output:** `System RI: 0.9410` → `True` (or higher)

**Target:** System RI should remain ≥0.9390 (may see slight lift +0.001 to +0.003)

**If <0.9390:** ❌ **ROLLBACK** — System RI degraded

**Result:** ________ (fill in actual value)

---

### ✅ Check 7: F2 Circuit Breaker Stable

**Command:**
```powershell
# Check F2 recovery time hasn't spiked
$f2Recovery = curl.exe -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,f2_recovery_seconds_bucket)" | ConvertFrom-Json | Select-Object -ExpandProperty data | Select-Object -ExpandProperty result | Select-Object -ExpandProperty value | Select-Object -Last 1
Write-Output "F2 Recovery (p95): $f2Recovery seconds"
[double]$f2Recovery -le 65
```

**Expected Output:** `F2 Recovery (p95): 54.5 seconds` → `True`

**Target:** ≤65s (allow 5s margin for jitter)

**If >65s:** ⚠️ **WARNING** — F2 recovery degraded, monitor closely

**Result:** ________ seconds (fill in actual value)

---

### ✅ Check 8: No New Firing Alerts

**Command:**
```powershell
# Check no new alerts fired
$firingAlerts = curl.exe -s http://localhost:9090/api/v1/alerts | Select-String '"state":"firing"' | Measure-Object | Select-Object -ExpandProperty Count
Write-Output "Firing Alerts: $firingAlerts"
$firingAlerts -eq 0
```

**Expected Output:** `Firing Alerts: 0` → `True`

**If >0:** ⚠️ **WARNING** — New alerts firing, investigate

**Result:** ________ firing (fill in actual value)

---

### ✅ Check 9: RS256 Token Verification Working

**Command:**
```powershell
# Test RS256 token verification
$testToken = curl.exe -s -X POST http://auth-service:8080/auth/token `
    -H "Content-Type: application/json" `
    -d '{"username":"test_user","password":"test_pass"}'

# Verify token signed with RS256
$tokenHeader = ($testToken | ConvertFrom-Json).access_token -split '\.' | Select-Object -First 1
$decodedHeader = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($tokenHeader + "=="))
$decodedHeader | ConvertFrom-Json | Select-Object -ExpandProperty alg
```

**Expected Output:** `RS256`

**If not RS256:** ❌ **ROLLBACK** — Tokens not being signed with RS256

**Result:** ____________ (fill in actual algorithm)

---

### ✅ Check 10: HS256 Backward Compatibility

**Command:**
```powershell
# Verify HS256 tokens still accepted (backward compatibility)
# (This requires a pre-existing HS256 token from T+47h)
$hs256Token = Get-Content "ops/evidence/T+48h_gate/test_hs256_token.txt"

curl.exe -s -X GET http://api-gateway:8080/protected `
    -H "Authorization: Bearer $hs256Token" `
    -w "%{http_code}"
```

**Expected Output:** `200` (HS256 tokens still accepted)

**If 401:** ❌ **ROLLBACK** — Backward compatibility broken

**Result:** HTTP ________ (fill in status code)

---

## 📈 ADOPTION MONITORING (T+48h + 30min)

**Execute 30 minutes after Phase 4 activation**

### ✅ Check 11: RS256 Adoption Increasing

**Command:**
```powershell
# Check adoption increased since T+48h
$adoptionT48 = psql terrafusion_db -t -c "
  SELECT adoption_rate 
  FROM rs256_adoption_hourly 
  WHERE timestamp <= NOW() - INTERVAL '30 minutes'
  ORDER BY timestamp DESC 
  LIMIT 1
" | ForEach-Object { $_.Trim() }

$adoptionNow = psql terrafusion_db -t -c "
  SELECT adoption_rate 
  FROM rs256_adoption_hourly 
  ORDER BY timestamp DESC 
  LIMIT 1
" | ForEach-Object { $_.Trim() }

Write-Output "Adoption T+48h: $adoptionT48%"
Write-Output "Adoption Now: $adoptionNow%"
Write-Output "Delta: $([double]$adoptionNow - [double]$adoptionT48)%"
```

**Expected Output:** Delta ≥0% (adoption maintained or increased)

**If <0%:** ⚠️ **WARNING** — Adoption decreasing, investigate client issues

**Result:** Delta = ________% (fill in actual value)

---

### ✅ Check 12: New Clients Using RS256

**Command:**
```powershell
# Check new authentications using RS256
psql terrafusion_db -t -c "
  SELECT 
    COUNT(*) FILTER (WHERE auth_method = 'RS256') AS rs256_count,
    COUNT(*) FILTER (WHERE auth_method = 'HS256') AS hs256_count,
    COUNT(*) AS total_count
  FROM auth_audit 
  WHERE created_at > NOW() - INTERVAL '30 minutes'
"
```

**Expected Output:** `rs256_count > hs256_count` (more RS256 than HS256)

**If not:** ⚠️ **WARNING** — New clients not adopting RS256

**Result:** RS256: ________, HS256: ________, Total: ________ (fill in)

---

## 🎯 VALIDATION SUMMARY

**Post-Launch Validation Status:**

| Check | Status | Notes |
|-------|--------|-------|
| 1. Dual-sign active | ⬜ PASS / ⬜ FAIL | ____________ |
| 2. JWKS updated | ⬜ PASS / ⬜ FAIL | ____________ |
| 3. Auth service restarted | ⬜ PASS / ⬜ FAIL | ____________ |
| 4. No auth errors spike | ⬜ PASS / ⬜ FAIL | ____________ |
| 5. Adoption tracking | ⬜ PASS / ⬜ FAIL | ____________ |
| 6. System RI maintained | ⬜ PASS / ⬜ FAIL | ____________ |
| 7. F2 stable | ⬜ PASS / ⬜ FAIL | ____________ |
| 8. No new alerts | ⬜ PASS / ⬜ FAIL | ____________ |
| 9. RS256 verification | ⬜ PASS / ⬜ FAIL | ____________ |
| 10. HS256 compatibility | ⬜ PASS / ⬜ FAIL | ____________ |
| 11. Adoption increasing | ⬜ PASS / ⬜ FAIL | ____________ |
| 12. New clients RS256 | ⬜ PASS / ⬜ FAIL | ____________ |

**Overall Status:** ______/12 checks passed

---

## 🚨 ROLLBACK DECISION

**If 3+ checks fail:** ❌ **IMMEDIATE ROLLBACK REQUIRED**

**Rollback Command:**
```powershell
# Execute immediate rollback
bash ops/recovery/rollback-latest.sh --component=rs256 --no-confirm

# Verify rollback succeeded
psql terrafusion_db -t -c "SELECT dual_sign_enabled FROM rs256_config WHERE active = true"
# Expected: 'f' (dual-sign disabled)
```

**Post-Rollback Actions:**
1. Document failure in incident report
2. Update Slack `#terrafusion-incidents`
3. Schedule post-mortem within 4 hours
4. Notify stakeholders (SRE Lead + Platform Lead)

---

## 📸 CAPTURE EVIDENCE

**After validation complete:**

```powershell
# Capture Grafana snapshot (T+48h + 30min)
pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T48h_post"

# Export validation results
$validationResults = @{
    timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    checks_passed = "___/12"
    system_ri = "___"
    f2_recovery = "___"
    adoption_delta = "___"
    overall_status = "PASS/FAIL"
} | ConvertTo-Json

$validationResults > ops/evidence/T+48h_gate/post_launch_validation.json
```

---

## 📊 NEXT MONITORING CHECKPOINT

**At T+52h (4 hours after launch):**

1. Re-run adoption query (expect 97% adoption)
2. Check auth error rate (expect <5 errors/4h)
3. Verify System RI stable (≥0.9390)
4. Export Grafana snapshot (T+52h)

**See:** `ops/runbooks/PHASE4_INIT.md` for full 48h monitoring plan

---

## ✅ VALIDATION COMPLETE

**Validated by:**

| Role | Name | Signature | Timestamp |
|------|------|-----------|-----------|
| SRE On-Call | _____________ | _____________ | ________ |

**Status:** ⬜ PASS (proceed with Phase 4) / ⬜ FAIL (rollback executed)

**Next Actions:**

```
1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________
```

---

**Sheet Version:** 1.0  
**Last Updated:** October 7, 2025 — T+36h  
**References:**
- `ops/runbooks/PHASE4_INIT.md` (full Phase 4 runbook)
- `ops/recovery/rollback-latest.sh` (rollback procedure)

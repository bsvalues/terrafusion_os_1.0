# County Data Isolation Breach Attempt Runbook

> **Classification:** Government Operations — SECURITY INCIDENT  
> **Alert:** `CountyDataIsolationBreachAttempt`  
> **Severity:** Critical  
> **Last Reviewed:** 2026-02-14

---

## Alert Details

**Trigger:** `rate(county_isolation_violations_total[1m]) > 0`

**Meaning:** An attempt to access another county's data was detected and **blocked**. Zero tolerance policy.

**SLO Impact:** SLO-010 (County Isolation Violation Rate = 0)

**Compliance:** FISMA-HIGH, County Sovereignty Model, NIST 800-53 AC-4 (Information Flow Enforcement)

---

## Immediate Actions

**⚠️ SECURITY INCIDENT:** Any isolation breach is a **critical security event**.

1. **Identify the source**
   ```bash
   # Check violation logs
   kubectl logs -n terrafusion -l app=terrafusion-api | grep "IsolationViolation"
   
   # Last 10 violations
   kubectl exec -n terrafusion deployment/postgres -- psql -U terrafusion -c "SELECT * FROM security_events WHERE event_type='IsolationViolation' ORDER BY created_at DESC LIMIT 10;"
   ```

2. **Verify RLS policies active**
   ```bash
   # Check Row-Level Security status
   kubectl exec -n terrafusion deployment/postgres -- psql -U postgres -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename IN ('properties', 'assessments', 'tax_levies');"
   
   # All should return 't' (true)
   ```

3. **Check affected counties**
   ```bash
   # Group violations by source county
   kubectl exec -n terrafusion deployment/postgres -- psql -U terrafusion -c "SELECT source_county_id, target_county_id, COUNT(*) FROM security_events WHERE event_type='IsolationViolation' AND created_at > NOW() - INTERVAL '1 hour' GROUP BY source_county_id, target_county_id;"
   ```

---

## Common Causes

| Cause | Symptoms | Resolution |
|-------|----------|------------|
| **RLS policy disabled** | Multiple violations across counties | Re-enable RLS immediately |
| **Admin user bypass** | User with BYPASSRLS role | Revoke BYPASSRLS, restrict to DBA only |
| **Code regression** | Direct SQL without county filter | Identify + revert code change |
| **API misconfiguration** | Missing X-TerraFusion-County-ID header | Fix Gateway config |

---

## Mitigation Steps

### 1. Verify RLS Active (HIGHEST PRIORITY)
```bash
# Enable RLS on all county-scoped tables
kubectl exec -n terrafusion deployment/postgres -- psql -U postgres <<EOF
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_levies ENABLE ROW LEVEL SECURITY;
EOF
```

### 2. Identify Source
```bash
# Get violation details
kubectl exec -n terrafusion deployment/postgres -- psql -U terrafusion -c "SELECT user_id, source_county_id, target_county_id, endpoint, ip_address FROM security_events WHERE event_type='IsolationViolation' ORDER BY created_at DESC LIMIT 1;"
```

### 3. Block User (if malicious)
```bash
# Suspend user account
kubectl exec -n terrafusion deployment/postgres -- psql -U terrafusion -c "UPDATE users SET is_active = false WHERE id = '<user_id>';"

# Revoke access tokens
kubectl exec -n terrafusion deployment/redis -- redis-cli DEL "user:<user_id>:tokens"
```

### 4. Review Recent Code Changes
```bash
# Check if code deployment triggered violations
kubectl rollout history deployment/terrafusion-api -n terrafusion

# Rollback if violations started after deploy
kubectl rollout undo deployment/terrafusion-api -n terrafusion
```

---

## Investigation

**Violation Classification:**
- **Intentional Malicious:** User deliberately attempting cross-county access → **immediate suspension + incident report**
- **Code Regression:** New code bypassing county filter → **rollback + fix**
- **Misconfiguration:** Admin accidentally disabled RLS → **re-enable + audit**

**Audit Trail Requirements:**
- Exact timestamp of violation
- Source user + county
- Target county
- Query/endpoint attempted
- Whether data was actually exposed (should be NO — RLS blocks)

---

## Escalation

**Severity:** Critical → **Immediate escalation** (security incident)

**Escalation Path:**
1. On-call security engineer (PagerDuty) — **immediately**
2. Platform lead — within 5 minutes
3. County coordinator (affected counties) — within 15 minutes
4. Legal/compliance — within 30 minutes (if data exposed)

**Regulatory Requirement:**  
- FISMA-HIGH incident reporting (within 1 hour)
- County notification (if data accessed)
- Law enforcement (if criminal intent)

---

## Post-Incident

**MANDATORY:**
- [ ] File security incident report (FISMA-HIGH requirement)
- [ ] Determine if data was actually accessed (should be NO)
- [ ] Notify affected county coordinators
- [ ] Review county isolation gate: `county-isolation-gate.mjs`
- [ ] Schedule security audit

**Evidence Collection:**
- Violation logs (full query text)
- User identity + session metadata
- Source IP + geolocation
- Timeline of access attempts
- Confirmation that RLS blocked access

**Preventive Actions:**
- Run `county-isolation-gate.mjs` to prevent future regressions
- Review RBAC policies
- Consider additional monitoring (honeypot queries)

---

*Government. Transcended. Isolated.*

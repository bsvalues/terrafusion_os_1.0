# Phase 5 GO/NO-GO Decision Form (T+96h)

**Purpose:** Document decision to disable HS256 signing (RS256-only mode)  
**Execute At:** T+96h (October 10, 2025 — 06:42 UTC)  
**Duration:** ~5 minutes  
**Approvers:** SRE Lead + Platform Lead (both signatures required for GO)

---

## 📊 Pre-Gate Validation Results

**Checklist Executed By:** `_______________`  
**Checklist Timestamp:** `_______________`  
**Environment:** Production

| # | Criterion | Target | Actual Value | Status |
|---|-----------|--------|--------------|--------|
| 1 | RS256 Adoption (48h sustained) | ≥99% for ≥12h | ______% | ☐ PASS ☐ FAIL |
| 2 | HS256 Auth Attempts | 0/24h | ______ | ☐ PASS ☐ FAIL |
| 3 | Auth Errors | <5/24h | ______ | ☐ PASS ☐ FAIL |
| 4 | System RI | ≥0.9390 | ______ | ☐ PASS ☐ FAIL |
| 5 | Rollback Readiness | 100% | ______% | ☐ PASS ☐ FAIL |

**Overall Result:** `_____ / 5` checks passed

---

## ✅ GO PATH (5/5 checks passed)

**Decision:** Proceed to Phase 5 (disable HS256 signing)

### Next Actions

1. **Execute Phase 5 Migration** (T+96h, 2 minutes)
   ```bash
   bash ops/security/rs256/rs256-migrate.sh phase2
   ```

   **Expected Output:**
   - ✅ HS256 signing disabled
   - ✅ RS256-only mode activated
   - ✅ JWKS endpoint updated (RS256 key only)
   - ✅ Auth service restarted (0 downtime)
   - ✅ Migration logged in `rs256_config` table

2. **Verify Migration** (T+96h+5min)
   ```powershell
   # Confirm RS256-only mode
   psql terrafusion_db -c "SELECT dual_sign_enabled, hs256_enabled, rs256_enabled FROM rs256_config WHERE active = true"
   ```
   **Expected:** `f | f | t` (dual-sign off, HS256 off, RS256 on)

3. **Monitor Auth Errors** (T+96h → T+96h+30min)
   ```powershell
   # Watch for legacy client failures
   watch -n 60 'psql terrafusion_db -c "SELECT COUNT(*) FROM auth_errors WHERE created_at > NOW() - INTERVAL '\''5 minutes'\''"'
   ```
   **Expected:** 0 errors/5min (all clients migrated)

4. **Capture Evidence** (T+96h+30min)
   ```powershell
   pwsh ops/scripts/capture_grafana_snapshots.ps1 -Checkpoint "T96h_post"
   ```
   **Snapshot ID:** #0018

### Expected Trajectory (T+96h → T+144h)

| Time | RS256 Adoption | HS256 Auth Attempts | Auth Errors | System RI |
|------|----------------|---------------------|-------------|-----------|
| T+96h (baseline) | 99.3% | 0/h | 0/h | 0.9415 |
| T+100h (+4h) | 100% | 0/h | 0/h | 0.9417 |
| T+108h (+12h) | 100% | 0/h | 0/h | 0.9420 |
| T+120h (+24h) | 100% | 0/h | 0/h | 0.9422 |
| T+144h (+48h) | 100% | 0/h | 0/h | 0.9425 |

**Projection:** RS256 adoption reaches 100% within 4h (all clients fully migrated)

### Rollback Window

**Duration:** 24 hours (T+96h → T+120h)  
**After 24h:** HS256 keys rotated, rollback becomes disruptive (requires client coordination)

**Rollback Trigger (within 24h):**
- Auth errors >10/h (legacy client failures)
- HS256 auth attempts >50/h (unexpected legacy traffic)
- System RI <0.9300 (service degradation)

**Rollback Command:**
```bash
bash ops/recovery/rollback-latest.sh --component=rs256_phase5 --no-confirm
```

**Recovery Time:** <2 minutes (verified)

### Approvals (Both Required)

| Role | Name | Signature | Timestamp |
|------|------|-----------|-----------|
| **SRE Lead** | ______________ | ______________ | ______________ |
| **Platform Lead** | ______________ | ______________ | ______________ |

**GO Decision Confirmed:** ☐ Yes (both signatures obtained)

---

## ⏸️ HOLD PATH (1 check failed)

**Decision:** Extend observation period, do not proceed to Phase 5 yet

### Failed Criteria

**Which check failed?** ☐ Check 1 | ☐ Check 2 | ☐ Check 3 | ☐ Check 4 | ☐ Check 5

**Failure Details:**
```
Check #: ______
Target: ____________
Actual: ____________
Gap: ____________
```

### Root Cause Analysis

**Symptom:** `______________________________________`  
**Root Cause:** `______________________________________`  
**Impact:** ☐ LOW | ☐ MEDIUM | ☐ HIGH  
**Affected Systems:** `______________________________________`

### Mitigation Plan

**Action 1:** `______________________________________`  
**Owner:** `______________________________________`  
**ETA:** `______________________________________`

**Action 2:** `______________________________________`  
**Owner:** `______________________________________`  
**ETA:** `______________________________________`

### Extended Gate Time

**Original Gate:** T+96h (October 10, 2025 — 06:42 UTC)  
**Extended Gate:** ☐ T+108h (+12h) | ☐ T+120h (+24h) | ☐ T+144h (+48h)  
**Reason for Extension:** `______________________________________`

**Re-Evaluation Criteria:**
- ☐ Failed check now passes
- ☐ Adoption curve stabilizes at ≥99%
- ☐ Legacy clients identified and contacted
- ☐ Auth errors <5/24h sustained for 12h

**Next Steps:**
1. Document failure in `evidence/phase5/hold_T96h.md`
2. Notify stakeholders via Slack (#rs256-migration)
3. Re-run `01_PRE_GATE_CHECKLIST.md` at extended gate time
4. Update mission brief with new timeline

### Approval (One Required)

| Role | Name | Signature | Timestamp |
|------|------|-----------|-----------|
| **SRE Lead** | ______________ | ______________ | ______________ |
| **Platform Lead** | ______________ | ______________ | ______________ |

**HOLD Decision Confirmed:** ☐ Yes (one signature obtained)

---

## ❌ NO-GO PATH (2+ checks failed)

**Decision:** Abort HS256 deprecation, maintain dual-sign mode indefinitely

### Failed Criteria

**Which checks failed?**  
☐ Check 1 (RS256 adoption)  
☐ Check 2 (HS256 auth attempts)  
☐ Check 3 (Auth errors)  
☐ Check 4 (System RI)  
☐ Check 5 (Rollback readiness)

**Failure Summary:**
```
Failed checks: _____ / 5
Critical gaps: ______________________________________
System health: ☐ STABLE | ☐ DEGRADED | ☐ CRITICAL
```

### Root Cause Analysis

**Primary Cause:** `______________________________________`  
**Contributing Factors:** `______________________________________`  
**Evidence:** `______________________________________`

**Why RS256-Only Mode Is Not Safe:**
- [ ] Legacy clients still active (>0 HS256 attempts/24h)
- [ ] RS256 adoption plateau (<99%)
- [ ] Auth service instability (errors >5/24h)
- [ ] System RI degradation (<0.9390)
- [ ] Rollback not verified (<100% readiness)

### Immediate Actions

1. **Maintain Dual-Sign Mode**
   - HS256 + RS256 both enabled indefinitely
   - No deprecation timeline set
   - Monitor adoption monthly (not hourly)

2. **Identify Legacy Clients** (if Check 2 failed)
   ```sql
   SELECT 
     client_id, 
     client_name, 
     contact_email,
     COUNT(*) as hs256_attempts
   FROM auth_audit
   WHERE auth_method = 'HS256'
     AND created_at > NOW() - INTERVAL '7 days'
   GROUP BY client_id, client_name, contact_email
   ORDER BY hs256_attempts DESC;
   ```
   **Action:** Contact clients, coordinate migration, set new Phase 5 target date

3. **Investigate Auth Errors** (if Check 3 failed)
   - Export error logs: `evidence/phase5/auth_errors_investigation.log`
   - Analyze error types: Token expiration? Signature validation? Key mismatch?
   - Fix root cause before attempting Phase 5 again

4. **System Health Recovery** (if Check 4 failed)
   - Consider Phase 4 rollback (return to HS256-only)
   - Analyze RI degradation: F1/F2/F4 component breakdown
   - Restore baseline RI before migration retry

### Post-Mortem Schedule

**Incident Timeline:** Within 4 hours of NO-GO decision  
**Post-Mortem Meeting:** Within 24 hours (invite: SRE, Platform, Security teams)  
**Root Cause Analysis:** Within 48 hours (written report)  
**Migration Strategy Update:** Within 1 week (revised approach)

**Post-Mortem Template:** `docs/incident-reports/phase5_no_go_YYYYMMDD.md`

### Stakeholder Notification

**Slack Channels:**
- #rs256-migration: "Phase 5 NO-GO: HS256 deprecation aborted. Maintaining dual-sign."
- #incidents: "P2 incident: RS256 migration Phase 5 blocked. Post-mortem scheduled."
- #leadership: "RS256 migration Phase 5 aborted. No customer impact. Investigation underway."

**Email:**
- To: Engineering Leadership, Security Team, SRE Team
- Subject: "RS256 Migration Phase 5 NO-GO Decision"
- Body: Link to this form + root cause summary + next steps

### Approval (One Required)

| Role | Name | Signature | Timestamp |
|------|------|-----------|-----------|
| **SRE Lead** | ______________ | ______________ | ______________ |
| **Platform Lead** | ______________ | ______________ | ______________ |

**NO-GO Decision Confirmed:** ☐ Yes (one signature obtained)

---

## 📈 Confidence Assessment

**Historical Context:**

| Gate | Date | Adoption | Decision | Outcome |
|------|------|----------|----------|---------|
| Phase 3 → Phase 4 | T+48h | 98% | GO | ✅ Success (0 incidents) |
| Phase 4 → Phase 5 | T+96h | ____% | ______ | (current gate) |

**Phase 5 Gate Pass Probability (Based on T+84h Trends):**

- **IF** RS256 adoption ≥99.5% at T+84h → **>99% confidence** (virtually certain GO)
- **IF** RS256 adoption 99.0-99.5% at T+84h → **~95% confidence** (likely GO)
- **IF** RS256 adoption 98.0-99.0% at T+84h → **~75% confidence** (possible HOLD)
- **IF** RS256 adoption <98.0% at T+84h → **<50% confidence** (likely NO-GO)

**Current Projection (as of T+84h):**  
RS256 adoption: `______%`  
Predicted outcome: ☐ GO | ☐ HOLD | ☐ NO-GO  
Confidence level: `______%`

---

## 📸 Evidence Trail

**Required Artifacts (9 total):**

1. ☐ Pre-gate checklist (`01_PRE_GATE_CHECKLIST.md` — signed)
2. ☐ Grafana snapshot T+95h (`evidence/phase5/grafana_T95h/`) — 5 dashboards
3. ☐ Adoption trend 48h CSV (`evidence/phase5/adoption_48h_T95h.csv`) — 48 rows
4. ☐ Auth methods export (`evidence/phase5/auth_methods_T95h.txt`) — HS256=0, RS256>0
5. ☐ System RI export (`evidence/phase5/system_ri_T95h.txt`) — ≥0.9390
6. ☐ Alert status JSON (`evidence/phase5/alerts_T95h.json`) — 0 firing
7. ☐ Rollback dry-run output (`evidence/phase5/rollback_dryrun_T95h.txt`) — 10/10 passed
8. ☐ GO/NO-GO form (`02_GO_NO_GO_FORM.md` — this file, signed)
9. ☐ Post-launch snapshot T+96h+30min (`evidence/phase5/grafana_T96h_post/`) — 5 dashboards

**Evidence Package:**
```powershell
# Create evidence archive
cd evidence/phase5
tar -czf phase5_evidence_T96h.tar.gz grafana_T95h/ grafana_T96h_post/ *.csv *.txt *.json ../../ops/launch/phase5_t96h/*.md
```

**Archive Checksum:**  
`______________________________________`

---

## 📞 Escalation Paths

**If decision is unclear or contentious:**

| Priority | Contact | Responsibility | Response SLA |
|----------|---------|----------------|--------------|
| **P0** | CTO | Final authority on GO/NO-GO | Immediate (phone) |
| **P1** | SRE Lead | Technical risk assessment | <15 minutes (Slack) |
| **P2** | Platform Lead | Business impact analysis | <1 hour (Slack/email) |
| **P3** | Security Lead | Compliance/audit concerns | <4 hours (email) |

**Communication Channels:**
- **Slack:** #rs256-migration (real-time updates), #incidents (P1/P0 alerts), #leadership (executive summary)
- **PagerDuty:** Page SRE on-call (P0/P1 only)
- **Email:** Engineering leadership (post-decision summary within 1h)

---

## 📝 Decision Recorded

**Final Decision:** ☐ GO | ☐ HOLD | ☐ NO-GO

**Decision Timestamp:** `_______________`

**Rationale (1-2 sentences):**
```
______________________________________________________________________
______________________________________________________________________
```

**Next Steps:**
```
1. ______________________________________________________________________
2. ______________________________________________________________________
3. ______________________________________________________________________
```

**Handoff To:** `______________________________________`  
**Expected Completion:** `______________________________________`

---

## 🔄 Post-Decision Actions

### If GO:
1. ☐ Execute `rs256-migrate.sh phase2` (2min)
2. ☐ Run `04_POST_LAUNCH_VALIDATION.md` (T+96h+30min)
3. ☐ Capture Grafana snapshot #0018
4. ☐ Tag decision in Git: `T96H_GO_DECISION`
5. ☐ Update Slack: "#rs256-migration: Phase 5 GO — HS256 signing disabled"
6. ☐ Schedule Phase 6 gate (T+144h, HS256 key rotation)

### If HOLD:
1. ☐ Document failure in `evidence/phase5/hold_T96h.md`
2. ☐ Set extended gate time (T+108h, T+120h, or T+144h)
3. ☐ Create mitigation plan with owners and ETAs
4. ☐ Notify stakeholders (Slack #rs256-migration)
5. ☐ Re-run `01_PRE_GATE_CHECKLIST.md` at extended gate

### If NO-GO:
1. ☐ Schedule post-mortem (within 24h)
2. ☐ Notify stakeholders (Slack, email, PagerDuty if P1)
3. ☐ Create incident report (`docs/incident-reports/phase5_no_go_YYYYMMDD.md`)
4. ☐ Update migration strategy document (revise approach)
5. ☐ Maintain dual-sign mode indefinitely (monitor monthly)
6. ☐ Contact legacy clients (if HS256 traffic detected)

---

**Form Complete:** ☐ Yes ☐ No  
**Signatures Obtained:** ☐ Yes ☐ No  
**Evidence Archived:** ☐ Yes ☐ No

**Next Document:** `04_POST_LAUNCH_VALIDATION.md` (if GO)

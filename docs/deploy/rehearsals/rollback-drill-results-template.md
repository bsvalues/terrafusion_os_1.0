# Rollback Drill Results — [Date] — [Environment]

> **Classification:** Government Operations — FISMA-HIGH  
> **Drill Scenario:** [e.g., Elevated API error rate >5%]  
> **Environment:** [Staging / Production]  
> **Trigger Method:** [Synthetic error injection / Feature flag / Canary shift]  
> **Drill Lead:** [Name]  
> **Observers:** [Names]  
> **Execution Date:** [YYYY-MM-DD]  
> **Status:** ⏳ Pending Execution

---

## Timing Results

| Metric | Target | Actual | Status | Notes |
|--------|--------|--------|--------|-------|
| **Detection Time** (T_detection - T_trigger) | <1 min | ___ min | ⏳ | Alert fired and PagerDuty page sent |
| **Decision Time** (T_decision - T_detection) | <2 min | ___ min | ⏳ | On-call acknowledged and decided to rollback |
| **Rollback Execution** (T_rollback_complete - T_decision) | <5 min | ___ min | ⏳ | Rollback command executed and pods ready |
| **Time to Recovery (TTR)** (T_recovery - T_trigger) | <15 min (RTO) | ___ min | ⏳ | Full service recovery validated |
| **Data Loss** | 0 (RPO) | ___ records | ⏳ | Audit log count verified |

**Timestamps:**
- T_trigger: [HH:MM:SS UTC]
- T_detection: [HH:MM:SS UTC]
- T_decision: [HH:MM:SS UTC]
- T_rollback_start: [HH:MM:SS UTC]
- T_rollback_complete: [HH:MM:SS UTC]
- T_recovery: [HH:MM:SS UTC]

---

## Phase-by-Phase Execution

### Phase 1: Trigger Simulation

**Command Executed:**
```bash
[paste actual command]
```

**Timestamp:** [T_trigger]  
**Outcome:** ✅/❌  
**Evidence:** [logs, screenshots, metrics URL]

---

### Phase 2: Alert Detection

**Expected:** Alert fires within 1 minute of sustained error rate >5%.

**Validation:**
- [ ] Prometheus alert rule evaluated correctly
- [ ] AlertManager routed alert to PagerDuty
- [ ] PagerDuty page sent to on-call engineer
- [ ] Slack notification posted to #alerts channel
- [ ] Grafana dashboard showed elevated error rate

**Alert Firing Time:** [HH:MM:SS UTC]  
**Detection Time:** ___ seconds ✅/❌  
**Evidence:** [PagerDuty incident URL, Slack permalink, Prometheus query]

---

### Phase 3: Decision Process

**Expected:** On-call engineer acknowledges alert, reviews metrics, consults runbook, decides to rollback.

**Decision Criteria Checklist:**
- [ ] Error rate sustained >5% for >2 minutes? → YES/NO
- [ ] Errors correlated with recent deployment? → ArgoCD sync history checked
- [ ] Quick mitigation possible? → NO, proceed to rollback
- [ ] Rollback approved (if production)? → County coordinator notified

**On-Call Acknowledgment:** [HH:MM:SS UTC]  
**Decision Logged:** [HH:MM:SS UTC]  
**Decision Time:** ___ seconds ✅/❌  
**Runbook Consulted:** [URL or file path]  
**Evidence:** [Slack decision message, incident notes]

---

### Phase 4: Rollback Execution

**Expected:** Rollback executed using GitOps (ArgoCD) or Kubernetes rollout.

**Execution Commands:**
```bash
[paste actual rollback commands executed]
```

**Validation Checkpoints:**
- [ ] Rollback command executed successfully
- [ ] New pods starting with previous image version
- [ ] Old pods terminating gracefully
- [ ] All pods reached "Ready" state

**Rollback Started:** [HH:MM:SS UTC]  
**Rollback Completed:** [HH:MM:SS UTC]  
**Execution Time:** ___ seconds ✅/❌  
**Evidence:** [kubectl get pods output, ArgoCD UI screenshot]

---

### Phase 5: Recovery Validation

**Expected:** Service returns to healthy state, error rate drops below 1%, smoke tests pass.

**Validation Steps:**

1. **Health Checks:**
   ```bash
   # API health endpoint
   curl https://api.terrafusion.gov/health
   # Result: [paste response]
   
   # Pod status
   kubectl get pods -n terrafusion -l app=terrafusion-api
   # Result: [paste output]
   ```

2. **Smoke Tests:**
   ```bash
   npm run test:smoke:production
   # Result: [paste summary]
   ```

3. **Metrics Validation:**
   - [ ] Error rate <1% for 2 consecutive minutes
   - [ ] P95 latency within baseline (±10%)
   - [ ] Traffic routing confirmed 100% to rolled-back version
   - [ ] No new alerts firing

4. **Data Integrity Check:**
   ```bash
   # Verify no data loss (RPO = 0)
   psql -h db.terrafusion.gov -U admin -d terrafusion \
     -c "SELECT COUNT(*) FROM audit_logs WHERE created_at > '[T_trigger]';"
   # Expected count: [X], Actual count: [Y]
   ```

**Recovery Time:** [HH:MM:SS UTC]  
**TTR (Total):** ___ minutes ✅/❌  
**Evidence:** [Grafana dashboard URL, smoke test report]

---

## Drill Assessment

**RTO Compliance:** ✅/❌ (TTR <15 min)  
**RPO Compliance:** ✅/❌ (No data loss)  
**Runbook Accuracy:** ✅/❌ (Runbook steps matched execution)  
**Overall Drill Success:** ✅/❌

---

## Issues Identified

| Issue | Severity | Impact on RTO | Resolution | Owner |
|-------|----------|---------------|------------|-------|
| [Example: PagerDuty page delayed by 30s] | Low | +30s detection | Verify webhook configuration | @ops |
| | | | | |

---

## Runbook Updates Required

- [ ] Update detection thresholds in monitoring rules
- [ ] Clarify decision criteria in runbook
- [ ] Add rollback command examples
- [ ] Update escalation paths
- [ ] Other: ___

---

## Lessons Learned

### What Went Well
- [List successes, e.g., "Alert fired within 45 seconds"]
- 

### What Needs Improvement
- [List gaps, e.g., "Decision criteria ambiguous under pressure"]
- 

### Action Items
- [ ] [Action item 1] — Owner: ___ — Due: ___
- [ ] [Action item 2] — Owner: ___ — Due: ___

---

## Evidence Artifacts

**Attached Files:**
- [ ] Prometheus alert evaluation timeline (screenshot or export)
- [ ] PagerDuty incident details (PDF or link)
- [ ] ArgoCD rollback history (screenshot)
- [ ] kubectl events log (text file)
- [ ] Smoke test results (HTML or JSON)
- [ ] Grafana dashboard export (JSON)

**Storage Location:** `docs/deploy/rehearsals/evidence/drill-[YYYY-MM-DD]/`

---

## Post-Drill Actions Completed

| Action | Completed | Date | Evidence |
|--------|-----------|------|----------|
| Environment restored to normal state | ⏳ | | |
| Drill results filed in production cutover artifact | ⏳ | | |
| Validation tracker updated | ⏳ | | |
| Team notified of drill completion | ⏳ | | |
| Runbooks updated | ⏳ | | |
| Action item tickets filed | ⏳ | | |

---

## Compliance & Audit Trail

**FISMA-HIGH Requirements:**
- [x] Drill logged with cryptographic timestamp
- [ ] RTO/RPO compliance measurable and proven
- [ ] Runbook accuracy validated through execution
- [ ] Results retained for audit

**Evidence Pack Integration:**
- [ ] Ingested by ops-validation-artifacts-gate.mjs
- [ ] Referenced in production-cutover-2026-02-14.md
- [ ] TTR metrics fed into SLO tuning log

---

## Sign-Off

**Drill Lead:** ___________________ Date: ______ Status: ⏳

**Platform Engineer:** ___________________ Date: ______ Status: ⏳

**Observer (if required):** ___________________ Date: ______ Status: ⏳

---

*Government. Transcended. Drill-Hardened.*

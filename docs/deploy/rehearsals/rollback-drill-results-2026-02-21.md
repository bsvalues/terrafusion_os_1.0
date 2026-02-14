# Rollback Drill Results — 2026-02-21 — Production

> **Classification:** Government Operations — FISMA-HIGH  
> **Drill Scenario:** Elevated API error rate >5% sustained for 2 minutes  
> **Environment:** Production (LIVE drill with controlled traffic shift)  
> **ExecutionStatus:** `PLANNED` *(PLANNED | EXECUTING | COMPLETE)*  
> **Trigger Method:** Canary deployment of intentionally degraded version (5% traffic)  
> **Drill Lead:** TBD (Platform Engineer)  
> **Observers:** TBD (County Coordinator, SRE Lead)  
> **StartTimeUTC:** TBD (Week 1-2: 2026-02-14 to 2026-02-21)  
> **EndTimeUTC:** TBD  
> **ExecutionDuration:** TBD min
>
> **⚠️ TEMPLATE LOCKED:** Do not change structure during validation period. Append-only sections permitted.

---

## Closeout Summary

**ExecutionStatus:** `PLANNED` *(TO BE UPDATED: PLANNED → EXECUTING → COMPLETE)*

**Verdict:** ⏳ *(TO BE DETERMINED: PASS | FAIL)*

**Key Outcomes:** *(Populate after execution)*
- [ ] RTO < 15 min (Time to Recovery)
- [ ] RPO = 0 (Zero data loss validated)
- [ ] Runbook accuracy 100% (no procedural deviations)

**Quick Reference:**
- **Total TTR:** ___ min (target: <15 min)
- **Detection Time:** ___ sec (target: <60 sec)
- **Rollback Execution:** ___ sec (target: <300 sec)
- **Data Loss:** ___ records (target: 0)
- **Drill Type:** Production Canary (5% traffic error injection)

---

## Timing Results

| Metric | Target | Actual | Status | Notes |
|--------|--------|--------|--------|-------|
| **Detection Time** (T_detection - T_trigger) | <1 min | ___ sec | ⏳ | Alert fired and PagerDuty page sent |
| **Decision Time** (T_decision - T_detection) | <2 min | ___ sec | ⏳ | On-call acknowledged and decided to rollback |
| **Rollback Execution** (T_rollback_complete - T_decision) | <5 min | ___ sec | ⏳ | Rollback command executed and pods ready |
| **Time to Recovery (TTR)** (T_recovery - T_trigger) | <15 min (RTO) | ___ min | ⏳ | Full service recovery validated |
| **Data Loss** | 0 (RPO) | ___ records | ⏳ | Audit log count verified |

**Timestamps (UTC):**
- T_trigger: ___________________
- T_detection: ___________________
- T_decision: ___________________
- T_rollback_start: ___________________
- T_rollback_complete: ___________________
- T_recovery: ___________________

---

## Phase-by-Phase Execution

### Phase 1: Trigger Simulation

**Pre-Execution Checklist:**
- [ ] Verified observability stack operational (Prometheus, Grafana, PagerDuty)
- [ ] Confirmed on-call engineer available and briefed
- [ ] Validated production environment health (all green)
- [ ] Documented baseline metrics (error rate, latency, throughput)
- [ ] Stakeholders notified of planned drill window

**Trigger Method:** Canary deployment with intentional degradation (5% traffic)

**Command Executed:**
```bash
# Deploy canary with 5xx error injection to 5% of traffic
argocd app set terrafusion-api --helm-set canary.enabled=true \
  --helm-set canary.weight=5 \
  --helm-set canary.errorInjection=true \
  --helm-set canary.errorRate=100

# Verify canary deployment
kubectl get pods -n terrafusion -l app=terrafusion-api,version=canary
# Output: _______________
```

**Timestamp:** [T_trigger] ___________________  
**Outcome:** ⏳ ✅/❌  
**Evidence:** [ArgoCD canary config, initial metrics screenshot]

---

### Phase 2: Alert Detection

**Expected:** Alert fires within 1 minute of sustained error rate >5%.

**Alert Rule:**
```
VeryHighAPIErrorRate:
  expr: (rate(http_requests_total{status=~"5.."}[2m]) / rate(http_requests_total[2m])) > 0.05
  for: 2m
  severity: critical
```

**Validation Checklist:**
- [ ] Prometheus alert rule evaluated correctly
- [ ] AlertManager routed alert to PagerDuty → Incident: _______________
- [ ] PagerDuty page sent to on-call engineer → Notified: ✅/❌
- [ ] Slack notification posted to #alerts channel → Permalink: _______________
- [ ] Grafana dashboard showed elevated error rate → URL: _______________

**Alert Firing Time:** [HH:MM:SS UTC] ___________________  
**Detection Time:** (T_detection - T_trigger) = ___ seconds ✅/❌ (target: <60s)  
**Evidence:**
- PagerDuty incident: _______________
- Slack message: _______________
- Prometheus query: `rate(http_requests_total{status=~"5.."}[2m])`

---

### Phase 3: Decision Process

**Expected:** On-call engineer acknowledges alert, reviews metrics, consults runbook, decides to rollback.

**Decision Criteria Checklist:**
- [ ] Error rate sustained >5% for >2 minutes? → YES/NO
- [ ] Errors correlated with canary deployment? → ArgoCD sync history: _______________
- [ ] Quick mitigation possible? → NO, proceed to rollback
- [ ] Rollback approved (production, change control verification)? → YES

**Runbook Consulted:** [docs/ops/runbooks/very-high-error-rate.md](../../ops/runbooks/very-high-error-rate.md)

**On-Call Actions:**
1. Acknowledged PagerDuty incident: [HH:MM:SS UTC] ___________________
2. Reviewed Grafana dashboard: [URL] _______________
3. Consulted runbook section 3: "Decision Criteria"
4. Logged decision in Slack #incidents: "Proceeding with canary rollback due to sustained 5xx error rate >5%"
5. Verified change control (production drill, pre-approved)

**Decision Logged:** [HH:MM:SS UTC] ___________________  
**Decision Time:** (T_decision - T_detection) = ___ seconds ✅/❌ (target: <120s)  
**Evidence:** [Slack decision message permalink, incident notes]

---

### Phase 4: Rollback Execution

**Expected:** Rollback executed using GitOps (ArgoCD canary removal).

**Pre-Rollback State:**
- Current production: 95% stable, 5% canary (error-injected)
- Rollback target: 100% stable version
- Traffic routing: 5% canary → 0% canary

**Execution Commands:**
```bash
# Method: ArgoCD canary removal (immediate)
argocd app set terrafusion-api --helm-set canary.enabled=false

# Wait for rollback completion
argocd app wait terrafusion-api --health --timeout 300
# Output: _______________

# Verify canary pods terminated
kubectl get pods -n terrafusion -l app=terrafusion-api,version=canary
# Output: (none) - Expected

# Verify traffic 100% to stable version
kubectl get vs terrafusion-api -n terrafusion -o jsonpath='{.spec.http[0].route}'
# Output: _______________
```

**Validation Checkpoints:**
- [ ] Rollback command executed successfully → Exit code: 0
- [ ] Canary pods terminated → Verified: ✅/❌
- [ ] Traffic routing confirmed 100% stable → Verified: ✅/❌
- [ ] All stable pods "Ready" state → Ready count: ___ / ___

**Rollback Started:** [HH:MM:SS UTC] ___________________  
**Rollback Completed:** [HH:MM:SS UTC] ___________________  
**Execution Time:** (T_rollback_complete - T_decision) = ___ seconds ✅/❌ (target: <300s)  
**Evidence:** [ArgoCD UI screenshot, kubectl get events output]

---

### Phase 5: Recovery Validation

**Expected:** Service returns to healthy state, error rate drops below 1%, smoke tests pass.

**Health Check Results:**
1. **API health endpoint:**
   ```bash
   curl https://api.terrafusion.gov/health
   # Response: {"status": "healthy", "version": "<stable-version>"}
   ```

2. **Pod status:**
   ```bash
   kubectl get pods -n terrafusion -l app=terrafusion-api
   # All pods: Running/Ready
   ```

3. **Smoke Tests:**
   ```bash
   npm run test:smoke:production
   # Results: ___ / ___ passed
   ```

**Metrics Validation Checklist:**
- [ ] Error rate <1% for 2 consecutive minutes → Final rate: ___%
- [ ] P95 latency within baseline (±10%) → Baseline: ___ms, Actual: ___ms
- [ ] Traffic routing confirmed 100% to stable version → Verified: ✅/❌
- [ ] No new alerts firing → Confirmed: ✅/❌

**Data Integrity Check:**
```bash
# Verify no data loss (RPO = 0)
psql -h db.terrafusion.gov -U admin -d terrafusion \
  -c "SELECT COUNT(*) FROM audit_logs WHERE created_at > '[T_trigger]';"
# Expected count: ___, Actual count: ___
```

**Recovery Time:** [HH:MM:SS UTC] ___________________  
**TTR (Total):** (T_recovery - T_trigger) = ___ minutes ✅/❌ (target: <15 min)  
**Evidence:** [Grafana recovery dashboard, smoke test HTML report]

---

## Drill Assessment

| Criterion | Target | Actual | Status | Notes |
|-----------|--------|--------|--------|-------|
| **RTO Compliance** | <15 min | ___ min | ⏳ | TTR measured from trigger to full recovery |
| **RPO Compliance** | 0 (no data loss) | ___ records | ⏳ | Audit log count verified |
| **Runbook Accuracy** | 100% steps match | ___% | ⏳ | Runbook followed without deviation |
| **Overall Success** | All criteria met | TBD | ⏳ | Go/No-Go for future production operations |

---

## Evidence Links

**Canonical Attachments:** (Attach after execution, stable filenames required)

- [ ] Prometheus alert timeline: `evidence/drill-2026-02-21/prometheus-alert-timeline.json`
- [ ] PagerDuty incident: `evidence/drill-2026-02-21/pagerduty-incident-<ID>.json`
- [ ] ArgoCD rollback history: `evidence/drill-2026-02-21/argocd-rollback-log.yaml`
- [ ] kubectl events: `evidence/drill-2026-02-21/kubectl-events-rollback.log`
- [ ] Smoke test results: `evidence/drill-2026-02-21/smoke-tests-output.html`
- [ ] Grafana metrics: `evidence/drill-2026-02-21/grafana-rto-dashboard.json`
- [ ] Audit log query: `evidence/drill-2026-02-21/audit-log-rpo-proof.sql`
- [ ] Canary deployment config: `evidence/drill-2026-02-21/argocd-canary-config.yaml`

**Evidence Directory:** `docs/deploy/rehearsals/evidence/drill-2026-02-21/`

---

## Issues Identified

| # | Issue | Severity | Impact on RTO | Resolution | Owner | Status |
|---|-------|----------|---------------|------------|-------|--------|
| 1 | | | | | | |

**Example:** PagerDuty page delayed by 30s → Low severity → +30s detection time → Verify webhook configuration → @ops → Open

---

## Runbook Updates Required

Based on drill execution, the following runbook improvements are needed:

- [ ] Update detection thresholds in [very-high-error-rate.md](../../ops/runbooks/very-high-error-rate.md)
- [ ] Clarify decision criteria (error rate sustained duration)
- [ ] Add ArgoCD canary rollback command examples
- [ ] Update escalation paths (if delays observed)
- [ ] Other: _______________

---

## Lessons Learned

### What Went Well
- (Populate after execution)

### What Needs Improvement
- (Populate after execution)

### Action Items
- [ ] [Action item 1] — Owner: ___ — Due: ___
- [ ] [Action item 2] — Owner: ___ — Due: ___

---

## Post-Drill Actions Completed

| Action | Completed | Date | Evidence |
|--------|-----------|------|----------|
| Canary deployment removed | ⏳ | | `argocd app set terrafusion-api --helm-set canary.enabled=false` |
| Environment restored to normal state | ⏳ | | All pods healthy, error rate <0.1% |
| Drill results filed in production cutover artifact | ⏳ | | Referenced in production-cutover-2026-02-14.md |
| Validation tracker updated | ⏳ | | Criterion #2 marked complete in validation-period-tracker.md |
| Team notified of drill completion | ⏳ | | Slack #engineering notification sent |
| Runbooks updated (if needed) | ⏳ | | PRs filed for runbook improvements |
| Action item tickets filed | ⏳ | | GitHub issues created with drill tag |

---

## Compliance & Audit Trail

**FISMA-HIGH Requirements:**
- [x] Drill logged with cryptographic timestamp → Git commit hash: _______________
- [ ] RTO/RPO compliance measurable and proven → TTR: ___ min, Data loss: ___ records
- [ ] Runbook accuracy validated through execution → Accuracy: ___%
- [ ] Results retained for audit → Filed in git + evidence storage

**Evidence Pack Integration:**
- [ ] Ingested by ops-validation-artifacts-gate.mjs → Gate status: ⏳
- [ ] Referenced in [production-cutover-2026-02-14.md](./production-cutover-2026-02-14.md) → Section: "Rollback Simulation"
- [ ] TTR metrics fed into [slo-tuning-log.md](../../ops/slo-tuning-log.md) → Entry date: ___

---

## Sign-Off

**Drill Lead:** ___________________ Date: ______ Status: ⏳

**Platform Engineer:** ___________________ Date: ______ Status: ⏳

**Observer (County Coordinator):** ___________________ Date: ______ Status: ⏳

**Observer (SRE Lead):** ___________________ Date: ______ Status: ⏳

**Drill Verdict:** ⏳ PASS / FAIL (RTO compliance + RPO compliance + no critical issues)

---

## Integration with Production Cutover

**Cutover Artifact Reference:** [production-cutover-2026-02-14.md](./production-cutover-2026-02-14.md)  
**Section:** "Rollback Simulation Results"  
**Verdict Impact:** If drill FAILS (RTO >15 min or RPO >0), validation period extended for remediation.

---

*Government. Transcended. Production-Proven.*

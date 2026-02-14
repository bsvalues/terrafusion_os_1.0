# Rollback Drill Results — Week 1-2 — Staging Environment

> **Classification:** Government Operations — FISMA-HIGH  
> **Drill Scenario:** Elevated API error rate >5% sustained for 2 minutes  
> **Environment:** Staging (safe synthetic error injection)  
> **ExecutionStatus:** `PLANNED` *(PLANNED | EXECUTING | COMPLETE)*  
> **Trigger Method:** Synthetic error injection via chaos engineering (5% of requests)  
> **Drill Lead:** TBD (Platform Engineer)  
> **Observers:** TBD  
> **StartTimeUTC:** TBD  
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
- **Drill Type:** Staging Chaos Injection (5% synthetic errors)

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
- [ ] Validated staging environment health (all green)
- [ ] Documented baseline metrics (error rate, latency, throughput)

**Command Executed:**
```bash
# Inject synthetic 5xx errors on 5% of API requests
kubectl apply -f - <<EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: HTTPChaos
metadata:
  name: api-error-rate-injection
  namespace: terrafusion-staging
spec:
  selector:
    namespaces:
      - terrafusion-staging
    labelSelectors:
      app: terrafusion-api
  mode: all
  duration: 5m
  target: Response
  abort: true
  statusCode: 500
  percentage: 5
EOF
```

**Timestamp:** [T_trigger] ___________________  
**Outcome:** ⏳ ✅/❌  
**Evidence:** [kubectl describe chaos output, initial metrics screenshot]

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
- [ ] Errors correlated with recent deployment? → ArgoCD sync history: _______________
- [ ] Quick mitigation possible? → NO, proceed to rollback
- [ ] Rollback approved (staging, no approval required)? → YES

**Runbook Consulted:** [docs/ops/runbooks/very-high-error-rate.md](../../ops/runbooks/very-high-error-rate.md)

**On-Call Actions:**
1. Acknowledged PagerDuty incident: [HH:MM:SS UTC] ___________________
2. Reviewed Grafana dashboard: [URL] _______________
3. Consulted runbook section 3: "Decision Criteria"
4. Logged decision in Slack #incidents: "Proceeding with rollback due to sustained 5xx error rate >5%"

**Decision Logged:** [HH:MM:SS UTC] ___________________  
**Decision Time:** (T_decision - T_detection) = ___ seconds ✅/❌ (target: <120s)  
**Evidence:** [Slack decision message permalink, incident notes]

---

### Phase 4: Rollback Execution

**Expected:** Rollback executed using GitOps (ArgoCD) or Kubernetes rollout.

**Pre-Rollback State:**
- Current image: `terrafusion/api:v1.2.3`
- Rollback target: `terrafusion/api:v1.2.2`
- Traffic routing: 100% to v1.2.3

**Execution Commands:**
```bash
# Method: ArgoCD rollback to previous stable revision
argocd app rollback terrafusion-api --revision <previous-stable-sha>
# Output: _______________

# Wait for rollback completion
argocd app wait terrafusion-api --health --timeout 300
# Output: _______________

# Verify pods running previous version
kubectl get pods -n terrafusion-staging -l app=terrafusion-api -o jsonpath='{.items[*].spec.containers[0].image}'
# Output: _______________
```

**Validation Checkpoints:**
- [ ] Rollback command executed successfully → Exit code: 0
- [ ] New pods starting with previous image (v1.2.2) → Verified: ✅/❌
- [ ] Old pods (v1.2.3) terminating gracefully → Verified: ✅/❌
- [ ] All pods reached "Ready" state → Ready count: ___ / ___

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
   curl https://api-staging.terrafusion.gov/health
   # Response: {"status": "healthy", "version": "1.2.2"}
   ```

2. **Pod status:**
   ```bash
   kubectl get pods -n terrafusion-staging -l app=terrafusion-api
   # All pods: Running/Ready
   ```

3. **Smoke Tests:**
   ```bash
   npm run test:smoke:staging
   # Results: ___ / ___ passed
   ```

**Metrics Validation Checklist:**
- [ ] Error rate <1% for 2 consecutive minutes → Final rate: ___%
- [ ] P95 latency within baseline (±10%) → Baseline: ___ms, Actual: ___ms
- [ ] Traffic routing confirmed 100% to rolled-back version (v1.2.2) → Verified: ✅/❌
- [ ] No new alerts firing → Confirmed: ✅/❌

**Data Integrity Check:**
```bash
# Verify no data loss (RPO = 0)
psql -h db-staging.terrafusion.gov -U admin -d terrafusion \
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
| **Overall Success** | All criteria met | TBD | ⏳ | Go/No-Go for production cutover |

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
- [ ] Add ArgoCD rollback command examples with revision syntax
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

## Evidence Links

**Canonical Attachments:** (Attach after execution, stable filenames required)

- [ ] Prometheus alert timeline: `evidence/drill-2026-02-XX/prometheus-alert-timeline.json`
- [ ] PagerDuty incident: `evidence/drill-2026-02-XX/pagerduty-incident-<ID>.json`
- [ ] ArgoCD rollback history: `evidence/drill-2026-02-XX/argocd-rollback-log.yaml`
- [ ] kubectl events: `evidence/drill-2026-02-XX/kubectl-events-rollback.log`
- [ ] Smoke test results: `evidence/drill-2026-02-XX/smoke-tests-output.html`
- [ ] Grafana metrics: `evidence/drill-2026-02-XX/grafana-rto-dashboard.json`
- [ ] Audit log query: `evidence/drill-2026-02-XX/audit-log-rpo-proof.sql`
- [ ] Chaos injection config: `evidence/drill-2026-02-XX/chaos-mesh-httpchaos.yaml`

**Evidence Directory:** `docs/deploy/rehearsals/evidence/drill-2026-02-XX/`

---

## Evidence Artifacts

**Evidence Storage:** `docs/deploy/rehearsals/evidence/drill-2026-02-XX/`

**Attached Files:**
- [ ] Prometheus alert evaluation timeline (screenshot or JSON export)
- [ ] PagerDuty incident details (PDF or incident URL)
- [ ] ArgoCD rollback history (screenshot or YAML export)
- [ ] `kubectl events` log for API deployment rollback
- [ ] Smoke test results (HTML report or test output)
- [ ] Grafana dashboard export (JSON or screenshot with metrics)
- [ ] Audit log query results (proving RPO = 0)

---

## Post-Drill Actions Completed

| Action | Completed | Date | Evidence |
|--------|-----------|------|----------|
| Chaos engineering injection removed | ⏳ | | `kubectl delete httpchaos api-error-rate-injection -n terrafusion-staging` |
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

**Observer (if required):** ___________________ Date: ______ Status: ⏳

**Drill Verdict:** ⏳ PASS / FAIL (RTO compliance + RPO compliance + no critical issues)

---

## Integration with Production Cutover

**Cutover Artifact Reference:** [production-cutover-2026-02-14.md](./production-cutover-2026-02-14.md)  
**Section:** "Rollback Simulation Results"  
**Verdict Impact:** If drill FAILS (RTO >15 min or RPO >0), production cutover should be delayed for remediation.

---

*Government. Transcended. Drill-Proven.*

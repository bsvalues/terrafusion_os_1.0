# Rollback Drill Protocol

> **Classification:** Government Operations — FISMA-HIGH  
> **Type:** Operational Readiness Validation  
> **Purpose:** Validate rollback procedures and RTO compliance through safe simulation  
> **Classification:** Pre-Production / Staging Environment  
> **Last Updated:** 2026-02-14

---

## Overview

**Objective:** Validate that TerraFusion OS can be rolled back to the previous version within the RTO target (<15 minutes) with zero data loss (RPO = 0 minutes).

**Scope:**
- Rollback trigger detection mechanisms
- Decision-making process under pressure
- Rollback execution procedures
- Recovery validation and smoke testing
- RTO/RPO compliance measurement

**Drill Cadence:** 
- Pre-production: Before every major cutover
- Production: Quarterly (calendar-based) or post-incident

---

## Safety Protocols

### Drill Execution Environments

| Environment | Permitted Drill Types | Approval Required | Notes |
|-------------|----------------------|-------------------|-------|
| **Local Dev** | All | None | Lowest risk, limited fidelity |
| **Staging** | All | Platform Engineer | High fidelity, safe environment |
| **Production** | Synthetic only | County Coordinator + Platform Lead | Real traffic, requires careful planning |

### Prohibited Actions in Production

- ❌ Intentional service crashes or kills
- ❌ Database corruption or intentional data errors
- ❌ Resource exhaustion (OOMKill, CPU starvation)
- ❌ Network partitions affecting live traffic
- ❌ Manual configuration changes that bypass GitOps

### Permitted Synthetic Triggers in Production

- ✅ Feature flag toggles (gradual rollout/rollback simulation)
- ✅ Canary traffic routing shifts
- ✅ Synthetic error injection via chaos engineering tools (low percentage)
- ✅ ArgoCD sync to previous revision (blue-green cutover)
- ✅ Load test traffic only (not citizen-facing)

---

## Drill Scenario: Elevated Error Rate Trigger

**Trigger Condition:** API error rate sustained >5% for 2 minutes

**Expected Behavior:** Automatic alert → on-call engineer paged → decision within 2 minutes → rollback executed → recovery within 15 minutes.

### Pre-Drill Checklist

- [ ] Drill date/time scheduled and communicated to team
- [ ] Staging or production environment selected
- [ ] Rollback target version identified and validated (previous stable release)
- [ ] Observability stack confirmed operational (Prometheus, Grafana, PagerDuty)
- [ ] On-call engineer briefed and available
- [ ] Rollback runbook reviewed ([runbook](./runbooks/api-down.md))
- [ ] Stakeholder notifications sent (if production drill)
- [ ] Timing measurement tools prepared (stopwatch, log timestamps)

---

## Drill Execution Phases

### Phase 1: Trigger Simulation (Time: T+0)

**Staging Environment:**
```bash
# Option 1: Deploy intentionally broken version to staging
kubectl set image deployment/terrafusion-api \
  terrafusion-api=terrafusion/api:broken-v1.0.1 \
  -n terrafusion-staging

# Option 2: Inject synthetic errors via chaos engineering
kubectl apply -f chaos/synthetic-error-500-5percent.yaml -n terrafusion-staging
```

**Production Environment (if approved):**
```bash
# Option 1: Feature flag toggle (safest)
kubectl exec -n terrafusion deployment/terrafusion-api -- \
  curl -X POST localhost:5000/admin/feature-flags/rollback-drill-mode/enable

# Option 2: Canary rollback simulation (1% traffic only)
kubectl argo rollouts set canary terrafusion-api --canary-weight=1 \
  --revision=<previous-stable-sha>
```

**Record:** `T_trigger = [timestamp]`

### Phase 2: Alert Detection (Time: T+0 to T+1)

**Expected:** Alert fires within 1 minute of sustained error rate >5%.

**Validate:**
- [ ] Prometheus alert rule evaluates correctly
- [ ] AlertManager routes alert to PagerDuty
- [ ] PagerDuty page sent to on-call engineer
- [ ] Slack notification posted to #alerts channel
- [ ] Grafana dashboard shows elevated error rate

**Measurement:**
```bash
# Check alert firing time
kubectl logs -n monitoring deployment/prometheus-operator --since=5m | grep TerraFusionAPIErrorRate

# Check PagerDuty incident creation time
# (via PagerDuty UI or API)
```

**Record:** `T_detection = [timestamp]` → **Detection Time = T_detection - T_trigger** (Target: <1 min)

### Phase 3: Decision Process (Time: T+1 to T+3)

**Expected:** On-call engineer acknowledges alert, reviews metrics, consults runbook, decides to rollback.

**Decision Criteria (from runbook):**
1. Error rate sustained >5% for >2 minutes? → YES ✅
2. Errors correlated with recent deployment? → Check ArgoCD sync history
3. Quick mitigation possible? → If NO, proceed to rollback
4. Rollback approved (if production)? → County coordinator notified

**Measurement:**
- On-call engineer timestamps acknowledgment in incident channel
- Decision logged: "Proceeding with rollback due to [reason]"

**Record:** `T_decision = [timestamp]` → **Decision Time = T_decision - T_detection** (Target: <2 min)

### Phase 4: Rollback Execution (Time: T+3 to T+8)

**Expected:** Rollback executed using GitOps (ArgoCD) or Kubernetes rollout.

**Execution Commands:**
```bash
# Method 1: ArgoCD rollback (preferred)
argocd app rollback terrafusion-api --revision <previous-stable-sha>
argocd app wait terrafusion-api --health --timeout 300

# Method 2: Kubernetes rollout undo
kubectl rollout undo deployment/terrafusion-api -n terrafusion
kubectl rollout status deployment/terrafusion-api -n terrafusion --timeout=5m

# Method 3: Helm rollback (if Helm-managed)
helm rollback terrafusion-api -n terrafusion
```

**Validation Checkpoints:**
- [ ] Rollback command executed successfully
- [ ] New pods starting with previous image version
- [ ] Old pods terminating gracefully
- [ ] All pods reach "Ready" state

**Measurement:**
```bash
# Check rollback start time
argocd app history terrafusion-api | grep rollback

# Check pod readiness time
kubectl get events -n terrafusion --field-selector involvedObject.name=terrafusion-api --sort-by='.lastTimestamp'
```

**Record:** `T_rollback_complete = [timestamp]` → **Rollback Execution Time = T_rollback_complete - T_decision** (Target: <5 min)

### Phase 5: Recovery Validation (Time: T+8 to T+15)

**Expected:** Service returns to healthy state, error rate drops below 1%, smoke tests pass.

**Validation Steps:**
1. **Health Checks:**
   ```bash
   # API health endpoint
   curl https://api.terrafusion.gov/health
   
   # Pod status
   kubectl get pods -n terrafusion -l app=terrafusion-api
   ```

2. **Smoke Tests:**
   ```bash
   # Run critical path smoke tests
   npm run test:smoke:production
   ```

3. **Metrics Validation:**
   - [ ] Error rate <1% for 2 consecutive minutes
   - [ ] P95 latency within baseline
   - [ ] Traffic routing confirmed 100% to rolled-back version
   - [ ] No new alerts firing

4. **Data Integrity Check:**
   ```bash
   # Verify no data loss (RPO = 0)
   psql -h db.terrafusion.gov -U admin -d terrafusion \
     -c "SELECT COUNT(*) FROM audit_logs WHERE created_at > '[T_trigger]';"
   
   # Compare with expected count
   ```

**Record:** `T_recovery = [timestamp]` → **Time to Recovery (TTR) = T_recovery - T_trigger** (Target: <15 min)

---

## Drill Results Template

Use this template to record drill outcomes and append to production cutover artifact.

### Rollback Drill Results — [Date] — [Environment]

**Drill Scenario:** [e.g., Elevated API error rate >5%]  
**Environment:** [Staging / Production]  
**Trigger Method:** [Synthetic error injection / Feature flag / Canary shift]  
**Drill Lead:** [Name]  
**Observers:** [Names]

#### Timing Results

| Metric | Target | Actual | Status | Notes |
|--------|--------|--------|--------|-------|
| **Detection Time** (T_detection - T_trigger) | <1 min | ___ min | ⏳/✅/❌ | - |
| **Decision Time** (T_decision - T_detection) | <2 min | ___ min | ⏳/✅/❌ | - |
| **Rollback Execution** (T_rollback_complete - T_decision) | <5 min | ___ min | ⏳/✅/❌ | - |
| **Time to Recovery (TTR)** (T_recovery - T_trigger) | <15 min (RTO) | ___ min | ⏳/✅/❌ | - |
| **Data Loss** | 0 (RPO) | ___ records | ⏳/✅/❌ | - |

#### Phase-by-Phase Execution

**Phase 1: Trigger Simulation**
- Command executed: [command]
- Timestamp: [T_trigger]
- Outcome: ✅/❌

**Phase 2: Alert Detection**
- Alert fired: ✅/❌
- PagerDuty page sent: ✅/❌
- Timestamp: [T_detection]
- Detection Time: ___ min ✅/❌

**Phase 3: Decision Process**
- On-call acknowledged: ✅/❌
- Decision logged: ✅/❌
- Timestamp: [T_decision]
- Decision Time: ___ min ✅/❌

**Phase 4: Rollback Execution**
- Rollback method: [ArgoCD / kubectl / Helm]
- Rollback started: [T_rollback_start]
- Rollback completed: [T_rollback_complete]
- Execution Time: ___ min ✅/❌

**Phase 5: Recovery Validation**
- Health checks passed: ✅/❌
- Smoke tests passed: ✅/❌
- Error rate <1%: ✅/❌
- Data integrity verified: ✅/❌
- Timestamp: [T_recovery]
- TTR: ___ min ✅/❌

#### Drill Assessment

**RTO Compliance:** ✅/❌ (TTR <15 min)  
**RPO Compliance:** ✅/❌ (No data loss)  
**Runbook Accuracy:** ✅/❌ (Runbook steps matched execution)  
**Overall Drill Success:** ✅/❌

#### Issues Identified

| Issue | Severity | Impact on RTO | Resolution | Owner |
|-------|----------|---------------|------------|-------|
| - | - | - | - | - |

#### Runbook Updates Required

- [ ] Update detection thresholds in monitoring rules
- [ ] Clarify decision criteria in runbook
- [ ] Add rollback command examples
- [ ] Update escalation paths
- [ ] Other: ___

#### Lessons Learned

- **What went well:**
  - [List successes]

- **What needs improvement:**
  - [List gaps]

- **Action items:**
  - [ ] [Action item 1] — Owner: ___ — Due: ___
  - [ ] [Action item 2] — Owner: ___ — Due: ___

---

## Post-Drill Actions

### Immediate (within 1 hour)
- [ ] Restore environment to normal state (disable synthetic errors, revert feature flags)
- [ ] File drill results in `docs/deploy/rehearsals/production-cutover-YYYY-MM-DD.md`
- [ ] Update validation tracker (`docs/ops/validation-period-tracker.md`)
- [ ] Notify team of drill completion

### Within 24 hours
- [ ] Review drill video/logs with team
- [ ] Update runbooks based on identified gaps
- [ ] File tickets for action items
- [ ] Update rollback procedure documentation if needed

### Within 1 week
- [ ] Implement high-priority improvements
- [ ] Schedule follow-up drill if RTO not met
- [ ] Update alerting thresholds if false positives detected

---

## Drill Frequency & Governance

### Pre-Production Drills (Required)
- **Timing:** Before every major cutover (new feature, infrastructure change)
- **Environment:** Staging
- **Approval:** Platform Engineer
- **Evidence:** Results appended to cutover artifact

### Production Drills (Recommended)
- **Timing:** Quarterly (every 90 days) or post-incident
- **Environment:** Production (synthetic triggers only)
- **Approval:** County Coordinator + Platform Lead
- **Evidence:** Filed in `docs/ops/drill-results/production-drill-YYYY-MM-DD.md`

### Drill Exemptions
- Production drills may be deferred if:
  - Actual rollback executed in production within previous 30 days
  - Major incident occurred requiring emergency procedures
  - Scheduled maintenance window conflict

---

## Compliance & Audit Trail

**FISMA-HIGH Requirements:**
- All drills must be logged and timestameable
- Drill results must be retained for audit
- RTO/RPO compliance must be measurable and provable
- Runbook accuracy must be validated through execution

**Evidence Pack Integration:**
- Drill results are ingested by ops-validation-artifacts-gate.mjs
- TTR metrics feed into SLO tuning log
- Runbook updates tracked via runbook-freshness-gate.mjs

---

## References

- [Production Cutover Artifact](../deploy/rehearsals/production-cutover-2026-02-14.md)
- [Disaster Recovery Plan](../security/disaster-recovery-plan.md)
- [API Down Runbook](./runbooks/api-down.md)
- [SLO Tuning Log](./slo-tuning-log.md)
- [Validation Period Tracker](./validation-period-tracker.md)

---

*Government. Transcended. Resilient.*

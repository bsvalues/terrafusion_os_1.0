# TerraFusion OS — Operational Runbooks

> **Classification:** Government Operations — FISMA-HIGH  
> **Purpose:** On-call procedures and operational playbooks  
> **Audience:** SRE team, on-call engineers, incident responders

---

## Overview

This directory contains operational runbooks for TerraFusion OS production operations, including:

- **Paging alert response** — What to do when alerts fire
- **Incident response** — Investigation and resolution procedures
- **Telemetry capture** — Validation period evidence collection
- **Phase gate procedures** — Release authorization protocols

---

## Paging Alert Runbooks

### Critical Service Failures

- **[api-down.md](api-down.md)** — TerraFusion API unreachable
- **[consciousness-down.md](consciousness-down.md)** — AI swarm offline
- **[gateway-down.md](gateway-down.md)** — API gateway failure

### Performance Degradation

- **[very-high-latency.md](very-high-latency.md)** — P95/P99 latency above threshold
- **[very-high-error-rate.md](very-high-error-rate.md)** — HTTP 5xx error rate spike

### Security & Compliance

- **[audit-log-failure.md](audit-log-failure.md)** — Audit log ingestion failure
- **[isolation-breach.md](isolation-breach.md)** — County data isolation breach attempt

---

## Validation Period Runbooks (30-Day Validation)

### Daily Operations

- **[daily-slo-capture.md](daily-slo-capture.md)** — Daily SLO burn evidence capture (Criterion #3)
  - **When:** Daily, 23:00-23:59 UTC
  - **Duration:** Days 1-7 (2026-02-15 to 2026-02-21)
  - **Automation:** `node scripts/capture-daily-slo-burn.mjs --day N`

- **[alert-audit-capture.md](alert-audit-capture.md)** — Real-time paging alert audit (Criterion #4)
  - **When:** Immediately when paging alert fires
  - **Duration:** First 100 paging alerts (Week 3-4)
  - **Automation:** `node scripts/capture-alert-audit-entry.mjs --id NNN`

### Phase Gate Procedures

- **[week4-phase8-unlocking.md](week4-phase8-unlocking.md)** — Phase 8 authorization procedure
  - **Trigger:** All 5 validation criteria complete
  - **Expected:** Week 4 (earliest 2026-02-21)
  - **Gates:** `node tools/gates/validation-week12-gate.mjs` (must show 5/5)

---

## Quick Reference

### Alert Response Flow

```
Alert Fires
    ↓
1. Acknowledge (PagerDuty/Slack)
    ↓
2. Find Runbook (docs/ops/runbooks/<alert-name>.md)
    ↓
3. Execute Investigation Steps
    ↓
4. Resolve or Escalate
    ↓
5. Capture Evidence (if validation period active)
```

### Validation Period Flow

```
Production Cutover (2026-02-14)
    ↓
Week 1-2: Cutover + Rollback (Criteria #1, #2) ✅
    ↓
Week 2-3: Daily SLO Capture (Criterion #3) 🟡
    ↓
Week 3-4: Alert FP Audit (Criterion #4) ⏳
    ↓
Week 4: Phase 8 Authorization (5/5 criteria) 🔒
```

---

## Runbook Structure

All runbooks follow this standard structure:

```markdown
# Runbook Title

> **Classification:** ...
> **Audience:** ...
> **Trigger:** ...

## Overview
[What this runbook covers]

## When to Execute
[Trigger conditions]

## Prerequisites
[Required access, tools]

## Procedure
[Step-by-step instructions]

## Verification
[How to verify success]

## Troubleshooting
[Common issues + resolutions]

## Related Documentation
[Links to related docs]
```

---

## Automation Scripts

### Validation Period Automation

| Script | Purpose | Usage |
|--------|---------|-------|
| `capture-daily-slo-burn.mjs` | Daily SLO evidence capture | `node scripts/capture-daily-slo-burn.mjs --day N` |
| `verify-slo-burn-completeness.mjs` | Validate Days 1-7 complete | `node scripts/verify-slo-burn-completeness.mjs` |
| `capture-alert-audit-entry.mjs` | Alert evidence capture | `node scripts/capture-alert-audit-entry.mjs --id NNN` |
| `verify-alert-audit-completeness.mjs` | Validate Alerts #001-100 | `node scripts/verify-alert-audit-completeness.mjs` |

### Validation Gates

| Gate | Purpose | Usage |
|------|---------|-------|
| `slo-burn-completeness-gate.mjs` | CI gate for Criterion #3 | `node tools/gates/slo-burn-completeness-gate.mjs` |
| `alert-audit-completeness-gate.mjs` | CI gate for Criterion #4 | `node tools/gates/alert-audit-completeness-gate.mjs` |
| `validation-week12-gate.mjs` | Composite 5/5 gate | `node tools/gates/validation-week12-gate.mjs` |

---

## Contact & Escalation

### On-Call Rotation

- **Primary:** PagerDuty schedule rotation
- **Secondary:** Slack #terrafusion-oncall
- **Escalation:** Engineering manager

### Incident Severity

| Severity | Response SLA | Examples |
|----------|--------------|----------|
| **Critical** | <5 min | API down, consciousness offline, data loss |
| **Warning** | <15 min | High latency, elevated error rate |
| **Info** | No SLA | Informational alerts (non-paging) |

---

## Related Documentation

- **Ops Documentation:** [docs/ops/](../)
- **Alert Definitions:** [docs/ops/alerts.md](../alerts.md)
- **SLO Definitions:** [docs/ops/slo.md](../slo.md)
- **Evidence Capture Protocol:** [docs/ops/evidence-capture-protocol.md](../evidence-capture-protocol.md)
- **Validation Period Tracker:** [docs/ops/validation-period-tracker.md](../validation-period-tracker.md)

---

*Government. Transcended. Always ready.*

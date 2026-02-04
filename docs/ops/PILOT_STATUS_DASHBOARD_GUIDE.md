# Pilot Status Dashboard Guide

> **Purpose:** How to read and interpret pilot status dashboards  
> **Audience:** Leadership, Operators, Auditors  
> **Version:** 1.0.0

---

## Overview

The TerraFusion OS portal provides real-time visibility into pilot status across five key areas:

1. **Readiness** — Overall go-live readiness score
2. **Exceptions** — Active, expiring, and expired policy exceptions
3. **Stop Watch** — Stop condition trigger monitoring
4. **DR Freshness** — Disaster recovery drill status
5. **KPIs** — MTTR and rollback success metrics

This guide explains how to read each dashboard and what actions to take based on status indicators.

---

## 1. Readiness Dashboard

**URL:** `/portal/readiness`

### What It Shows

The readiness score is a composite metric (0–100%) indicating overall pilot health.

| Score Range | Status | Meaning |
|-------------|--------|---------|
| 95–100% | 🟢 Green | Fully ready, no blockers |
| 80–94% | 🟡 Yellow | Minor issues, review recommended |
| 60–79% | 🟠 Orange | Significant issues, action required |
| < 60% | 🔴 Red | Critical issues, pilot blocked |

### Components

| Component | Weight | Description |
|-----------|--------|-------------|
| Attestation Currency | 15% | Agency attestation is valid and not expired |
| MOU Coverage | 15% | All services have active MOUs |
| Operator Certification | 20% | All operators are certified |
| Exception Status | 15% | No expired exceptions |
| DR Freshness | 15% | DR drill within 90 days |
| KPI Compliance | 20% | MTTR and rollback within thresholds |

### How to Read

```
┌─────────────────────────────────────────────────────────────┐
│  READINESS SCORE                                            │
│  ████████████████████████████████████░░░░░  92%            │
│  Status: 🟡 Yellow                                          │
├─────────────────────────────────────────────────────────────┤
│  Components:                                                │
│  ✅ Attestation (15/15)                                     │
│  ✅ MOU Coverage (15/15)                                    │
│  ✅ Operators (20/20)                                       │
│  ⚠️  Exceptions (12/15) — 1 expiring in 24h                 │
│  ✅ DR Freshness (15/15)                                    │
│  ✅ KPIs (15/20) — MTTR slightly elevated                   │
├─────────────────────────────────────────────────────────────┤
│  Blockers: None                                             │
│  Warnings: Exception renewal needed, MTTR trending up       │
└─────────────────────────────────────────────────────────────┘
```

### Actions

| Status | Action |
|--------|--------|
| 🟢 Green | Continue normal operations |
| 🟡 Yellow | Review warnings in daily war room |
| 🟠 Orange | Immediate triage, assign owners |
| 🔴 Red | Halt operations, resolve blockers |

---

## 2. Exception Ledger

**URL:** `/portal/exceptions`

### What It Shows

All policy exceptions across the pilot agency, categorized by status.

### Status Categories

| Status | Icon | Meaning |
|--------|------|---------|
| Active | 🟢 | Valid exception with future expiry |
| Expiring | 🟡 | Expires within 48 hours |
| Expired | 🔴 | Past expiry date — **BLOCKER** |
| Closed | ⚪ | Remediated or no longer needed |

### Severity Levels

| Severity | Max Active | Description |
|----------|------------|-------------|
| Critical | 0 | Security/compliance critical — not allowed |
| High | 2 | Significant risk — limited allowance |
| Medium | 5 | Moderate risk — managed allowance |
| Low | 10 | Minor risk — larger allowance |

### How to Read

```
┌─────────────────────────────────────────────────────────────┐
│  EXCEPTION LEDGER                                           │
├─────────────────────────────────────────────────────────────┤
│  Summary:                                                   │
│  🟢 Active: 3     🟡 Expiring: 1     🔴 Expired: 0         │
├─────────────────────────────────────────────────────────────┤
│  ID            │ Severity │ Age  │ Expiry    │ Owner       │
│  sha256:exc_01 │ Medium   │ 15d  │ 2026-02-15│ sha256:op_1 │
│  sha256:exc_02 │ Low      │ 7d   │ 2026-03-01│ sha256:op_2 │
│  sha256:exc_03 │ Low      │ 3d   │ 2026-03-10│ sha256:op_1 │
│  sha256:exc_04 │ Medium   │ 45d  │ 2026-02-04│ sha256:op_3 │ ← Expiring!
└─────────────────────────────────────────────────────────────┘
```

### Actions

| Condition | Action |
|-----------|--------|
| Expiring within 48h | Renew before expiry or remediate |
| Any Expired | **BLOCKER** — Must remediate immediately |
| Critical active | Should not exist — escalate |
| Age > 60 days | Review for permanent remediation |

---

## 3. Stop Condition Watch

**URL:** `/portal/stop-watch`

### What It Shows

Real-time monitoring of the four stop condition triggers.

### Stop Condition Codes

| Code | Trigger | Auto-Pause |
|------|---------|------------|
| `MTTR_REGRESSION` | MTTR exceeds 30 minutes | ✅ Yes |
| `ROLLBACK_FAILURE` | Rollback operation failed | ✅ Yes |
| `DR_DRILL_FAILURE` | DR drill did not pass | ✅ Yes |
| `AUDIT_INTEGRITY_ALERT` | Audit chain violation | ✅ Yes |

### Status Indicators

| Status | Icon | Meaning |
|--------|------|---------|
| Normal | 🟢 | Metric within threshold |
| Warning | 🟡 | Metric trending toward threshold |
| Critical | 🔴 | Threshold exceeded — pause triggered |
| Paused | ⏸️ | System is paused, awaiting recovery |

### How to Read

```
┌─────────────────────────────────────────────────────────────┐
│  STOP CONDITION WATCH                                       │
├─────────────────────────────────────────────────────────────┤
│  Condition              │ Threshold  │ Current │ Status    │
│  MTTR_REGRESSION        │ ≤ 30 min   │ 22 min  │ 🟢 Normal │
│  ROLLBACK_FAILURE       │ ≥ 95%      │ 98%     │ 🟢 Normal │
│  DR_DRILL_FAILURE       │ ≤ 90 days  │ 24 days │ 🟢 Normal │
│  AUDIT_INTEGRITY_ALERT  │ Valid      │ Valid   │ 🟢 Normal │
├─────────────────────────────────────────────────────────────┤
│  Pause Status: Active (not paused)                          │
│  Last Trigger: None in current pilot                        │
└─────────────────────────────────────────────────────────────┘
```

### When Paused

```
┌─────────────────────────────────────────────────────────────┐
│  ⏸️  SYSTEM PAUSED                                          │
├─────────────────────────────────────────────────────────────┤
│  Trigger: MTTR_REGRESSION                                   │
│  Pause Event: sha256:pause_20260203_001                     │
│  Trigger Event: sha256:trigger_20260203_001                 │
│  Paused At: 2026-02-03T14:32:00Z                            │
│  Pause Duration: 00:45:22                                   │
├─────────────────────────────────────────────────────────────┤
│  Recovery Status:                                           │
│  ☐ Root cause identified                                    │
│  ☐ Approval 1: Pending                                      │
│  ☐ Approval 2: Pending                                      │
│  [Request Approval] [View Details]                          │
└─────────────────────────────────────────────────────────────┘
```

### Actions

| Status | Action |
|--------|--------|
| All Normal | Continue monitoring |
| Any Warning | Investigate trend, prepare mitigation |
| Any Critical | Pause will trigger automatically |
| Paused | Follow recovery procedure (dual-approval) |

---

## 4. DR Freshness Dashboard

**URL:** `/portal/dr`

### What It Shows

Disaster recovery drill status and compliance.

### Metrics

| Metric | Threshold | Description |
|--------|-----------|-------------|
| Days Since Drill | ≤ 90 | Time since last successful DR drill |
| Last Drill Result | Pass | Most recent drill outcome |
| RPO Achieved | ≤ Documented | Recovery Point Objective met |
| RTO Achieved | ≤ Documented | Recovery Time Objective met |

### How to Read

```
┌─────────────────────────────────────────────────────────────┐
│  DR FRESHNESS                                               │
├─────────────────────────────────────────────────────────────┤
│  Last Drill: 2026-01-10 (24 days ago)              🟢 Fresh │
│  Result: Pass                                      ✅       │
│  RPO: 2 hours (target: 4 hours)                    ✅       │
│  RTO: 4 hours (target: 8 hours)                    ✅       │
├─────────────────────────────────────────────────────────────┤
│  Next Scheduled Drill: 2026-04-10                           │
│  Drill Freshness Expiry: 2026-04-10 (66 days remaining)     │
│                                                             │
│  ████████████████████░░░░░░░░░░░░░░░░░░  27%               │
│                        66 days until threshold              │
└─────────────────────────────────────────────────────────────┘
```

### Freshness States

| Days Since Drill | Status | Action |
|------------------|--------|--------|
| 0–60 | 🟢 Fresh | No action needed |
| 61–80 | 🟡 Approaching | Schedule next drill |
| 81–89 | 🟠 Urgent | Execute drill this week |
| 90+ | 🔴 Expired | **BLOCKER** — DR_DRILL_FAILURE triggered |

---

## 5. KPI Dashboard

**URL:** `/portal/kpis`

### What It Shows

Key performance indicators for pilot exit criteria.

### Metrics

| KPI | Threshold | Measurement |
|-----|-----------|-------------|
| MTTR | ≤ 30 min | 7-day rolling average |
| Rollback Success | ≥ 95% | Pilot duration |
| Availability | ≥ 99.5% | Pilot duration |
| Incident Response | ≤ 15 min (p95) | All incidents |

### How to Read

```
┌─────────────────────────────────────────────────────────────┐
│  PILOT KPIs                                   Day 7 of 14   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MTTR (7-day rolling)                                       │
│  ████████████████████████░░░░░░  22 min / 30 min  🟢        │
│                                                             │
│  Rollback Success (pilot)                                   │
│  ██████████████████████████████  98% / 95%        🟢        │
│                                                             │
│  Availability (pilot)                                       │
│  ██████████████████████████████  99.8% / 99.5%    🟢        │
│                                                             │
│  Incident Response (p95)                                    │
│  ████████████████████░░░░░░░░░░  12 min / 15 min  🟢        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Exit Gate Status: 4/4 KPIs passing                         │
│  Trend: Stable                                              │
└─────────────────────────────────────────────────────────────┘
```

### Trend Indicators

| Trend | Icon | Meaning |
|-------|------|---------|
| Improving | ↗️ | Metric getting better |
| Stable | → | Metric holding steady |
| Degrading | ↘️ | Metric getting worse |
| Volatile | ↕️ | Metric fluctuating significantly |

### Actions

| Status | Action |
|--------|--------|
| All Green | Continue, document for exit |
| Any Yellow | Investigate, document in war room |
| Any Red | MTTR_REGRESSION may trigger pause |

---

## Quick Reference Card

### Daily Checks

| Dashboard | Check | Threshold |
|-----------|-------|-----------|
| Readiness | Score | ≥ 95% |
| Exceptions | Expired | = 0 |
| Stop Watch | All conditions | Normal |
| DR | Freshness | ≤ 90 days |
| KPIs | MTTR | ≤ 30 min |

### Warning Signs

| Indicator | Meaning | Urgency |
|-----------|---------|---------|
| 🟡 in any dashboard | Trending toward issue | Review today |
| 🟠 in any dashboard | Near threshold | Action within 24h |
| 🔴 in any dashboard | Threshold exceeded | Immediate action |
| ⏸️ Paused | Stop condition triggered | Recovery required |

### Escalation Path

| Level | Contact | Trigger |
|-------|---------|---------|
| L1 | On-Call Operator | Any 🟡 indicator |
| L2 | Incident Commander | Any 🔴 or ⏸️ |
| L3 | Platform Engineering | Unresolved after 1h |
| L4 | Executive Sponsor | Policy decisions |

---

## References

- War Room Cadence: [WAR_ROOM_CADENCE.md](WAR_ROOM_CADENCE.md)
- Exit Criteria: [PILOT_EXIT_CRITERIA.md](PILOT_EXIT_CRITERIA.md)
- Stop-Condition Runbook: [STOP_CONDITION_REHEARSAL_RUNBOOK.md](STOP_CONDITION_REHEARSAL_RUNBOOK.md)
- Executive Brief: [EXECUTIVE_BRIEF.md](EXECUTIVE_BRIEF.md)

---

*Government. Transcended.*

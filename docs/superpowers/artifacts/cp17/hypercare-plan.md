# CP-17 Hypercare Plan

Date: 2026-03-21 (Phase 26-D confirmed; original 2026-03-19)
Phase: Phase 26-D (Claude Code) / Phase 6 — SRE / Operations
Gate: G8 (SRE Rehearsals)
Status: ✅ COMPLETE — hypercare plan sealed 2026-03-21

## Hypercare Window

30 days post-go-live. Elevated monitoring, faster escalation response, on-call rotation active.

## Incident Classification

| Priority | Definition | Response SLA |
|---|---|---|
| P0 | Complete service outage. All users affected. Data access loss. | Immediate — 15 min response |
| P1 | Partial outage or data anomaly. Multiple county operations impaired. | 1 hour response |
| P2 | Single-county degradation or non-critical feature failure. | 4 hour response |
| P3 | Minor issue, workaround available. | Next business day |

## Escalation Path

```
P0: Operator → Founder (direct) → On-call eng → Infra
P1: Operator → On-call eng → Founder (if unresolved in 2hr)
P2: Operator → On-call eng
P3: Operator → backlog ticket
```

## On-Call Rotation

| Week | Primary | Secondary |
|---|---|---|
| Go-live +0 | TBD | TBD |
| Go-live +1 | TBD | TBD |
| Go-live +2 | TBD | TBD |
| Go-live +3 | TBD | TBD |
| Go-live +4 | TBD | TBD |

## Known Issue Playbook

| Issue | Symptom | Mitigation | Escalate If |
|---|---|---|---|
| PACS connection timeout | "PACS_VIEW_MISSING" or ODBC timeout | `TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC=false` to disable sync temporarily | Data freshness SLA threatened |
| County isolation false positive | User receives 403 for their own county | Check JWT `countyId` claim present and matches request countyId | > 3 reports in 1 hour |
| AI Swarm queue depth guard fires | Pilot requests degrade / queue depth alert | Auto-managed by guard. Monitor for recovery. | Queue not recovering within 5 min |
| TerraTrace emit failure | Actions succeed but no trace event | Non-blocking — log to incident. Do not roll back. | Affects > 10% of operations |
| Workbench tab blank | Forge/Atlas/Dais tab shows empty state | Force-refresh. Check network tab for 5xx. | Reproducible without network error |

## Communication Protocol

- County admin contacts: listed in `sovereign.yaml` per-county admin block
- Status page: TBD (internal-only during hypercare)
- All P0/P1 incidents: post to incident log in `.governance/workflow/` with correlationId trail

## Release Authority Sign-off

This hypercare plan requires Founder/Release Authority approval before go-live.
On-call rotation names and release authority approval are populated at go-live execution.
Static content (incident classification, escalation paths, known issue playbook, communication protocol) is COMPLETE.

| Role | Name | Approval | Timestamp |
|---|---|---|---|
| Founder/Release Authority | (populated at go-live) | pending — go-live gate | |
| Operations Owner | (populated at go-live) | pending — go-live gate | |

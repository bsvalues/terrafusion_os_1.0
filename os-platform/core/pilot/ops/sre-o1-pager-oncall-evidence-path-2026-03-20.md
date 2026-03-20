# SRE-O1 Pager / On-Call Evidence Path

Date: 2026-03-20
Status: AUTHORIZED
Scope: Define the only truthful pager/on-call execution surface that may be used to close the remaining `SRE-O1-OPS` blocker for the Benton Hostinger release lane

## Why This Artifact Exists

The current Hostinger snapshot footprint does not expose a deployed pager-capable monitoring surface.

That means pager/on-call validation cannot be truthfully completed on-box there.

`SRE-O1-OPS` may still close, but only by executing the pager/on-call proof on an explicitly authorized off-box observability surface that is real, routable, and tied back to the same release lane.

## Authorized Execution Surface

The authorized pager/on-call execution surface for this lane is the external observability stack that satisfies all of the following:

1. alert evaluation is performed by a real Prometheus-capable monitoring plane
2. alert routing is performed by a real Alertmanager-capable routing plane
3. critical alerts route to a real on-call receiver, with PagerDuty as the canonical receiver shape already documented in repo observability guidance
4. the alert is bound to the Benton release lane by environment identity and release metadata

Repo truth supporting this authorization:

- `.github/workflows/README_OBSERVABILITY_CI.md` documents the canonical critical-alert route shape: `severity: critical` -> Alertmanager receiver `pagerduty`
- `ops/validation/alert_trace_map.yaml` documents a concrete critical alert shape with `severity: critical` and `pagerduty: "true"`
- `os-platform/core/pilot/ops/sre-o1-ops-status-2026-03-20.md` proves the Hostinger box itself does not currently host that surface

## Minimum Evidence Required

The off-box execution bundle must contain sanitized proof of all items below:

1. the alert source
   - alert rule or synthetic firing input
   - severity = `critical`
   - Benton lane identity and target environment
2. the routing proof
   - Alertmanager route evaluation or equivalent routed-receiver proof
   - receiver must be the real on-call path for critical incidents
3. the on-call receipt
   - PagerDuty incident or equivalent real incident receipt
   - timestamp
   - incident key or sanitized identifier
4. the operator acknowledgement
   - human acknowledgement timestamp or escalation evidence
5. the release-lane binding
   - release environment
   - release SHA or deployed-at stamp
   - public host or equivalent runtime identity
6. the observability correlation
   - dashboard, alert trace, or monitoring query that matches the same incident

## Acceptance Rule

`SRE-O1-OPS` pager/on-call validation may be marked COMPLETE only when the proof bundle shows that a real critical alert for the Benton release lane was routed through the authorized monitoring surface and received by the real on-call path.

Documentation-only statements, repo examples, or undeployed config stubs do not satisfy this requirement.

## Explicitly Not Accepted

The following do not close the blocker:

- Hostinger box inspection alone
- screenshots without routed incident evidence
- Slack-only notification without the critical on-call route
- static repo files that were not executed on a live monitoring surface
- synthetic notes that are not bound to Benton release metadata

## Operational Next Step

Execute the pager/on-call test on the real off-box observability surface, then publish a sanitized verification artifact under `os-platform/core/pilot/ops/**` that records the routed incident proof and links it back to `SRE-O1-OPS`.
# SRE-O1 Pager / On-Call Evidence Path

Date: 2026-03-21
Status: REVISED
Scope: Define the truthful pager/on-call execution surface rules for closing the remaining `SRE-O1-OPS` blocker for the Benton Hostinger release lane

## Why This Artifact Exists

The current Hostinger snapshot footprint is the live Benton truth surface, but it does not expose a deployed pager-capable monitoring surface.

That means pager/on-call validation cannot be truthfully completed on-box there.

`SRE-O1-OPS` may still close, but only by collecting closure evidence from the live Hostinger-backed Benton lane or from a separately verified off-box observability surface that is real, routable, and tied back to that same release lane.

## Execution Surface Rule

Pager/on-call closure for this lane may be executed only on a surface that is proven to satisfy all of the following:

1. alert evaluation is performed by a real monitoring plane
2. alert routing is performed by a real alerting plane
3. critical alerts route to a real on-call receiver, with PagerDuty remaining the canonical receiver shape already documented in repo observability guidance
4. the alert is bound to the Benton release lane by environment identity and release metadata
5. the surface is currently verified, not merely named in repo documentation

Repo truth supporting this authorization:

- `.github/workflows/README_OBSERVABILITY_CI.md` documents the canonical critical-alert route shape: `severity: critical` -> Alertmanager receiver `pagerduty`
- `ops/validation/alert_trace_map.yaml` documents a concrete critical alert shape with `severity: critical` and `pagerduty: "true"`
- `os-platform/core/pilot/ops/sre-o1-ops-status-2026-03-20.md` proves the Hostinger box itself does not currently host that surface

## Current Verified Posture

The current verified Benton runtime is the Hostinger snapshot lane documented in:

- `os-platform/core/pilot/ops/hostinger-control-plane.md`
- `.github/workflows/release-lane.yml`
- `.github/workflows/health-check.yml`
- `.github/workflows/infra-probe.yml`

The current verified Hostinger footprint does not expose a pager-capable monitoring surface.

Repo documentation and workflows still contain Azure/AKS observability references, including:

- `.github/workflows/README_OBSERVABILITY_CI.md`
- `.github/workflows/observability-ci.yml`

Those references are not sufficient, by themselves, to authorize an execution surface for this lane.

Until a real off-box surface is separately verified as live, reachable, receiver-capable, and bound to the Benton release lane, the Azure/AKS path must be treated as an unverified alternate lane rather than current operational truth.

Current truthful outcome:

1. Hostinger is the verified live Benton runtime
2. Hostinger does not currently provide the required pager/on-call surface
3. no separate off-box pager/on-call surface has yet been verified for this lane

## Operator Rule For Next Attempt

The next truthful attempt must begin by proving the execution surface itself before any alert drill is attempted.

The minimum operator path is:

1. identify the claimed live pager/on-call execution surface for the Benton lane
2. prove that the surface is real, reachable, and currently deployed
3. prove that the surface routes critical incidents to the real on-call receiver
4. prove that the surface can be bound to Benton release metadata for the target environment
5. only then execute the critical alert drill and collect routed incident proof

If the operator cannot prove steps 1 through 4, the correct result is a blocked-attempt receipt rather than beginning with `az`, `az aks get-credentials`, `kubectl`, or a documentation-only closure attempt.

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

`SRE-O1-OPS` pager/on-call validation may be marked COMPLETE only when the proof bundle shows that a real critical alert for the Benton release lane was routed through a verified live monitoring surface and received by the real on-call path.

Documentation-only statements, repo examples, or undeployed config stubs do not satisfy this requirement.

## Explicitly Not Accepted

The following do not close the blocker:

- Hostinger box inspection alone
- Azure/AKS workflow references without live surface verification
- screenshots without routed incident evidence
- Slack-only notification without the critical on-call route
- static repo files that were not executed on a live monitoring surface
- synthetic notes that are not bound to Benton release metadata

## Operational Next Step

First verify or commission a real pager-capable execution surface for the Benton lane, then execute the pager/on-call test on that surface and publish a sanitized verification artifact under `os-platform/core/pilot/ops/**` that records the routed incident proof and links it back to `SRE-O1-OPS`.
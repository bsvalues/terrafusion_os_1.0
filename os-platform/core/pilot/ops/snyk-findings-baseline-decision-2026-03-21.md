# Snyk Findings Baseline Decision

Date: 2026-03-21
Status: ACTIVE
Owner lane: core pilot ops
Purpose: separate scan-contract restoration from findings disposition so Snyk does not become a surprise release gate

## Restore Decision

The Snyk restore slice is successful.

- Repo-owned runner is the canonical truth for Snyk code and IaC semantics.
- Editor and profile drift are no longer authoritative for release-path scans.
- Local CLI auth and repo-standard execution are verified.

This is a restore success.

This is not final security closure.

## Lane Split

Two separate lanes now exist and must remain separate:

- Lane A: scan contract correctness
- Lane B: finding disposition and enforcement

Do not claim Lane B closure from Lane A completion.

## Current Scan Truth

### Code surface

Current governed code targets:

- `tools/registry`
- `os-platform/core/pilot`
- `os-platform/core/types`

Current verified result:

- `npm run security:scan` completed with 71 findings on 2026-03-21

This proves the scanner is live and not fake-green.

### IaC surface

Current configured IaC target:

- `charts`

Current workspace truth:

- root `charts` directory does not exist in this governed workspace
- IaC mode therefore skips truthfully
- this skip does not mean all infrastructure surfaces were scanned

Quarantined chart trees are not the governed scan surface for this lane.

## Enforcement Decision

The current 71 code findings are not yet ratified as a hard release-fail gate.

Until formal triage is completed, the correct posture is:

- scanner must run truthfully
- findings must remain visible
- findings are governed debt, not silent debt
- checks should not be reinterpreted as full release closure

Required next classification buckets:

- fix-now
- accepted baseline / known debt
- false positive / not applicable

## Check Naming Decision

Distinct CI check surfaces should remain explicit:

- `security-snyk-code`
- `security-snyk-iac`

This avoids one vague security result masking whether code ran, IaC skipped, or both.

## Next Required Slice

Next slice must ratify:

1. the real governed IaC target set, if any
2. the 71 findings baseline and disposition policy
3. the threshold at which Snyk findings become a hard required gate

Until that slice lands, truthful execution and truthful skip semantics are the governing standard.
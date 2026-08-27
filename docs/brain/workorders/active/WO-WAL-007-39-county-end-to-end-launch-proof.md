# WO-WAL-007 — 39-County End-to-End Launch Proof

| Field | Value |
| --- | --- |
| Status | `BLOCKED_ON_WAL_001_006` |
| Program | Washington Assessor Launch V1 |
| Risk | R4 integrated release-candidate acceptance |
| Terminal condition | `WAL_RELEASE_CANDIDATE_ACCEPTED_ALL_39_CONTEXTS_NO_LAUNCH_BLOCKING_GAPS` |

## Objective

Prove one exact release candidate across the full launch contract before any production promotion.

## Required acceptance matrix

### All 39 county contexts

For every Washington county, prove in real API/browser runtime:

- county exists in canonical control plane and Counties HUB;
- public baseline state is truthful and provenance/freshness is visible;
- actual runtime endpoint/row behavior matches the county and never silently returns Benton;
- advertised TerraForge capabilities match observed inputs;
- launch-eligible public workflow(s) function where their inputs exist;
- explicit source/capability gaps are rendered honestly where inputs do not exist.

### Deep journeys

Execute at least:

1. real county upload: authenticate → upload → validate/quarantine → lineage → canonical promotion → HUB state change → TerraForge consumption → import rollback;
2. read-only Sync: connect representative source profile → ingest/checkpoint → lineage/quarantine → HUB freshness/state → TerraForge consumption → disconnect/rollback with external source unchanged;
3. more than one materially distinct source family so the proof is not merely Benton/Harris repeated;
4. session/navigation re-entry and stale-state tests.

### Adversarial/security

- county A credentials against county B upload/connected/runtime data;
- route/body/header county tampering;
- public mode against county-provided/connected data;
- invalid/missing county with no Benton fallback;
- malformed upload, duplicate upload, schema drift;
- Sync schema drift and attempted source write path;
- stale UI cache/context after switching/auth changes;
- representative auth/authorization denial and non-disclosure checks.

## Release identity

Bind the candidate to exact sovereign/suite commits, build artifacts/images, schema/migration set, frontend bundle, configuration class, county source/profile versions and test/proof run identities. Re-running proof against a different build is not acceptance.

## Launch-blocking rule

Any P0/P1 product/security/isolation/data-integrity/rollback finding is blocking until repaired and re-proven at exact head. A non-launch-related pre-existing CI defect may remain separately recorded only when deterministic evidence proves it predates the candidate and does not weaken required launch controls.

## Output

One machine-readable WAL acceptance receipt and human-readable matrix, exact-head independent review, zero unresolved substantive review threads, and `GO` only if every terminal requirement above is satisfied.

## Denials

No production promotion in this WO, no test bypass, no sampled 39-county claim based on fewer counties, no substituting synthetic fixtures for required runtime/browser proof where the acceptance contract says real runtime.

## Continuation

`GO` automatically admits WAL-008 for the exact accepted candidate. `NO_GO` remains in this mission until repaired; do not return to the owner for routine remediation.

# WO-SR-007A - Atlas Local Sovereign Shadow Projection Proof

| Field | Value |
| --- | --- |
| Status | ACTIVE - PHASE 0 AUTHORITY ACTIVATION |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R3 bounded local sovereign shadow projection proof |
| Authority | `OWNER-SR-007A-R3-ATLAS-LOCAL-SHADOW-PROJECTION-20260729` |
| Sovereign base | `12019bce0850b28ded91e5e820d0f54d202a14cc` |
| Atlas base | `6c530f1b6b77d59225353dede929c0688f1587da` |
| Atlas module | `src/spatial-read/project-atlas-feature.mjs` |
| Module SHA-256 | `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46` |
| Merge mode | Mode B, sequential staged exact scope |
| Terminal condition | `ATLAS_LOCAL_SOVEREIGN_SHADOW_PROJECTION_PROVEN_WITHOUT_RUNTIME_ADOPTION` |

## Objective

Prove the exact standalone Atlas projection module can consume the existing pure unwired sovereign
spatial-read adapter output through a local, disposable, hash-pinned test path without runtime
adoption, Atlas repository mutation, network access, installation, or persistent configuration.

## Required Sequence

1. Merge this governance-only authority activation. No test or validation script is introduced here.
2. Implement the exact focused test and local validation script, execute the bounded proof, and merge
   the implementation PR.
3. Merge a governance-only terminal closeout that consumes the decision and returns the program to
   portfolio reconciliation.

## Proof Boundary

- Polygon state uses the real sovereign adapter result before invoking the exact Atlas module.
- Point and unavailable states use frozen synthetic contract shapes and make no adapter claim.
- County or parcel mismatch and invalid geometry fail before Node execution.
- Cross-lane fields are excluded from the bounded input; the proof does not claim Atlas rejects fields
  it never receives.
- Repeated inputs produce byte-normalized deterministic output.
- A tampered disposable module copy is rejected before execution.

## Denials

No `backend/src/**` change, runtime wiring, DI, controller, service, provider, persistence, GIS
service, HTTP/network access, Atlas repository mutation, source extraction, workflow, package,
publication, deployment, production, county/PACS/SQL access, credential, secret, source retirement,
ownership transfer, or cutover is authorized.

## Stop Conditions

Stop on source/hash mismatch, shared Atlas checkout mutation, network or install activity, residue
after cleanup, files outside the exact allowlist, required-check failure or bypass, unresolved
substantive review, exact-head assurance failure, or any denied boundary.

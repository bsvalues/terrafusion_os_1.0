# WO-SR-007B - Atlas Unwired Projection Process Host Foundation Evidence

## Current Result

`PHASE_1_IMPLEMENTATION_VALIDATED_PENDING_MERGE`

## Bound Identity

| Surface | Exact identity |
| --- | --- |
| Sovereign implementation base | `e4157f69a692a830caea96644cf07e6b85f28271` |
| Atlas base | `6c530f1b6b77d59225353dede929c0688f1587da` |
| Atlas module | `src/spatial-read/project-atlas-feature.mjs` |
| Module SHA-256 | `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46` |
| Authority | `OWNER-SR-007B-R3-ATLAS-UNWIRED-PROJECTION-HOST-20260729` |

## Phase 0

This governance-only phase records the active owner decision, exact 14-file allowlist, denials,
stop conditions, sequential Mode B delivery, and terminal condition. It creates no source, test,
script, runtime, configuration, Atlas repository, workflow, deployment, or capability change.

Phase 0 merged in PR #1392 from exact reviewed head
`43b31090e26a0c17f7d13b24c5ab7a6aa01b0ecb` and produced sovereign implementation base
`e4157f69a692a830caea96644cf07e6b85f28271`.

## Phase 1 Local Proof

| Evidence | Result |
| --- | --- |
| Disposable Atlas checkout | `C:\Users\bsval\.codex-reference\terrafusion-atlas-sr007b-lf` |
| Atlas checkout settings | `core.autocrlf=false`; `core.eol=lf`; detached exact commit; clean before and after |
| Atlas source commit | `6c530f1b6b77d59225353dede929c0688f1587da` |
| Atlas module | `src/spatial-read/project-atlas-feature.mjs` |
| Source SHA-256 | `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46` - PASS |
| Build storage | Invocation-owned `E:\tf-build\sr-007b-unwired-process-host\<run-id>`; removed after proof |
| Backend build | PASS - 0 warnings, 0 errors |
| Focused tests | PASS - 33 passed, 0 failed, 0 skipped |
| Runtime consumers | 0 |
| DI registrations | 0 |
| Atlas repository mutation | No |
| Runtime adoption | No |

The proof covers canonical `polygon`, Point, unavailable, deterministic normalization, canonical path and hash
verification, copied-byte verification, exact identity and property allowlists, malformed and
oversized input/output, invalid geometry, raw-socket and DNS network denial, filesystem denial, nonzero exit, timeout,
cancellation, process-tree termination, and cleanup. The validation script uses an explicit local
Node executable and a local package cache; it performs no package install and no remote artifact
fetch.

## Required Implementation Evidence

- Exact sovereign and Atlas commits plus exact source and copied-module hashes.
- Absolute canonical `.mjs` source validation and execution of only the verified disposable copy.
- Filesystem-confined local Node invocation with network primitives denied and no package install.
- One-MiB stdin and stdout limits, 64-KiB stderr limit, one JSON result, and no trailing content.
- Polygon, Point, and JSON-null results with deterministic normalization.
- Exact top-level and property allowlists plus county and parcel identity preservation.
- Fail-closed path, hash, input, output, geometry, process, network, filesystem, timeout,
  cancellation, and size-limit proofs.
- Full process-tree termination and invocation-owned cleanup after every outcome.
- Zero DI registrations, runtime consumers, persistent configuration, Atlas mutations, providers,
  network calls, persistence, deployment, or protected-resource access.
- Zero-warning backend build, focused and affected tests, Work Order tooling, remote checks,
  exact-head assurance, and zero unresolved substantive review threads.

## Rollback

Revert the governance activation before implementation, or delete the two unwired source files,
focused test, proof script, and lifecycle records after implementation. No runtime configuration,
Atlas source, external system, or production state requires reversal.

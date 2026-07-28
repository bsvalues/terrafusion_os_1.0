# WO-SR-006A - Forge Standalone Kernel Artifact and Shadow-Consumer Gate Evidence

## Current Result

`AUTHORITY_ACTIVE_IMPLEMENTATION_PENDING`

## Authority

Owner decision `OWNER-SR-006A-R3-FORGE-SHADOW-CONSUMPTION-20260728` grants one sequential R3
envelope at sovereign base `5f9955ca9d1dd09ed3485ebcea0587794a831f20` and Forge base
`2430b483f20e07a6ff9a66e493caab0e39db64ef`.

The envelope covers one governance-only activation PR, one exact three-file Forge producer PR, and one
exact sovereign shadow-consumer/closeout PR. It grants no runtime switch, source retirement,
publication, deployment, protected-data access, or credential provisioning.

## Phase 0 Proof

- Exact decision and cross-repository allowlist recorded.
- WO-SR-006A admitted as active only after this PR merges.
- Forge and sovereign implementation files remain unchanged.
- Workflow and integration-test changes remain deferred until authority is on sovereign `main`.

## Required Terminal Evidence

The terminal update must record:

- activation PR head and merge;
- Forge producer PR head and merge;
- merged-main workflow run ID, artifact name, source hashes, toolchain, filename, and SHA-256;
- private retrieval and pre-execution hash verification;
- accepted/fail-closed/exit/deterministic parity;
- unchanged sovereign runtime and empty `backend/src/**` and appsettings diffs;
- backend zero-warning build, Work Order tooling, remote checks, assurance, and review state;
- additive rollback proof;
- consumed authority and return to portfolio reconciliation.

## Stop Type

`NONE` while execution remains within the recorded envelope.

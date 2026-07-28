# WO-SR-006A - Forge Standalone Kernel Artifact and Shadow-Consumer Gate

| Field | Value |
| --- | --- |
| Status | COMPLETE ON MERGE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R3 bounded local artifact and non-production shadow consumption |
| Authority | `OWNER-SR-006A-LOCAL-SOVEREIGN-SHADOW-CORRECTION-20260728` |
| Sovereign base | `5f9955ca9d1dd09ed3485ebcea0587794a831f20` |
| Forge proof commit | `24059c3642339f36877cb454ca63683180915b71` |
| Dependency | WO-SR-006A-P complete |
| Merge mode | Mode B, bounded exact scope |
| Terminal condition | `FORGE_LOCAL_SOVEREIGN_SHADOW_CONSUMPTION_PROVEN_WITHOUT_RUNTIME_SWITCH` |

## Objective

Build the existing standalone Forge valuation kernel locally from its exact merged commit, transfer
it through a disposable hash-pinned local directory, consume it only in the sovereign non-production
integration harness, and prove accepted and fail-closed parity without changing the configured
runtime or retiring source.

## Sequence

1. Merge this governance-only authority activation.
2. Merge the exact three-file Forge producer change; retain its Actions artifact as historical CI
   evidence, not as the sovereign supply chain.
3. Build exact Forge `24059c3642339f36877cb454ca63683180915b71` locally, verify the disposable
   artifact, run the sovereign shadow test, delete the artifact, and merge this closeout.

## Boundaries

The exact file allowlist and denials are recorded in the owner decision and registry. No product
source, runtime configuration, package, publication, deployment, county/PACS/SQL access, credential
provisioning, source retirement, or cutover is authorized.

No GitHub artifact retrieval, cross-repository credential, network execution path, package, release,
or persistent distribution is part of the sovereign proof.

## Validation

- Forge source and Cargo metadata unchanged.
- Existing Forge kernel tests and parity corpus pass.
- Manifest records repository, exact commit, source hashes, command, target, toolchain, filename, and
  executable SHA-256.
- The local artifact manifest records exact Forge commit, source hashes, toolchain, filename, and
  SHA-256 `86d5a0c34c6881c26352e7f344090366c19066dd93b9357d8f9ebf62e524abba`
  for the exact artifact executed by the final local proof run.
- The disposable local transfer verifies SHA-256 before execution and is removed afterward.
- Accepted output, fail-closed output, exit behavior, and deterministic serialization match.
- Existing sovereign executable remains the configured runtime.
- Backend build passes with zero warnings and zero errors.
- Work Order query/tooling, remote checks, exact-head assurance, and review resolution pass.

## Stop Conditions

Stop only for scope expansion, credential provisioning, network artifact transfer, artifact/hash
mismatch, required-check failure or bypass, unresolved substantive review, runtime-path mutation,
public publication, protected-resource access, or conflicting authority.

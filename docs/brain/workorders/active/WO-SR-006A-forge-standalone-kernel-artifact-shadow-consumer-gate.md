# WO-SR-006A - Forge Standalone Kernel Artifact and Shadow-Consumer Gate

| Field | Value |
| --- | --- |
| Status | ACTIVE |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R3 bounded private artifact and non-production shadow consumption |
| Authority | `OWNER-SR-006A-R3-FORGE-SHADOW-CONSUMPTION-20260728` |
| Sovereign base | `5f9955ca9d1dd09ed3485ebcea0587794a831f20` |
| Forge base | `2430b483f20e07a6ff9a66e493caab0e39db64ef` |
| Dependency | WO-SR-006A-P complete |
| Merge mode | Mode B, bounded exact scope |
| Terminal condition | `FORGE_SHADOW_CONSUMPTION_PROVEN_WITHOUT_RUNTIME_SWITCH` |

## Objective

Build the existing standalone Forge valuation kernel as a hash-pinned temporary private Actions
artifact, consume it only in the sovereign non-production integration harness, and prove accepted and
fail-closed parity without changing the configured runtime or retiring source.

## Sequence

1. Merge this governance-only authority activation.
2. Merge the exact three-file Forge producer change and produce the artifact from merged Forge main.
3. Merge the exact sovereign shadow consumer, evidence, and closeout change.

## Boundaries

The exact file allowlist and denials are recorded in the owner decision and registry. No product
source, runtime configuration, package, publication, deployment, county/PACS/SQL access, credential
provisioning, source retirement, or cutover is authorized.

Existing GitHub Actions identities and configured secret references may be used without reading or
exposing values. If those permissions cannot retrieve the private artifact, execution stops as
`BLOCKED_EXISTING_CREDENTIAL_OR_PERMISSION_REQUIRED`.

## Validation

- Forge source and Cargo metadata unchanged.
- Existing Forge kernel tests and parity corpus pass.
- Manifest records repository, exact commit, source hashes, command, target, toolchain, filename, and
  executable SHA-256.
- Artifact is private, immutable by exact run/name/SHA, and retained no longer than seven days.
- Sovereign retrieval verifies the SHA-256 before execution.
- Accepted output, fail-closed output, exit behavior, and deterministic serialization match.
- Existing sovereign executable remains the configured runtime.
- Backend build passes with zero warnings and zero errors.
- Work Order query/tooling, remote checks, exact-head assurance, and review resolution pass.

## Stop Conditions

Stop only for scope expansion, new credential provisioning, artifact/hash mismatch, required-check
failure or bypass, unresolved substantive review, runtime-path mutation, public publication, or
protected-resource access, or conflicting authority.

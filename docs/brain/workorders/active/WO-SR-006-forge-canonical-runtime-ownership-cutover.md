# WO-SR-006 - Forge Canonical Runtime Ownership Cutover

| Field | Value |
| --- | --- |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Loop | `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R4 |
| Status | Active - sovereign implementation and rollback proof ready for PR |
| Authority | `OWNER-SR-006-FORGE-CANONICAL-CUTOVER-20260728` |
| Sovereign base | `af0e21eea55c3421ac55aad6c87605a57d6f85de` |
| Forge base | `24059c3642339f36877cb454ca63683180915b71` |
| Merge mode | Mode B - sequential staged cutover |

## Objective

Transfer canonical ownership of the valuation kernel only to `bsvalues/terrafusion-forge`, make the
sovereign runtime consume a locally built and hash-verified Forge artifact, and retire only the
duplicate mutable sovereign valuation-kernel source.

## Sequential interlocks

1. Merge this governance-only authority activation.
2. Merge the Forge readiness-acceptance documentation before sovereign implementation begins.
3. Implement the sovereign cutover and duplicate retirement inside the exact allowlist.
4. Complete the disposable repository-level rollback rehearsal before implementation merge.
5. After the sovereign implementation merges, merge Forge finalization and sovereign closeout.

Phase 0 merged in sovereign PR #1385 as
`4e6a810c73b0e9e165a4e496f17dd9da44ec2449`. Forge readiness merged in Forge PR #3 as
`7a2716e5cd77992f5164e95e4bd9474d3b4150f8`. The sovereign implementation candidate now stages the
exact Forge artifact locally, binds runtime selection to its manifest, retires only the duplicate
valuation crate, preserves the cost crate, and passes the disposable repository rollback rehearsal.
Canonical ownership is not claimed until the sovereign implementation, Forge finalization, and
sovereign closeout PRs merge.

## Required proof

- Verify exact sovereign and Forge revisions and pre-cutover byte parity.
- Build Forge locally with committed inputs and stage a hash-verified executable plus manifest in an
  ignored OS-managed local artifact slot.
- Prove accepted, typed fail-closed, missing-artifact, mismatched-artifact, and exact binary
  provenance behavior through the real client/host path.
- Remove only `packages/terrabuild/kernels/terraforge.kernel.valuation/**`, remove that crate from
  the sovereign Cargo workspace and lockfile, and preserve the cost kernel and shared contracts.
- Prove a fresh-worktree bootstrap and a complete repository rollback rehearsal without committing
  binaries, manifests, build output, or machine-specific absolute paths.

## Explicit denials

No production deployment or activation, county runtime, PACS, SQL, protected county data,
credentials, secrets, GitHub artifact transfer, workflow or deployment-pipeline changes, cost-kernel
ownership transfer, controller or public API behavior change, shared-contract ownership transfer,
other-suite cutover, broad five-suite cutover, rollback-history deletion, or package publication.

## Terminal condition

`FORGE_CANONICAL_RUNTIME_OWNERSHIP_CUTOVER_AND_SOVEREIGN_DUPLICATE_RETIREMENT_PROVEN`

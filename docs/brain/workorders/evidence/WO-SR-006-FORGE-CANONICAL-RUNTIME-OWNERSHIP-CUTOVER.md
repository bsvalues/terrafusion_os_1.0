# WO-SR-006 - Forge Canonical Runtime Ownership Cutover Evidence

## Current state

`FORGE_CANONICAL_RUNTIME_OWNERSHIP_CUTOVER_AND_SOVEREIGN_DUPLICATE_RETIREMENT_PROVEN`

Owner decision `OWNER-SR-006-FORGE-CANONICAL-CUTOVER-20260728` authorizes a Forge-only R4 canonical
ownership transfer at sovereign base `af0e21eea55c3421ac55aad6c87605a57d6f85de` and exact Forge
base `24059c3642339f36877cb454ca63683180915b71`.

## Completed interlocks

- Sovereign authority activation: PR #1385, exact reviewed head
  `f02e376d344b5eb67573605b8c90f6a5030b377c`, merge
  `4e6a810c73b0e9e165a4e496f17dd9da44ec2449`.
- Forge readiness acceptance: Forge PR #3, exact reviewed head
  `ae552a14a2741ff5c513775a31f3f8b7a7cc4c99`, merge
  `7a2716e5cd77992f5164e95e4bd9474d3b4150f8`.
- Forge source commit: `24059c3642339f36877cb454ca63683180915b71`.
- Sovereign implementation: PR #1386, exact reviewed head
  `a7168fe9a7a48150e05a7e2beb05d8984e5e238f`, merge
  `827bb60515403a96417bdea6ec7f6ecc3ca08926`.
- Forge finalization: Forge PR #4, exact reviewed head
  `cef9842d3cabbf6aa2cd687a8bc084239b5d0b81`, merge
  `b36c2e130fb3fe9b34d7e67c8880f5b6d25b3084`.

## Local canonical artifact proof

The clean local Forge worktree passed its two locked offline tests and produced
`terraforge-kernel-valuation.exe` through the exact committed build inputs. The staged local
OS-managed artifact slot is ignored by Git and contains no committed binary or manifest.

| Input | SHA-256 |
| --- | --- |
| `kernels/terraforge.kernel.valuation/Cargo.toml` | `c27750c78f2ddf77e5cfca3fc6a020bd2bf5ddecb97fa10e44d2e20d2c5e2358` |
| `kernels/terraforge.kernel.valuation/Cargo.lock` | `087367b4a37c7a55700b4f9bec1ac073d5c6e8cc3932f1a4220a9abbba0b48bd` |
| `kernels/terraforge.kernel.valuation/build.rs` | `9220a3d4c6011d835c4fd45ef07cf34a109fe434527926d4e12848ebbae921f6` |
| `kernels/terraforge.kernel.valuation/src/main.rs` | `3dbad9a2c89c061fccdfc2a0d05d7074a6b397bc05da6ee5e9a23844d209f4ae` |
| staged executable | `377f333f0478dd9046b9625b44fe6aee880b60ddb6b8a212a2d443fda1d2422c` |

`Stage-ForgeValuationKernel.ps1` proved:

- exact Forge origin, commit, Git blobs, and source hashes;
- local offline locked build and tests;
- manifest-bound executable provenance;
- accepted behavior through the real client/host path;
- fail-closed missing-manifest and mismatched-artifact behavior;
- unchanged sovereign cost-kernel behavior;
- no network artifact transfer.

The final focused canonical-path run passed 5 tests, including deterministic repeated-output proof
and rejection of a manifest with a mismatched frozen source hash.

The canonical Release solution restore/build ran with NuGet and artifacts redirected to external
local build storage and completed with 0 warnings and 0 errors.

## Source retirement and rollback proof

The candidate removes only `packages/terrabuild/kernels/terraforge.kernel.valuation/**`, removes
that member from the sovereign Cargo workspace and lockfile, and retains
`terraforge.kernel.cost`. The existing kernel workflow was narrowed to the retained cost kernel after
CI exposed its stale valuation-binary expectation, and the cost source received rustfmt-only
normalization. No cost behavior or ownership, shared contract, public API, deployment, credential,
secret, county/PACS/SQL, or other-suite surface changed.

At candidate `538eeaeb3b33fd67381a4a17af3b41a2d303c58c`, the disposable sparse rollback worktree reversed
the complete cutover range to sovereign base `4e6a810c73b0e9e165a4e496f17dd9da44ec2449`. It restored
the three exact valuation-source blobs, the original Cargo workspace member, and the original
valuation runtime path. Four Rust tests and seven focused backend tests passed. The proof used no
production or protected resources and removed its disposable worktree and generated outputs.

## Terminal verification

- Sovereign PR #1386: `45` passing checks, `0` failures, `0` unresolved review threads, clean
  exact-head squash merge.
- Forge PR #4: `5` passing checks, `0` failures, `0` unresolved review threads, clean exact-head
  squash merge.
- Duplicate sovereign valuation source: absent from sovereign `main`.
- Sovereign cost kernel and shared contracts: retained.
- Forge valuation source: canonical at exact source commit
  `24059c3642339f36877cb454ca63683180915b71`.
- Runtime integration ownership: retained by the sovereign OS.
- Production, deployment, county/PACS/SQL, credentials, secrets, publication, cost ownership,
  public APIs, shared-contract ownership, and other suites: unchanged.

## Closeout

`PASS`

This exact-scope closeout consumes `OWNER-SR-006-FORGE-CANONICAL-CUTOVER-20260728` on merge and
returns the Five-Suite program to portfolio reconciliation. No successor implementation or cutover
authority is implied.

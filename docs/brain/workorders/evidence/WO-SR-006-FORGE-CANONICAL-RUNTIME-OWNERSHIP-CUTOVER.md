# WO-SR-006 - Forge Canonical Runtime Ownership Cutover Evidence

## Current state

`SOVEREIGN_IMPLEMENTATION_AND_ROLLBACK_PROOF_READY_FOR_PR`

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
| staged executable | `899b66675a29ff8dec33e2814315ba0f13bc2eb076765fa08d7cd6164046c0b0` |

`Stage-ForgeValuationKernel.ps1` proved:

- exact Forge origin, commit, Git blobs, and source hashes;
- local offline locked build and tests;
- manifest-bound executable provenance;
- accepted behavior through the real client/host path;
- fail-closed missing-manifest and mismatched-artifact behavior;
- unchanged sovereign cost-kernel behavior;
- no network artifact transfer.

The final focused canonical-path run passed 4 tests, including rejection of a manifest with a
mismatched frozen source hash.

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

## Remaining interlocks

- Sovereign implementation PR review, required checks, exact-head assurance, merge, and
  post-merge verification.
- Forge documentation-only finalization after the sovereign implementation merge.
- Sovereign authority closeout and portfolio reconciliation.

No completion or cutover claim is made until all required phases merge and the terminal condition is
verified.

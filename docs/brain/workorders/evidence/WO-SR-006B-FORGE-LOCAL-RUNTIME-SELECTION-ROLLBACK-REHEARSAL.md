# WO-SR-006B - Forge Local Runtime-Selection and Rollback Rehearsal Evidence

## Current Result

`FORGE_LOCAL_RUNTIME_SELECTION_AND_ROLLBACK_REHEARSAL_PROVEN_NO_PERSISTENT_SWITCH`

## Authority

Owner decision `OWNER-SR-006B-R3-FORGE-LOCAL-RUNTIME-ROLLBACK-20260728` authorizes one bounded,
non-production process-local rehearsal at sovereign base
`0d1167fce6e887e1f49f4e75963f441e9f04ab06` and exact Forge commit
`24059c3642339f36877cb454ca63683180915b71`.

## Local Proof

The proof ran from isolated sovereign and Forge worktrees. It:

- verified the shared `D:\terrafusion-forge` checkout remained clean and unchanged;
- passed 2/2 Forge kernel tests and consumed the pre-existing configured sovereign executable;
- verified the disposable manifest before execution;
- passed the focused client/host runtime-selection and rollback test: 1 passed, 0 failed, 0 skipped;
- proved accepted Forge invocation, typed fail-closed Forge invocation, and accepted sovereign
  rollback invocation;
- exercised the pre-existing sovereign comparison executable at the established configured local path
  `packages/terrabuild/kernels/target/release/terraforge-kernel-valuation.exe`;
- matched `KernelBinarySha256` to the selected binary in every state;
- restored process environment values and removed the disposable proof directory;
- passed the full Release backend build with 0 warnings and 0 errors using D-drive package and
  artifact redirection;
- passed Work Order query validation and all 41 query/planner tests;
- produced no `backend/src/**` or `appsettings*.json` delta.

## Artifact and Toolchain Evidence

| Evidence | Value |
| --- | --- |
| Forge commit | `24059c3642339f36877cb454ca63683180915b71` |
| Final Forge rehearsal artifact SHA-256 | `add713984f1a78ffbb87c88a6d9eedcab1cf3912c414d522127ff078c4267811` |
| Final sovereign comparison artifact SHA-256 | `4896ae1308228619ee5898531ed0c05ca2f918394d264d178e510b476bbed818` |
| Prior same-WO Forge artifact SHA-256 | `c475eef7461275bed46f4150f8ca1155ef692323e103fb2aca9e52680d8985ac` |
| Prior same-WO sovereign artifact SHA-256 | `4896ae1308228619ee5898531ed0c05ca2f918394d264d178e510b476bbed818` |
| Prior WO-SR-006A artifact SHA-256 | `7fc77d5f475581ceaa87501d4c521e005857c8cfd85334ab09569d92ae716e88` |
| Reproducibility classification | `BINARY_HASH_CHANGED_REPRODUCIBILITY_NOT_CLAIMED` |
| Current Rust compiler | `rustc 1.92.0 (ded5c06cf 2025-12-08)` |
| Current Cargo | `cargo 1.92.0 (344c4567c 2025-10-21)` |
| Current target | `x86_64-pc-windows-gnu` |
| Prior toolchain | `UNKNOWN_NOT_RETAINED_BY_WO-SR-006A` |

The binary mismatch does not invalidate the rehearsal. All source hashes match the exact pinned
Forge commit, each new manifest hash verified before execution, accepted and fail-closed behavior
passed, and rollback passed. Multiple WO-SR-006B runs under the same recorded current source hashes
and toolchain produced different Forge binary hashes. The final assurance-remediation run used
disposable build root `20260728T184237322Z` and consumed the pre-existing configured sovereign
binary without rebuilding it. This evidence does not infer the cause of the Forge hash changes and
does not claim reproducible binary output.

## Source Hashes

| Forge source | SHA-256 |
| --- | --- |
| `Cargo.toml` | `1d0997f80c718be5bcb4bcbe687f93786bac326975da22026ed738bff60489f0` |
| `Cargo.lock` | `a85a0b72850254f85b74a988ae73cb18dfae97d1cfc28d764a626075d44c80b9` |
| `build.rs` | `af474e3d6639701f5d5d2bbed509b742b7c988015c6fb96164baf740bd088e4f` |
| `src/main.rs` | `29fa8345e4921e1fa21cf7745142ec49c42b9b32f88c8a001fbb914f50ed77d9` |

## Safety and Non-Claims

- Persistent application settings and runtime configuration did not change.
- `backend/src/**` did not change.
- No GitHub artifact, credential, secret, network trust, deployment, or production resource was used.
- No source was retired and no ownership transfer or `WO-SR-006` cutover was authorized.

## Merge and Closeout

The implementation PR must preserve this exact scope, pass exact-head assurance, pass all required
checks, and have zero unresolved substantive review threads. After verified merge, the bounded
authority is completed and consumed and routing returns to portfolio reconciliation.

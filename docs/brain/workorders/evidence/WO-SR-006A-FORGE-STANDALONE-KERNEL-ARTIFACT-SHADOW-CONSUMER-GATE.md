# WO-SR-006A - Forge Standalone Kernel Artifact and Shadow-Consumer Gate Evidence

## Current Result

`FORGE_LOCAL_SOVEREIGN_SHADOW_CONSUMPTION_PROVEN_WITHOUT_RUNTIME_SWITCH`

## Authority

Owner decision `OWNER-SR-006A-LOCAL-SOVEREIGN-SHADOW-CORRECTION-20260728` grants the corrected local
R3 closeout at sovereign base `5feba52f222422d8cc93a900bb335cacd5230913` and exact Forge proof
commit `24059c3642339f36877cb454ca63683180915b71`.

The owner revoked GitHub artifact transfer and credential provisioning before sovereign Phase 2.
The completed envelope uses one governance activation PR, one exact three-file Forge producer PR
retained as historical CI evidence, and one local sovereign shadow-consumer/closeout PR. It grants no
runtime switch, source retirement, publication, deployment, protected-data access, or credential.

## Phase 0 Proof

- Exact decision and cross-repository allowlist recorded.
- PR #1377 head `df15cc53cf9c820ca32037275cb6880149316436` merged as
  `5feba52f222422d8cc93a900bb335cacd5230913`.
- Forge PR #2 head `468b21714abea071bef82eb05b4febbda7e9ff82` merged as
  `24059c3642339f36877cb454ca63683180915b71`.
- Forge run `30365590537` and executable SHA-256 `c33ca863be6a1c09ba4e2bb434d9d110facb13462a1c95c0f13dc3c41e8a62be`
  remain historical CI evidence only.

## Local Sovereign Proof

`scripts/validation/Invoke-ForgeLocalShadowProof.ps1`:

- verified the clean Forge worktree at exact commit `24059c3642339f36877cb454ca63683180915b71`;
- ran 2/2 Forge kernel tests and a locked release build;
- copied the executable only through a disposable local directory;
- wrote and re-read a local manifest before execution;
- verified local executable SHA-256
  `86d5a0c34c6881c26352e7f344090366c19066dd93b9357d8f9ebf62e524abba`
  for the exact artifact executed by the final local proof run;
- built the matching sovereign valuation source in the disposable directory without modifying or
  creating a repository lockfile;
- passed the focused xUnit shadow test: 1 passed, 0 failed, 0 skipped;
- proved accepted, fail-closed, exit, and deterministic normalized-output parity;
- proved `backend/src/**` and appsettings tracked diffs are empty; and
- removed the disposable artifact directory in `finally`.

The ordinary remote test run visibly skips the local-only fact when its explicit test-scoped
environment path is absent. GitHub validates the committed harness and evidence but is not the build,
transfer, execution, or trust plane for this proof.

## Source Hashes

| Forge source | SHA-256 |
| --- | --- |
| `Cargo.toml` | `1d0997f80c718be5bcb4bcbe687f93786bac326975da22026ed738bff60489f0` |
| `Cargo.lock` | `a85a0b72850254f85b74a988ae73cb18dfae97d1cfc28d764a626075d44c80b9` |
| `build.rs` | `af474e3d6639701f5d5d2bbed509b742b7c988015c6fb96164baf740bd088e4f` |
| `src/main.rs` | `29fa8345e4921e1fa21cf7745142ec49c42b9b32f88c8a001fbb914f50ed77d9` |

## Rollback

Revert the local validation script, local-only test, and closeout/routing changes. The sovereign
kernel, Forge kernel, runtime configuration, application settings, and production resources did not
change.

## Stop Type

`NONE`; authority is consumed when this exact closeout merges.

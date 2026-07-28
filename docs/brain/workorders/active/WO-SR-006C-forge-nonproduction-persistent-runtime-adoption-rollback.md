# WO-SR-006C - Forge Non-Production Persistent Runtime Adoption and Rollback Gate

| Field | Value |
| --- | --- |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Loop | `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R3 |
| Status | Active - authority ratified; implementation not started |
| Authority | `OWNER-SR-006C-R3-FORGE-NONPROD-PERSISTENT-ADOPTION-ROLLBACK-20260728` |
| Sovereign base | `6f868cd6bd02fb29fbf544a6f8493e9e7fcec1a6` |
| Forge base | `24059c3642339f36877cb454ca63683180915b71` |
| Merge mode | Mode B - exact bounded scope |

## Objective

Prove that a disposable local `ForgeRehearsal` configuration can select the exact-commit Forge
valuation kernel across two isolated non-production host starts, then roll back to the unchanged
sovereign kernel in a third host start.

## Authorized boundary

The configuration file is created outside the repository under a unique temporary directory and may
override only `RustKernels:ValuationKernelPath`. It is never a canonical `appsettings*.json` file.
The test host uses synthetic data, requires no network or database, and is limited to the current
process and child test host.

## Required proof

1. Verify exact sovereign and Forge commits, committed Forge source hashes, and build inputs.
2. Build and hash the Forge binary locally and record a complete disposable manifest.
3. Start host A and host B from the same on-disk Forge override; prove accepted and typed fail-closed
   behavior and exact Forge binary provenance.
4. Roll back the disposable configuration to the sovereign binary.
5. Start host C; prove accepted and typed fail-closed behavior and sovereign binary provenance.
6. Restore the process environment and remove every disposable worktree, configuration, binary,
   manifest, and log.

## Explicit denials

No `backend/src/**`, canonical `appsettings*.json`, production or county runtime, deployment,
network artifact transfer, protected data, credentials, secrets, source retirement, ownership
transfer, package publication, other-suite adoption, or `WO-SR-006` cutover.

## Terminal condition

`FORGE_NONPRODUCTION_PERSISTENT_RUNTIME_ADOPTION_AND_ROLLBACK_PROVEN`

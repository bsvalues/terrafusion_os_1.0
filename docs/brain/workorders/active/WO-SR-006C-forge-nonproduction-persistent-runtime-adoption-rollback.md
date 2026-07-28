# WO-SR-006C - Forge Non-Production Persistent Runtime Adoption and Rollback Gate

| Field | Value |
| --- | --- |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Loop | `LOOP-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R3 |
| Status | Complete - terminal proof merged; authority consumed |
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

## Completion

PR #1383 merged exact reviewed head
`eaa9890cc09c8ee32026b91aa6bcd53f96032cbd` as
`bbacef062445ffdf30b9e5ce8c4f8b3664a765bd`.

The proof selected the locally built Forge binary through the same disposable on-disk
`ForgeRehearsal` configuration in isolated host starts A and B, then rewrote that same configuration
to the unchanged sovereign binary and proved rollback in host start C. Accepted and typed
fail-closed cases passed in every start. Canonical configuration, persistent runtime state,
`backend/src/**`, the shared Forge checkout, deployment, source ownership, and cutover remained
unchanged.

The Forge build hash changed across separate local builds, so reproducibility is explicitly not
claimed. The recorded terminal hashes are evidence for the completed execution, not a stable binary
identity contract.

# WO-SR-007D - Atlas Persistent Local Runtime Adoption Evidence

## Current verdict

`ATLAS_PERSISTENT_LOCAL_RUNTIME_ADOPTION_AND_ROLLBACK_PROVEN`

## Exact identities

| Surface | Identity |
| --- | --- |
| Sovereign base | `5a328e728852dc2bb933d704d0daa5c54750728c` |
| Atlas repository | `bsvalues/terrafusion-atlas` |
| Atlas commit | `6736a53980c73d2b503ec71a440ad8e02aa43782` |
| Module | `src/spatial-read/project-atlas-feature.mjs` |
| Artifact type | `atlas.spatial-read.projection-module@1` |
| Transport | `local-os-managed-artifact-slot` |
| Module length | 917 bytes |
| Module SHA-256 | `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46` |

## Observed runtime and rollback proof

`Invoke-AtlasPersistentRuntimeAdoptionRollbackProof.ps1` cloned the pinned private Atlas commit into
an invocation-owned short path, staged the exact module through the merged `WO-SR-007C` stager,
compiled the real backend graph under warnings-as-errors, and ran the focused Atlas suite with exact
artifact environment enabled. The proof emitted TRX, parsed its counters, and refused terminal
success unless all 89 selected tests were executed and passed with zero failures or skips. The set
includes an observed published-Development-host case that resolves effective mode to Disabled and
registers neither the process host nor consumer when sovereign source markers are absent.

Observed result:

```text
result=PASS
terminalCondition=ATLAS_PERSISTENT_LOCAL_RUNTIME_ADOPTION_AND_ROLLBACK_PROVEN
focusedTests=89 passed, 0 failed, 0 skipped
runtimeStartA=PASS
runtimeRestartB=PASS
disabledSelectionRollback=PASS - no host or consumer registered
restoredSelectionStart=PASS
manifestTamperAfterConstruction=FAIL_CLOSED_BEFORE_PROCESS_START
moduleTamperAfterConstruction=FAIL_CLOSED_BEFORE_PROCESS_START
persistentDevelopmentSelection=true
configurableArtifactRedirectDenied=true
productionSelection=DISABLED
moduleSha256=3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46
countyOrProtectedDataUsed=false
deploymentOrProductionUsed=false
```

The successful proof retained an ignored runtime-adoption receipt and a complete prior-slot rollback
directory under `.terrafusion/runtime/atlas/adoption-receipts/`. The proof removed its clone and build
state, restored every tampered byte in `finally`, and found no tracked worktree drift.

An intentional post-publication failure using an unavailable .NET executable also exercised the
failure transaction. It produced `TERMINAL_FAILURE`, moved the unproven published candidate to an
ignored recovery directory, restored the prior fixed slot, re-inventoried every relative path and
SHA-256 in both directions, and reported
`PREVIOUS_ARTIFACT_RESTORED_AND_HASH_VERIFIED`. Missing or malformed stager receipt output protects
the entire staging transaction root from cleanup rather than risking the only rollback backup.

## Ownership and duplicate analysis

The mutable provider-neutral projection module is fetched only from the pinned Atlas repository.
There is no second sovereign copy to delete. The sovereign `AtlasSpatialReadAdapter`, frozen
`atlas.spatial-read` contract, authenticated county scope, parcel reader, process host, API and
Workbench route are legitimate integration responsibilities and remain. Truthful standalone
repository ownership finalization subsequently completed without module-byte changes.

## Protected completion

Sovereign PR #1465 reviewed exact head `feb69f85999039db03ef95f52f8a8d4e4c0d2f8f`
and merged as `4fcbfbd0585122f67f640b1b76786b7629f28e1f` with protected tree
`1084c60d6aec72802a8dd477b633058b818573d6`. Atlas PR #4 merged as protected
suite main `708fc5c31988405f9ca2cba7ebea7bb9d1fec3a6`, tree
`d986cc31da0077adb3a133bd1fa6d44bb2a79acc`. Required assurance and both
protected-main observations passed.

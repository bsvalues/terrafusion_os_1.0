# WO-SR-007D - Atlas Persistent Local Runtime Adoption Evidence

## Current verdict

`LOCAL_RUNTIME_AND_ROLLBACK_PROOF_PASS_REMOTE_ASSURANCE_PENDING`

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
success unless all 88 selected tests were executed and passed with zero failures or skips.

Observed result:

```text
result=PASS
terminalCondition=ATLAS_PERSISTENT_LOCAL_RUNTIME_ADOPTION_AND_ROLLBACK_PROVEN
focusedTests=88 passed, 0 failed, 0 skipped
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
Workbench route are legitimate integration responsibilities and remain. The remaining Atlas step is
truthful standalone repository ownership finalization; it does not require module-byte changes.

## Remaining merge gates

- independent review of the complete exact-scope diff;
- governance, JSON, platform lint and `git diff --check` on the final head;
- protected GitHub checks and zero unresolved substantive review threads;
- exact-head merge followed by protected-main verification.

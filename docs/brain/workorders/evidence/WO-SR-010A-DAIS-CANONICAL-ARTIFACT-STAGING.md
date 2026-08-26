# WO-SR-010A - Dais Canonical Artifact Staging Evidence

## Current verdict

`LOCAL_PROOF_PASS_REMOTE_ASSURANCE_PENDING`

## Exact identities

| Surface | Identity |
| --- | --- |
| Sovereign base | `4fcbfbd0585122f67f640b1b76786b7629f28e1f` |
| Dais repository and commit | `bsvalues/terrafusion-dais@6932bbbf014cf70d7362e070a1dad2a8a680ad47` |
| Protected source ref | `refs/heads/main`; pinned commit verified reachable from fetched `origin/main` |
| Module | 9269 bytes; `5fd8efd8b06baa57b602a565c5927c95614336d5c1dcdfa914f27734e9ecaafb` |
| Frozen schema | 3496 bytes; `b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c` |
| Suite source manifest | `6dbcef689d7cb1f282bdd34eff56009280fb391bedfa58d0308480365b962859` |
| Original contract anchor | `e57b1eca9c3291d10203efaa1fd586bcbce13f94` |
| Original DTO | `c9bb02054fc5a211ed609a3e9d7fe604e34cd0613701a57f6f2788d312348f47` |

## Observed local proof

The Windows regression performed nine detached exact-commit staging invocations against the verified
read-only Dais synchronization clone. It observed clean-parent bootstrap and fresh failure cleanup;
rejected both a numeric field encoded as a string and a string field encoded as a singleton array
before publication; published the exact three-file slot
with byte-identical candidate/published inventories and every manifest field verified; injected a
failure immediately after moving the prior slot and
verified guarded restoration; injected a post-publication failure and verified automatic whole-slot
rollback; then successfully re-staged while proving the real backup directory, every receipt hash,
and the complete inventory in both directions. Two overlapped invocations additionally proved that
the transaction winner retained exact publication while the concurrent loser failed closed on the
slot mutex without mutation.

```text
terminalCondition=DAIS_STAGING_PROVENANCE_AND_ROLLBACK_PROVEN
moduleLength=9269
moduleSha256=5fd8efd8b06baa57b602a565c5927c95614336d5c1dcdfa914f27734e9ecaafb
schemaLength=3496
schemaSha256=b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c
sourceManifestSha256=6dbcef689d7cb1f282bdd34eff56009280fb391bedfa58d0308480365b962859
protectedSourceBranch=main
protectedMainAncestryVerified=true
exactThreeFileInventoryVerified=true
candidatePublishedInventoryEqualityVerified=true
fullManifestIdentityVerified=true
candidateNumericTypeTamperRejectedBeforePublication=true
candidateStringArrayTamperRejectedBeforePublication=true
concurrentInvocationRejectedWithoutMutation=true
backupContentsVerified=true
rollbackExecuted=true
rollbackHashesVerified=true
automaticFailureRollbackVerified=true
cleanParentBootstrapVerified=true
freshFailureSlotRemovalVerified=true
backupVerificationFailureRollbackVerified=true
```

The offline guard separately parsed both PowerShell files, rejected a forged repository origin,
refused a cross-volume backup root, refused a reparse-point build root, and rejected build-root/live-
slot overlap while proving a sentinel slot remained byte-identical. No private-suite credential is
introduced into sovereign CI.

The pinned standalone source was independently re-executed at the same Dais commit: direct module
tests passed 17/17, verifier tests passed 6/6, and the verifier accepted all 10 hash-pinned artifacts
with three positive and six negative fixtures against contract source `e57b1eca9`.

## Independent assurance

Independent review exposed and drove repairs for build-root/live-slot overlap, cross-volume backup
non-atomicity, incomplete candidate/publication manifest equality, numeric and string JSON type
coercion, and concurrent transaction interference. The final assurance pass re-ran the offline guards
and full nine-invocation regression and reported `CLEAN`; the exact staged diff remained the declared
17 files.

## Remaining gates

Protected PR checks, zero unresolved substantive review threads, exact-head merge, and protected-main
verification remain required. This
evidence claims staging only; runtime selection begins in `WO-SR-010B`.

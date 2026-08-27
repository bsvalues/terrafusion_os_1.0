# WO-SR-011A - Dossier Canonical Artifact Staging Evidence

## Current verdict

`IMPLEMENTED_LOCAL_PENDING_PROTECTED_MERGE`

## Exact identities

| Surface | Identity |
| --- | --- |
| Sovereign base | `54f9e4b411fb886bd592226067928f024b02285b` |
| Dossier repository and commit | `bsvalues/terrafusion-dossier@7558cfebfeea0c7b536251769b1d779c4558a763` |
| Protected source ref | `refs/heads/main`; pinned commit must be reachable from fetched `origin/main` |
| Module | 8901 bytes; `bb0427d6634412d86be92a2ef5f6f0bfcdf97ee054887a42d59c2a0bc0127a8b` |
| Frozen schema | 2851 bytes; `f658bc2bda718f58bd0353e9635524d5dbd376be515b543da3442b0094e52270` |
| Suite source manifest | `0c8310e45a02face985fd9d628f16ff26bfac6b078107fa8f96e6f22f1ebcb07` |
| Original contract anchor | `cfcd460d6387c7dc5aefbc83a389e74333cf0201` |
| Original DTO | `414fd158cd7a0f1e483ab44a83b93a64e4180300561f53088830583220566b7f` |

## Observed local proof

The Windows regression completed nine detached exact-commit staging invocations from the canonical
local Dossier synchronization checkout. It rejected a pinned commit when it was not reachable from
observed protected `main`; refused Production and forged origin before mutation; verified exact
candidate/published three-file inventories; rejected numeric and singleton-array manifest type
tampering; executed fresh-publication cleanup, backup-verification restoration, and post-publication
whole-slot rollback; proved every real backup file and receipt hash in both directions; serialized
concurrent staging; and left runtime selection disabled. The first run exposed Windows long-path
materialization failure for Dossier's frozen filenames; the repaired stager enables Git long paths
before detached checkout, and the complete proof then passed.

The expected terminal receipt is:

```text
terminalCondition=DOSSIER_STAGING_PROVENANCE_AND_ROLLBACK_PROVEN
moduleLength=8901
moduleSha256=bb0427d6634412d86be92a2ef5f6f0bfcdf97ee054887a42d59c2a0bc0127a8b
schemaLength=2851
schemaSha256=f658bc2bda718f58bd0353e9635524d5dbd376be515b543da3442b0094e52270
sourceManifestSha256=0c8310e45a02face985fd9d628f16ff26bfac6b078107fa8f96e6f22f1ebcb07
protectedSourceBranch=main
runtimeAdopted=false
```

The offline guard separately parsed both PowerShell files, verified default `Disabled` selection,
refused Production while preserving a sentinel slot byte-for-byte, rejected a forged canonical
origin, refused cross-volume backup, refused a reparse-point build root, and rejected build-root/live-
slot overlap without mutation. It requires no private Dossier credential.

The exact protected Dossier commit was also materialized in a disposable detached clone with
`core.autocrlf=false` and `core.eol=lf`. Its combined module and verifier suite passed 26/26, and the
standalone verifier accepted all 12 hash-pinned artifacts (three positive and eight negative) against
contract source `cfcd460d6387c7dc5aefbc83a389e74333cf0201`. A direct run from the shared Windows
synchronization checkout was intentionally not accepted as artifact-identity proof because checkout
CRLF conversion changes the frozen JSON hashes; the canonical Git-blob form is the staged form.

This evidence claims staging only. It does not claim a runtime consumer, persistent selection,
custody mutation, source-ownership transfer, source retirement, deployment, or production use.

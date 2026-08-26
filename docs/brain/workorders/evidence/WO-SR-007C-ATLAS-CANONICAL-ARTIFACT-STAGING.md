# WO-SR-007C - Atlas Canonical Artifact Staging Evidence

## Current verdict

`LOCAL_PROOF_PASS_REMOTE_ASSURANCE_PENDING`

## Exact identities

| Surface | Identity |
| --- | --- |
| Sovereign base | `6fa8a420c1b875255bf612802a0d9c93a0e2ea15` |
| PR #1464 owner-reported repaired head independently fetched | `62062d42772b3b53c1470827851d32eae5c740a8` |
| Atlas repository | `bsvalues/terrafusion-atlas` |
| Atlas commit | `6736a53980c73d2b503ec71a440ad8e02aa43782` |
| Module | `src/spatial-read/project-atlas-feature.mjs` |
| Module length | 917 bytes |
| Module SHA-256 | `3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46` |

## Independent review and repair

Independent assurance confirmed that `62062d427` fixed the original `Copy-Item -LiteralPath '*'
defect and that its backup file really contained 917 bytes with the exact module hash. It then found
four remaining gaps: failure cleanup could remove unrelated slot contents, restored bytes were not
rehash-verified, the claimed regression test did not exist, and caller-controlled repository
provenance was not enforced.

The remediation moves the entire previous slot to a rollback directory, records every relative file
hash, restores the entire slot on deterministic injected publication failure, compares complete
inventories in both directions before reporting rollback, validates the canonical Atlas origin, fixes
LF checkout behavior, publishes a manifest, and adds an interruption-safe Windows regression. The
focused workflow deliberately uses offline parser and forged-origin guards because the sibling Atlas
repository is private and this mission does not authorize a new cross-repository credential.

## Observed local proof

The regression executed five exact staging runs in an isolated checkout:

1. a clean checkout-shaped run with the Atlas runtime parent absent, followed by parent bootstrap,
   an injected fresh-slot publication failure, and verified removal of the partial slot;
2. fresh publication of the canonical 917-byte module and manifest;
3. an injected backup-verification exception after the slot move, followed by guarded whole-slot
   restoration and exact inventory comparison;
4. an injected post-publication failure through the stager's catch path, whole-slot restoration, and
   bidirectional inventory comparison including an unrelated sentinel sidecar;
5. a successful re-stage whose whole-slot rollback directory and receipt hashes exactly matched the
   replaced files.

Observed result:

```text
terminalCondition=ATLAS_STAGING_PROVENANCE_AND_ROLLBACK_PROVEN
backupContentsVerified=true
rollbackExecuted=true
rollbackHashesVerified=true
automaticFailureRollbackVerified=true
cleanParentBootstrapVerified=true
freshFailureSlotRemovalVerified=true
backupVerificationFailureRollbackVerified=true
moduleLength=917
moduleSha256=3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46
```

The staged manifest reported canonical repository `bsvalues/terrafusion-atlas`, exact commit
`6736a53980c73d2b503ec71a440ad8e02aa43782`, and the same module SHA-256.

## Remaining merge gates

- deterministic local parse/diff/governance checks on the final exact head;
- independent re-review of the remediated diff;
- required GitHub checks complete and successful;
- zero unresolved substantive review threads;
- exact-head merge followed by protected-main verification.

No runtime selection, deployment, protected resource, live data, credential, or other-suite action is
claimed by this staging evidence.

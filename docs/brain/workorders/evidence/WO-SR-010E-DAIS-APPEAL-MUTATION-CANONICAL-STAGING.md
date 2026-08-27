# WO-SR-010E - Dais Appeal Mutation Canonical Staging Evidence

## Current verdict

`COMPLETE_PROTECTED_MAIN_VERIFIED`

The full authenticated protected-source proof passed against Dais protected `main` commit
`8a9cfc608bcda835126db2054bb7ba7ecf185275`. Sovereign PR #1470 merged exact reviewed head
`dfce1f5f1502665391b6c23ef820cfe1df72535c` as protected-main commit
`153103c4f5356219c142ccfe88174c2c6477e54d` after all required first-party contexts passed and all
first-party review threads were resolved.

## Observed outcome

- the exact module, schema, and source manifest matched all supplied lengths, SHA-256 identities,
  and Git blob identities;
- the source commit was observed reachable from protected `main`;
- the published OS slot contained exactly the module, schema, and generated provenance manifest;
- the generated published manifest was exactly 1,465 bytes with SHA-256
  `c858e7cd390502bf1461cf7af6302916a7c437f5f4f47b17d379f49af114b825`;
- numeric manifest type tamper was rejected before publication;
- a fresh injected publication failure left no partial slot;
- a deliberately nonempty prior slot contained the complete prior artifact plus a sentinel;
- injected backup-verification failure restored that prior inventory byte-for-byte;
- injected post-publication failure restored that prior inventory byte-for-byte;
- successful replacement produced a real backup directory and complete nonempty receipt hashes;
- every source clone and candidate proof root was removed on success and injected failure, while a
  successful replacement retained only its deliberately managed `previous-artifact` rollback slot;
- the prior slot was physically moved back into service, hash-observed, then the adopted slot was
  restored and hash-observed;
- the test cleaned its ignored artifact and temporary proof roots;
- `runtimeActivated=false`, `countyOrProtectedDataUsed=false`, and
  `deploymentOrProductionUsed=false`.

The proof also found and repaired one fail-open staging defect before commit: coercive PowerShell
comparison permitted a stringified numeric manifest length. Published manifest validation now
requires exact scalar types for every string and integer field.

First-party PR review then found that proof-side slot moves were not serialized with a concurrent
stager. The proof now owns the production named transaction mutex across its entire run; recursive
in-process stager acquisitions remain valid while other processes cannot publish into a slot the
proof may move or clean. Offline and full authenticated rollback proofs passed again after repair.

## Commands

```powershell
pwsh -NoProfile -File tests/dais-appeal-mutation-staging-identity.ps1 -OfflineGuardsOnly
pwsh -NoProfile -File tests/dais-appeal-mutation-staging-identity.ps1 -ProofRootBase <short-temp-root>
git diff --check
```

The full proof terminal condition was
`DAIS_APPEAL_MUTATION_EXACT_STAGING_AND_ROLLBACK_PROVEN`.

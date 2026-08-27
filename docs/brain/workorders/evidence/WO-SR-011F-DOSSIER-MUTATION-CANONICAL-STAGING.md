# WO-SR-011F - Dossier Mutation Canonical Staging Evidence

## Current verdict

`PASS_ON_EXACT_PROTECTED_SOURCE_PENDING_SOVEREIGN_PROTECTED_MERGE`

The sovereign staging implementation and full observed proof ran on exact protected OS base
`142a105a0a9a1aef425a434b962c7d9e3326e50b`, which contains protected mutation-contract merge
`7cb96bf2ea5efea7caccae6d6e8c9f81f672412e`, against Dossier protected merge
`2c709fe2286b5c1e6bde43fcbc2a35111a456092`.

## Exact protected identities

WO-SR-011E Dossier PR #5 merged reviewed head `9e3bed12e0acde927b7563fd189be8dc1c2cb634`
as protected `main` `2c709fe2286b5c1e6bde43fcbc2a35111a456092`. Protected tree
`56f73f4c4ce30c71182ecca7cdcf4622d81b7ba9` equals the reviewed tree.

| Surface | Protected identity |
| --- | --- |
| Module | 18,366 bytes; SHA-256 `b314d94ac5cd1ed88d7c841f8a87d3263e7a8adf21c4d5d465003c015c66f277`; Git blob `c9080b4fac4bb6abc42cfa870e2c36df1ddac6fc` |
| Schema | 18,611 bytes; SHA-256 `48db4388e76c91ca10e2caad54c814e0eb4fee7908e219e4186a3823d30e62a3`; Git blob `42fb0ce560a407ccee27ffd55f3d074dac182243` |
| Source manifest | 6,921 bytes; SHA-256 `dd9dfd1f0d6e31689ebbc90e2e7f1674be55b54eff433ec15d041b565d4f2444`; Git blob `fa128c254b38366133d5017e50e7c7226f37401f` |
| Published manifest | 1,493 bytes; SHA-256 `425d36d660ed2d46616a645d014dfa2906cfbac424b4ec0a6d7692ec43ba2716` |

## Observed proof

The offline guard proof:

- parsed the complete PowerShell transaction implementation;
- refused Production and an alternate artifact slot;
- refused build-root/live-slot overlap without changing the slot;
- refused a cross-volume build/backup root before source fetch or slot mutation;
- compared the artifact-slot existence and recursive file hashes before and after refusal;
- verified source clones will use `core.autocrlf=false`, `core.eol=lf`, detached exact commit checkout,
  and protected-main ancestry;
- verified backups use whole-directory `Move-Item -LiteralPath`, followed by recursive enumerated
  file hashing and exact inventory comparison;
- verified the historical `Copy-Item -LiteralPath '<directory>\\*'` wildcard failure pattern is absent;
- verified the receipt declares `runtimeAdopted=false`.

The authenticated full proof then used a short same-volume root to avoid Windows nested-clone path
limits and observed six detached staging invocations. It verified protected-main ancestry, exact LF
module/schema/source-manifest bytes and Git blobs, the exact generated three-file inventory, and the
1,493-byte published manifest identity. It rejected typed manifest tamper before publication, removed
a partial fresh publication, restored a deliberately nonempty four-file prior slot after injected
backup-verification failure, restored it again after injected post-publication failure, and then
performed a successful replacement that emitted a real rollback directory and four exact receipt
hashes. The proof physically moved that backup back into service, observed every hash, then restored
and re-observed the adopted three-file slot.

Observed command:

```powershell
pwsh -NoProfile -File tests/dossier-mutation-staging-identity.ps1 -OfflineGuardsOnly
pwsh -NoProfile -File tests/dossier-mutation-staging-identity.ps1 -DossierRepository <canonical-local-source> -ProofRootBase <short-same-volume-root>
```

Observed full terminal condition:

```text
DOSSIER_MUTATION_EXACT_STAGING_AND_ROLLBACK_PROVEN
```

## Remaining protected-sovereign evidence

Exact-head review, required first-party checks, protected merge, and protected-main verification remain
for this sovereign child. No COMPLETE claim is permitted until those outcomes are observed.

This record claims no runtime adoption, persistence or custody mutation, county data use, deployment,
Production use, source ownership completion, or Dossier terminal completion.

# WO-SR-011F - Dossier Mutation Canonical Staging

| Field | Value |
| --- | --- |
| Status | EXACT STAGING AND ROLLBACK PROVEN LOCALLY - protected sovereign merge pending |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R3 exact artifact staging with recoverable whole-slot replacement |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Sovereign base | `1f0889a72497b283140fb0d0a57eed79775f9a34` |
| Contract merge | `7cb96bf2ea5efea7caccae6d6e8c9f81f672412e` |
| Dossier source | `bsvalues/terrafusion-dossier@2c709fe2286b5c1e6bde43fcbc2a35111a456092` |
| Contract | `dossier.mutation-decision@1.0.0` |
| Terminal condition | `DOSSIER_MUTATION_EXACT_STAGING_AND_ROLLBACK_PROVEN` |

## Objective

Stage the exact Dossier protected-main mutation-decision module and frozen schema into the fixed,
ignored sovereign artifact slot with exact repository, commit, Git-blob, byte, contract, DTO, and
source-manifest provenance. Execute and observe whole-slot rollback before any runtime adoption.

## Protected source

WO-SR-011E merged Dossier PR #5 as protected `main`
`2c709fe2286b5c1e6bde43fcbc2a35111a456092`. Its protected tree
`56f73f4c4ce30c71182ecca7cdcf4622d81b7ba9` equals reviewed head
`9e3bed12e0acde927b7563fd189be8dc1c2cb634`. The stager pins that protected merge and independently
verified exact source bytes and Git blobs before publication.

- module: 18,366 bytes; SHA-256
  `b314d94ac5cd1ed88d7c841f8a87d3263e7a8adf21c4d5d465003c015c66f277`; Git blob
  `c9080b4fac4bb6abc42cfa870e2c36df1ddac6fc`
- schema: 18,611 bytes; SHA-256
  `48db4388e76c91ca10e2caad54c814e0eb4fee7908e219e4186a3823d30e62a3`; Git blob
  `42fb0ce560a407ccee27ffd55f3d074dac182243`
- source manifest: 6,921 bytes; SHA-256
  `dd9dfd1f0d6e31689ebbc90e2e7f1674be55b54eff433ec15d041b565d4f2444`; Git blob
  `fa128c254b38366133d5017e50e7c7226f37401f`
- published provenance manifest: 1,493 bytes; SHA-256
  `425d36d660ed2d46616a645d014dfa2906cfbac424b4ec0a6d7692ec43ba2716`

## Exact scope

1. `.gitignore`
2. `scripts/bootstrap/Stage-DossierMutationDecisionModule.ps1`
3. `tests/dossier-mutation-staging-identity.ps1`
4. `docs/brain/workorders/active/WO-SR-011F-dossier-mutation-canonical-staging.md`
5. `docs/brain/workorders/evidence/WO-SR-011F-DOSSIER-MUTATION-CANONICAL-STAGING.md`

The fixed ignored slot is `.terrafusion/runtime/dossier/mutation-decision`.

## Required final proof

1. protected-main ancestry and exact module, schema, and source-manifest Git blobs;
2. exact LF byte lengths and SHA-256 identities from a detached checkout with line-ending conversion disabled;
3. source-manifest binding to sovereign contract merge `7cb96bf2ea5efea7caccae6d6e8c9f81f672412e`, reviewed contract head, and frozen DTO hash;
4. candidate and published inventories containing exactly module, schema, and generated manifest;
5. generated published-manifest exact byte length and SHA-256 identity;
6. manifest type tamper, Production, forged origin, cross-volume root, and overlap refusal before publication;
7. fresh publication failure removing the partial slot;
8. backup-verification and post-publication failures restoring a nonempty prior slot byte-for-byte;
9. a successful replacement emitting a real enumerated backup and exact receipt hashes;
10. physical rollback execution and adopted-slot restoration, both hash-observed;
11. no runtime registration, consumer, selection, county data, production, or deployment.

## Ownership boundary and denials

Dossier owns pure mutation-decision semantics. The sovereign OS retains authentication,
authorization, property/evidence lookup, custody and persistence orchestration, hashing, transactions,
audit, API transport, and county isolation. This child does not activate the module, add a consumer,
select a runtime, mutate Dossier or county data, change the contract, deploy, or use Production.

## Continuation

After exact-head review, protected checks, merge, and protected-main verification, proceed to a
separate runtime-adoption child. This staging result does not authorize runtime selection.

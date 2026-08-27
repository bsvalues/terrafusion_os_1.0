# WO-SR-011I - Dossier Duplicate Reference Retirement

| Field | Value |
| --- | --- |
| Status | COMPLETE - duplicate reference custody classification retired |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Base | protected OS `5680f1de637e9e39d702c4cf6f708edee7bd00f3` |
| Suite owner | protected Dossier `051c1d83c9e6c17b0869656bc1c4eb8e7c36194b` |

## Objective

Retire the last duplicate sovereign custody-classification reference exposed by
`GET /api/dossier/document-types`. Preserve the legitimate sovereign reference fields for document
labels, accepted extensions, and retention classes, while keeping custody mutation behavior solely
in the suite-owned `dossier.mutation-decision@1.0.0` contract consumed by persistent write routes.

## Exact scope and walls

- Remove only the `EntersCustodyChain` field and its mutable values from the OS reference DTO/table.
- Preserve the persisted document field and its assignment from the accepted suite decision result.
- Preserve authentication, county/parcel isolation, retention reference data, integration adapters,
  process-host/runtime selection, and rollback behavior.
- No Azure, deployment, live county/PACS/SQL mutation, secrets, WilliamOS, topology change, or sixth
  suite.

## Required proof

- The document-types response no longer serializes `EntersCustodyChain`.
- The OS contains no custody-classification source outside the governed mutation DTO/adapter path.
- Dossier mutation and legacy endpoint tests compile and pass.
- Required protected checks pass, review threads are resolved, and protected-main tree identity is
  verified before the Dossier suite terminal record is repaired.

## Protected completion

PR #1482 reviewed exact head `b173b8d16c434373064341e51c6a1b3b1f61dedc`, tree
`b9860d533d91fc0ac930bc0787d545b2151a4184`, and squash-merged as protected OS
main `65ddfe9948b02c0cd6089fc95c83e48885cc92ab` with exact tree equality. Zero
review threads and all eight required contexts plus backend, security, seal, frontend, and package
first-party checks passed. Dossier terminal governance is protected at suite main
`4a109acef12804f89c894f8f139034bf975c0811`, tree
`eedad9c4e8b5c3f30d33f5e58a2856b896f7ae86`.

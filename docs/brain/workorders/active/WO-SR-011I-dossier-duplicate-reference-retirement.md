# WO-SR-011I - Dossier Duplicate Reference Retirement

| Field | Value |
| --- | --- |
| Status | ACTIVE - implementation and protected proof |
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

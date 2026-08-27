# WO-SR-011A - Dossier Canonical Artifact Staging

| Field | Value |
| --- | --- |
| Status | PROVEN ON CURRENT PROTECTED BASE - protected PR pending |
| Program | Five-Suite Federated Repository Buildout |
| Goal | `GOAL-FIVE-SUITE-FEDERATED-REPOSITORIES` |
| Risk | R3 bounded non-production local artifact staging |
| Authority | `OWNER-FIVE-SUITE-FEDERATED-COMPLETION-20260826` |
| Sovereign base | `f14fc4999f650ed4bbff2633813be6b57ec4bfbc` |
| Dossier source | `bsvalues/terrafusion-dossier@7558cfebfeea0c7b536251769b1d779c4558a763` |
| Module | `src/evidence-registry/project-dossier-evidence-registry-read.mjs`, 8901 bytes, SHA-256 `bb0427d6634412d86be92a2ef5f6f0bfcdf97ee054887a42d59c2a0bc0127a8b` |
| Schema | `contract-compat/dossier.evidence-registry-read.v1/dossier.evidence-registry-read.v1.schema.json`, 2851 bytes, SHA-256 `f658bc2bda718f58bd0353e9635524d5dbd376be515b543da3442b0094e52270` |
| Terminal condition | `DOSSIER_CANONICAL_ARTIFACT_STAGING_PROVEN` |

## Objective

Stage the exact Dossier-owned evidence-registry read module and its frozen contract schema into the
ignored, fixed OS-managed slot. Bind repository, protected-main commit, module, schema, source
manifest, original contract anchor, and DTO identity in the generated manifest. Execute clean-
bootstrap failure cleanup and two whole-slot restoration paths before any runtime adoption.

## Exact scope

1. `.github/workflows/dossier-canonical-staging.yml`
2. `.gitignore`
3. `backend/src/TerraFusion.API/Configuration/DossierEvidenceRegistryReadOptions.cs`
4. `scripts/bootstrap/Stage-DossierEvidenceRegistryReadModule.ps1`
5. `tests/dossier-staging-identity.ps1`
6. `docs/brain/workorders/active/WO-SR-011A-dossier-canonical-artifact-staging.md`
7. `docs/brain/workorders/evidence/WO-SR-011A-DOSSIER-CANONICAL-ARTIFACT-STAGING.md`
8. `docs/governance/CI_WORKFLOW_LIFECYCLE_POLICY.md`
9. `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
10. `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
11. `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
12. `docs/brain/workorders/programs/five-suite-federated-repository-buildout.md`

## Required proof

- canonical origin, explicit protected `main` fetch, pinned-commit reachability, and exact detached
  checkout with line-ending conversion disabled;
- module, schema, source-manifest, contract-anchor, and DTO identities agree with runtime pins;
- candidate and published inventories contain exactly module, schema, and generated manifest;
- source, option, build-root, candidate, and slot reparse points fail closed;
- the backup root is same-volume and disjoint from the sovereign repository and live slot;
- whole previous slot is moved, hashed, restored, and compared bidirectionally after injected backup
  verification and publication failures;
- an inter-process mutex serializes the entire slot observation/move/publish/rollback transaction;
- Production is refused before source fetch or slot mutation, and the default runtime mode remains
  `Disabled`;
- offline Windows CI proves parser and fail-closed guards without private suite credentials.

## Ownership boundary and denials

Dossier owns evidence-registry projection semantics for
`dossier.evidence-registry-read@1.0.0`. The OS retains authentication, caller county context,
persistence and `CountyId` filtering, authorization, custody/write orchestration, transport, API,
Workbench, and TerraTrace integration. This staging child does not select `LocalExact`, change the
frozen contract or adapter, write evidence/custody records, touch entities/schema/migrations, mutate
the Dossier repository, use county data, deploy, publish a release, or retire sovereign integration
seams.

## Continuation

After protected merge and exact-main verification, a separate dependency-cleared child may implement
a fail-closed process host and make the exact staged Dossier module a real non-production runtime
consumer. That successor must preserve authentication, county isolation, persistence, custody,
TerraTrace, and API/Workbench responsibilities in the sovereign OS and must execute observed
selection and rollback proof before any ownership claim.

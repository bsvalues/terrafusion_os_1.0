# WO-SR-005D-P - Dossier Custody Contract and Evidence-Integrity Gate Preparation

## Verdict

`COMPLETE_DECOMPOSITION_REQUIRED_EVIDENCE_SNAPSHOT_SELECTED`

Dossier has real county-scoped documents, evidence, custody events, packets, and notes, but the
frozen contract manifest has no `dossier.*` group. The smallest safe first cohort is the existing
read-only evidence snapshot. Append-only custody mutation and retention semantics are legally
significant and remain outside this contract lane.

## Audit Basis

| Surface | Exact live evidence | Classification |
| --- | --- | --- |
| Dossier authority | `brain/packs/dossier/README.md:5-49` | Dossier owns documents, evidence, custody, packets, and case files; Forge values, Dais workflows, Atlas geometry, and shell composition are excluded. |
| Document entity | `backend/src/TerraFusion.Core/Entities/DossierDocument.cs:5-63` | County-scoped metadata includes SHA-256, retention class, custody entry, uploader identity, storage path, and description; privacy/storage/retention fields require decomposition. |
| Evidence entity | `backend/src/TerraFusion.Core/Entities/DossierEvidence.cs:5-42` | County-scoped evidence identity, type, integrity, and optional document link are genuine Dossier concepts. |
| Custody entity | `backend/src/TerraFusion.Core/Entities/DossierCustodyEvent.cs:5-35` | Append-only actions, actor, hash, notes, county, and timestamp are real but legally significant mutation semantics. |
| Other cohorts | `backend/src/TerraFusion.Core/Entities/DossierPacket.cs:5-45`, `DossierPacketItem.cs:5-28`, `DossierNote.cs:5-32` | Packets and notes add workflow, content, PII, and completeness concerns; defer them from the first contract. |
| County boundary | `backend/src/TerraFusion.API/Controllers/DossierController.cs:18-27`, `:47-94` | API is authenticated and county-scoped; production fails closed, while a development-only Benton fallback must not enter a suite contract. |
| Snapshot endpoint | `backend/src/TerraFusion.API/Controllers/DossierController.cs:915-1022` | Existing read-only endpoint emits county, parcel, snapshot timestamp, content hash, trace metadata, links, and evidence summaries. |
| Custody mutation API | `backend/src/TerraFusion.API/Controllers/DossierController.cs:1734-2030` | Registration and append-only custody writes update integrity and compute chain hashes; explicitly excluded from the first contract. |
| Trace proof | `backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5Cx24DossierTraceMetadataTests.cs:10-24`, `:45-207` | Synthetic integration proof covers correlation IDs and links without granting audit-storage ownership. |
| Snapshot proof | `backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5Cx25DossierEvidenceSnapshotTests.cs:10-20`, `:44-217`, `:348-406` | Synthetic proof covers same-county success, cross-county 404, missing-county 403, hash shape, links, privacy exclusions, and timestamp-dependent hashes. |
| Cross-county guard | `backend/tests/TerraFusion.Unit.Tests/R1Week3/AtlasDossierControllerGuardsTests.cs:188-291` | Dossier reads/writes deny cross-county parcels and resolve valid county context. |
| Legacy extraction claim | `phase4d.wave1d.dossier-documents.json` | Claims adapted PDF connector parity, but does not prove evidence-snapshot or custody contract parity and is not source authority. |
| Frozen contract state | `backend/src/TerraFusion.Abstractions/contracts.freeze.json` | Contains Forge, Atlas, and cross-cutting groups only; no Dossier contract or package exists. |
| Standalone Dossier | `bsvalues/terrafusion-dossier` `main` at `b211387b7ba3653d901b6223900710b2012395d6` | Private clean bootstrap declares only `crosscut.audit@1.0.0`; no Dossier product or domain contract exists. |

The sovereign audit is pinned to `2b228d65425c4defd8a5afe987e6455328506450`. Quarantined
sources and UI composition are not contract authority.

## Selected Contract Cohort

The next Work Order should decompose `dossier.evidence-snapshot@1.0.0` as a county-scoped,
provider-neutral, read-only projection.

- Candidate identity: `countyId`, `parcelId`, `snapshotTimestamp`, `contentHash`, `correlationId`.
- Candidate evidence summary: stable evidence identifier, type, integrity state, optional document
  reference, and event count only where source proof supports it.
- `contentHash` currently includes the snapshot timestamp. It proves snapshot-byte integrity, not a
  stable document hash or chain-of-custody link. The decomposition must name the hash basis exactly.
- Actor identity, notes, document names/descriptions/storage paths, uploader identity, values,
  workflow state, geometry, and provider details must not cross accidentally.
- Empty evidence is valid and cannot be converted into fixture or demo truth.

## County And Integrity Gate

1. `countyId` and `parcelId` are mandatory in request and result.
2. Missing county context fails closed; development fallback is never contract behavior.
3. Cross-county results are rejected without record-existence disclosure.
4. Integrity vocabulary must be closed and unknown values fail closed.
5. Snapshot hash, document content hash, and custody-event hash are distinct concepts.
6. The first contract grants no custody mutation, verification, transfer, sealing, dispute, retention,
   classification, deletion, or legal-evidence claim.

## Existing Proof And Gaps

- Existing synthetic tests prove endpoint shape, county denial, hash format, links, correlation, and
  omission of note content.
- They do not prove a frozen cross-repository schema, canonical hash serialization, stable evidence
  ordering, duplicate identity handling, standalone parity, retention, or custody-chain validity.
- The timestamp-dependent hash intentionally changes between snapshots and must not be represented
  as stable content identity.

## Next

`WO-SR-005D-C - Dossier Evidence Snapshot Contract Decomposition` is admitted as a docs/evidence-only
R2 slice. It must define exact records, fields, hash basis, ordering, privacy exclusions, enums,
fixtures, and a later implementation allowlist or return `NO_GO`. No contract artifact or runtime
implementation is admitted by this preparation.

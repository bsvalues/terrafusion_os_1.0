# WO-SR-005D-C - Dossier Evidence Snapshot Contract Decomposition

## Verdict

`NO_GO_SNAPSHOT_CROSSES_FORGE_DAIS_AND_OS_COMPOSITION`

The proposed `dossier.evidence-snapshot@1.0.0` contract is rejected. The committed endpoint is a
cross-suite composition view, not a Dossier-owned evidence-record projection. Freezing it under a
Dossier namespace would transfer Property, Forge valuation, levy, and note semantics into the wrong
suite contract.

## Exact Source Reconciliation

| Surface | Exact source evidence | Finding |
| --- | --- | --- |
| Snapshot DTO | `backend/src/TerraFusion.API/DTOs/Dossier/EvidenceSnapshotDto.cs:12-22` | The result contains `Property`, `Valuation`, `Levies`, and `Notes`; these are not a Dossier-only evidence summary. |
| Endpoint composition | `backend/src/TerraFusion.API/Controllers/DossierController.cs:915-1022` | The endpoint reads property facts, CostForge valuation, levies, and notes before calculating a timestamp-dependent hash. |
| Dossier evidence entity | `backend/src/TerraFusion.Core/Entities/DossierEvidence.cs:5-42` | The actual Dossier-owned persistent boundary is county/parcel-scoped evidence identity, type, integrity, optional document link, creator, and creation time. |
| Evidence registry reads | `backend/src/TerraFusion.API/Controllers/DossierController.cs:1817-1898` | Existing authenticated reads retrieve one evidence record or list parcel evidence; they are the bounded source candidate for a later contract. |
| Custody chain read | `backend/src/TerraFusion.API/Controllers/DossierController.cs:1990-2030` | Custody actions, actor, notes, and hashes are legally significant and remain outside the first read contract. |
| Dossier authority | `brain/packs/dossier/README.md:5-49` | Dossier owns documents, evidence, custody, packets, and records; it does not own Forge values, Dais workflows, Atlas geometry, or OS composition. |

The source audit is pinned to sovereign commit
`2ab0331f079c0717ba4f544a4ad7be744ed85d1f`. No county data, provider, SQL, live service, or
quarantined source was accessed.

## Contract Decision

The snapshot fails decomposition for four independent reasons:

1. Its result crosses suite ownership boundaries.
2. Its hash includes `snapshotTimestamp`, so it is neither stable evidence identity nor a custody hash.
3. Notes can carry free text and cannot be imported into a first contract accidentally.
4. A Dossier namespace would misrepresent OS composition behavior as suite-owned capability.

Therefore there is no implementation allowlist, fixture set, parity gate, package boundary, or
publication plan for `dossier.evidence-snapshot@1.0.0`.

## Bounded Successor Candidate

`WO-SR-005D-C2` may decompose `dossier.evidence-registry-read@1.0.0` from the persistent registry
reads only. That Work Order must:

- require `countyId` and `parcelId` and fail closed without development fallback;
- define exact selector-to-result matching and cross-county non-disclosure;
- include only stable evidence identity, evidence type, closed integrity state, optional document
  reference, creation time, and pagination fields supported by source;
- exclude title/free text, creator identity, actor, notes, storage paths, valuation data, levies,
  geometry, workflow state, custody mutation, retention, and provider details;
- require deterministic ordering with a stable identity tie-break and record the current adapter gap;
- fail closed on unknown enums, duplicates, selector mismatch, or malformed identity;
- return a later implementation allowlist or `NO_GO` without modifying source.

## Validation

- Exact committed source and ownership reconciliation: `PASS`.
- Snapshot ownership and hash-basis test: `NO_GO`.
- Runtime, backend, contract, package, workflow, and destination changes: `NONE`.
- Protected county/PACS/SQL, credentials, secrets, and live resources: `UNTOUCHED`.

## Next

Admit `WO-SR-005D-C2 - Dossier Evidence Registry Read Contract Decomposition` as the next R2
docs/evidence slice. No implementation authority is implied.

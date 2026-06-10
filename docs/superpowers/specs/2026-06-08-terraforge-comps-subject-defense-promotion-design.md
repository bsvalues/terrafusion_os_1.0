# TERRAFORGE-COMPS-SUBJECT-DEFENSE-PROMOTION-CONTRACT

**Date:** 2026-06-08
**Author:** Operator (Benton County assessor) — captured by Claude
**Status:** APPROVED — ready for implementation
**Suite:** TerraForge · Module: CompsForge

## Why this slice (and not the others)

CompsForge can today build and persist a draft `market_search` comp set
(`POST /api/terraforge/comps/sets`, landed in `e5d696087`). It still cannot
answer the real appraisal question:

> "How does this market basket become a defensible comp set for a **specific
> subject parcel**?"

That bridge is the missing rung. It must exist before certification, Dossier
export, adjustments, reconciliation, or statewide federation are meaningful.
This slice builds **only that rung**.

### The product ladder

```
Session Basket
    ↓
Draft Market-Search Comp Set         ← we are here (e5d696087)
    ↓  ◀── THIS SLICE
Draft Subject-Defense Comp Set
    ↓
Comparable Diagnosis
    ↓
Adjustment Support
    ↓
Reconciliation
    ↓
Review / Certification
    ↓
Dossier Evidence Packet
```

## Decision: bind only, do not score

The first version **binds** a comp set to a subject parcel and **preserves the
selected candidates unchanged**. It does NOT score, diagnose, adjust, or
reconcile. Making the state transition real comes before adding intelligence —
adding scoring now would invent appraisal logic before the subject-defense
object model exists, creating another fake-smart surface.

## Decision: derive, do not mutate

Promotion **creates a new derived `subject_defense` comp set**. The original
`market_search` comp set remains intact.

```
market_search comp set
        ↓ promote (derive)
new subject_defense comp set  (SourceCompSetId → original)
```

## Two distinct kinds of comp set

| | market_search | subject_defense |
|---|---|---|
| Purpose | Explore/organize comparable sales from a market universe | Prepare selected sales as support for ONE subject parcel |
| `mode` | `market_search` | `subject_defense` |
| `subjectParcelId` | null (optional) | **required** |
| `status` | `draft` | `draft` |
| `officialStatus` | `not_official` | `not_official` |

Subject-bound does **not** mean defended. It means "this comp set is now being
*prepared* for defense of this parcel."

## Backend contract

### Endpoint

```
POST /api/terraforge/comps/sets/{compSetId}/promote-subject-defense
```

Request:

```json
{
  "subjectParcelId": "101974030000025",
  "promotionReason": "Prepare subject defense review",
  "preserveCandidates": true
}
```

`subjectParcelId` is **required**. Missing/blank → 400, no persistence.

Response (201, derived set):

```json
{
  "compSetId": "<new-derived-id>",
  "sourceCompSetId": "<market-search-comp-set-id>",
  "mode": "subject_defense",
  "status": "draft",
  "officialStatus": "not_official",
  "subjectParcelId": "101974030000025",
  "candidateCount": 3,
  "promotionStatus": "promoted",
  "unavailableActions": [
    "certify_official",
    "export_dossier_packet",
    "apply_adjustments",
    "reconcile_value"
  ],
  "provenance": {
    "source": "TerraForge CompsForge",
    "promotionFrom": "market_search",
    "runtime": "county_scoped"
  }
}
```

### Source-set rules

- The source comp set must exist **within the caller's county scope**
  (`TryResolveCountyScopeAsync`). Cross-county → 404 (not found in scope).
- The source comp set must be `mode = market_search`. Promoting a set that is
  already `subject_defense` → 409/400 (not a valid promotion source).
- The source must have ≥ 1 candidate.

### Entity additions (`CompSet`)

The entity already has `Mode`, `Status`, `OfficialStatus`, `SubjectParcelId`.
Add lineage fields (all nullable; only populated on derived subject-defense sets):

```csharp
public Guid? SourceCompSetId { get; set; }      // → original market_search set
public string? PromotionReason { get; set; }    // operator-provided reason
public string? PromotedFromMode { get; set; }   // "market_search"
public DateTime? PromotedAtUtc { get; set; }
public string? PromotedBy { get; set; }          // actor identity if available
```

`CompSetCandidate` already preserves `ParcelId`, `SalePrice`, `SaleDate`,
`PricePerSqft`, `Qualification`, `Rank`, and provenance. **`Rank` carries the
original rank** on the derived candidates — no separate `OriginalRank` field is
added (YAGNI; `Rank` already serves). Derived candidates are deep copies with
new ids, the new `CompSetId`, same `CountyId`, provenance preserved.

### Schema management — bootstrap SQL, NOT EF migration

**Decision (corrected during implementation):** CompSet tables are created and
managed exclusively by the bootstrap table-creation path
(`DatabaseInitializationService`), **not** by EF migrations. Verified: the
committed `TerraFusionDbContextModelSnapshot.cs` contains zero `CompSet`
references — Codex shipped `CompSets`/`CompSetCandidates` via bootstrap SQL
only, and `TerraForgeCompSetContractTests` enforces the bootstrap SQL (not a
migration). Generating an EF migration here is therefore wrong: it scaffolds
`CreateTable CompSets` from scratch and sweeps in unrelated `dry_run_log` index
drift from a concurrent slice.

So the new columns are added in BOTH bootstrap code paths:
- SQLite/dev: `CREATE TABLE` column list + new index.
- Postgres: `CREATE TABLE` column list + idempotent
  `ALTER TABLE "CompSets" ADD COLUMN IF NOT EXISTS ...` for each new column
  (so pre-existing tables are upgraded) + new index.

No EF migration is generated for this slice, by design and for consistency with
the existing CompSet feature.

## Frontend contract

In **market-search mode**, add a `Promote to Subject Defense` action.

Enabled only when:
- the comp set is persisted (we have a `compSetId` from create), AND
- it has ≥ 1 candidate, AND
- `mode = market_search`, AND
- a subject parcel is provided/selected.

If no subject parcel selected:

> "Select a subject parcel to promote this market basket into subject defense."

After successful promotion:

> "Subject Defense draft created. This comp set is now attached to parcel
> {parcelId}. It is still draft and not official. Adjustments, reconciliation,
> certification, and Dossier export are not connected yet."

## Hard NOs (this slice)

- Do not call it "defended" or "official".
- Do not generate a value conclusion / appeal packet.
- Do not export to Dossier; do not mutate Dais or Atlas/GIS.
- Do not apply AI confidence/similarity scoring.
- Do not invent adjustment recommendations; do not auto-reconcile.
- Do not overwrite the original market basket without trace.

## Acceptance tests

### Backend — PASS

- Promote a persisted `market_search` set → new `subject_defense` set.
- `subjectParcelId` required for promotion.
- Original candidates preserved (count + data) on derived set.
- Original market-search set remains intact (unchanged, still `market_search`).
- Derived set has `status = draft`, `officialStatus = not_official`.
- County isolation enforced (cross-county source → not found).
- No Dais / Dossier / Atlas writes.
- Response lists `unavailableActions`: certify_official, export_dossier_packet,
  apply_adjustments, reconcile_value.

### Backend — FAIL (must be rejected)

- Promotion succeeds without `subjectParcelId`.
- Promotion marks the set official.
- Promotion creates Dossier evidence / mutates workflow.
- Promotion creates adjustment/reconciliation artifacts.
- Promotion overwrites the original market basket without trace.

### Frontend — PASS

- Promote button appears for a saved market-search comp set.
- Promote requires a subject parcel.
- Success shows draft/not-official copy.
- Candidate count unchanged.
- Certification/export/reconciliation remain disabled.

### Frontend — FAIL (must not happen)

- UI says "defense complete" / "official comp set".
- UI enables Dossier export.
- UI fabricates adjustment analysis.

## Files

- `backend/src/TerraFusion.Core/Entities/TerraForge/CompSet.cs` — add lineage fields
- `backend/src/TerraFusion.Core/Entities/TerraForge/CompSetConfiguration.cs` — map fields
- `backend/src/TerraFusion.API/Services/DatabaseInitializationService.cs` — bootstrap columns (SQLite + Postgres ALTER), no EF migration
- `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` — promote endpoint + DTOs
- `backend/tests/TerraFusion.SalesForge.Tests/` — promotion contract tests
- `frontend/apps/os-shell/src/pages/suites/modules/CompsForgeModule.tsx` — promote action + copy
- `frontend/apps/os-shell/src/pages/suites/modules/__tests__/` — frontend promotion test

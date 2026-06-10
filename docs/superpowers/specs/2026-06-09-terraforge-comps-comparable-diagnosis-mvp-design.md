# TERRAFORGE-COMPS-COMPARABLE-DIAGNOSIS-MVP

**Date:** 2026-06-09
**Owner lineage:** `fix/projector-delete-insert-atomicity` (only branch with CompSet/CompSetCandidate + subject-defense)
**Workspace:** worktree `feat/compsforge-comparable-diagnosis-mvp` (isolated from the Slice-I quarantine agent writing in the primary tree)
**Status:** APPROVED — backend-first
**Suite:** TerraForge · Module: CompsForge

## What this is

For a `subject_defense` comp set, produce and persist **transparent, rule-based,
deterministic** per-candidate diagnostics — a draft review aid that flags
candidate risks and review needs. It is the rung after subject-defense promotion:

```
Draft Subject-Defense Comp Set   (done, 6b673bf14)
        ↓  ◀── THIS SLICE
Comparable Diagnosis (draft review aid)
        ↓
Adjustment Support → Reconciliation → Review/Certification → Dossier Packet → Statewide
```

## Hard rules (unchanged from operator directive)

- Rule-based, deterministic. **No AI scoring, no confidence number, no "best comp."**
- `subject_defense` sets only. Reject `market_search`, official/certified, missing `subjectParcelId`, wrong county.
- Candidates unchanged; comp set stays `status=draft` / `officialStatus=not_official`.
- No adjustments, reconciliation, certification, Dossier export, statewide federation.
- No Dais/Dossier/Atlas mutation.
- Bootstrap SQL for new `CompSetCandidate` columns — **no EF migration** (CompSet convention).
- Honest copy: "draft review aid… does not apply adjustments, reconcile value, certify, or create Dossier evidence."

## Real-data sources (no fabrication)

- **Candidate** characteristics: `ComparableSales` (county-scoped) by `ParcelId` →
  GLA, LotSizeSqft, Neighborhood, QualityGrade, Condition, SaleDate, validity fields.
- **Subject** characteristics: `CamaCharacteristics` (county-scoped) by `ParcelId`,
  latest `TaxYear` → SquareFeet, LandAreaSqft, NeighborhoodCode, QualityGrade, ConditionGrade.
- If a row is missing → emit `missing_candidate_data` / `missing_subject_data` and
  **skip** the rules that need the absent data. Never invent a mismatch.

## Deterministic rule set (v1)

Intrinsic / intra-set (always computable from candidate data):
- `missing_candidate_data` — candidate sale row not found in county scope, or GLA/price missing.
- `sale_validity_unknown` — qualification not in the qualified set.
- `stale_sale` — SaleDate older than 60 months before the supplied `asOf` date.
- `high_price_per_sqft_outlier` — candidate $/sqft deviates > 40% from the set's
  median $/sqft (requires ≥ 3 candidates with a usable $/sqft).

Subject-relative (computed only when subject data is present):
- `missing_subject_data` — no CamaCharacteristics row for the subject (set-level;
  also surfaced per candidate so the appraiser sees why subject rules didn't run).
- `different_market_area` — candidate neighborhood ≠ subject neighborhood.
- `gla_mismatch` — |candGLA − subjGLA| / subjGLA > 25%.
- `site_size_mismatch` — |candLot − subjLot| / subjLot > 50%.
- `quality_mismatch` — normalized candidate quality ≠ subject quality.
- `condition_mismatch` — normalized candidate condition ≠ subject condition.

Derived:
- `requires_reviewer_attention` — true when any non-trivial flag is present.

## qualificationStatus (deterministic mapping)

- `needs_review` — `missing_candidate_data` present (cannot fully assess).
- else by significant-flag count over {sale_validity_unknown, stale_sale,
  high_price_per_sqft_outlier, different_market_area, gla_mismatch,
  site_size_mismatch, quality_mismatch, condition_mismatch}:
  - 0 → `strong`
  - 1–2 → `usable`
  - ≥ 3 → `weak`
- `disqualified` — reserved; v1 does not auto-disqualify (humble). Not emitted yet.
- `reviewRequired` — true when status ∈ {weak, needs_review} or any flag present.

## The engine is pure (DB-free, deterministic)

`CompSetDiagnosisEngine.Diagnose(subject, candidates, asOf, version)` →
list of per-candidate results. No DB, no `DateTime.UtcNow` inside (caller passes
`asOf`), no randomness → fully unit-testable. The controller does all DB I/O,
builds the engine inputs, calls the engine, persists results, returns the DTO.

## Persistence (CompSetCandidate columns, bootstrap SQL)

```
QualificationStatus   (string?)
DiagnosisStatus       (string?)   // "draft" once diagnosed
ReviewRequired        (bool?)
DiagnosticFlagsJson   (string?)   // JSON array of flag strings
SupportSummary        (string?)   // plain-language reason
DiagnosedAtUtc        (DateTime?)
DiagnosedBy           (string?)
DiagnosisVersion      (string?)   // "rules_v1"
```

SQLite `CREATE` column list + `IX`? not needed. Postgres `CREATE` columns +
idempotent `ALTER TABLE "CompSetCandidates" ADD COLUMN IF NOT EXISTS ...`.

## Endpoints

```
POST /api/terraforge/comps/sets/{compSetId}/diagnose
GET  /api/terraforge/comps/sets/{compSetId}/diagnosis
```

POST rejects: invalid id (400), missing in county scope (404), `mode != subject_defense`
(409), `officialStatus == official` (409), missing `subjectParcelId` (409).
Response includes `unavailableActions`: apply_adjustments, reconcile_value,
certify_official, export_dossier_packet.

## Acceptance gate

- Diagnosis runs only on `subject_defense` drafts.
- Each candidate gets status + flags + summary; candidates otherwise unchanged.
- Comp set stays draft / not_official; original `market_search` source untouched.
- County isolation enforced.
- unavailableActions always list adjustments/reconciliation/certification/Dossier.
- No EF migration / snapshot change; no primary-tree files touched (worktree only).
- GET returns the persisted diagnosis.

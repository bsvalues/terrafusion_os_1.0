# TERRAFORGE-COMPS-SUBJECT-DEFENSE-DETAIL-VIEW

**Date:** 2026-06-09 · **Branch:** feat/compsforge-subject-defense-detail (off owner dd4e8fb39)
**Status:** APPROVED — backend-first · **Suite:** TerraForge · Module: CompsForge

## What this is

A focused, **read-only** subject-defense detail surface that consolidates, for one
comp set, everything an appraiser needs to read the defensibility picture in one
place — without re-deriving anything:

- subject parcel summary (from CamaCharacteristics)
- selected candidates
- the rule diagnosis layer (preserved)
- the human reviewer layer (separate)
- certification posture + draft/not-official posture
- the actions that remain unavailable

Not a dashboard. Not new analysis. A single aggregating read over data that
already exists (CompSet + CompSetCandidate rule layer + CompSetCandidateReview
reviewer layer + CamaCharacteristics subject + certification fields).

## Hard rules

- Read-only. No mutation of any kind. No new SQL/proof logic — reuse the existing
  county-scoped reads (CompSets, CompSetCandidates, CompSetCandidateReviews, CamaCharacteristics).
- County-isolated. Works for any persisted comp set; subject summary is populated
  only when CamaCharacteristics exists (else `found=false`).
- No adjustments / reconciliation / dossier export / statewide federation / AI scoring.
- Reviewer override is shown as a SEPARATE layer; the rule diagnosis is shown verbatim.

## Backend

```
GET /api/terraforge/comps/sets/{compSetId}/detail
```
Invalid id → 400; not found in county scope → 404. Returns:
- compSetId, name, mode, status, officialStatus, subjectParcelId
- posture: { draft, official, certified }
- subject: { parcelId, found, grossLivingArea, lotSizeSqft, neighborhoodCode, qualityGrade, conditionGrade }
- certification: { certified, certifiedBy, certifiedAtUtc }
- candidates[]: candidateId, parcelId, rank, salePrice, saleDate, pricePerSqft, qualification,
  ruleQualificationStatus, ruleFlags[], ruleSupportSummary, diagnosisStatus,
  review: { disposition, reviewerNote, acknowledgedFlags[], qualificationOverride, overrideReason, reviewedBy, reviewedAtUtc } | null
- unavailableActions[]: apply_adjustments, reconcile_value, export_dossier_packet, statewide_federation
- note (honest, read-only aid wording)

## Frontend

A `SubjectDefenseDetail` component (its own file, to avoid bloating the module)
rendered in the CompsForge subject-defense area: subject summary card, per-candidate
rows showing rule layer + reviewer layer side by side, certification banner, posture
badges, unavailable-action chips. Honest copy; no overclaim.

## Acceptance

- detail returns subject summary + candidates with rule AND reviewer layers + posture.
- county isolation; invalid id → 400; not found → 404; read-only (no writes).
- subject `found=false` when no CamaCharacteristics; rows still render.
- certified set shows certified posture; draft set shows draft/not-official.
- frontend renders all layers; reviewer override shown separate from rule status.
- live e2e on real Postgres.

# TERRAFORGE-COMPS-DIAGNOSIS-REVIEW-NOTES

**Date:** 2026-06-09
**Branch:** feat/compsforge-diagnosis-review-notes (off owner HEAD 0a9a236c4)
**Status:** APPROVED — backend-first
**Suite:** TerraForge · Module: CompsForge

## What this is

Let a human appraiser respond to the rule-based comparable diagnosis. The
machine flags risk; the human reviews, explains, and (optionally) overrides —
and **both layers are preserved separately and traceably.**

```
system flags risk (rule diagnosis)  →  human reviews  →  human explains  →  trace keeps both
```

## Hard rules

- The original rule diagnosis on `CompSetCandidate` (QualificationStatus, flags,
  SupportSummary, …) is **never mutated** by review. The human layer lives in a
  **separate entity** (`CompSetCandidateReview`).
- A human override is stored on the review record only; it does NOT overwrite the
  rule's QualificationStatus. UI shows both ("rule says X, reviewer says Y").
- subject_defense + draft only. Not official, not certified.
- No adjustments, reconciliation, certification, Dossier export, federation.
- County-isolated. Bootstrap-SQL for the new table — no EF migration (CompSet convention).

## Entity (separate layer)

`CompSetCandidateReview` — one current review row per candidate (upsert on re-review):

```
CompSetCandidateReviewId  Guid PK
CompSetId                 Guid
CompSetCandidateId        Guid   (the reviewed candidate)
CountyId                  Guid
ParcelId                  string (convenience)
Disposition              string  (required; enum below)
ReviewerNote             string? (<=2000)
AcknowledgedFlagsJson    string? (JSON array of flag codes the reviewer acknowledged)
QualificationOverride    string? (optional human status; strong|usable|weak|needs_review|disqualified)
OverrideReason           string? (REQUIRED when QualificationOverride is set)
ReviewedBy               string
ReviewedAtUtc            DateTime
```

Disposition enum:
```
accepted_for_review | needs_field_verification | needs_sale_validation
| reject_as_comparable | use_as_secondary_support
```

## Endpoints

```
POST /api/terraforge/comps/sets/{compSetId}/candidates/{candidateId}/review
GET  /api/terraforge/comps/sets/{compSetId}/reviews
```

POST rules:
- comp set must be subject_defense (409 otherwise), not official (409).
- candidate must belong to the comp set + county scope (404 otherwise).
- Disposition required + in the enum (400 otherwise).
- If QualificationOverride present, OverrideReason required (400 otherwise);
  override must be in the status enum (400 otherwise).
- Upsert: one review row per candidate (re-POST replaces it; ReviewedAtUtc updates).
- NEVER writes to CompSetCandidate diagnosis fields.

GET returns, per candidate: the **rule diagnosis** (from CompSetCandidate) AND the
**reviewer layer** (from CompSetCandidateReview, null if not yet reviewed) — both
visibly separate. Also `unavailableActions` (adjustments/reconcile/certify/export).

## Acceptance

- Review persists in CompSetCandidateReview; candidate's rule diagnosis unchanged.
- Disposition validated; invalid → 400.
- Override without reason → 400; override never overwrites rule QualificationStatus.
- Re-review upserts (one row per candidate).
- County isolation; subject_defense-only (market_search → 409).
- GET returns rule layer + reviewer layer separately; unavailableActions intact.
- No EF migration/snapshot change.

## Files

- `backend/src/TerraFusion.Core/Entities/TerraForge/CompSet.cs` — add CompSetCandidateReview
- `backend/src/TerraFusion.Data/Configurations/TerraForge/CompSetConfiguration.cs` — config
- `backend/src/TerraFusion.Data/TerraFusionDbContext.cs` — DbSet + apply config
- `backend/src/TerraFusion.API/Services/DatabaseInitializationService.cs` — bootstrap table
- `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` — endpoints + DTOs
- `backend/TerraFusion.API.Tests/TerraForge/` — behavioral tests
- (UI after backend) `frontend/.../CompsForgeModule.tsx` — reviewer affordance

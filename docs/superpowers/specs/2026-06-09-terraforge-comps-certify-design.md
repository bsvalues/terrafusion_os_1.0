# TERRAFORGE-COMPS-CERTIFY

**Date:** 2026-06-09
**Branch:** feat/compsforge-certify (off owner HEAD 45dfdf976)
**Status:** APPROVED — backend-first
**Suite:** TerraForge · Module: CompsForge

## What this is

The first and only action that moves a comp set off `not_official`: certify a
**reviewed** subject-defense comp set as the official record of defense, then
**lock it**. Certification freezes the rule diagnosis + reviewer layers as the
official record; it does not adjust, reconcile, or export.

```
... → Comparable Diagnosis → Review Notes → Certification (THIS) → [later: Dossier packet]
```

## Policy decisions (operator-approved)

1. **Human-in-the-loop precondition** — certify is rejected (409) unless EVERY
   candidate has a `CompSetCandidateReview` (a reviewer decision). You cannot
   certify an un-reviewed set. (Reviewing implies it was diagnosed first.)
2. **Lock-after-certify** — once certified, `diagnose`, `review`, and any
   re-certify on that set return 409. The rule + reviewer layers are already
   immutable by design; certification freezes the whole set.

## Hard rules

- Certification is the ONLY action that sets `officialStatus = official`.
- subject_defense only; must be `status = draft` / `officialStatus = not_official`
  at certify time. Re-certify → 409.
- County-isolated. Bootstrap-SQL for new columns — no EF migration.
- Still NO adjustments, reconciliation, Dossier export, statewide federation.

## Entity (new CompSet fields)

```
CertifiedBy        string?   (actor identity)
CertifiedAtUtc     DateTime? (when)
```

`status` becomes `certified` and `officialStatus` becomes `official` on certify.
No separate snapshot table — the rule layer (CompSetCandidate) and reviewer layer
(CompSetCandidateReview) are already append-only/immutable-by-rule; the lock
preserves them.

## Endpoints

```
POST /api/terraforge/comps/sets/{compSetId}/certify
GET  /api/terraforge/comps/sets/{compSetId}/certification
```

POST rules:
- Invalid id → 400; not found in county scope → 404.
- mode != subject_defense → 409.
- already official/certified → 409 (re-certify blocked).
- any candidate missing a reviewer decision → 409 (lists how many unreviewed).
- on success: officialStatus=official, status=certified, stamp CertifiedBy/At.

Response includes: compSetId, status, officialStatus, certifiedBy, certifiedAtUtc,
candidateCount, reviewedCount, plus unavailableActions
(apply_adjustments, reconcile_value, export_dossier_packet, statewide_federation).

GET returns current certification status (certified or draft, who/when, counts).

## Lock enforcement

`diagnose` and `review` already reject `officialStatus == official` (409) — the
lock is enforced by those existing guards once certify sets official. Add tests
proving the lock. `promote-subject-defense` derives from market_search sources
only, so it is unaffected.

## Acceptance

- Certify a fully-reviewed subject_defense set → official/certified + stamped.
- Certify with any unreviewed candidate → 409, nothing changes.
- Certify non-subject_defense → 409; re-certify → 409.
- After certify: diagnose → 409, review → 409 (locked).
- County isolation; invalid id → 400; not found → 404.
- No EF migration/snapshot change.
- Live e2e: create→promote→diagnose→review all→certify→locked, on real Postgres.

## Files

- `backend/src/TerraFusion.Core/Entities/TerraForge/CompSet.cs` — CertifiedBy/At
- `backend/src/TerraFusion.Data/Configurations/TerraForge/CompSetConfiguration.cs`
- `backend/src/TerraFusion.API/Services/DatabaseInitializationService.cs` — bootstrap columns
- `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` — certify/certification + DTOs
- `backend/TerraFusion.API.Tests/TerraForge/` — behavioral tests
- (UI after backend) `frontend/.../CompsForgeModule.tsx` — Certify action

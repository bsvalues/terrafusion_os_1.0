# Current Use Case Desk Design

## Goal

Replace CUForge's previous tabbed view with a case desk for Ag Appraisers and Chief Appraisers.

## Scope

Canonical product surface:

```txt
frontend/apps/os-shell/src/pages/forge/current-use/*
```

Standalone TerraForge Current Use pages are legacy/dev-only and are not expanded in this slice.

## Data Contract

This slice does not add backend endpoints or persistence. The case desk is derived from existing live Current Use records:

- `/currentuse/classifications`
- `/currentuse/removals`
- `/currentuse/interest-rates`
- `/currentuse/rollback/calculate`

The UI must display the honest source label:

```txt
Case Desk derived from live Current Use records.
```

## Product Shape

The app thinks in cases, not panels. A case represents a parcel-centered Current Use workload item derived from classification, removal, and rollback exposure data.

Primary units:

- `CurrentUseCaseDeskPage`: host for derived case data, queue selection, case selection, and appraiser/chief work surfaces.
- `CurrentUseWorkQueue`: daily Ag Appraiser queue with actionable lanes.
- `CurrentUseCaseFile`: selected parcel case file with classification, acreage, value exposure, status, removal context, and timeline.
- `CurrentUseChecklist`: staff compliance checklist derived from live fields.
- `CurrentUseRollbackWorksheet`: row-level rollback worksheet using existing rollback calculation output.
- `CurrentUseNoticeActionPanel`: non-persistent notice preparation for missing evidence, intent to remove, and final notice actions.
- `CurrentUseChiefReviewPanel`: Chief Appraiser review queue derived from high-risk, high-dollar, removal, and notice-ready cases.

## Derived Queue Rules

The first version uses deterministic derived rules:

- Missing Evidence: classification has no acreage, no current use value, no market value, or no tax savings.
- Pending Owner Response: files waiting on owner/operator documents or withdrawal clarification.
- Continuance Pending: active classifications with no removal and complete core values.
- Inspection Required: files needing field inspection, aerial review, or land-use verification.
- Rollback Incomplete: removal files without a completed rollback worksheet.
- Notice Ready: files ready for missing evidence, intent to remove, or final notice preparation.
- Pending Chief Review: missing evidence, high-dollar rollback exposure, exception, appeal, or removal decision files requiring Chief Appraiser review.
- Waiting on Treasurer: issued or confirmed rollback files waiting for Treasurer billing or receipt.
- Appeal Active: files with active appeal, hearing, or board review posture.

## Non-Persistent Interaction Rules

Because this slice is frontend-operational first:

- Checklist items are computed and may show session-only visual state if needed.
- Notice actions are prepared in the UI and labeled as not saved to the case record.
- Chief approve/return actions are review preparation only.
- No user action claims to persist to backend.

## Testing

Tests must prove:

- CUForge renders the Current Use Case Desk identity and honest derived-source label.
- Work queues are derived from live classification/removal data.
- Selecting a queue and case updates the case file.
- Rollback worksheet sends the existing rollback calculation request and renders row-level detail.
- Chief review queue exposes high-liability cases without backend persistence claims.

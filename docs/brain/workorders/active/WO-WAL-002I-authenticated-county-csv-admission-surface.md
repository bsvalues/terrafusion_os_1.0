# WO-WAL-002I — Authenticated County CSV Admission Surface

| Field | Value |
| --- | --- |
| Status | `ACTIVE_DEPENDENCY_CLEARED` |
| Parent | `WO-WAL-002` |
| Predecessor | `WO-WAL-002H`; protected merge `f868693429d875afd2bbc137f68612db8c942d08` |
| Program | Washington Assessor Launch V1 |
| Risk | R5 authenticated county-scoped upload UI and metadata history |
| Contract | `wal.county-upload.authenticated-admission-surface.v1` |
| Environment | `local-os-shell-and-disposable-api-sqlite` |
| Terminal condition | `AUTHENTICATED_COUNTY_CSV_ADMISSION_AND_COUNTY_ONLY_HISTORY_VISIBLE` |

## Assessor outcome

An assessor can choose a Washington county in Counties HUB, open the dedicated Canon data-admission
surface, prove that the authenticated canonical county matches that selection, admit a bounded
Parcels or Sales CSV through the protected API, and see durable admission metadata for that county
only. The surface must state that admission is not staging, publication, or TerraForge availability.

## Exact reservations

- `docs/brain/workorders/active/WO-WAL-002I-authenticated-county-csv-admission-surface.md`
- `backend/src/TerraFusion.Core/Import/CountyCsvUploadAdmissionLedger.cs`
- `backend/src/TerraFusion.Data/Services/Import/CountyCsvUploadAdmissionLedger.cs`
- `backend/src/TerraFusion.Data/Extensions/CountyCsvUploadAdmissionServiceCollectionExtensions.cs`
- `backend/src/TerraFusion.API/Controllers/DataImportController.cs`
- `backend/TerraFusion.API.Tests/Controllers/DataImportControllerTests.cs`
- `backend/tests/TerraFusion.Unit.Tests/Import/CountyCsvUploadAdmissionServiceRegistrationTests.cs`
- `frontend/apps/os-shell/src/Router.tsx`
- `frontend/apps/os-shell/src/components/CountiesHub.tsx`
- `frontend/apps/os-shell/src/pages/canon/CountyCsvAdmissionPage.tsx`
- `frontend/apps/os-shell/src/pages/canon/__tests__/CountyCsvAdmissionPage.test.tsx`
- `frontend/apps/os-shell/src/services/canon/countyCsvUpload.ts`
- `frontend/apps/os-shell/src/services/__tests__/countyCsvUpload.test.ts`
- `frontend/apps/os-shell/src/__tests__/routes/suiteRouting.contract.test.tsx`
- `frontend/apps/os-shell/src/__tests__/shell/countiesHubJourney.contract.test.tsx`

## Contract

1. Expose recent durable admission metadata through an assessor-protected endpoint. Resolve the
   county exclusively from authenticated canonical context and query only that immutable county ID.
2. Keep Counties HUB department-agnostic: it selects county navigation context and links to the
   dedicated Canon data-admission route; it does not execute the mutating upload workflow.
3. The Canon surface recognizes only the 39 canonical Washington county codes and does not treat the
   route or any form field as authority.
4. Suppress upload controls unless the protected history response's county name and key exactly match
   the canonical route county. Reject cross-county history batches, malformed responses, and
   mismatched admission receipts.
5. Submit only the selected CSV and closed `Parcels`/`Sales` dataset. Never send a caller-selected
   county identifier.
6. Refresh and display county-only durable admission history after success. Label every receipt and
   history row `admitted-not-staged`; do not make a runtime capability claim.

## Denials

No row staging, mapping, quarantine, canonical promotion, trust/capability recomputation, TerraForge
consumption, rollback execution, external county system access or write-back, protected county file,
credential, live database, production deployment, or completion of `WO-WAL-002` is authorized.

## Validation

- focused API controller and disposable-SQLite persistence/history tests;
- focused frontend client, route, navigation, same-county admission, mismatched-county refusal, and
  malformed-response tests;
- frontend type-check and build, API Release build, required protected checks, exact-head independent
  review, protected merge, and exact-merge acceptance;
- browser observation of Counties HUB navigation and the dedicated admission surface without a false
  staging or TerraForge availability claim.

## Continuation

After exact-merge acceptance, continue under `WO-WAL-002` to the highest remaining assessor-visible
upload blocker: county-scoped row staging, validation/quarantine, promotion, runtime consumption, or
rollback. No owner relay is required inside the active mission authority.

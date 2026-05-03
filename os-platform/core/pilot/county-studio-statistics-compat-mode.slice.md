# Slice Card: county-studio-statistics-compat-mode

## Purpose

Implement an explicit County Studio **Statistics Compat** mode that uses the
`statistics_ratio_study_compat_v1` shared population contract without changing
or weakening the existing **Operational Health** lens.

This slice exists because the current truth gates prove County Studio health
and TerraForge ratio-study are different analytical populations, not failed
copies of one another.

## Current Posture

- County Studio Operational Health exists and remains the command/workbench lens.
- Benton direct-source recomputation passes for sampled County Studio segments.
- Statistics parity remains provisional.
- `statistics_ratio_study_compat_v1` is defined in the shared contract proof.
- The blocking implementation gap is: County Studio has no same-population
  Statistics Compat mode.

## Governance Scope

### Current Authorized Scope For This Slice Card

This planning artifact is inside the current allowed governance surface:

- `os-platform/core/pilot/county-studio-statistics-compat-mode.slice.md`

### Implementation Scope Requiring Explicit Authorization

The implementation itself will require explicit authorization because the
likely files live outside the current Core Governance Surface:

- `backend/src/TerraFusion.API/**`
- `backend/src/TerraFusion.Core/**`
- `frontend/apps/os-shell/src/pages/forge/county-studio/**`
- `frontend/apps/os-shell/src/pages/forge/statistics/**`
- frontend tests under `frontend/apps/os-shell/src/**/__tests__/**`

Do not modify those implementation files under the current AGENTS.md rules
until the user explicitly authorizes this slice's implementation scope.

## Forbidden Work

- Do not collapse Operational Health into Statistics Compat.
- Do not remove or hide Statistics Studio.
- Do not claim County Studio replaces Statistics Studio until parity proof passes.
- Do not reinterpret the existing health summary as a ratio-study-compatible metric.
- Do not widen into unrelated County Studio workflow, SyncAtlas, mapping, auth, or
  CostForge work.
- Do not use 39-county demo/reference data as production parity proof.
- Do not silently treat 2017 conversion-sensitive qualification fields as
  production verified.

## Product Model

County Studio must expose two explicit modes:

| Mode | Meaning | Population |
| --- | --- | --- |
| Operational Health | Command/workbench health rollup | Active segment-set parcel rollup |
| Statistics Compat | Parity lens for Statistics/TerraForge ratio-study | `statistics_ratio_study_compat_v1` qualified-sale ratio rows |

Mode selection must be visible in the County Studio UI. It must not be inferred
from route state, hidden defaults, or silent fallback behavior.

## Required Contract

Statistics Compat must implement `statistics_ratio_study_compat_v1` exactly:

- Same county id.
- Same tax year.
- Comparison unit: qualified sale ratio row.
- Same assessed-value identity semantics, with parcel identity reconciliation
  reported.
- Sale window:
  - `SalesYear = taxYear`, or
  - null `SalesYear` with `SaleDate >= Jan 1 (taxYear - 2)` and
    `SaleDate < Jan 1 taxYear`.
- Qualification rule:
  - `QualificationDecision == qualified`, or
  - null decision with `QualificationRecommendation == qualified/null`.
- `SaleQualification`-only inclusions must be reported as conversion-sensitive,
  not silently treated as parity truth.
- Exclude `SuppressOnRatioRptCd = T`.
- Exclude `IncludeNoCalc = true`.
- Report `countWithRatio` before outlier trimming.
- Compute statistics on Tukey/IQR-trimmed rows.
- Report `outliersExcluded`.
- Echo the applied segment/cohort/county-wide scope in every response.
- Echo trust posture:
  - Production Provisional
  - Sync-Derived
  - Converted Legacy Sensitive

## Expected Backend Shape

Add or expose a County Studio statistics-compat read path that returns at least:

- `contractId`
- `studyId`
- `countyId`
- `taxYear`
- `mode`
- `population`
- `identityJoin`
- `saleWindow`
- `qualificationPolicy`
- `suppressionPolicy`
- `outlierPolicy`
- `trustPosture`
- `countWithRatio`
- `outliersExcluded`
- `trimmedCount`
- `medianRatio`
- `cod`
- `prd`
- `weightedMeanRatio`
- `prb`
- `conversionSensitiveCounts`
- `parcelIdentityReconciliation`

The response must be comparable to TerraForge ratio-study without consulting UI
state.

## Expected UI Shape

County Studio must expose an explicit mode control:

- Operational Health
- Statistics Compat

Operational Health should keep the current health summary behavior.

Statistics Compat should display:

- contract id
- population count
- pre/post-trim counts
- median/COD/PRD
- weighted mean/PRB
- conversion-sensitive qualification count
- trust badges
- parity status against TerraForge ratio-study

## Proof Gates

Required existing gates:

- `pnpm run type-check`
- `node --test os-platform/core/tests/phase83-tools.test.mjs`

Required truth gates:

- `pnpm run truth:direct-source`
- `pnpm run truth:statistics-parity-scope`
- `pnpm run truth:statistics-shared-contract`
- `pnpm run truth:dev-data`

Expected behavior after implementation:

- `truth:statistics-shared-contract` must no longer report
  `IMPLEMENTATION_GAP_SHARED_PARITY_MODE_MISSING`.
- `truth:dev-data` may still warn on trust-tier or conversion-sensitive lineage,
  but must not fail because County Studio lacks the shared parity mode.

## Parity Acceptance Conditions

For the selected Benton control study:

- County Studio Statistics Compat `contractId` equals
  `statistics_ratio_study_compat_v1`.
- County Studio Statistics Compat and TerraForge ratio-study use the same
  population definition.
- `countWithRatio` matches exactly.
- `outliersExcluded` matches exactly.
- `medianRatio` matches within `0.0001`.
- `COD` matches within `0.01`.
- `PRD` matches within `0.0001`.
- `weightedMeanRatio` matches within `0.0001`.
- `PRB` matches within `0.0001`.
- Parcel identity reconciliation counts are present.
- Conversion-sensitive qualification counts are present.
- The proof artifact names any remaining mismatch as one of:
  - source data mismatch
  - derivation mismatch
  - API mapping mismatch
  - frontend mapping mismatch
  - scope mismatch
  - upstream qualification uncertainty
  - honest unavailable / incompatible comparison

## Completion Criteria

This slice is complete only when:

- County Studio exposes both modes explicitly.
- Operational Health remains unchanged as the segment-set rollup lens.
- Statistics Compat implements `statistics_ratio_study_compat_v1`.
- Same-population parity proof passes for the Benton control study.
- Statistics Studio remains visible until parity proof passes.
- The final evidence explains whether the Statistics superset claim can be
  upgraded or remains provisional.

## Starting Evidence

- `os-platform/core/pilot/evidence/direct-source-recompute.latest.json`
- `os-platform/core/pilot/evidence/statistics-parity-scope-alignment.latest.json`
- `os-platform/core/pilot/evidence/statistics-shared-population-contract.latest.json`
- `os-platform/core/pilot/evidence/dev-data-truth-gate.latest.json`

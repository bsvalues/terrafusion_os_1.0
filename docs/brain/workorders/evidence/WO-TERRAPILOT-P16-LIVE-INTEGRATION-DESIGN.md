# WO-TERRAPILOT-P16 — Live Integration Design Packet

**Goal:** `GOAL-TERRAPILOT-TOOL-MATURITY`  
**Loop:** `LOOP-TERRAPILOT-TOOL-MATURITY`  
**Date:** 2026-08-26  
**Status:** COMPLETE ON PROTECTED MERGE — DESIGN ONLY  
**Candidate:** `summarize_levy_rate_components`  
**Current maturity:** L2 / `contract-covered` / `liveIntegration: false`

## Authority and boundary

The owner directed execution of the already-listed Work Orders on 2026-08-26 and explicitly rejected repeated re-authorization of decisions already recorded by those Work Orders. P16 is the already-listed design-only successor in the TerraPilot maturity program. This packet completes **P16 design only** when the protected PR merges.

This Work Order does **not** authorize or perform runtime implementation, handler mutation, backend mutation, tool-maturity promotion, `liveIntegration: true`, deployment, schema/database migration, secrets access, PACS access, county SQL access, or live county-data access. A runtime implementation is a different Work Order and is not invented here.

## Existing implementation truth

The candidate is not hypothetical. Current source already contains:

- manifest/registry identity for `summarize_levy_rate_components` as a Dais, read-only, Muse-mode tool;
- the real handler export `summarizeLevyRateRealHandler` in `os-platform/core/pilot/handlers.real.ts`;
- an in-handler county-boundary check through `assertCountyMatch(params.county, context.countyId)`;
- authenticated backend-token acquisition through `acquirePilotToken()`;
- an existing backend call to `POST /api/levy-calculation/calculate-rate`.

The current handler sends:

- `districtId` / `districtName` derived from the request;
- `countyCode` derived from the execution context;
- `districtType: county-regular` and `measureType: regular`;
- **assessed value and budget amount from fixture/fallback values** (`TF_R1_FIXTURE_ASSESSED_VALUE` / `TF_R1_FIXTURE_BUDGET_AMOUNT`, with hard-coded fallbacks).

That is a decisive L2/L3 boundary. The request reaches real backend code, but its financial inputs are not established as live authoritative levy inputs. The candidate therefore remains correctly classified `contract-covered`, not live-integrated.

## Existing levy surfaces evaluated

P16 evaluated the existing levy controllers instead of inventing a new service.

### 1. `LevyCalculationController` — current handler target

- routes: `/api/levy-calculation` and `/api/levy/v1`;
- current action: `POST calculate-rate`;
- authorization: roles `LevyClerk,Assessor,Admin,Administrator`;
- county isolation: JWT county identity is resolved from `countyId` / `countyCode`, then `request.CountyCode` must match;
- the action calculates rates and **persists a `TaxLevy` row**;
- `GET history` is authenticated and county-scoped but reads those persisted calculation records.

**Disposition:** not selected for the read-only TerraPilot integration. `POST calculate-rate` mutates persistence and conflicts with the tool's `read_only` / `writeLane: null` contract. `GET history` is useful historical evidence but is not the authoritative native current-rate source for this summary tool.

### 2. `LevyCalculatorController`

- route: `/api/levy/calculator`;
- `calculate-rate`, `bill-impact`, and `rate-comparison/{districtId}` are calculation/read surfaces over native TerraLevy tables;
- the class has `[Authorize]`, but all three actions currently override it with `[AllowAnonymous]`;
- `calculate-rate` accepts caller-supplied assessed value and levy amount rather than resolving authoritative current district facts.

**Disposition:** not selected. It is non-persisting, but its anonymous/caller-supplied input boundary does not satisfy the intended authenticated county-governed L3 path.

### 3. `LevyController`

- route: `/api/levy`;
- `GET rates` reads certified PACS-seeded levy codes/rates;
- `GET tax-areas` reads tax-area/levy associations;
- `GET calculate` performs read-only itemized tax-area arithmetic;
- the controller has no authenticated county-context boundary and is Benton-specific by implementation/data source.

**Disposition:** not selected for this tool. It is valuable real Benton levy data, but the current `districtCode` tool contract is not a tax-area/assessed-value calculation contract and the endpoint does not independently enforce authenticated county identity.

### 4. `LevyDashboardController` — selected backing read model

- route: `/api/levy/dashboard`;
- `GET districts-overview` reads `LevyRates`, `LevyMeasures`, `LevyCertifications`, and district data from the native `LevyDbContext` without persistence mutation;
- it returns, per district/year: `DistrictCode`, `DistrictName`, `DistrictType`, current `Rate`, `AssessedValue`, `LevyAmount`, optional `AiOptimalRate`, `StatutoryLimit`, certification state, prior-year rate, and year-over-year delta;
- it therefore contains the exact real read facts required to replace the current fixture-backed calculation request.

The current action is **not yet an acceptable L3 boundary as implemented** because `[AllowAnonymous]` overrides class authorization and `countyId` is caller-supplied. That defect is part of the selected design, not hidden.

**Selected future runtime boundary:** harden and consume `GET /api/levy/dashboard/districts-overview` as an authenticated, claim-derived, county-scoped read endpoint. Do not add a parallel levy service.

## Exact future runtime mapping

If a separate runtime Work Order is later admitted, it must implement the selected boundary exactly as follows.

1. **Backend county/auth hardening**
   - Remove the action-level anonymous override from `districts-overview` for the TerraPilot integration path.
   - Resolve county from authenticated claims using the existing TerraFusion county-context pattern; do not trust an arbitrary caller-supplied `countyId` as authority.
   - Reject a requested county that does not match the authenticated county.
   - Preserve read-only `AsNoTracking` behavior and make no levy persistence mutation.

2. **District resolution**
   - Query the requested `taxYear` within the authenticated county only.
   - When `districtCode` is supplied, require exactly one matching `DistrictCode`; zero or ambiguous matches return an explicit unavailable/error result without fallback fixtures.
   - When `districtCode` is absent, resolve exactly one county-regular district row for the authenticated county/year. If that is not uniquely resolvable, return an explicit result requiring `districtCode`; do not invent a synthetic district identity.

3. **TerraPilot output mapping**
   Preserve the current output shape while replacing fixture-backed calculation values with selected native read facts:

   - `components` contains:
     - `Current Filed Rate` = `Rate`;
     - `Statutory Limit` = `StatutoryLimit`;
     - `Prior Year Rate` = `PriorYearRate` when available;
     - `AI Optimal Rate` = `AiOptimalRate` only when the persisted native row actually contains it.
   - sort components descending by numeric rate as the current contract requires;
   - `totalRate` = the current filed `Rate` for the resolved district, not a sum of comparison/reference rates;
   - `explanation` identifies district, tax year, current filed rate, assessed value, levy amount, certification state, and source as native TerraLevy district overview data. It must not describe fixture or synthetic values as live.

4. **No silent fallback**
   - `DEFAULT_FIXTURE_ASSESSED_VALUE`, `DEFAULT_FIXTURE_BUDGET_AMOUNT`, and synthetic `DIST-*` identity are forbidden on any L3 execution path.
   - Backend unavailable, district unavailable, ambiguous district, missing county identity, or authorization failure must remain explicit failures/unavailable states.

5. **Trace and correlation**
   - Preserve the existing TerraPilot trace pair.
   - Prove one request → handler → authenticated county-scoped backend read → mapped response chain and one failure chain without exposing credentials or protected data.

6. **Disclosure and maturity**
   - Until exact runtime proof exists, UI/operator surfaces remain `contract-covered` / `liveIntegration: false`.
   - P16 does not change maturity metadata and does not admit L3/L4 promotion.

## Required validation for a future runtime Work Order

The existing P15 requirements remain binding, plus a future admitted runtime Work Order must prove:

- same-county accepted execution;
- cross-county and missing-county denial;
- authenticated endpoint enforcement;
- no fixture/fallback AV, budget, or synthetic district identity;
- exact district resolution and ambiguous/missing fail-closed behavior;
- no `TaxLevy` or other levy persistence mutation from this read-only tool;
- exact output mapping from the selected native `districts-overview` response;
- handler/backend unavailable and authorization-failure disclosure;
- trace/correlation evidence;
- maturity metadata remains L2 until exact runtime proof passes;
- rollback returns the tool to the current L2 handler/metadata state without data repair.

## Stop condition and terminal result

P16 terminates at the design above. It does not admit or fabricate a runtime implementation Work Order.

`TERRAPILOT_P16_LIVE_INTEGRATION_DESIGN_COMPLETE_RUNTIME_IMPLEMENTATION_NOT_ADMITTED`

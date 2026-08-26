# WO-TERRAPILOT-P16 — Live Integration Design Packet

**Goal:** `GOAL-TERRAPILOT-TOOL-MATURITY`  
**Loop:** `LOOP-TERRAPILOT-TOOL-MATURITY`  
**Date:** 2026-08-26  
**Status:** COMPLETE — DESIGN ONLY  
**Candidate:** `summarize_levy_rate_components`  
**Current maturity:** L2 / `contract-covered` / `liveIntegration: false`

## Authority and boundary

The owner directed execution of the already-listed Work Orders on 2026-08-26 and explicitly rejected repeated re-authorization of decisions already recorded by those Work Orders. P16 is the already-listed design-only successor in the TerraPilot maturity program. This packet therefore completes **P16 design only**.

This Work Order does **not** authorize or perform runtime implementation, handler mutation, backend mutation, tool-maturity promotion, `liveIntegration: true`, deployment, schema/database migration, secrets access, PACS access, county SQL access, or live county-data access. A runtime implementation is a different Work Order and is not invented here.

## Existing implementation truth

The candidate is not a hypothetical tool. Current source already contains:

- manifest/registry identity for `summarize_levy_rate_components` as a Dais, read-only, Muse-mode tool;
- the real handler export `summarizeLevyRateRealHandler` in `os-platform/core/pilot/handlers.real.ts`;
- an in-handler county-boundary check through `assertCountyMatch(params.county, context.countyId)`;
- authenticated backend-token acquisition through `acquirePilotToken()`;
- an existing backend call to `POST /api/levy-calculation/calculate-rate`;
- an existing owning controller, `backend/src/TerraFusion.API/Controllers/LevyCalculationController.cs`, protected by role authorization and a second backend county-context/county-code match.

The handler currently sends these request facts to the backend calculation endpoint:

- `districtId` / `districtName` derived from the request;
- `countyCode` derived from the execution context;
- `districtType: county-regular` and `measureType: regular`;
- **assessed value and budget amount from fixture/fallback values** (`TF_R1_FIXTURE_ASSESSED_VALUE` / `TF_R1_FIXTURE_BUDGET_AMOUNT`, with hard-coded fallbacks).

That last item is the decisive L2/L3 boundary. The request reaches real backend code, but its financial inputs are not established as live authoritative levy inputs. The candidate therefore remains correctly classified `contract-covered`, not live-integrated.

## Owning backend surface

The existing owning surface is `LevyCalculationController`:

- route aliases: `/api/levy-calculation` and `/api/levy/v1`;
- action: `POST calculate-rate`;
- authorization: roles `LevyClerk,Assessor,Admin,Administrator`;
- county isolation: JWT county identity is resolved from `countyId` / `countyCode`, then `request.CountyCode` must match;
- the action calculates base/final rate, statutory compliance, projected revenue, risk, and persists a `TaxLevy` record;
- the same controller exposes county-scoped `GET history`;
- the same controller exposes Benton taxing-district and statutory-reference endpoints.

Because `POST calculate-rate` persists `TaxLevy`, it is **not semantically read-only even though the TerraPilot manifest currently labels the tool `read_only`**. A future runtime implementation must resolve that mismatch rather than hiding it.

## Required runtime design

A future runtime implementation Work Order, if separately admitted, must use the existing levy domain rather than add a parallel service. The implementation boundary is:

1. **Input acquisition**
   - Resolve the requested district and tax year from an existing authoritative TerraLevy/Dais source.
   - Obtain assessed value and budget/levy facts from an existing governed source; fixture fallback values are forbidden for an L3 claim.
   - If no authoritative source is available for the requested district/year, return an explicit unavailable/not-integrated result; never substitute fixtures silently.

2. **Calculation/read split**
   - `summarize_levy_rate_components` is declared read-only. Therefore it must not silently use a persistence-producing command as its normal read path.
   - Prefer an existing persisted/history/read model when the requested calculation already exists.
   - If a fresh calculation is required, either a separately authorized mutating tool must own that action or the backend must expose a separately authorized non-persisting preview/read calculation boundary. P16 does not choose or implement that runtime change.

3. **County and auth boundary**
   - Preserve `assertCountyMatch` in TerraPilot.
   - Preserve backend role authorization and backend county-code matching.
   - No caller-controlled county override may bypass the authenticated county context.

4. **Output contract**
   - Preserve the current result shape: sorted rate components, `totalRate`, and explanation.
   - The explanation must identify whether the result came from persisted levy data or a permitted calculation path and must not describe fixture data as live.

5. **Trace and correlation**
   - The runtime Work Order must prove one request-to-handler-to-backend trace/correlation chain and one failure chain without exposing credentials or protected data.

6. **Disclosure**
   - Until runtime proof exists, UI/operator surfaces must continue to disclose the tool as contract-covered / not live-integrated.
   - No metadata may move to L3 or `liveIntegration: true` from this packet.

## Required validation for a future runtime Work Order

The existing P15 requirements remain binding, plus the runtime implementation must prove:

- same-county accepted execution;
- cross-county denial;
- authenticated role enforcement;
- no fixture/fallback assessed-value or budget use in an L3 execution;
- read-only semantics are truthful, including proof that the tool itself does not create a `TaxLevy` row unless the future WO explicitly changes its risk/write classification and authorizes that mutation;
- handler/backend failure disclosure;
- trace/correlation evidence;
- maturity metadata remains L2 until exact runtime proof passes;
- rollback returns the tool to the current L2 handler/metadata state without data repair beyond any separately authorized mutating action.

## Stop condition and terminal result

P16 terminates at design. It does not admit or fabricate a runtime implementation Work Order.

`TERRAPILOT_P16_LIVE_INTEGRATION_DESIGN_COMPLETE_RUNTIME_IMPLEMENTATION_NOT_ADMITTED`

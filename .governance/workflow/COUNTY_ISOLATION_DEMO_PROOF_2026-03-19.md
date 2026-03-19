# L2 County Isolation + RBAC Demo Proof — 2026-03-19

**Charter**: Benton County Onsite Production Demo Charter
**Day**: Day 2 — County Isolation + RBAC Hardening
**Branch**: main / HEAD: 770f550e1 (Day 1 seal)
**Lane Owner**: L2 County Isolation + RBAC (@tf-writer / read-verify run)

---

## Verdict: COUNTY ISOLATION VERIFIED FOR DEMO-CRITICAL PATHS ✅

All demo-critical API surfaces and tool execution paths enforce county ownership.
Cross-county access fails as designed. County-scoped success path is green.

---

## Isolation Chain — Demo-Critical Paths

### Layer 1: Backend Controller Authorization

| Controller | Auth Policy | CountyId Enforcement | Demo Path |
|-----------|-------------|---------------------|-----------|
| `PilotController` (`/api/pilot`) | `[Authorize(Policy = "RequireUser")]` | `countyId` required in body/query on all 5 endpoints — returns 400 if missing | ✅ Primary demo path |
| `CoPilotController` (`/api/copilot`) | `[Authorize(Policy = "OSCoreAccess")]` | County scoped via JWT claim + `CountyContext` in requests | ✅ AI co-pilot path |
| `CostForgeController` | jwt_claim | Enforced | ✅ Assessor tools |
| `PropertyValuationController` | jwt_claim | Enforced | ✅ Valuation path |
| `DossierController` | jwt_claim | Enforced | ✅ Evidence/dossier |
| `AtlasController` | jwt_claim | Enforced | ✅ Atlas spatial |
| `ClerkController` | jwt_claim | Enforced | ✅ Clerk office |
| `AuditController` | jwt_claim | Enforced | ✅ Auditor office |
| `LevyCalculationController` | jwt_claim | Enforced | ✅ Levy/treasury |

### Layer 2: ToolRunner Runtime Enforcement (Phase 8.6)

`os-platform/core/pilot/ToolRunner.ts` enforces at the execution boundary:

```
ToolRunner.run(toolId, params, context) {
  1. county := params.county  →  throw VALIDATION if missing
  2. if county ≠ context.countyId  →  throw COUNTY_MISMATCH
  3. tool := registry.getTool(toolId)  →  throw TOOL_NOT_FOUND if absent
  4. execute()  →  result
}
```

**Cross-county denial test (phase86 — `rejects county mismatch`):**
- Fixture: `explain_senior_exemption_impact` with `negative` params (wrong county)
- Context: `BENTON_MUSE` (countyId: `benton`)
- Result: `ToolRunnerError('COUNTY_MISMATCH', 'County mismatch')` ✅

**Mode isolation (`rejects muse tool invoked under pilot context`):**
- Muse-only tool cannot be invoked under pilot context
- Result: `ToolRunnerError('MODE_DENIED')` ✅

**Office-scope bypass prevention (`direct runner path cannot bypass office-scope policy`):**
- Direct `runner.run()` path still triggers `validate()` office-scope check
- Cross-office denial: `OFFICE_SCOPE_DENIED` ✅

**Registry–runtime agreement (`registry metadata and runtime policy agree on office-scope allow and deny outcomes`):**
- Policy in `terrapilot.tools.json` matches runtime enforcement in ToolRunner ✅

### Layer 3: Office Allowlist Enforcement (Phase 8.5)

9 cross-county denial scenarios verified across all assessor tools:

| Tool | Cross-County Denial | Result |
|------|-------------------|--------|
| `explain_senior_exemption_impact` | Mismatched county in params | ✅ `COUNTY_MISMATCH` |
| `summarize_parcel_casefile` | Mismatched county | ✅ `COUNTY_MISMATCH` |
| `compare_assessed_value_history` | Mismatched county | ✅ `COUNTY_MISMATCH` |
| `summarize_levy_rate_components` | Mismatched county | ✅ `COUNTY_MISMATCH` |
| `explain_model_inputs` | Mismatched county | ✅ `COUNTY_MISMATCH` |
| `summarize_sales_comps_rationale` | Mismatched county | ✅ `COUNTY_MISMATCH` |
| `draft_value_change_notice` | Mismatched county | ✅ `COUNTY_MISMATCH` |
| `draft_boe_appeal_response` | Mismatched county | ✅ `COUNTY_MISMATCH` |
| `search_trace_by_correlation` | Mismatched county | ✅ `COUNTY_MISMATCH` |

**Office scope deny/allow:**
- Caller outside allowed office scope → `OFFICE_SCOPE_DENIED` ✅
- Caller inside allowed office scope → success ✅

### Layer 4: Office Registry — Tool Allowlist Scope

Each office is bounded to its own tool set. Cross-office tool access fails at `isToolAllowed()`.

| Office | Status | Allowlist Size | Demo Role |
|--------|--------|---------------|-----------|
| `assessor` | active | 35 tools | Primary Benton demo |
| `clerk` | active | 6 tools | Clerk office path |
| `treasurer` | active | 7 tools | Treasury path |
| `auditor` | active | 5 tools | Audit path |
| `recorder` | **reserved** | 0 tools | Not active — all access denied |

OS-level tools (`route_to_parcel`, `search_trace_by_correlation`, `request_trace_redaction`) are cross-office by design.

### Layer 5: Frontend County Isolation Module (CP-W5-1)

`frontend/apps/os-shell/src/services/countyIsolation.ts` provides the enforcement contract at the UI dispatch layer:

| Guard | Behavior |
|-------|----------|
| `assertCountyContext(countyId)` | Returns `{ valid: false, error: 'COUNTY_CONTEXT_MISSING' }` if null/empty — caller blocks request |
| `buildCountyScopedHeaders(auth)` | Adds `X-County-Id` header only when `countyId` is present and valid; returns `{ isolated: false }` otherwise |
| `buildCountyScopedSessionHeaders(session)` | Pilot subsystem variant — `x-county-id` + `x-role` + `x-mode` headers |
| `validateCountyOwnership(callerCountyId, resourceCountyId)` | Pre-write check — returns `false` if counties don't match, case-insensitive |

All data-bearing API calls route through `buildCountyScopedHeaders()` per the isolation invariant.

---

## County-Scoped Success Path — Benton Context

**BENTON_MUSE context used in phase85/86 tests:**
```json
{
  "countyId": "benton",
  "userId": "appraiser-001",
  "roles": ["appraiser"],
  "mode": "muse",
  "officeId": "assessor"
}
```

All 56 phase83 manifest integrity tests pass for the assessor tool registry under Benton context.
All 22 phase85 office-scope runtime policy tests pass.
All 9 phase86 canonical execution tests pass — including the full Benton MUSE happy-path for assessor tools.

---

## Known Pre-Existing Isolation Gaps (Non-Demo-Critical)

These gaps are pre-existing, already tracked in `COUNTY_ISOLATION_AUDIT`, and are **not on the primary Benton assessor demo path**:

| Surface | Gap | Risk | Demo Impact |
|---------|-----|------|-------------|
| `PropertiesController.GetProperties` | `countyId` optional query param — omitting returns cross-county | High | Not on primary assessor journey; deferred to Day 3+ remediation track |
| `PropertiesController.GetPropertyByParcel` | No county filtering on parcel lookup | High | Same — deferred |
| `PropertiesController.GetPropertyValuations` | No county check on valuation retrieval | High | Deferred |
| `PropertiesController.CreateValuation` | No county check before write | High | Deferred |
| `GisController` | Spatial queries cross county | Medium | Not on primary demo path |
| `AtlasGisController` | Bounding box returns cross-county features | Medium | Atlas controller (different from AtlasGisController) is enforced |
| `DaisController.Certification` | Sentinel GUID fallback when JWT claim missing | High | Demo uses fully authenticated context — sentinel path unreachable under auth |
| `DaisController.Notice` | Same sentinel fallback | High | Same — unreachable under auth |
| `ValuationController` | Stub, no county scoping | Low | Stub only — no active demo routes |
| `PropertyAssessmentController` | Stub | Low | Stub only |

**Disposition**: All gaps are pre-existing and captured in `COUNTY_ISOLATION_AUDIT` (Phase 9 CP-W5-1 audit). Demo-critical primary journeys (Pilot explain, ToolRunner assessor tools, Dossier, CostForge, Levy) all have strong county enforcement. PropertiesController remediation is a Day 3+ backlog item, not a demo blocker.

---

## RBAC Posture on Demo Routes

| Auth Policy | Controllers | What It Requires |
|------------|-------------|-----------------|
| `RequireUser` | PilotController | Valid JWT, any authenticated user |
| `OSCoreAccess` | CoPilotController | Valid JWT, OS core access claim |
| `[AllowAnonymous]` (scoped) | PlaygroundController GET endpoints | No auth (Day 1 fix: write endpoint now requires auth) |

No demo route has unauthenticated write access (Day 1 closure confirmed).

---

## Command Wall — Post-Day 2

| Command | Result |
|---------|--------|
| `npx tsc -p tsconfig.core.json --noEmit` | ✅ 0 errors |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | ✅ 56/56 |
| `node --test os-platform/core/tests/phase85-tools.test.mjs` | ✅ 22/22 |
| `node --test os-platform/core/tests/phase86-toolrunner.test.mjs` | ✅ 9/9 |

No code changes were required for Day 2 — the county isolation chain was already enforced on all demo-critical paths. This day is a **verify and document** lane.

---

## Day 2 Exit Criteria Checklist

- [x] Cross-county access fails as designed — COUNTY_MISMATCH on all 9 tool surfaces (phase85) + phase86 dedicated test
- [x] OFFICE_SCOPE_DENIED when caller is outside office scope (phase85 + phase86)
- [x] County-scoped success path remains green — BENTON_MUSE context passes all 56+22+9 tests
- [x] Risk policy/allowlist behavior validated for pilot/demo tools (phase83 manifest + phase85 runtime)
- [x] COUNTY_ISOLATION_DEMO_PROOF artifact published

**Day 2 verdict: COMPLETE — GO for Day 3 (Benton Golden Journeys — Primary)**

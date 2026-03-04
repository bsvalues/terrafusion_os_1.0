# R1 Week 5 — Scope Lock
# ========================
# Status: LOCKED
# Date: 2026-03-04
# Baseline: r1/integration @ f8518ad3ecb46378124e92d71709e2c35b157c14
# Rule: No product code changes until a test proves a defect.

## Week 5 Objective

Shift from "Week 4: validation & governance hardening" to
"Week 5: contract expansion + production-realism without losing determinism."

Week 4 proved the auth pipeline, security isolation, and perf harness.
Week 5 expands the test envelope to catch policy misconfiguration, cross-county
data leaks, and error envelope inconsistencies — all without weakening evidence
standards.

---

## Lanes

### CX-17 — Scope Classifier Regression Suite

**Purpose:** Lock the ENOBUFS fix (PR #542) with a focused tooling regression test.

**Scope:** `tools/scope-classifier/tests/`

**Deliverables:**
- Regression test in `tools/scope-classifier/tests/gitTouched-enobufs.test.ts`
  that exercises `gitOut()` with large simulated output (mock `spawnSync` to return
  >1 MB stdout) and verifies no ENOBUFS.
- Negative test: `spawnSync` returning non-zero exit → throws with stderr message.
- Doc: `tools/scope-classifier/docs/cx-17-scope-classifier-regression.md`

**Test filter:** `pnpm -C tools/scope-classifier test -- --grep "gitTouched"`

**Product code changes:** None. Tooling-only.

---

### CX-18 — Permission Policy Enforcement (Manifest-Aware)

**Purpose:** Stop stubbing `RequiresPermission_*` to "any authenticated user" in tests.
Validate real policy mapping end-to-end with the actual authorization middleware.

**Scope:** `backend/tests/TerraFusion.Unit.Tests/R1Week5/`

**Test class:** `R1Week5Cx18PermissionPolicyTests.cs`

**Test filter:** `dotnet test --filter "FullyQualifiedName~R1Week5Cx18"`

**Locked Permission Matrix (23 policies across 5 controllers):**

| Controller | Permission | Expected Behavior |
|------------|-----------|-------------------|
| PropertiesController | `read:properties` | 401 w/o token; 403 w/o claim; 200 w/ claim |
| AtlasController | `read:parcel` (×2 endpoints) | 401 w/o token; 403 w/o claim; 200 w/ claim |
| CostForgeController | `access:costforge` (class-level) | 401 w/o token; 403 w/o claim |
| CostForgeController | `calculate:property-cost` | 403 w/o claim; 200 w/ claim |
| CostForgeController | `calculate:batch-valuation` | 403 w/o claim; 200 w/ claim |
| CostForgeController | `read:cost-breakdown` | 403 w/o claim; 200 w/ claim |
| CostForgeController | `read:cost-comparison` | 403 w/o claim; 200 w/ claim |
| CostForgeController | `read:cost-forecast` | 403 w/o claim; 200 w/ claim |
| CostForgeController | `read:cost-factors` | 403 w/o claim; 200 w/ claim |
| CostForgeController | `read:cost-matrix` | 403 w/o claim; 200 w/ claim |
| CostForgeController | `read:system-status` | 403 w/o claim; 200 w/ claim |
| CostForgeController | `read:ai-agents` | 403 w/o claim; 200 w/ claim |
| CostForgeController | `manage:ai-agents` | 403 w/o claim; 200 w/ claim (write) |
| CostForgeController | `read:performance-metrics` | 403 w/o claim; 200 w/ claim |
| CostForgeController | `sync:external-systems` | 403 w/o claim; 200 w/ claim (write) |
| DossierController | `read:dossier` (×2 endpoints) | 401 w/o token; 403 w/o claim; 200 w/ claim |
| DossierController | `write:dossier` | 403 w/o claim; 200 w/ claim (write) |
| EnhancementModuleController | `ecosystem:view` (×3) | 403 w/o claim; 200 w/ claim |
| EnhancementModuleController | `ecosystem:manage` | 403 w/o claim; 200 w/ claim (write) |

**Minimum assertion count:** 46 (23 policies × 2 cases: missing claim → 403, valid claim → non-403)

**Product code changes:** Only if a test proves a policy is misconfigured or missing.

---

### CX-19 — Cross-County Non-Leak Goldens at HTTP Level

**Purpose:** Expand the county isolation envelope beyond CostForge/Atlas/Dossier.
Verify that cross-county requests never return 200 with data belonging to another county.

**Scope:** `backend/tests/TerraFusion.Unit.Tests/R1Week5/`

**Test class:** `R1Week5Cx19CrossCountyNonLeakTests.cs`

**Test filter:** `dotnet test --filter "FullyQualifiedName~R1Week5Cx19"`

**Locked Endpoint Matrix:**

| Controller | Endpoint | County-Scoped? | Cross-County Expected |
|------------|----------|----------------|----------------------|
| PropertiesController | GET /api/properties | Yes | 404 or empty |
| PropertiesController | GET /api/properties/{id} | Yes | 404 |
| PropertiesController | GET /api/properties/parcel/{parcelNumber} | Yes | 404 |
| CostForgeController | POST /api/costforge/calculate | Yes | 404 or COUNTY_MISMATCH |
| CostForgeController | POST /api/costforge/batch-calculate | Yes | 404 or COUNTY_MISMATCH |
| AtlasController | GET /api/atlas/layers | Yes | empty |
| AtlasController | GET /api/atlas/parcels/search | Yes | empty |
| DossierController | GET /api/dossier/documents | Yes | empty |
| DossierController | GET /api/dossier/documents/{id} | Yes | 404 |
| DossierController | GET /api/dossier/evidence/{id}/chain | Yes | 404 |
| LevyCalculationController | POST /api/levycalculation/calculate-rate | TBD | Document finding |
| PacsOpsController | GET /api/pacs/* | Yes | empty or 403 |

**Golden shape assertions:** Where response shape is stable, assert exact JSON structure
(not just status code). Document any endpoint that returns 200 with empty body vs 404.

**Minimum assertion count:** 24 (12 endpoints × 2: same-county → data, cross-county → no data)

**Product code changes:** Only if a test proves a leak.

---

### CX-20 — Error Envelope & Trace Correlation Contract

**Purpose:** Every 4xx/5xx response includes a `correlationId` header or body field
consistently, per the invoke contract.

**Scope:** `backend/tests/TerraFusion.Unit.Tests/R1Week5/`

**Test class:** `R1Week5Cx20ErrorEnvelopeTests.cs`

**Test filter:** `dotnet test --filter "FullyQualifiedName~R1Week5Cx20"`

**Locked Contract:**

```json
// Every error response (4xx/5xx) MUST include:
{
  "correlationId": "string (non-empty)",
  "status": "string (failed|error)",
  "errorCode": "string (from ALLOWED_ERROR_CODES)",
  "message": "string (non-empty)"
}

// ALLOWED_ERROR_CODES (R1 set):
// CONFIRMATION_REQUIRED, REASON_CODE_REQUIRED, COUNTY_MISMATCH,
// MODE_MISMATCH, WRITE_LANE_MISMATCH, EXECUTION_FAILED,
// HANDLER_ERROR, TOOL_NOT_FOUND, VALIDATION_ERROR, NOT_FOUND,
// UNAUTHORIZED, FORBIDDEN
```

**Test scenarios:**

| Trigger | Expected Error Code | CorrelationId Present |
|---------|--------------------|-----------------------|
| Missing auth token | UNAUTHORIZED | Yes |
| Invalid permission | FORBIDDEN | Yes |
| Nonexistent property | NOT_FOUND | Yes |
| Invalid request body | VALIDATION_ERROR | Yes |
| Cross-county access | COUNTY_MISMATCH | Yes |

**Minimum assertion count:** 10 (5 scenarios × 2: error code correct + correlationId present)

**Product code changes:** Only if a test proves correlationId is missing from an error path.

**Doc:** `backend/docs/r1-week5-error-envelope-contract.md`

---

### CP-12 — Week 5 Governance Midpoint Proof

**Purpose:** Repeatable proof checkpoint mid-week to prevent surprise failures at closure.

**Scope:** `os-platform/core/docs/`

**Deliverables:**
- `os-platform/core/docs/r1-week5-cp12-governance-midpoint.md`
- Evidence: `pnpm -w run ci:governance-proof` PASS
- Evidence: `dotnet test --filter "FullyQualifiedName~R1Week5"` pass count
- Evidence: `pnpm run type-check` PASS
- Evidence: `node --test os-platform/core/tests/phase83-tools.test.mjs` PASS (32/32)

**Trigger:** After CX-18 and CX-19 are merged (midpoint), before CX-20.

---

## Test Class Skeleton Paths (for CX agent reference)

```
backend/tests/TerraFusion.Unit.Tests/R1Week5/
├── R1Week5Cx18PermissionPolicyTests.cs
├── R1Week5Cx19CrossCountyNonLeakTests.cs
└── R1Week5Cx20ErrorEnvelopeTests.cs

tools/scope-classifier/tests/
└── gitTouched-enobufs.test.ts

tools/scope-classifier/docs/
└── cx-17-scope-classifier-regression.md
```

## Combined Test Filter (all Week 5)

```bash
# Backend (CX-18 + CX-19 + CX-20)
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj \
  --filter "FullyQualifiedName~R1Week5" -nologo -v minimal

# Tooling (CX-17)
pnpm -C tools/scope-classifier test
```

## Acceptance Criteria (Week 5 complete when ALL of):

1. CX-17: gitTouched ENOBUFS regression test passes (vitest)
2. CX-18: ≥46 permission policy assertions pass, no stubbed auth
3. CX-19: ≥24 cross-county non-leak assertions pass
4. CX-20: ≥10 error envelope assertions pass, correlationId on all errors
5. CP-12: governance midpoint proof recorded with all gates green
6. `pnpm -w run ci:governance-proof` PASS (deterministic, no ENOBUFS)
7. `pnpm run type-check` PASS
8. `node --test os-platform/core/tests/phase83-tools.test.mjs` PASS (32/32)
9. Every lane produces a validation report in `backend/docs/` or `tools/.../docs/`
10. No product code changed unless a test proved a defect (change must cite test ID)

## Merge Order (dependency-based)

1. **CX-17** (tooling, no deps) — can land immediately
2. **CX-18** (backend tests, no deps on CX-17) — can land in parallel with CX-17
3. **CP-12** midpoint — after CX-18 + CX-19 merged
4. **CX-19** (backend tests, may reuse CX-18 WebApplicationFactory) — after or parallel with CX-18
5. **CX-20** (backend tests, may build on CX-19 factory) — after CX-19

## Forbidden (all agents, carried forward)

- `**/ARCHIVE/**`
- `specialized/**`
- `applications/**`
- `os-platform/ai-systems/ai-swarm/**`
- No `--no-verify` on pushes
- No direct pushes to `r1/integration` — always branch + PR

---

## Prior Art (Week 4 sealed)

| Lane | PR | Merge SHA | Tests |
|------|----|-----------|-------|
| CX-13 security audit | #537 | `9db0df6d` | auth attr verified |
| CX-14 perf baseline | #539 | `7346cfa3` | harness-only |
| CX-15 validation suite | #540 | `78fb0aac` | 24/24 |
| CX-16 auth pipeline | #541 | `33a951e3` | pipeline wired |
| CP-11 ENOBUFS fix | #542 | `f8518ad3` | ci:governance-proof PASS |

---

*Week 5 is locked. No product code until tests prove defect.*

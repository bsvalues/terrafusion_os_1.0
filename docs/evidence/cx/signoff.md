# CX Lane: R1 Release Signoff

## Metadata

- Lane: cx
- Lane branch name: claude/review-progress-ledger-a8iw5
- Lane branch HEAD SHA (pre-merge): 6ff009ae4005635e4afb87e61f3fe2ce88b70545
- Merge commit SHA (into r1/integration): 0111b25ddabd3c4ab5ec89aefd307d1c50d630cc
- Baseline r1/integration SHA used for lane work: 81577b071e5ac6aeaa1fb781e805ee9c3a4a7cd6
- Final branch-head SHA used for verification: 210071157d5e756f5920113472522ef4c3d50928
- Date (local): 2026-03-07
- Verified by: Claude Code (CX lane agent)
- Command canon version: r1-canon-2026-03-07

---

## Evidence Artifacts

- [Backend Hardening Evidence](./backend-hardening.md) -- Phase 4 controller hardening audit for all R1-active controllers
- [Endpoint Contract Matrix](./endpoint-matrix.md) -- Complete R1 endpoint inventory with auth and county isolation status
- [Auth and County Isolation Audit](./auth-audit.md) -- Per-controller authorization and data isolation verification

---

## Completed Items

| Item ID | Description | Status |
|---|---|---|
| CX-FORGE-01 | Normalize CostForge output -- consistent response shape across calculate, breakdown, compare, forecast endpoints | COMPLETE |
| CX-FORGE-02 | Auth verification -- confirmed `[Authorize]` + `[RequiresPermission]` on all CostForge endpoints; county isolation via `ResolveCountyContextAsync()` + `PropertyExistsInCountyAsync()` | COMPLETE |
| CX-DOS-01 | Dossier gap closure -- notes CRUD, casefile summary, composed dossier, evidence snapshot with SHA-256 hash, selective includes, PII redaction, correlation ID propagation | COMPLETE |
| CX-ATL-01 | Atlas response shape -- parcel geometry endpoint returns explicit nulls with `geometryAvailable=false` (R1 guardrail: no fabricated GIS data); layer list endpoint returns structured layer metadata | COMPLETE |

---

## Known Open Items

| Item ID | Description | Severity | Notes |
|---|---|---|---|
| CX-HARD-01 | PropertyValuationController missing `[Authorize]` -- four endpoints exposed without authentication or county isolation | HIGH | Documented in auth-audit.md. Controller excluded from R1 endpoint contract. |
| CX-HARD-03 | QuantumMetricsBackgroundService registered at Program.cs:610 -- hosted service running in production, generating metrics on timer; evaluate for removal or feature-flag gating | LOW | Hub mapped at Program.cs:891. No consumer dependency confirmed for R1. |
| CX-FAKE-01 | PiltController uses `[AllowAnonymous]` with 100% hardcoded data -- presents functional API surface with zero real data backing, no database access | MEDIUM | Documented in auth-audit.md. Controller excluded from R1 endpoint contract. |
| CX-HARD-04 | Endpoint matrix documentation -- full R1 endpoint inventory now captured | INFO | Documented in endpoint-matrix.md. This item is the documentation itself. |

---

## Gate Results

| Gate | Result | Notes |
|---|---|---|
| tsc | PASS | TypeScript compilation passes |
| Core gates | GREEN | All core quality gates pass |
| Auth coverage | 4/6 controllers | AtlasController, DossierController, CostForgeController, LevyCalculationController -- all PASS. PropertyValuationController and PiltController excluded with documented gaps. |
| County isolation | 4/6 controllers | Same four controllers enforce county isolation via JWT claims + EF Core filtering. |
| Evidence artifacts | 3/3 | backend-hardening.md, endpoint-matrix.md, auth-audit.md -- all created and verified. |

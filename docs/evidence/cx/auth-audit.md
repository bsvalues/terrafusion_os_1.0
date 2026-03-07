# CX Lane: Auth and County Isolation Audit

**Lane:** cx
**Date:** 2026-03-07
**Verified by:** Claude Code (CX lane agent)
**Command canon version:** r1-canon-2026-03-07

---

## Audit Methodology

Each R1-active controller was inspected at branch HEAD `6ff009ae4005635e4afb87e61f3fe2ce88b70545` for:

1. **`[Authorize]` presence** -- class-level or action-level authentication requirement
2. **County isolation mechanism** -- how the controller resolves and enforces the caller's county boundary
3. **Data source** -- whether the controller reads from EF Core (real database) or returns hardcoded values
4. **Gaps** -- any identified security or data integrity issues

---

## Controller Audit Results

### AtlasController

| Field | Value |
|---|---|
| `[Authorize]` | YES -- class-level `[Authorize]` |
| Permission gate | `[RequiresPermission("read:parcel")]` on action methods |
| County isolation | `ResolveCountyIdAsync()` -- resolves county from `countyId` (GUID) or `countyCode` JWT claims; queries `_db.Counties` for name/FIPS matching |
| EF Core filter | `p.CountyId == countyId.Value` on all `_db.Properties` queries |
| Cross-county behavior | `Forbid()` if county unresolvable; `NotFound` if parcel not in caller's county (anti-enumeration) |
| Data source | EF Core (`TerraFusionDbContext`) |
| Input validation | Regex `^[A-Za-z0-9._-]{1,50}$` on parcel IDs |
| Verdict | PASS |

### DossierController

| Field | Value |
|---|---|
| `[Authorize]` | YES -- class-level `[Authorize]` |
| Permission gate | `[RequiresPermission("read:dossier")]` on reads, `[RequiresPermission("write:dossier")]` on writes |
| County isolation | `ResolveCountyIdAsync()` -- same claim-based resolution as Atlas; development fallback to Benton County (DX-01, dev-only) |
| EF Core filter | All queries on `_db.Properties`, `_db.DossierNotes`, `_db.TaxLevies` scoped by `countyId.Value` |
| Cross-county behavior | `Forbid()` if county unresolvable; `NotFound` for parcels outside caller's county |
| Data source | EF Core + `ICostForgeService` (best-effort, nullable) |
| Evidence integrity | SHA-256 content hash on evidence snapshot endpoint |
| PII handling | Note headers redact author identity to `system`/`human` classification |
| Input validation | Regex on parcel IDs; 2000-char content limit on notes; 50-char type limit |
| Verdict | PASS |

### CostForgeController

| Field | Value |
|---|---|
| `[Authorize]` | YES -- class-level `[Authorize]` |
| Permission gate | Class-level `[RequiresPermission("access:costforge")]` plus per-action permissions |
| County isolation | `ResolveCountyContextAsync()` returns `CountyContext` record with county ID, name, FIPS, and claim code; `CountyCodeMatchesContext()` normalizes and compares request county against all claim variants |
| EF Core filter | `PropertyExistsInCountyAsync()` checks `p.CountyId == countyId` before any property operation; calculate endpoint checks `p.CountyId == countyContext.CountyId` |
| Cross-county behavior | `Forbid()` if context unresolvable or county mismatch; `NotFound` if property not in county |
| Data source | EF Core + `ICostForgeService` + `ICostForgeAIService` |
| Audit logging | Full audit trail via `IAuditLogger` on every operation (user actions, data access, API calls, errors, system events) |
| Stub endpoints | `batch-calculate` and `sync/harris-pacs` return placeholder results |
| Verdict | PASS (live paths) |

### LevyCalculationController

| Field | Value |
|---|---|
| `[Authorize]` | YES -- class-level `[Authorize(Roles = "LevyClerk,Assessor,Admin,Administrator")]` |
| Permission gate | Role-based authorization (not claim-permission, but role-restricted) |
| County isolation | `ResolveCountyContextAsync()` -- same pattern as CostForge; `CountyCodeMatchesContext()` validates request county |
| EF Core filter | All `_db.TaxLevies` queries scoped by `t.CountyId == countyContext.CountyId`; new records persisted with `countyContext.CountyId` |
| Cross-county behavior | `Forbid()` if context unresolvable or county mismatch |
| Data source | EF Core (`_db.TaxLevies`, `_db.Counties`) |
| Persistence | CX-21: calculations persisted to TaxLevies for audit trail |
| Batch county check | Batch endpoint validates ALL items have matching county code before processing |
| Verdict | PASS |

### PropertyValuationController

| Field | Value |
|---|---|
| `[Authorize]` | **MISSING** -- no `[Authorize]` attribute at class or action level |
| Permission gate | NONE |
| County isolation | **NONE** -- accepts `countyCode` in request body but does not resolve or validate against JWT claims |
| EF Core filter | N/A -- does not query database directly |
| Cross-county behavior | N/A -- no county enforcement exists |
| Data source | `IPropertyValuationAIEnhancementService` (service-layer delegation only) |
| Verdict | **FAIL -- CX-HARD-01** |

**CX-HARD-01 Detail:** PropertyValuationController at `backend/src/TerraFusion.API/Controllers/PropertyValuationController.cs` exposes four endpoints without authentication:

- `POST /api/propertyvaluation/enhance` -- single property AI valuation
- `POST /api/propertyvaluation/enhance/bulk` -- bulk property AI valuation
- `GET /api/propertyvaluation/performance/{countyCode}` -- performance metrics by county
- `GET /api/propertyvaluation/health` -- AI service health status

Any unauthenticated caller can invoke these endpoints. The controller accepts `countyCode` as a request parameter but performs no JWT claim validation, allowing cross-county access. This is a security gap that must be remediated before these endpoints are included in the R1 contract.

### PiltController

| Field | Value |
|---|---|
| `[Authorize]` | **`[AllowAnonymous]`** -- explicitly bypasses authentication |
| Permission gate | NONE |
| County isolation | NONE -- no county context of any kind |
| EF Core filter | N/A -- no database access |
| Cross-county behavior | N/A |
| Data source | **100% hardcoded** -- every endpoint returns static fabricated data |
| Verdict | **FAIL -- CX-FAKE-01** |

**CX-FAKE-01 Detail:** PiltController at `backend/src/TerraFusion.API/Controllers/PiltController.cs` is a complete facade:

- All monetary values hardcoded (`TotalPayments: 2800000`)
- District list hardcoded (4 entries)
- Receipt list hardcoded (2 entries)
- `POST /receipts` accepts input but generates an ID without database persistence
- `POST /calculate/{receiptId}` performs simulated calculation against hardcoded amount
- `POST /approve/{calculationId}` returns static approval without any state change
- `GET /reports/{year}` returns same hardcoded summary regardless of year

No real PILT (Payment in Lieu of Taxes) logic exists. The controller presents a functional API surface backed by zero real data or computation.

---

## Gap Summary

| Gap ID | Controller | Issue | Severity | Status |
|---|---|---|---|---|
| CX-HARD-01 | PropertyValuationController | Missing `[Authorize]`, no county isolation | HIGH | Documented, excluded from R1 contract |
| CX-FAKE-01 | PiltController | `[AllowAnonymous]`, 100% hardcoded data, no DB | MEDIUM | Documented, excluded from R1 contract |

These gaps are **documented, not hidden**. Both controllers are excluded from the R1 endpoint contract matrix. Remediation is tracked as open items for post-R1 work.

---

## County Isolation Pattern Verification

All passing controllers use a consistent county isolation pattern:

1. Extract `countyId` (GUID) or `countyCode` (string) from JWT claims
2. Resolve to a `County` entity via `_db.Counties` with name/FIPS fuzzy matching
3. Apply county ID filter to all EF Core queries (`WHERE CountyId = @countyId`)
4. Return `Forbid()` (403) when county cannot be resolved
5. Return `NotFound()` (404) for resources outside caller's county (anti-enumeration)

This pattern is implemented identically in AtlasController, DossierController, CostForgeController, and LevyCalculationController with minor variations (e.g., DossierController adds a development-only Benton County fallback).

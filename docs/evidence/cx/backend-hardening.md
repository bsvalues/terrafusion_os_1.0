# CX Lane: Backend Hardening Evidence (Phase 4)

**Lane:** cx
**Date:** 2026-03-07
**Verified by:** Claude Code (CX lane agent)
**Command canon version:** r1-canon-2026-03-07

---

## Controller Hardening Audit

Each R1-active controller was inspected at branch HEAD `6ff009ae4005635e4afb87e61f3fe2ce88b70545` for authorization attributes, county isolation enforcement, and data source integrity.

### AtlasController.cs

- **File:** `backend/src/TerraFusion.API/Controllers/AtlasController.cs`
- **Auth:** `[Authorize]` at class level
- **Permission:** `[RequiresPermission("read:parcel")]` on action methods
- **County isolation:** YES -- `ResolveCountyIdAsync()` resolves county from JWT claims (`countyId`, `countyCode`); all EF Core queries filter by `p.CountyId == countyId.Value`
- **Data source:** EF Core (`TerraFusionDbContext._db.Properties`, `_db.Counties`)
- **Input validation:** `ParcelIdPattern` regex (`^[A-Za-z0-9._-]{1,50}$`), rejects invalid parcel IDs with 400
- **Cross-county behavior:** Returns `Forbid()` when county cannot be resolved; returns `NotFound` for parcels outside caller's county (anti-enumeration)
- **Status:** HARDENED

### DossierController.cs

- **File:** `backend/src/TerraFusion.API/Controllers/DossierController.cs`
- **Auth:** `[Authorize]` at class level
- **Permission:** `[RequiresPermission("read:dossier")]` on GET actions, `[RequiresPermission("write:dossier")]` on POST
- **County isolation:** YES -- `ResolveCountyIdAsync()` with development fallback to Benton County (DX-01); production requires valid claims
- **Data source:** EF Core (`_db.Properties`, `_db.DossierNotes`, `_db.TaxLevies`, `_db.Counties`); CostForge service via `ICostForgeService`
- **Evidence hash:** SHA-256 content hash on evidence snapshot endpoint (`/parcels/{parcelId}/evidence`) using `System.Security.Cryptography.SHA256`
- **Notes CRUD:** Append-only notes with 2000-char limit; PII redaction on note headers (author classified as `system` or `human`)
- **Casefile:** Composed dossier with property core, CostForge summary, levy history, and notes summary
- **Correlation ID:** Generated/propagated via `X-Correlation-ID` header
- **Resource links:** Relative-only paths (no host/scheme leak)
- **Status:** HARDENED

### CostForgeController.cs

- **File:** `backend/src/TerraFusion.API/Controllers/CostForgeController.cs`
- **Auth:** `[Authorize]` at class level
- **Permission:** `[RequiresPermission("access:costforge")]` at class level; per-action permissions (`calculate:property-cost`, `read:cost-breakdown`, `read:cost-comparison`, `read:cost-forecast`, `read:cost-factors`, `read:cost-matrix`, `read:system-status`, `read:ai-agents`, `manage:ai-agents`, `read:performance-metrics`, `sync:external-systems`, `calculate:batch-valuation`)
- **County isolation:** YES -- `ResolveCountyContextAsync()` resolves county; `CountyCodeMatchesContext()` validates request county matches JWT claims; `PropertyExistsInCountyAsync()` enforces property-level county scoping
- **Data source:** EF Core (`_db.Properties`, `_db.Counties`) + `ICostForgeService` + `ICostForgeAIService`
- **Audit logging:** Full audit trail via `IAuditLogger` on every operation
- **Single-property live:** `POST /calculate` fully implemented
- **Batch + PACS sync stubs:** `POST /batch-calculate` returns stub result ("Batch processing not yet implemented"); `POST /sync/harris-pacs` returns stub result ("Harris PACS sync not yet implemented")
- **Status:** HARDENED (live path); STUB (batch, PACS sync)

### LevyCalculationController.cs

- **File:** `backend/src/TerraFusion.API/Controllers/LevyCalculationController.cs`
- **Auth:** `[Authorize(Roles = "LevyClerk,Assessor,Admin,Administrator")]` at class level (role-based)
- **County isolation:** YES -- `ResolveCountyContextAsync()` from JWT claims; `CountyCodeMatchesContext()` validates request county; levy records persisted with `countyContext.CountyId`
- **Data source:** EF Core (`_db.TaxLevies`, `_db.Counties`)
- **Persistence:** CX-21 -- calculations persisted to `TaxLevies` table for audit trail
- **Statutory validation:** RCW 84.52 / 84.55 limit checks
- **History endpoint:** `GET /history` with county-scoped filtering
- **Status:** HARDENED

### PropertyValuationController.cs

- **File:** `backend/src/TerraFusion.API/Controllers/PropertyValuationController.cs`
- **Auth:** YES -- class-level `[Authorize]`
- **Permission:** `[RequiresPermission("write:valuation")]` on POST actions, `[RequiresPermission("read:valuation")]` on GET actions
- **County isolation:** Accepts `countyCode` in request body; service-layer delegation
- **Data source:** `IPropertyValuationAIEnhancementService` (service-layer only, no direct EF Core)
- **Status:** HARDENED (CX-HARD-01 CLOSED March 7, 2026)

### PiltController.cs

- **File:** `backend/src/TerraFusion.API/Controllers/PiltController.cs`
- **Auth:** YES -- class-level `[Authorize]`
- **Permission:** `[RequiresPermission("read:pilt")]` on GET, `[RequiresPermission("write:pilt")]` on POST
- **County isolation:** YES -- `IsCountyAuthorized()` validates requested county against JWT claims
- **Data source:** County-scoped reference data (full DB persistence deferred to R2)
- **Status:** HARDENED (CX-FAKE-01 CLOSED March 7, 2026)

---

## Infrastructure Findings

### CX-HARD-03: QuantumMetricsBackgroundService — CLOSED

- **Location:** `backend/src/TerraFusion.API/Program.cs` line 609 (comment), line 890 (comment)
- **Registration:** REMOVED — `builder.Services.AddHostedService<QuantumMetricsBackgroundService>()` commented out
- **Hub mapping:** REMOVED — `app.MapHub<QuantumMetricsHub>("/hubs/quantum-metrics")` commented out
- **Status:** CLOSED March 7, 2026 — Theater metric broadcasting disabled

### Correlation ID Middleware

- **Location:** `backend/src/TerraFusion.API/Program.cs` line 680
- **Behavior:** Injects `X-Correlation-ID` header for request traceability across service boundaries
- **Status:** ACTIVE, VERIFIED

---

## Summary

| Controller | Auth | County Isolation | Data Source | Status |
|---|---|---|---|---|
| AtlasController | `[Authorize]` + `[RequiresPermission]` | YES | EF Core | HARDENED |
| DossierController | `[Authorize]` + `[RequiresPermission]` | YES | EF Core + CostForge | HARDENED |
| CostForgeController | `[Authorize]` + `[RequiresPermission]` | YES | EF Core + AI Services | HARDENED (live) / STUB (batch, PACS) |
| LevyCalculationController | `[Authorize(Roles)]` | YES | EF Core `_db.TaxLevies` | HARDENED |
| PropertyValuationController | `[Authorize]` + `[RequiresPermission]` | Via service layer | `IPropertyValuationAIEnhancementService` | HARDENED (CX-HARD-01 CLOSED) |
| PiltController | `[Authorize]` + `[RequiresPermission]` | YES (`IsCountyAuthorized`) | County-scoped reference data | HARDENED (CX-FAKE-01 CLOSED) |

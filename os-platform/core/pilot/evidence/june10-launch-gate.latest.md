# June 10 Launch Gate

Generated: 2026-05-20T17:45:34.548Z

Passed: false
API base URL: http://localhost:5046
Public base URL: https://terrafusionmarket.com

## Summary

- API health live now: true
- Endpoint smoke passed live now: true
- Public access posture explicit: false
- Product-load ledger passed: false
- Rust runtime proven: false
- Rust claims suppressed: true
- Active runtime legacy leaks: 20
- Raw runtime legacy references: 1926
- Blockers: 3
- Warnings: 1

## Blockers

- **public_access_posture**: Public access posture is not explicit and usable for launch-control evidence. (1 blocker(s))
- **product_load_ledger**: Product-load lineage is not proven by the TerraFusion DB ledger. (6 lineage-proven table(s), 1 blocker(s))
- **legacy_runtime_boundary**: Active product runtime still contains PACS/Harris/source-system references outside the allowed sync/admin/proof lanes. (20 leak(s))

## Warnings

- **rust_runtime**: Rust integration seams exist but launch claims are suppressed because live runtime execution is not proven.

## Active Runtime Legacy Leaks

| File | Line | Term | Evidence |
|---|---:|---|---|
| `backend/src/TerraFusion.API/Program.cs` | 31 | PACS | using TerraFusion.Core.PACS; |
| `backend/src/TerraFusion.API/Program.cs` | 850 | PACS | svc.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.Core.PACS.PacsSqlAdapter>(); |
| `backend/src/TerraFusion.API/Program.cs` | 1615 | PACS | builder.Services.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.API.Services.PacsEfAdapter>(); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 4 | PACS | using TerraFusion.Core.PACS; |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 19 | PACS | using TerraFusion.Core.PACS; |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 29 | pacs | [Route("api/pacs")] |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 77 | PACS | Message = "PACS SQL Server not configured. Set ConnectionStrings:PacsConnection." |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 25 | pacs | [Route("api/production/pacs")] |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 146 | harris | [HttpGet("activations/{activationId}/harris-bridge")] |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 287 | SqlConnection | using var connection = new SqlConnection(_ciapsConnectionString); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 350 | SqlConnection | using var connection = new SqlConnection(_ciapsConnectionString); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 692 | SqlConnection | using var connection = new SqlConnection(_ciapsConnectionString); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 762 | SqlConnection | private async Task<CIAPSProperty?> QueryCIAPSPropertyDataAsync(SqlConnection connection, string parcelId) |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 774 | SqlConnection | private async Task<BuildingPermit?> QueryBuildingPermitDataAsync(SqlConnection connection, string parcelId) |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 981 | SqlConnection | private async Task<object> ValidateCIAPSSchemaAsync(SqlConnection connection) |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 1314 | SqlConnection | private async Task<SchemaValidationResult> ValidateCIAPSSchemaAsync(SqlConnection connection) |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 1480 | SqlConnection | private async Task<SchemaValidationResult> ValidateCIAPSSchemaAsync(SqlConnection connection) |
| `backend/src/TerraFusion.API/Services/PacsEfAdapter.cs` | 17 | PACS | using TerraFusion.Core.PACS; |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 200 | SqlConnection | using var connection = new SqlConnection(connectionString); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 321 | SqlConnection | using var connection = new SqlConnection(connectionString); |

## Runtime Legacy Classification

- Raw references: 1926
- Blocking active runtime dependencies: 20

| Category | Count |
|---|---:|
| active_runtime_dependency | 20 |
| ingestion_sync_allowed | 119 |
| proof_or_test_only | 1376 |
| docs_comments_labels | 254 |
| archived_or_quarantined | 0 |
| user_facing_terminology | 157 |

### Category Examples

#### active_runtime_dependency

- `backend/src/TerraFusion.API/Program.cs:31` PACS — using TerraFusion.Core.PACS;
- `backend/src/TerraFusion.API/Program.cs:850` PACS — svc.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.Core.PACS.PacsSqlAdapter>();
- `backend/src/TerraFusion.API/Program.cs:1615` PACS — builder.Services.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.API.Services.PacsEfAdapter>();
- `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs:4` PACS — using TerraFusion.Core.PACS;
- `backend/src/TerraFusion.API/Controllers/PacsController.cs:19` PACS — using TerraFusion.Core.PACS;

#### ingestion_sync_allowed

- `backend/src/TerraFusion.API/Program.cs:2923` pacs — app.MapPost("/api/admin/pacs/seed", (
- `backend/src/TerraFusion.API/Program.cs:2953` pacs — return Results.Accepted("/api/admin/pacs/seed/status",
- `backend/src/TerraFusion.API/Program.cs:2957` pacs — app.MapGet("/api/admin/pacs/seed/status", () =>
- `backend/src/TerraFusion.API/Program.cs:2967` pacs — app.MapPost("/api/admin/pacs/canonicalize", (
- `backend/src/TerraFusion.API/Program.cs:2995` pacs — return Results.Accepted("/api/admin/pacs/canonicalize/status",

#### proof_or_test_only

- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs:48` pacs — ///   GET  sync-pop-2/pacs-table-columns   — read-only INFORMATION_SCHEMA query
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs:144` Harris — /// SYNC-POP-2: drains live Harris PACS into the doctrine pipeline.
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs:171` pacs_oltp — hint  = "Set TF_DEV_PACS_PASSWORD env var and ensure pacs_oltp is reachable on localhost,1433.",
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs:183` PACS — // ── S1: PACS sales → legacy_pacs_raw.sale ─────────────────
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs:202` PACS — // ── S2-A: PACS prop_supp_assoc → legacy_pacs_raw.prop_supp_assoc

#### docs_comments_labels

- `backend/src/TerraFusion.API/Program.cs:137` PACS — // ── Standalone PACS seed mode ──────────────────────────────────────────────
- `backend/src/TerraFusion.API/Program.cs:138` pacs — // Run as: dotnet run --project TerraFusion.API -- --seed-pacs
- `backend/src/TerraFusion.API/Program.cs:180` PACS — // Re-runs only canonical Property upserts from the PACS mirror.
- `backend/src/TerraFusion.API/Program.cs:327` PACS — // ── Levy rebuild from PACS oracle + canonical levy tables ──────────────────
- `backend/src/TerraFusion.API/Program.cs:1221` PACS — // Slice OPS-1-A-2 — PACS reachability probe + Process-backed refresh

#### archived_or_quarantined

- None

#### user_facing_terminology

- `backend/src/TerraFusion.API/Program.cs:903` pacs — if (args.Contains("--seed-pacs"))
- `backend/src/TerraFusion.API/Program.cs:1300` harris — ?? "harris-pacs-prod";
- `backend/src/TerraFusion.API/Program.cs:2453` pacs — .AddPacsReadiness("ready", "pacs")
- `backend/src/TerraFusion.API/Program.cs:2928` PACS — return Results.Conflict("PACS seed already running. Check /api/admin/pacs/seed/status.");
- `backend/src/TerraFusion.API/Program.cs:2954` PACS — new { message = "PACS seed started in background. Poll /api/admin/pacs/seed/status." });


## Required Fixes

- Public access posture is not explicit and usable for launch-control evidence.
- Product-load lineage is not proven by the TerraFusion DB ledger.
- Active product runtime still contains PACS/Harris/source-system references outside the allowed sync/admin/proof lanes.

## Interpretation

June 10 launch gate is red. Production approval must not rely on stale evidence, unproven lineage, unsuppressed Rust claims, or active runtime legacy leaks.

# June 10 Launch Gate

Generated: 2026-05-20T19:01:24.576Z

Passed: false
API base URL: http://localhost:5046
Public base URL: https://terrafusionmarket.com

## Summary

- API health live now: true
- Endpoint smoke passed live now: true
- Public access posture explicit: false
- Product-load ledger passed: true
- Rust runtime proven: false
- Rust claims suppressed: true
- Active runtime legacy leaks: 0
- Raw runtime legacy references: 1917
- Blockers: 1
- Warnings: 1

## Blockers

- **public_access_posture**: Public access posture is not explicit and usable for launch-control evidence. (1 blocker(s))

## Warnings

- **rust_runtime**: Rust integration seams exist but launch claims are suppressed because live runtime execution is not proven.

## Active Runtime Legacy Leaks

- None

## Runtime Legacy Classification

- Raw references: 1917
- Blocking active runtime dependencies: 0

| Category | Count |
|---|---:|
| active_runtime_dependency | 0 |
| ingestion_sync_allowed | 120 |
| proof_or_test_only | 1338 |
| docs_comments_labels | 172 |
| archived_or_quarantined | 179 |
| user_facing_terminology | 108 |

### Category Examples

#### active_runtime_dependency

- None

#### ingestion_sync_allowed

- `backend/src/TerraFusion.API/Program.cs:849` PACS — svc.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.Core.PACS.PacsSqlAdapter>();
- `backend/src/TerraFusion.API/Program.cs:2939` pacs — app.MapPost("/api/admin/pacs/seed", (
- `backend/src/TerraFusion.API/Program.cs:2969` pacs — return Results.Accepted("/api/admin/pacs/seed/status",
- `backend/src/TerraFusion.API/Program.cs:2973` pacs — app.MapGet("/api/admin/pacs/seed/status", () =>
- `backend/src/TerraFusion.API/Program.cs:2983` pacs — app.MapPost("/api/admin/pacs/canonicalize", (

#### proof_or_test_only

- `backend/src/TerraFusion.API/Controllers/CognitiveFrameworkMonitoringController.cs:219` Harris — TaskTitle = "Deploy Harris PACS Integration",
- `backend/src/TerraFusion.API/Controllers/CostForgeTestController.cs:119` Harris — _logger.LogInformation("CostForge test Harris PACS sync endpoint called: {CountyId}", request.CountyId);
- `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs:180` PACS — /// Get production PACS performance metrics
- `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs:183` PACS — /// <returns>Production PACS performance metrics with database and sync performance</returns>
- `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs:184` pacs — [HttpGet("production-pacs/performance")]

#### docs_comments_labels

- `backend/src/TerraFusion.API/Program.cs:136` PACS — // ── Standalone PACS seed mode ──────────────────────────────────────────────
- `backend/src/TerraFusion.API/Program.cs:137` pacs — // Run as: dotnet run --project TerraFusion.API -- --seed-pacs
- `backend/src/TerraFusion.API/Program.cs:179` PACS — // Re-runs only canonical Property upserts from the PACS mirror.
- `backend/src/TerraFusion.API/Program.cs:326` PACS — // ── Levy rebuild from PACS oracle + canonical levy tables ──────────────────
- `backend/src/TerraFusion.API/Program.cs:1228` PACS — // Slice OPS-1-A-2 — PACS reachability probe + Process-backed refresh

#### archived_or_quarantined

- `backend/src/TerraFusion.API/Program.cs:1626` PACS — TerraFusion.Core.PACS.PacsServiceRegistration.AddPacsAdapter(builder.Services);
- `backend/src/TerraFusion.API/Program.cs:1630` PACS — builder.Services.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.API.Services.PacsEfAdapter>();
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs:48` pacs — ///   GET  sync-pop-2/pacs-table-columns   — read-only INFORMATION_SCHEMA query
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs:144` Harris — /// SYNC-POP-2: drains live Harris PACS into the doctrine pipeline.
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs:171` pacs_oltp — hint  = "Set TF_DEV_PACS_PASSWORD env var and ensure pacs_oltp is reachable on localhost,1433.",

#### user_facing_terminology

- `backend/src/TerraFusion.API/Program.cs:902` pacs — if (args.Contains("--seed-pacs"))
- `backend/src/TerraFusion.API/Program.cs:1307` harris — ?? "harris-pacs-prod";
- `backend/src/TerraFusion.API/Program.cs:2467` pacs — healthChecksBuilder.AddPacsReadiness("ready", "pacs");
- `backend/src/TerraFusion.API/Program.cs:2944` PACS — return Results.Conflict("PACS seed already running. Check /api/admin/pacs/seed/status.");
- `backend/src/TerraFusion.API/Program.cs:2970` PACS — new { message = "PACS seed started in background. Poll /api/admin/pacs/seed/status." });


## Required Fixes

- Public access posture is not explicit and usable for launch-control evidence.

## Interpretation

June 10 launch gate is red. Production approval must not rely on stale evidence, unproven lineage, unsuppressed Rust claims, or active runtime legacy leaks.

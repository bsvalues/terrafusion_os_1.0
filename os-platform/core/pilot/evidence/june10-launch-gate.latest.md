# June 10 Launch Gate

Generated: 2026-05-20T16:57:11.825Z

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
- Active runtime legacy leaks: 581
- Blockers: 3
- Warnings: 1

## Blockers

- **public_access_posture**: Public access posture is not explicit and usable for launch-control evidence. (1 blocker(s))
- **product_load_ledger**: Product-load lineage is not proven by the TerraFusion DB ledger. (5 lineage-proven table(s), 2 blocker(s))
- **legacy_runtime_boundary**: Active product runtime still contains PACS/Harris/source-system references outside the allowed sync/admin/proof lanes. (581 leak(s))

## Warnings

- **rust_runtime**: Rust integration seams exist but launch claims are suppressed because live runtime execution is not proven.

## Active Runtime Legacy Leaks

| File | Line | Term | Evidence |
|---|---:|---|---|
| `backend/src/TerraFusion.API/Program.cs` | 31 | PACS | using TerraFusion.Core.PACS; |
| `backend/src/TerraFusion.API/Program.cs` | 137 | PACS | // ── Standalone PACS seed mode ────────────────────────────────────────────── |
| `backend/src/TerraFusion.API/Program.cs` | 138 | pacs | // Run as: dotnet run --project TerraFusion.API -- --seed-pacs |
| `backend/src/TerraFusion.API/Program.cs` | 180 | PACS | // Re-runs only canonical Property upserts from the PACS mirror. |
| `backend/src/TerraFusion.API/Program.cs` | 327 | PACS | // ── Levy rebuild from PACS oracle + canonical levy tables ────────────────── |
| `backend/src/TerraFusion.API/Program.cs` | 850 | PACS | svc.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.Core.PACS.PacsSqlAdapter>(); |
| `backend/src/TerraFusion.API/Program.cs` | 903 | pacs | if (args.Contains("--seed-pacs")) |
| `backend/src/TerraFusion.API/Program.cs` | 1221 | PACS | // Slice OPS-1-A-2 — PACS reachability probe + Process-backed refresh |
| `backend/src/TerraFusion.API/Program.cs` | 1251 | PACS | // C36 / canonical / PACS work (per C41-A Hard Guards). |
| `backend/src/TerraFusion.API/Program.cs` | 1258 | PACS | // C43-A guards. No mutation, no joins, no PACS reads. |
| `backend/src/TerraFusion.API/Program.cs` | 1282 | PACS | // Slice C48-D — opt-in PACS schema catalog wiring. When the operator has |
| `backend/src/TerraFusion.API/Program.cs` | 1292 | Harris | // the connection string MUST point at Harris PACS (the legacy source), never |
| `backend/src/TerraFusion.API/Program.cs` | 1300 | harris | ?? "harris-pacs-prod"; |
| `backend/src/TerraFusion.API/Program.cs` | 1339 | Harris | // 🔄 Legacy Harris PACS background sync is disabled by default. |
| `backend/src/TerraFusion.API/Program.cs` | 1340 | PACS | // The canonical path is explicit TerraFusionSync invocation through the PACS adapter boundary. |
| `backend/src/TerraFusion.API/Program.cs` | 1358 | pacs | // docs/pacs/block-c-contract-v1.8.md for the deprecation rationale. |
| `backend/src/TerraFusion.API/Program.cs` | 1600 | PACS | // Phase 11: GIS data service — PACS-sourced parcel boundary & layer data |
| `backend/src/TerraFusion.API/Program.cs` | 1603 | PACS | // 🏛️ PACS Adapter - pacscontract.v1 compliant read-only boundary |
| `backend/src/TerraFusion.API/Program.cs` | 1605 | PACS | // When absent: seeded PACS data from EF Core / SQLite (PacsEfAdapter) for local dev |
| `backend/src/TerraFusion.API/Program.cs` | 1615 | PACS | builder.Services.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.API.Services.PacsEfAdapter>(); |
| `backend/src/TerraFusion.API/Program.cs` | 1632 | Harris | // Detects discrepancies between Harris PACS and TerraFusion, auto-corrects data issues, maintains 99.9% accuracy |
| `backend/src/TerraFusion.API/Program.cs` | 1663 | PACS | // (ArcGIS-sourced) and canonical_tf.tf_parcel (PACS-sourced). |
| `backend/src/TerraFusion.API/Program.cs` | 1674 | PACS | // Slice S1: PACS sale raw landing — drains an IPacsSaleSource into |
| `backend/src/TerraFusion.API/Program.cs` | 1681 | PACS | // Slice S2-A: PACS prop_supp_assoc raw landing — supp-aware-join |
| `backend/src/TerraFusion.API/Program.cs` | 1687 | PACS | // Slice S1 (SYNC-POP-4a): PACS property/parcel raw landing — the |
| `backend/src/TerraFusion.API/Program.cs` | 1695 | PACS | // Slice S2-B (SYNC-POP-4b): PACS parcel-spine truth promoter — |
| `backend/src/TerraFusion.API/Program.cs` | 1703 | PACS | // Slice S3 (SYNC-POP-4c): PACS parcel canonical projector — writes |
| `backend/src/TerraFusion.API/Program.cs` | 1712 | PACS | // Single-tier (canonical-only) populator that reads PACS dbo.attribute |
| `backend/src/TerraFusion.API/Program.cs` | 1721 | PACS | // ATTR-POP-1; reads (i_attr_val_id, i_attr_val_cd) pairs from PACS |
| `backend/src/TerraFusion.API/Program.cs` | 1729 | PACS | // Slice B1-A: PACS account raw landing — Block B's PII-rich |
| `backend/src/TerraFusion.API/Program.cs` | 1736 | PACS | // Slice B1-B: PACS owner raw landing — 4-key year-versioned link |
| `backend/src/TerraFusion.API/Program.cs` | 1744 | PACS | // Slice B1-C: PACS wash_prop_owner_val raw landing — WSDOR-grade |
| `backend/src/TerraFusion.API/Program.cs` | 1752 | PACS | // Slice C1-A: PACS imprv raw landing — Block C's per-improvement |
| `backend/src/TerraFusion.API/Program.cs` | 1759 | PACS | // Slice C1-B: PACS imprv_detail raw landing — per-component |
| `backend/src/TerraFusion.API/Program.cs` | 1766 | PACS | // Slice C1-C: PACS imprv_attr raw landing with dictionary |
| `backend/src/TerraFusion.API/Program.cs` | 1771 | PACS | // the operator can refresh codes from PACS dbo.imprv_attr_val at |
| `backend/src/TerraFusion.API/Program.cs` | 1834 | PACS | // Slice L1: PACS land_detail raw landing — Block C's land lane |
| `backend/src/TerraFusion.API/Program.cs` | 1841 | PACS | // SYNC-DOCTRINE-4-IMPL-V4: PACS property_val raw landing — provides |
| `backend/src/TerraFusion.API/Program.cs` | 1863 | PACS | // landing-layer imprv_attr dictionary from PACS at backend startup. |
| `backend/src/TerraFusion.API/Program.cs` | 1876 | pacs | // docs/pacs/block-d-execution-plan.md §3.1. |
| `backend/src/TerraFusion.API/Program.cs` | 1884 | pacs | // docs/pacs/block-d-execution-plan.md §3.2. |
| `backend/src/TerraFusion.API/Program.cs` | 1893 | pacs | // docs/pacs/block-d-execution-plan.md §3.3 + v1.8 contract. |
| `backend/src/TerraFusion.API/Program.cs` | 1903 | pacs | // canonical_tf.tf_sale. Per docs/pacs/block-c-contract-v1.9.md |
| `backend/src/TerraFusion.API/Program.cs` | 1913 | pacs | // Per docs/pacs/blocks-d-through-h-design.md §F2. Read-only; |
| `backend/src/TerraFusion.API/Program.cs` | 1922 | pacs | // docs/pacs/blocks-d-through-h-design.md §"F3". Read-only. |
| `backend/src/TerraFusion.API/Program.cs` | 1930 | pacs | // type/state codes). Per docs/pacs/blocks-d-through-h-design.md |
| `backend/src/TerraFusion.API/Program.cs` | 1964 | PACS | // the existing /api/sync/doctrine/drain/{lane} endpoints; PACS |
| `backend/src/TerraFusion.API/Program.cs` | 2013 | PACS | // PII-redacting; resolves PACS prop_id to TfParcelId via source_xref; |
| `backend/src/TerraFusion.API/Program.cs` | 2029 | PACS | // PACS prop_id and owner_id (==acct_id) to canonical TfParcelId + |
| `backend/src/TerraFusion.API/Program.cs` | 2038 | PACS | // projector. Resolves PACS prop_id to TfParcelId via source_xref, |
| `backend/src/TerraFusion.API/Program.cs` | 2049 | PACS | // Slice L3: canonical_tf.tf_land projector. Resolves PACS prop_id |
| `backend/src/TerraFusion.API/Program.cs` | 2081 | PACS | // Slice S3: canonical_tf.tf_sale projector — resolves PACS prop_id |
| `backend/src/TerraFusion.API/Program.cs` | 2082 | pacs | // to TfParcelId via source_xref, projects qualifying truth-pacs |
| `backend/src/TerraFusion.API/Program.cs` | 2138 | Harris | // Exports Prometheus metrics for: Consciousness (swarm), CostForge AI, TerraGaia, TerraFusionGPT, TerraLevy, TerraFlow, TerraSync, Harris PACS integration |
| `backend/src/TerraFusion.API/Program.cs` | 2450 | PACS | // but the AddPacsReadiness extension was never called. Result: PACS down → |
| `backend/src/TerraFusion.API/Program.cs` | 2453 | pacs | .AddPacsReadiness("ready", "pacs") |
| `backend/src/TerraFusion.API/Program.cs` | 2915 | pacs | // POST /api/admin/pacs/seed  — pulls source-system tables |
| `backend/src/TerraFusion.API/Program.cs` | 2923 | pacs | app.MapPost("/api/admin/pacs/seed", ( |
| `backend/src/TerraFusion.API/Program.cs` | 2928 | PACS | return Results.Conflict("PACS seed already running. Check /api/admin/pacs/seed/status."); |
| `backend/src/TerraFusion.API/Program.cs` | 2953 | pacs | return Results.Accepted("/api/admin/pacs/seed/status", |
| `backend/src/TerraFusion.API/Program.cs` | 2954 | PACS | new { message = "PACS seed started in background. Poll /api/admin/pacs/seed/status." }); |
| `backend/src/TerraFusion.API/Program.cs` | 2957 | pacs | app.MapGet("/api/admin/pacs/seed/status", () => |
| `backend/src/TerraFusion.API/Program.cs` | 2961 | pacs | // POST /api/admin/pacs/canonicalize — Phase 7 only: promote Pacs* mirror rows → canonical TF entities. |
| `backend/src/TerraFusion.API/Program.cs` | 2967 | pacs | app.MapPost("/api/admin/pacs/canonicalize", ( |
| `backend/src/TerraFusion.API/Program.cs` | 2995 | pacs | return Results.Accepted("/api/admin/pacs/canonicalize/status", |
| `backend/src/TerraFusion.API/Program.cs` | 2996 | pacs | new { message = "Canonicalization started. Poll /api/admin/pacs/canonicalize/status." }); |
| `backend/src/TerraFusion.API/Program.cs` | 2999 | pacs | app.MapGet("/api/admin/pacs/canonicalize/status", () => |
| `backend/src/TerraFusion.API/Program.cs` | 3005 | pacs | // POST /api/admin/pacs/seed-sales — targeted seed: sales only, then canonicalize + qualify. |
| `backend/src/TerraFusion.API/Program.cs` | 3013 | pacs | app.MapPost("/api/admin/pacs/seed-sales", ( |
| `backend/src/TerraFusion.API/Program.cs` | 3018 | pacs | return Results.Conflict("Sales seed already running. Check /api/admin/pacs/seed-sales/status."); |
| `backend/src/TerraFusion.API/Program.cs` | 3042 | pacs | return Results.Accepted("/api/admin/pacs/seed-sales/status", |
| `backend/src/TerraFusion.API/Program.cs` | 3043 | pacs | new { message = "Sales-only seed started. Poll /api/admin/pacs/seed-sales/status." }); |
| `backend/src/TerraFusion.API/Program.cs` | 3046 | pacs | app.MapGet("/api/admin/pacs/seed-sales/status", () => |
| `backend/src/TerraFusion.API/Controllers/AtlasGisController.cs` | 240 | PACS | // ── PACS-Sourced Parcel Data ───────────────────────────────────── |
| `backend/src/TerraFusion.API/Controllers/AtlasGisController.cs` | 243 | PACS | /// Return a parcel boundary approximation from PACS situs + land_detail data. |
| `backend/src/TerraFusion.API/Controllers/BenchmarkingController.cs` | 38 | PACS | /// Optional: filter by buildingType code and/or revalArea (PACS Cycle). |
| `backend/src/TerraFusion.API/Controllers/BenchmarkingController.cs` | 73 | PACS | /// Average base cost per sqft by Reval Area (PACS Cycle field) from the Benton cost matrix. |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 48 | pacs | ///   GET  sync-pop-2/pacs-table-columns   — read-only INFORMATION_SCHEMA query |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 144 | Harris | /// SYNC-POP-2: drains live Harris PACS into the doctrine pipeline. |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 171 | pacs_oltp | hint  = "Set TF_DEV_PACS_PASSWORD env var and ensure pacs_oltp is reachable on localhost,1433.", |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 183 | PACS | // ── S1: PACS sales → legacy_pacs_raw.sale ───────────────── |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 202 | PACS | // ── S2-A: PACS prop_supp_assoc → legacy_pacs_raw.prop_supp_assoc |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 267 | Harris | /// SYNC-POP-2 helper: introspects a Harris PACS source table to see |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 269 | PACS | /// assumptions against real PACS schema. |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 271 | pacs | [HttpGet("sync-pop-2/pacs-table-columns")] |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 290 | SqlConnection | await using var conn = new Microsoft.Data.SqlClient.SqlConnection(pacsCs); |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 411 | PACS | // ── S1: PACS sales → legacy_pacs_raw.sale ───────────────── |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 545 | Harris | /// against live Harris PACS, capture the type-distribution histogram |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 611 | PACS | : "INCONCLUSIVE: legacy_pacs_raw.property = 0. Source returned no rows; check PACS connection and dbo.property contents.", |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 1148 | PACS | /// PACS tables (account, prop_supp_assoc, property, plus the |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 1550 | PACS | // Use 2026 as the working year for keyed imprv lookups; PACS data is |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 1698 | PACS | /// <param name="WorkingYear">PACS prop_val_yr to filter imprv stages by. |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 1856 | PACS | /// <param name="WorkingYear">PACS prop_val_yr to filter land stages by. Default 2026.</param> |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 1968 | PACS | /// anchored seed unlocks all five PACS lanes (sale, owner, WSDOR, |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2035 | PACS | // OWNER-LANE seed: lands owners, then derives all PACS keys. |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2053 | PACS | // PARCEL chain (used by every PACS lane's xref resolution). |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2166 | PACS | // Independent of PACS chains; resolves APN crosswalk against |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2168 | PACS | // includes everything we just projected from the PACS lanes). |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2224 | PACS | /// <param name="WorkingYear">PACS year filter. Default 2026.</param> |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2227 | PACS | /// and drains the full PACS corpus. Wall-clock ~60-150 minutes. Use for |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2239 | PACS | // ATTR-POP-1: populate canonical_tf.attribute_definition from PACS |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2246 | PACS | /// the resolved Benton county. Reads PACS <c>dbo.attribute</c> |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2302 | pacs | .Where(b => b.SourceSystem == "truth-pacs-imprv-promoter" && b.Status == "COMPLETED") |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2363 | PACS | : "INCONCLUSIVE: PACS dbo.attribute returned no rows. Investigate.", |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2672 | PACS | //   loop opened by ATTR-POP-1 + ATTR-DRAIN-1. Reads PACS value-grain |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2734 | pacs | .Where(b => b.SourceSystem == "truth-pacs-imprv-promoter" && b.Status == "COMPLETED") |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2799 | PACS | : "INCONCLUSIVE: 0 rows from PACS. Investigate."), |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 3017 | PACS | // SYNC-COMPLETE-1: PACS source-side row counts for post-drain validation. |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 3023 | PACS | /// Returns SELECT COUNT(*) against a whitelisted set of PACS tables |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 3029 | pacs | [HttpGet("pacs-counts")] |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 3061 | SqlConnection | await using var conn = new Microsoft.Data.SqlClient.SqlConnection(pacsCs); |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 3090 | pacs_oltp | note = "All counts are SELECT COUNT(*) at the time of this call against live pacs_oltp. -1 sentinel indicates per-query failure (see errors block).", |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 3111 | PACS | /// row? PACS network reads are out of scope; this measures only |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 3149 | PACS | PropId = 9_000_000 + i,                    // out of real PACS range |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 3150 | PACS | OwnerId = 9_000_000_000L + i,              // out of real PACS range |
| `backend/src/TerraFusion.API/Controllers/CognitiveFrameworkMonitoringController.cs` | 219 | Harris | TaskTitle = "Deploy Harris PACS Integration", |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 955 | Harris | /// Supports Washington State compliance and Harris PACS integration |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 2404 | PACS | // RevalArea maps to the PACS Cycle field (physical inspection rotation area) |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 2628 | Harris | /// Source: Harris PACS CMS tables + IAAO age-life method. |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 2643 | Harris | source = "Harris PACS CMS + IAAO Standard on Mass Appraisal / Benton County FY 2025", |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 2649 | PACS | /// Source: Benton County land schedule (slope-intercept method from PACS land_sched_si_detail). |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 2658 | PACS | method = "Slope-Intercept (PACS land_sched_si_detail)", |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 2666 | PACS | /// Source: Benton County residential valuation policy + PACS imprv_detail type codes. |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 2723 | PACS | // Step 3: Depreciation (multiplicative age-life model from PACS) |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 2735 | PACS | // Physical depreciation: age-life with 85% cap (per PACS/IAAO) |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 2742 | PACS | // Multiplicative depreciation (per PACS CMS model) |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 3339 | PACS | new { name = "revalArea", type = "string", required = false, description = "Reval Area (PACS Cycle 1-6) for local cost multiplier" }, |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 3991 | PACS | // Benton County land rates by zone (from PACS land_sched_si_detail) |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 4008 | PACS | // Site/yard improvement schedule (from PACS imprv_detail type codes + Benton policy) |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 4163 | PACS | /// <summary>GET /api/costforge/regions — Benton County Reval Areas (PACS Cycle field) with cost factors.</summary> |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 4188 | PACS | /// hood_cd is the PACS neighborhood code. Reval area is loaded only from explicit Region/Cycle-derived fields. |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 4189 | PACS | /// Falls back to BentonSalesData if PACS table is empty or unreachable. |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 4259 | PACS | // Assessed values from Properties table (canonical, no PACS naming) |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 4755 | PACS | explanation = "Published Benton County cost rate for this building type and Reval Area (PACS Cycle)" }, |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 4805 | PACS | // Reval Areas (Cycle field in PACS) = physical inspection rotation areas 1-6 |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 4882 | PACS | // Reval Area (Cycle) adjustment factors — Benton County PACS Cycle field |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 7003 | PACS | description = "Improvement value is negative — invalid; check PACS source.", |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 8049 | PACS | // Feature factor codes — real certified-lane improvement detail codes from PACS |
| `backend/src/TerraFusion.API/Controllers/CostForgeTestController.cs` | 119 | Harris | _logger.LogInformation("CostForge test Harris PACS sync endpoint called: {CountyId}", request.CountyId); |
| `backend/src/TerraFusion.API/Controllers/CountyDeploymentController.cs` | 164 | Harris | modules = new[] { "GIS Core", "Property Assessment", "Tax Levy Management", "Advanced Analytics", "Compliance Automation", "AI Swarm", "Quantum Optimization", "Harris PACS Integration" }, |
| `backend/src/TerraFusion.API/Controllers/DataImportController.cs` | 8 | PACS | /// Full PACS sync wiring is Post-R1; these endpoints return empty collections |
| `backend/src/TerraFusion.API/Controllers/DataImportController.cs` | 48 | PACS | return Ok(new { fileId = Guid.NewGuid(), status = "pending", message = "PACS sync wiring is Post-R1; file queued for future processing." }); |
| `backend/src/TerraFusion.API/Controllers/DataImportController.cs` | 62 | PACS | return Ok(new { status = "queued", message = "PACS sync wiring is Post-R1; import queued." }); |
| `backend/src/TerraFusion.API/Controllers/DoctrineDrainController.cs` | 1726 | PACS | // than PACS directly) is faster and avoids round-tripping to |
| `backend/src/TerraFusion.API/Controllers/DoctrineDrainController.cs` | 1997 | PACS | /// <param name="WorkingYear">PACS prop_val_yr filter for the year-grain stages |
| `backend/src/TerraFusion.API/Controllers/EliteDashboardController.cs` | 411 | Harris | recommendations.Add("🔗 Expand Harris PACS integration to more counties"); |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 180 | PACS | /// Get production PACS performance metrics |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 183 | PACS | /// <returns>Production PACS performance metrics with database and sync performance</returns> |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 184 | pacs | [HttpGet("production-pacs/performance")] |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 189 | PACS | _logger.LogInformation("🏛️ API: Getting production PACS performance metrics"); |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 195 | PACS | _logger.LogInformation("✅ Production PACS metrics retrieved: {Records} records processed, {QueryTime:F2}ms avg query time, {IntegrityScore:F2} integrity score", |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 202 | PACS | _logger.LogError(ex, "❌ Error getting production PACS performance metrics"); |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 205 | PACS | Error = "Production PACS performance error", |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 524 | PACS | ["Production PACS"] = "Healthy", |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 532 | PACS | ["Production PACS"] = "green", |
| `backend/src/TerraFusion.API/Controllers/ForgeController.cs` | 18 | PACS | /// Queries PACS tables for real Benton County data; returns structured fallback |
| `backend/src/TerraFusion.API/Controllers/ForgeController.cs` | 19 | PACS | /// where PACS data is incomplete. |
| `backend/src/TerraFusion.API/Controllers/ForgeController.cs` | 172 | PACS | // Raw PACS codes are facts. TF recommendation is a suggestion. Assessor decision is law. |
| `backend/src/TerraFusion.API/Controllers/ForgeController.cs` | 257 | PACS | /// Typically called after a PACS ingest to populate QualificationRecommendation. |
| `backend/src/TerraFusion.API/Controllers/GovernmentController.cs` | 113 | Harris | system = "Harris PACS", |
| `backend/src/TerraFusion.API/Controllers/GovernmentController.cs` | 165 | Harris | name = "Harris PACS", |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 6 | PACS | using TerraFusion.API.Models.PACS; |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 13 | Harris | /// STRATEGIC BRIDGE CONTROLLER: Harris PACS ↔ TerraFusion Enhancement API |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 16 | Harris | /// between Harris PACS legacy systems and TerraFusion's championship AI capabilities. |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 19 | Harris | /// - Enable seamless Harris PACS enhancement with TerraFusion AI |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 45 | Harris | /// STRATEGIC ENTRY POINT: Initialize Harris PACS Enhancement Bridge |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 49 | Harris | /// Creates the strategic bridge that transforms Harris PACS operations with |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 58 | Harris | _logger.LogInformation("🚀 Initializing Harris PACS Enhancement Bridge - County: {CountyCode}", request.CountyCode); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 82 | Harris | _logger.LogInformation("✅ Harris PACS Enhancement Bridge Initialized Successfully - Session: {SessionId}", result.SessionId); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 87 | Harris | _logger.LogError("❌ Failed to initialize Harris PACS Enhancement Bridge - County: {CountyCode}, Error: {Error}", |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 94 | Harris | _logger.LogError(ex, "❌ Exception during Harris PACS Enhancement Bridge initialization - County: {CountyCode}", request.CountyCode); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 104 | Harris | /// Transforms Harris PACS property assessment with TerraFusion's championship AI, |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 223 | Harris | /// STRATEGIC ANALYTICS: Generate Harris PACS vs TerraFusion Comparison Report |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 228 | Harris | /// over Harris PACS legacy operations, providing compelling migration justification. |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 237 | Harris | _logger.LogInformation("📊 Generating Harris PACS vs TerraFusion Comparison Report - Session: {SessionId}", sessionId); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 304 | Harris | /// providing administrative oversight of Harris PACS enhancement operations. |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 332 | Harris | /// Provides real-time performance comparison between Harris PACS baseline |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 388 | PACS | public Models.PACS.ConsciousnessLevel ConsciousnessLevel { get; set; } = Models.PACS.ConsciousnessLevel.Enhanced; |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 393 | PACS | // PACSConnectionConfig and ConsciousnessLevel are defined in TerraFusion.API.Models.PACS |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 4 | PACS | using TerraFusion.Core.PACS; |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 59 | PACS | _logger.LogDebug("No county claims found for PACS request; falling back to Benton County in Development"); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 84 | PACS | "PACS jurisdiction mismatch: user county {CountyName} (FIPS {FipsCode}) does not match requested jurisdiction {Jurisdiction}", |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 94 | Harris | /// Get available Harris PACS jurisdictions |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 104 | PACS | error = "PACS jurisdictions not available", |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 105 | PACS | details = "pacscontract.v1 does not expose jurisdictions. Use PACS adapter endpoints." |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 110 | Harris | _logger.LogError(ex, "Error retrieving Harris PACS jurisdictions"); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 350 | Harris | /// Get Harris PACS system status |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 375 | Harris | _logger.LogError(ex, "Error retrieving Harris PACS system status"); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 381 | Harris | /// Health check endpoint for Harris PACS integration |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 407 | Harris | message = "Harris PACS system is offline" |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 413 | Harris | _logger.LogError(ex, "Harris PACS health check failed"); |
| `backend/src/TerraFusion.API/Controllers/LandSegmentExceptionController.cs` | 15 | pacs | /// per <c>docs/pacs/blocks-d-through-h-design.md</c> §F.4. |
| `backend/src/TerraFusion.API/Controllers/LevyCalculationController.cs` | 636 | PACS | // Extracted from quarantined PACS levy SQL + BCBSLevy + TerraFlow |
| `backend/src/TerraFusion.API/Controllers/LevyCalculationController.cs` | 876 | PACS | /// Extracted from quarantined PACS levy SQL and Benton County Assessor levy workbook. |
| `backend/src/TerraFusion.API/Controllers/LevyCalculationController.cs` | 944 | PACS | /// Extracted from PACS levy_cert tables and Benton County Assessor procedures. |
| `backend/src/TerraFusion.API/Controllers/LevyController.cs` | 16 | PACS | /// Data source: pacs_levy_rates and pacs_levy_tax_area_assocs (seeded from PACS dbo.levy |
| `backend/src/TerraFusion.API/Controllers/LevyReferenceController.cs` | 272 | PACS | Source: "PACS dbo.tax_area (mirrored via PacsTaxArea entity)", |
| `backend/src/TerraFusion.API/Controllers/MigrationPathwaysController.cs` | 14 | Harris | /// Provides comprehensive REST API endpoints for county migration from Harris PACS |
| `backend/src/TerraFusion.API/Controllers/MigrationPathwaysController.cs` | 52 | Harris | /// Performs thorough analysis of county's readiness to migrate from Harris PACS |
| `backend/src/TerraFusion.API/Controllers/MultiCountyIntegrationController.cs` | 11 | Harris | /// Manages Harris PACS synchronization and cross-county property assessment data |
| `backend/src/TerraFusion.API/Controllers/MultiCountyIntegrationController.cs` | 137 | Harris | reason = "Harris PACS integration not configured for this county" |
| `backend/src/TerraFusion.API/Controllers/MultiCountyIntegrationController.cs` | 422 | Harris | "Configure Harris PACS integration if needed", |
| `backend/src/TerraFusion.API/Controllers/MultiCountyIntegrationController.cs` | 578 | Harris | recommendations.Add("Consider enabling Harris PACS integration"); |
| `backend/src/TerraFusion.API/Controllers/MultiCountyIntegrationController.cs` | 615 | Harris | recommendations.Add("Expand Harris PACS integration to more counties"); |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 2 | PACS | // PACS Controller - /api/pacs Endpoints |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 4 | Harris | // Live Harris PACS data endpoints backed by IPacsAdapter (pacscontract.v1). |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 5 | PACS | // Returns 503 when PACS is not yet configured (missing TF_DEV_PACS_* / connection |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 8 | PACS | // Phase 33 — PACS Live Integration |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 19 | PACS | using TerraFusion.Core.PACS; |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 24 | Harris | /// Live Harris PACS data endpoints. |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 26 | PACS | /// Returns HTTP 503 when PACS SQL Server is not yet provisioned. |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 29 | pacs | [Route("api/pacs")] |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 42 | pacs | // ── GET /api/pacs/properties ───────────────────────────────────────── |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 46 | PACS | /// Returns 503 when PACS is not configured. |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 73 | PACS | _logger.LogWarning("PACS adapter not available: {Message}", ex.Message); |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 77 | PACS | Message = "PACS SQL Server not configured. Set ConnectionStrings:PacsConnection." |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 81 | PACS | // Cap PACS query at 5s so the endpoint fails fast and the frontend can fall back. |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 150 | PACS | _logger.LogWarning("PACS properties query timed out after 10s — SQL Server not reachable"); |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 154 | PACS | Message = "PACS query timed out. SQL Server not provisioned or unreachable.", |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 159 | PACS | _logger.LogWarning("PACS contract violation: {Code} {Message}", ex.ErrorCode, ex.Message); |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 168 | PACS | _logger.LogError(ex, "Unexpected error reading PACS properties"); |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 172 | PACS | Message = "PACS query failed. See server logs.", |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 177 | pacs | // ── GET /api/pacs/health ───────────────────────────────────────────── |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 180 | PACS | /// PACS adapter connectivity status — used by smoke tests. |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 181 | PACS | /// Returns 200 {"status":"connected"} when PACS is live. |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 214 | PACS | return StatusCode(503, new { status = "timeout", detail = "PACS health probe timed out after 5s" }); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 3 | PACS | * TERRAFUSION OS - PRODUCTION PACS INTEGRATION CONTROLLER |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 4 | Harris | * Real Benton County Harris PACS API Integration |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 20 | PACS | /// Production PACS Integration Controller |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 21 | Harris | /// Provides championship-level API endpoints for real Benton County Harris PACS integration |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 25 | pacs | [Route("api/production/pacs")] |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 51 | PACS | /// Initialize complete production PACS integration |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 61 | PACS | _logger.LogInformation("🏛️ API: Initializing production PACS integration for Benton County"); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 76 | PACS | // Initialize production PACS integration |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 81 | PACS | _logger.LogError("❌ Production PACS integration failed: {Message}", integrationResult.Message); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 84 | PACS | Error = "Production PACS integration failed", |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 99 | PACS | _logger.LogInformation("✅ Production PACS integration completed successfully: {Records} records processed", |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 106 | PACS | _logger.LogError(ex, "❌ Critical error during production PACS integration"); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 209 | PACS | _logger.LogInformation("🤖 API: Preparing AI training datasets from production PACS data"); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 326 | PACS | /// Validate production schemas against real PACS database structures |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 327 | Harris | /// Ensures compatibility with Benton County Harris PACS systems |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 335 | PACS | _logger.LogInformation("🔍 API: Validating production schemas against real PACS structures"); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 368 | PACS | /// Optimize production queries using real PACS performance patterns |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 377 | PACS | _logger.LogInformation("⚡ API: Optimizing production queries using real PACS performance patterns"); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 453 | PACS | /// Provides real-time status of all PACS integration components |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 467 | PACS | SystemName = "TerraFusion OS - Production PACS Integration", |
| `backend/src/TerraFusion.API/Controllers/PropertiesController.cs` | 247 | PACS | /// Returns empty buildings array (not 404) when parcel has no PACS improvements. |
| `backend/src/TerraFusion.API/Controllers/SalesRatioStudyController.cs` | 23 | PACS | /// <c>canonical_tf.tf_sale</c>; equivalence to PACS-original |
| `backend/src/TerraFusion.API/Controllers/SalesReviewQueueController.cs` | 16 | pacs | /// <para>Per <c>docs/pacs/blocks-d-through-h-design.md</c> §F: F2 |
| `backend/src/TerraFusion.API/Controllers/SystemOrchestrationController.cs` | 200 | Harris | Type = "Harris PACS v12.4.7", |
| `backend/src/TerraFusion.API/Controllers/SystemOrchestrationController.cs` | 321 | Harris | SyncSources = new[] { "Harris PACS", "Tyler", "Aumentum", "Vision" }, |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 236 | PACS | // Properties join for assessed value (canonical TF table — no PACS read). |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 266 | PACS | // Time-of-sale physical characteristics (PACS snapshot — use these for ratio) |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 279 | PACS | // Raw PACS codes (Layer 1 — facts, never transformed) |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 588 | PACS | /// Code audit: breakdown of raw PACS qualification codes in the taxYear sale window. |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 589 | PACS | /// Exposes WAC code nulls as a data quality flag (the known PACS seeding gap). |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 627 | PACS | description = g.Key == null ? "No WAC code (PACS seeding gap — data quality issue)" : g.Key, |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 667 | PACS | ? $"{wacNullCount:N0} of {totalSales:N0} sales ({wacNullPct}%) have no WAC code — PACS seeding gap" |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 691 | PACS | /// Ratio = Properties.AssessedValue / ComparableSales.SalePrice (TF-computed; PACS ratio column unused). |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 744 | PACS | // PACS is the legacy system being replaced — TF never uses PACS-computed ratio values. |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 1099 | PACS | /// falling back to assessment-time values when PACS did not record sale-time data. |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 1137 | PACS | // Fetch fields needed for regression. Prefer sale-time PACS values; fall back to |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 1332 | PACS | /// SaleRatioTypes, ReetWacCodes). No PACS staging read. Safe to call anytime. |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 1334 | PACS | ///   1 - PACS SaleQualifier (already on ComparableSales.RawSaleQualifier) |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 1382 | PACS | ///   - SyncController owns PACS/raw-mirror backfill into ComparableSales.Raw* fields. |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 1386 | PACS | /// does not reach back into PACS staging. Missing raw-code repair must happen in Sync. |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 11 | Harris | /// modules with seamless Harris PACS bridge integration. |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 16 | Harris | /// - Harris PACS bridge integration management |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 39 | Harris | /// Harris PACS compatibility, AI requirements, and county-specific availability. |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 61 | Harris | /// options, requirements, Harris PACS bridge capabilities, and performance metrics. |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 74 | Harris | /// Activates a specific module for a county with optional Harris PACS bridge integration, |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 112 | Harris | /// AI agent allocations, and Harris PACS bridge status. |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 139 | HARRIS | /// HARRIS PACS INTEGRATION: Get Harris PACS Bridge Status |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 141 | harris | /// GET /api/terrafusionmarketplace/activations/{activationId}/harris-bridge |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 143 | Harris | /// Returns the status and metrics of Harris PACS bridge integration for |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 146 | harris | [HttpGet("activations/{activationId}/harris-bridge")] |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 150 | harris | "activations/{activationId}/harris-bridge", |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 151 | Harris | "Harris bridge marketplace telemetry", |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 211 | Harris | /// module health, AI agent status, and Harris PACS bridge connectivity. |
| `backend/src/TerraFusion.API/Controllers/TerraFusionSyncController.cs` | 13 | Harris | /// for Washington State counties including Harris PACS, Tyler, Aumentum, and other government systems |
| `backend/src/TerraFusion.API/Controllers/TerraFusionSyncController.cs` | 145 | Harris | /// Gets all registered legacy systems (Harris PACS, Tyler, Aumentum, etc.) |
| `backend/src/TerraFusion.API/Controllers/WorkbenchSyncReadinessController.cs` | 24 | PACS | /// <item>HG3 read-only — no writes to PACS, TerraFusion DB, the |
| `backend/src/TerraFusion.API/Controllers/WorkbenchSyncReadinessController.cs` | 95 | PACS | /// Probes the PACS connection, runs the three SyncAtlas |
| `backend/src/TerraFusion.API/Controllers/WorkbenchSyncReadinessController.cs` | 161 | pacs | Source = "pacs-connection-probe", |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 15 | Harris | /// delivering quantifiable superiority over Harris PACS legacy systems |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 58 | Harris | _logger.LogInformation($"🎯 Launching AI Supremacy Demonstration {demoId} - TerraFusion vs Harris PACS"); |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 80 | Harris | // Phase 2: Initialize Harris PACS Baseline Comparison |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 227 | Harris | /// Initialize Harris PACS baseline performance comparison |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 231 | Harris | _logger.LogInformation($"📊 Initializing Harris PACS baseline performance metrics for competitive analysis"); |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 236 | Harris | // Connect to Harris PACS and gather baseline metrics |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 249 | Harris | SystemVersion = "Harris PACS v12.4.7", |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 259 | Harris | _logger.LogInformation($"📈 Harris PACS baseline established: {demo.HarrisPACSResults.ResponseTime.TotalMilliseconds}ms avg response, {demo.HarrisPACSResults.Accuracy:P2} accuracy"); |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 267 | Harris | _logger.LogInformation($"⚡ Executing parallel performance test - TerraFusion AI vs Harris PACS"); |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 412 | Harris | /// Execute Harris PACS scenario for baseline comparison |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 421 | Harris | // Execute scenario through Harris PACS API |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 430 | Harris | SystemName = "Harris PACS v12.4.7", |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 441 | Harris | AgentsDeployed = 0, // Harris PACS doesn't use AI agents |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 447 | Harris | _logger.LogError(ex, $"❌ Harris PACS scenario execution failed: {scenario.Name}"); |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 452 | Harris | SystemName = "Harris PACS v12.4.7", |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 516 | Harris | _logger.LogInformation($"🏆 TerraFusion demonstrates {demo.CompetitiveAdvantage.OverallSuperiority:P2} overall superiority over Harris PACS"); |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 524 | Harris | if (harrisPacsValue == 0) return 1.0; // 100% superiority if Harris PACS fails |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 863 | Harris | Description = "Compare TerraFusion AI vs Harris PACS property assessment processing speed", |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 867 | Harris | RequiredFeatures = new List<string> { "AI Swarm", "Harris PACS Integration" } |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 873 | Harris | Description = "Demonstrate TerraFusion's 99.9% accuracy vs Harris PACS baseline", |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 893 | Harris | Description = "Automated compliance validation vs manual Harris PACS process", |
| `backend/src/TerraFusion.API/Services/AISwarmIntelligenceOrchestrator.cs` | 347 | harris | new SwarmCluster { Id = "harris-pacs-sync", Name = "Harris PACS Sync", Specialization = "GovernmentIntegration", MaxCapacity = 7500, ActiveAgents = 7321 }, |
| `backend/src/TerraFusion.API/Services/CostForgeService.cs` | 84 | PACS | $"has no BuildingType classification. Re-run PACS sync to populate."); |
| `backend/src/TerraFusion.API/Services/CostForgeService.cs` | 111 | PACS | "Defaulting to {YearBuilt} (age 25) for depreciation — re-run PACS sync.", |
| `backend/src/TerraFusion.API/Services/CountyMigrationPathways.cs` | 14 | Harris | /// This revolutionary service orchestrates smooth, zero-disruption migration from Harris PACS |
| `backend/src/TerraFusion.API/Services/CountyMigrationPathways.cs` | 85 | Harris | /// Performs thorough analysis of county's current Harris PACS deployment, |
| `backend/src/TerraFusion.API/Services/DataMigrationEngine.cs` | 15 | Harris | /// This sophisticated engine orchestrates seamless data migration from Harris PACS |
| `backend/src/TerraFusion.API/Services/DataMigrationEngine.cs` | 327 | Harris | // This would integrate with Harris PACS to analyze data structure |
| `backend/src/TerraFusion.API/Services/ElitePerformanceMonitoringService.cs` | 356 | PACS | /// Get production PACS performance metrics |
| `backend/src/TerraFusion.API/Services/ElitePerformanceMonitoringService.cs` | 394 | PACS | _logger.LogError(ex, "❌ Error getting production PACS performance metrics"); |
| `backend/src/TerraFusion.API/Services/ElitePerformanceOptimizationEngine.cs` | 491 | Harris | _logger.LogDebug("⚡ Cache strategies aggressively optimized for Harris PACS integration"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 5 | Harris | using TerraFusion.API.Models; // Harris PACS Enhancement Models |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 6 | PACS | using PACSModels = TerraFusion.API.Models.PACS; // PACS Integration Models (alias to resolve ambiguity) |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 15 | Harris | /// STRATEGIC BRIDGE: Harris PACS ↔ TerraFusion Enhancement Layer |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 17 | Harris | /// This revolutionary service creates a seamless enhancement bridge between legacy Harris PACS |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 19 | Harris | /// while maintaining familiar Harris PACS workflows. |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 22 | Harris | /// - Counties see familiar Harris PACS interface with dramatically improved results |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 72 | Harris | /// STRATEGIC ENTRY POINT: Initialize Harris PACS Enhancement Bridge |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 74 | Harris | /// This creates the seamless integration layer that transforms Harris PACS from |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 85 | Harris | _logger.LogInformation("🚀 Initializing Harris PACS Enhancement Bridge for County: {CountyCode}", countyCode); |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 95 | Harris | // Phase 2: Harris PACS Connection & Data Discovery |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 167 | Harris | _logger.LogInformation("✅ Harris PACS Enhancement Bridge Successfully Initialized - Session: {SessionId}, County: {CountyCode}, AI Agents: {AgentCount}", |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 177 | Harris | Message = $"Harris PACS Enhancement Bridge Active - {aiSwarmActivation.ActivatedAgents} AI agents enhancing {countyCode} county operations", |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 183 | Harris | _logger.LogError(ex, "❌ Failed to initialize Harris PACS Enhancement Bridge for County: {CountyCode}", countyCode); |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 196 | Harris | /// CORE ENHANCEMENT: Apply TerraFusion AI to Harris PACS Property Assessment |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 198 | Harris | /// This transforms legacy Harris PACS property assessments with TerraFusion's |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 218 | Harris | // Phase 1: Retrieve Harris PACS Baseline Assessment |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 324 | Harris | /// STRATEGIC ANALYTICS: Generate Harris PACS vs TerraFusion Comparison Report |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 327 | Harris | /// TerraFusion AI provides over legacy Harris PACS operations. |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 345 | Harris | _logger.LogInformation("📊 Generating Harris PACS vs TerraFusion Comparison Report - Session: {SessionId}", sessionId); |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 347 | Harris | // Phase 1: Collect Harris PACS Baseline Performance Data |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 413 | Harris | _logger.LogInformation("✅ Harris PACS vs TerraFusion Comparison Report Generated - ROI: {ROI}%, Accuracy Improvement: {AccuracyImprovement}%", |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 654 | Harris | Summary = "Executive summary of Harris PACS enhancement analysis", |
| `backend/src/TerraFusion.API/Services/HarrisPacsImportService.cs` | 27 | Harris | _logger.LogInformation("Starting Harris PACS import for county {County} from {FilePath}", countyId, filePath); |
| `backend/src/TerraFusion.API/Services/HarrisPacsImportService.cs` | 32 | Harris | throw new InvalidOperationException($"County {countyId} not authorized for Harris PACS import. Only Benton County supported."); |
| `backend/src/TerraFusion.API/Services/HarrisPacsImportService.cs` | 62 | Harris | _logger.LogInformation("Harris PACS import completed for {County}: {Success}/{Total} records", |
| `backend/src/TerraFusion.API/Services/HarrisPacsImportService.cs` | 72 | Harris | _logger.LogError(ex, "Harris PACS import failed for county {County}", countyId); |
| `backend/src/TerraFusion.API/Services/HarrisPacsImportService.cs` | 79 | PACS | // Mock PACS data reader - in production, integrate with actual Harris PACS export format |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 3 | HARRIS | * TERRAFUSION OS - HARRIS PACS INTEGRATION SERVICE |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 26 | Harris | /// Production Harris PACS Integration Service |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 27 | Harris | /// Integrates with real Benton County Harris PACS database structures |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 43 | Harris | /// Production Harris PACS Integration Service |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 59 | PACS | // Production Data Structures (Based on Real PACS Schema) |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 205 | Harris | /// Initialize integration with real Benton County Harris PACS systems |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 210 | Harris | _logger.LogInformation("🏛️ Initializing Benton County Harris PACS Integration with Real Production Schemas"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 287 | SqlConnection | using var connection = new SqlConnection(_ciapsConnectionString); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 350 | SqlConnection | using var connection = new SqlConnection(_ciapsConnectionString); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 399 | PACS | /// Synchronize with production PACS using real sync service patterns |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 403 | Harris | _logger.LogInformation("🔄 Synchronizing with production Harris PACS"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 430 | PACS | Message = $"PACS synchronization completed: {successfulSyncs}/{syncOperations.Count} operations successful", |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 440 | PACS | _logger.LogError(ex, "❌ Error during PACS synchronization"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 444 | PACS | Message = $"PACS synchronization error: {ex.Message}", |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 606 | PACS | // Step 1: Extract data from production PACS |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 653 | PACS | /// Get comprehensive PACS integration performance metrics |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 678 | PACS | _logger.LogError(ex, "❌ Error gathering PACS integration metrics"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 692 | SqlConnection | using var connection = new SqlConnection(_ciapsConnectionString); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 727 | PACS | _logger.LogInformation("⏰ Executing scheduled PACS synchronization"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 732 | PACS | _logger.LogWarning("⚠️ Scheduled PACS sync completed with issues: {Message}", result.Message); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 737 | PACS | _logger.LogError(ex, "❌ Error during scheduled PACS synchronization"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 762 | SqlConnection | private async Task<CIAPSProperty?> QueryCIAPSPropertyDataAsync(SqlConnection connection, string parcelId) |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 774 | SqlConnection | private async Task<BuildingPermit?> QueryBuildingPermitDataAsync(SqlConnection connection, string parcelId) |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 981 | SqlConnection | private async Task<object> ValidateCIAPSSchemaAsync(SqlConnection connection) |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 995 | PACS | // Supporting data models based on real Benton County PACS structures |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 1314 | SqlConnection | private async Task<SchemaValidationResult> ValidateCIAPSSchemaAsync(SqlConnection connection) |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 1371 | PACS | Message = "Data extracted from production PACS", |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 1480 | SqlConnection | private async Task<SchemaValidationResult> ValidateCIAPSSchemaAsync(SqlConnection connection) |
| `backend/src/TerraFusion.API/Services/IAISuperiorityDemonstrationService.cs` | 7 | Harris | /// for showcasing TerraFusion's 1,008 AI agents vs Harris PACS baseline |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 1 | PACS | using TerraFusion.API.Models.PACS; |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 6 | Harris | /// Harris PACS Integration Service Interface - Championship-level property assessment system integration |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 7 | PACS | /// for Tyler Technologies PACS v12.4.7 with sovereign county data isolation |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 12 | Harris | /// Retrieves property data from Harris PACS by parcel ID with AI enhancement |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 20 | Harris | /// Retrieves paginated list of properties from Harris PACS jurisdiction |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 25 | PACS | /// <returns>List of property data from PACS system</returns> |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 29 | Harris | /// Synchronizes property data from Harris PACS to TerraFusion database |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 44 | PACS | /// Validates PACS connection configuration for jurisdiction |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 46 | PACS | /// <param name="config">PACS connection configuration to validate</param> |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 51 | PACS | /// Retrieves property assessment history from PACS for trend analysis |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 60 | Harris | /// Executes AI-enhanced batch property valuation via Harris PACS integration |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 69 | PACS | /// Retrieves comparable sales data from PACS for property valuation |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 79 | Harris | /// Updates property valuation in Harris PACS after AI enhancement |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 84 | PACS | /// <returns>Update result with PACS confirmation</returns> |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 88 | Harris | /// ✅ Gather baseline performance metrics from Harris PACS for superiority comparison benchmarking |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 95 | Harris | /// ✅ Execute demonstration scenario against Harris PACS for performance comparison |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 103 | Harris | /// Property Data Model - Harris PACS property information with TerraFusion AI enhancement |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 123 | PACS | /// PACS Sync Result - Property data synchronization outcome |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 137 | PACS | /// PACS Sync Status - Current synchronization state for jurisdiction |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 152 | PACS | /// PACS Connection Validation - Connection test results |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 227 | PACS | /// Enhanced Property Valuation - AI-enhanced valuation for PACS update |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 239 | PACS | /// PACS Update Result - Property valuation update outcome |
| `backend/src/TerraFusion.API/Services/ISaleQualificationService.cs` | 10 | PACS | ///   Layer 1 — Raw PACS codes: copied verbatim at sync time. Never judged here. |
| `backend/src/TerraFusion.API/Services/ISaleQualificationService.cs` | 15 | PACS | /// Raw PACS codes are facts. TerraFusion recommendation is a suggestion. |
| `backend/src/TerraFusion.API/Services/ModuleRegistry.cs` | 12 | Harris | /// including specialized government modules and Harris PACS bridge integrations. |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 12 | Harris | /// Handles Harris PACS system integration and county-specific configurations |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 72 | Harris | /// Synchronizes data for a specific county with Harris PACS and local systems |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 103 | Harris | // Step 2: Sync with Harris PACS if enabled |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 318 | Harris | /// Synchronizes data with Harris PACS system for a specific county |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 324 | Harris | _logger.LogInformation("Starting Harris PACS synchronization for {CountyCode}", countyCode); |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 336 | Harris | result.ErrorMessage = "Harris PACS integration not enabled for this county"; |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 342 | Harris | // Simulate Harris PACS API integration |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 346 | Harris | // In a real implementation, this would connect to the actual Harris PACS system |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 357 | Harris | $"Harris PACS sync for {countyCode}: {result.RecordsSynced} records processed", true); |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 363 | Harris | _logger.LogError(ex, "Harris PACS synchronization failed for {CountyCode}", countyCode); |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 364 | Harris | await _auditLogger.LogAsync("HARRIS_PACS_ERROR", $"Harris PACS sync failed: {ex.Message}", false); |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 501 | pacs | ApiEndpoint = $"https://pacs.{countyCode}.wa.gov/api", |
| `backend/src/TerraFusion.API/Services/PacsEfAdapter.cs` | 2 | PACS | // PACS EF Core Adapter - Development/SQLite Implementation |
| `backend/src/TerraFusion.API/Services/PacsEfAdapter.cs` | 5 | PACS | // Reads from seeded PACS mirror tables in TerraFusionDbContext (SQLite). |
| `backend/src/TerraFusion.API/Services/PacsEfAdapter.cs` | 16 | Pacs | using TerraFusion.Core.Entities.Pacs; |
| `backend/src/TerraFusion.API/Services/PacsEfAdapter.cs` | 17 | PACS | using TerraFusion.Core.PACS; |
| `backend/src/TerraFusion.API/Services/PacsEfAdapter.cs` | 24 | PACS | /// Reads seeded PACS data from SQLite via TerraFusionDbContext. |
| `backend/src/TerraFusion.API/Services/PACSEnhancementExtensions.cs` | 3 | PACS | using TerraFusion.API.Models.PACS; |
| `backend/src/TerraFusion.API/Services/PACSEnhancementExtensions.cs` | 15 | pacs | ConnectionId = $"pacs-{countyCode.ToLowerInvariant()}", |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 7 | PACS | using TerraFusion.Core.PACS; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 15 | PACS | /// Canonical PACS-to-TerraFusion importer. |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 91 | PACS | result.Message = "PACS contract validation failed. Sync aborted."; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 175 | PACS | "Skipping PACS property pass for county {County}; requested data types: {DataTypes}", |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 198 | PACS | result.Message = "Imported Benton PACS operational data into TerraFusion."; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 236 | PACS | _logger.LogError(ex, "PACS import failed for county {County}", countyName); |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 240 | PACS | result.Message = "PACS import failed."; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 332 | PACS | var normalizedGeoId = Normalize(source.GeoId) ?? $"PACS-{source.PropId.ToString(CultureInfo.InvariantCulture)}"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 488 | PACS | .Where(property => property.CountyId == countyId && property.PropertyId.StartsWith("PACS-")) |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 710 | PACS | $"Imported from PACS prop_id {source.PropId.ToString(CultureInfo.InvariantCulture)}", |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 772 | PACS | : $"PACS {Normalize(source.GeoId) ?? source.PropId.ToString(CultureInfo.InvariantCulture)}"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 795 | PACS | "PACS comparable sales page {Page}: {ItemCount} items, totalCount={TotalCount}, hasMore={HasMore}", |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 816 | PACS | "PACS comparable sales import complete: rowsSeen={RowsSeen}, salesAdded={SalesAdded}, salesUpdated={SalesUpdated}, salesSkipped={SalesSkipped}", |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 886 | PACS | var normalizedParcelId = Normalize(sourceSale.GeoId) ?? $"PACS-{sourceSale.PropId.ToString(CultureInfo.InvariantCulture)}"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 995 | PACS | var normalizedParcelId = Normalize(sourceRow.GeoId) ?? $"PACS-{sourceRow.PropId.ToString(CultureInfo.InvariantCulture)}"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1156 | PACS | return $"PACS-{property.PropId}"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1185 | PACS | // Raw PACS qualifier codes (SaleQualifier, CountyRatioCd, etc.) are not available |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1187 | PACS | // from the PACS mirror tables. Sales synced via this path will have null Raw* codes; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1231 | PACS | ApplyString(target.Region, NormalizeText(source.Region ?? source.Neighborhood, 30) ?? "PACS", value => target.Region = value, ref changed); |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1281 | PACS | var region = NormalizeText(source.Region, 100) ?? "PACS"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1283 | PACS | var buildingTypeDescription = NormalizeText(source.BuildingTypeDescription ?? source.MatrixDescription, 100) ?? "PACS improvement matrix"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1284 | PACS | var matrixType = NormalizeText(source.MatrixType, 50) ?? "PACS"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1340 | PACS | return $"PACS sale/deed import ({deedType})"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1414 | PACS | return $"PACS {Normalize(sale.GeoId) ?? sale.PropId.ToString(CultureInfo.InvariantCulture)}"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1476 | PACS | property.Address = $"PACS {normalizedParcelNumber}"; |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 3 | PACS | * TERRAFUSION OS - PRODUCTION PACS DATA INTEGRATION ENGINE |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 27 | PACS | /// Production PACS Data Integration Engine |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 28 | Harris | /// Integrates with real Benton County Harris PACS production database structures |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 45 | PACS | /// Production PACS Data Integration Engine |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 57 | PACS | // Production Database Connections (Based on Real PACS Architecture) |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 118 | PACS | /// Initialize complete production integration with real Benton County PACS systems |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 123 | PACS | _logger.LogInformation("🏛️ Initializing Production PACS Integration with Real Benton County Systems"); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 138 | PACS | // Validate production schemas against real PACS structures |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 159 | PACS | Message = $"Production PACS integration completed: {successfulIntegrations}/{integrationResults.Count} databases integrated", |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 174 | PACS | _logger.LogError(ex, "❌ Critical error during production PACS integration"); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 200 | SqlConnection | using var connection = new SqlConnection(connectionString); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 321 | SqlConnection | using var connection = new SqlConnection(connectionString); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 446 | PACS | _logger.LogInformation("🤖 Preparing AI training datasets from production PACS data"); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 631 | PACS | /// Validate production schemas against real PACS database structures |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 635 | PACS | _logger.LogInformation("🔍 Validating production schemas against real PACS structures"); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 674 | PACS | /// Optimize production queries using real PACS performance patterns |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 678 | PACS | _logger.LogInformation("⚡ Optimizing production queries using real PACS performance patterns"); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 907 | PACS | _logger.LogInformation("🤖 Initializing 1,008 AI agents with production PACS data patterns"); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 959 | PACS | Purpose = "Train AI agents on property valuation patterns from real PACS data", |
| `backend/src/TerraFusion.API/Services/SaleQualificationService.cs` | 4 | Pacs | using TerraFusion.Core.Entities.Pacs; |
| `backend/src/TerraFusion.API/Services/SaleQualificationService.cs` | 20 | PACS | ///   Layer 1 — PACS SaleQualifier (sl_qualifier) |
| `backend/src/TerraFusion.API/Services/SaleQualificationService.cs` | 21 | Harris | ///     Harris standard codes set at sale entry time. |
| `backend/src/TerraFusion.API/Services/SaleQualificationService.cs` | 131 | PACS | // ── Layer 1: PACS SaleQualifier (sl_qualifier) ──────────────────────── |
| `backend/src/TerraFusion.API/Services/SaleQualificationService.cs` | 161 | PACS | // Hardcoded Benton fallback — confirmed from live PACS query 2026-04-04. |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 15 | Harris | /// providing seamless access to specialized government modules through both Harris PACS |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 21 | Harris | /// - Seamless Harris PACS bridge integration |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 45 | Harris | // Harris PACS Bridge Integration |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 79 | Harris | /// Harris PACS bridge integration, and performance monitoring systems. |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 100 | Harris | // Phase 3: Initialize Harris PACS Bridge Integration |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 288 | HARRIS | /// HARRIS PACS INTEGRATION: Initialize Harris PACS Bridge Integration |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 291 | Harris | /// Harris PACS enhancement bridge for unified functionality. |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 297 | Harris | _logger.LogInformation("🔗 Initializing Harris PACS Bridge Integration"); |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 301 | Harris | // Create bridge integration for each Harris PACS compatible module |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 319 | Harris | _logger.LogInformation("✅ Harris PACS Bridge Integration Setup: {ModuleId}", module.ModuleId); |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 326 | Harris | _logger.LogError(ex, "❌ Failed to initialize Harris PACS Bridge Integration"); |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 335 | Harris | /// Harris PACS bridge mode and pure TerraFusion deployment. |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 364 | Harris | // Phase 3: Setup Harris PACS Bridge (if needed) |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 431 | Harris | /// Harris PACS compatibility, and requirements. |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncIntegrationService.cs` | 251 | PACS | "Skipping Benton sync for {County} because this host is running in operational-snapshot mode without PACS connectivity.", |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncIntegrationService.cs` | 260 | PACS | Message = "This host is running in Benton operational-snapshot mode. PACS sync is not available here.", |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncIntegrationService.cs` | 263 | PACS | "PACS sync is disabled on this host. Use the canonical local PACS-connected runtime for sync operations." |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncRuntimeState.cs` | 9 | PACS | /// runtime readiness when canonical PACS configuration is actually present. |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncRuntimeState.cs` | 320 | PACS | ?? configuration["PACS:ConnectionString"]; |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncRuntimeState.cs` | 322 | PACS | ?? configuration["PACS:SalesConnectionString"]; |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncRuntimeState.cs` | 331 | PACS | _logger.LogInformation("TerraFusionSync runtime started without canonical PACS configuration; no default Benton systems/counties registered."); |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncRuntimeState.cs` | 340 | Harris | SystemName = "Harris PACS Canonical Boundary", |
| `backend/src/TerraFusion.API/Services/UnifiedOrchestrationService.cs` | 327 | PACS | "⚠️ PACS runtime not configured. Host is running in Benton operational-snapshot mode; legacy integration startup is intentionally skipped."); |
| `backend/src/TerraFusion.API/Services/UnifiedOrchestrationService.cs` | 479 | PACS | _logger.LogInformation("⏭️ Legacy integration start skipped; PACS runtime is not configured on this host."); |
| `backend/src/TerraFusion.API/Services/UnifiedOrchestrationService.cs` | 492 | PACS | _logger.LogInformation("⏭️ Legacy integration stop skipped; PACS runtime is not configured on this host."); |
| `backend/src/TerraFusion.API/Services/UnifiedOrchestrationService.cs` | 504 | PACS | !string.IsNullOrWhiteSpace(_configuration["PACS:ConnectionString"]); |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 10 | Pacs | // BOUNDARY REPAIR COMPLETE (CP-3b): All Pacs* reads removed per PACS Sync mandate. |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 16 | Pacs | /// Reads canonical TerraFusion entities only. No direct Pacs* mirror reads. |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 82 | PACS | // The improvement-level DepPct=100 in PACS is a "formula-driven" flag, not the applied rate. |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 83 | PACS | // ImprvVal in PACS IS the RCNLD (depreciation already applied). Back-calculate RCN: |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 206 | PACS | // Qualification priority: Layer 3 (assessor decision) → Layer 2 (TF recommendation) → Layer 1b (PACS legacy sync field). |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 295 | PACS | // PACS is the legacy system being replaced — TF never trusts PACS calculations. |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 304 | PACS | // Ratio = AssessedValue / SalePrice — IAAO standard; TF-computed, not PACS-sourced. |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 353 | PACS | // Use PACS adjusted_sl_price when available — this is the price used for ratio study calculations. |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 354 | PACS | // Fall back to raw SalePrice only when the adjusted price hasn't been synced from PACS yet. |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 370 | PACS | // TF-computed ratio: AssessedValue / SalePrice. Never uses PACS sl_ratio. |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 382 | PACS | // Qualification-relevant sale flags (imported from ingested data; not PACS calculations) |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 588 | PACS | /// PACS year-layer model (SupNum, PropState, program enrollment, exemptions, etc.). |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 738 | PACS | ///   Quality class (20%)  — PACS imprv_det_class_cd (ECONOMY…EXCELLENT); ordinal distance |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 741 | PACS | ///   Improvement Type (10%)  — PACS imprv_type_cd: R1=SFR, R2=Mobile/MFH, A1=Apt, etc. |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 766 | PACS | // PACS quality tier ordinal map — imprv_det_class_cd normalized values. |
| `backend/src/TerraFusion.API/Services/ValuationService.cs` | 818 | PACS | // Improvement type: binary match on PACS imprv_type_cd (R1=SFR, R2=Mobile/MFH, etc.) |
| `backend/src/TerraFusion.API/Services/WorkflowTransitionGuide.cs` | 14 | Harris | /// from Harris PACS to TerraFusion OS with user training, change management, and |
| `backend/src/TerraFusion.API/Services/WorkflowTransitionGuide.cs` | 70 | Harris | // Phase 1: Analyze existing Harris PACS workflows |
| `backend/src/TerraFusion.API/Services/WorkflowTransitionGuide.cs` | 321 | Harris | /// Harris PACS workflows to TerraFusion equivalents. |
| `backend/src/TerraFusion.API/Services/WorkflowTransitionGuide.cs` | 378 | Harris | // This would analyze Harris PACS workflows |
| `frontend/apps/os-shell/src/applications/terra-levy/ReferenceComplianceTab.tsx` | 284 | PACS | <SectionCard title="F9 · Tax Code Areas (PACS mirror)" rcw={tcas.rcwReference}> |
| `frontend/apps/os-shell/src/applications/terra-levy/ReferenceComplianceTab.tsx` | 324 | PACS | <em>No TCAs in mirror; PACS sync has not populated the table.</em> |
| `frontend/apps/os-shell/src/components/AISuperiorityDashboard.tsx` | 99 | harris | const LEGACY_RESPONSE_PREFIX = 'harris' + 'PA' + 'CS'; |
| `frontend/apps/os-shell/src/components/dashboard/MorningBriefingStrip.tsx` | 13 | pacs | * the legacy `pacs` name (callers and contract tests written before the |
| `frontend/apps/os-shell/src/components/dashboard/MorningBriefingStrip.tsx` | 21 | pacs | pacs?:             FreshData<AssessmentSourceHealth> |
| `frontend/apps/os-shell/src/components/dashboard/MorningBriefingStrip.tsx` | 26 | pacs | export function MorningBriefingStrip({ swarm, assessmentSource, pacs, appeals, workload }: MorningBriefingStripProps) { |
| `frontend/apps/os-shell/src/components/dashboard/MorningBriefingStrip.tsx` | 27 | pacs | const sourceFeed = assessmentSource ?? pacs |
| `frontend/apps/os-shell/src/components/dashboard/MorningBriefingStrip.tsx` | 29 | pacs | throw new Error('MorningBriefingStrip requires either `assessmentSource` or `pacs` prop.') |
| `frontend/apps/os-shell/src/components/marketplace/TerraFusionMarketplace.tsx` | 38 | Harris | Ratings, AI-agent counts, Harris bridge health, and performance claims stay hidden until |
| `frontend/apps/os-shell/src/config/generatedModules.ts` | 546 | pacs | "id": "pacs-bridge", |
| `frontend/apps/os-shell/src/config/generatedModules.ts` | 563 | pacs | "pacs", |
| `frontend/apps/os-shell/src/config/moduleComponents.tsx` | 68 | pacs | pacs: 'pacs-bridge', |
| `frontend/apps/os-shell/src/config/moduleComponents.tsx` | 69 | pacs | 'assessment-data-bridge': 'pacs-bridge', |
| `frontend/apps/os-shell/src/config/moduleComponents.tsx` | 186 | pacs | 'pacs-bridge', |
| `frontend/apps/os-shell/src/config/moduleComponents.tsx` | 901 | pacs | case 'pacs-bridge': |
| `frontend/apps/os-shell/src/config/moduleComponents.tsx` | 906 | pacs | moduleId="pacs-bridge" |
| `frontend/apps/os-shell/src/data/dev-snapshots/SnapshotDataProvider.ts` | 5 | PACS | * These are real PACS-sourced records extracted from terrafusion-dev.db, |
| `frontend/apps/os-shell/src/data/dev-snapshots/SnapshotDataProvider.ts` | 123 | PACS | /** Map PACS property type code to domain PropertyType */ |
| `frontend/apps/os-shell/src/data/dev-snapshots/SnapshotDataProvider.ts` | 639 | pacs | source: 'pacs-sync', |
| `frontend/apps/os-shell/src/data/dev-snapshots/SnapshotDataProvider.ts` | 734 | PACS | // Snapshot mode: return only values derived from real PACS data |
| `frontend/apps/os-shell/src/data/fixtures/FixtureDataProvider.ts` | 13 | PACS | *   fixture:sync-stale           — parcel whose PACS sync timestamp is >90 days old |
| `frontend/apps/os-shell/src/data/fixtures/FixtureDataProvider.ts` | 139 | PACS | legalDescription: 'FIXTURE - PACS sync >90 days old', |
| `frontend/apps/os-shell/src/data/fixtures/FixtureDataProvider.ts` | 426 | pacs | source: 'pacs-sync', |
| `frontend/apps/os-shell/src/orchestration/moduleActivation.ts` | 140 | pacs | 'pacs-bridge': 'Assessment DataBridge', |
| `frontend/apps/os-shell/src/orchestration/moduleActivation.ts` | 217 | pacs | 'pacs-bridge': '🔗', |
| `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx` | 332 | pacs | const pacs = usePacsStatus(); |
| `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx` | 488 | pacs | <MorningBriefingStrip swarm={swarm} pacs={pacs} appeals={appeals} workload={workload} /> |
| `frontend/apps/os-shell/src/pages/suites/modules/ValueAuditModule.tsx` | 9 | Harris | * Source: Harris PACS change_of_value_report + TerraTrace audit spine |
| `frontend/apps/os-shell/src/pages/workbench/sync-corpus/CorpusStartModal.tsx` | 93 | PACS | sales → geometry) against the full Benton County PACS corpus. |
| `frontend/apps/os-shell/src/pages/workbench/sync-corpus/CorpusStartModal.tsx` | 158 | pacs | <li className='tf-text-secondary' data-testid='preflight-pacs'> |
| `frontend/apps/os-shell/src/pages/workbench/sync-corpus/CorpusStartModal.tsx` | 159 | PACS | PACS reachable (will be verified at start) |
| `frontend/apps/os-shell/src/pages/workbench/sync-corpus/ReconciliationPanel.tsx` | 33 | PACS | Reconciliation (PACS source vs TerraFusion canonical) |
| `frontend/apps/os-shell/src/pages/workbench/sync-corpus/ReconciliationPanel.tsx` | 57 | PACS | <th style={{ textAlign: 'right', padding: '6px 8px' }}>PACS</th> |
| `frontend/apps/os-shell/src/pages/workbench/sync-doctrine/useDoctrineState.ts` | 9 | PACS | *   - The data is canonical pipeline output, not a live PACS probe |
| `frontend/apps/os-shell/src/pages/workbench/sync-readiness/ScopeSelectorForm.tsx` | 62 | PACS | PACS source connection id |
| `frontend/apps/os-shell/src/pages/workbench/tabs/forge/CostApproach.tsx` | 231 | PACS | {/* Physical attributes from PACS improvement attributes */} |
| `frontend/apps/os-shell/src/pages/workbench/tabs/forge/ForgeYearContextPanel.tsx` | 5 | PACS | * PropertyForge. Shows the selected year's PACS layer attributes: |
| `frontend/apps/os-shell/src/pages/workbench/tabs/forge/ForgeYearSelector.tsx` | 4 | PACS | * PACS-aware year selector for the Forge workbench. |
| `frontend/apps/os-shell/src/pages/workbench/tabs/forge/ForgeYearSelector.tsx` | 8 | PACS | * layers that exist for this parcel in PACS. |
| `frontend/apps/os-shell/src/pages/workbench/tabs/forge/ForgeYearSelector.tsx` | 123 | PACS | /* Happy path — render PACS-sourced layer list */ |
| `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx` | 92 | PACS | /* PACS year layers for this parcel */ |
| `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx` | 120 | PACS | {/* PACS Year Selector */} |
| `frontend/apps/os-shell/src/plugins/gis-core/index.js` | 100 | Harris | children: 'Production: Leaflet/Cesium integration with Harris PACS overlay', |
| `frontend/apps/os-shell/src/plugins/harris-pacs/index.js` | 15 | harris | const result = await pluginApi.invoke('harris.importStatus'); |
| `frontend/apps/os-shell/src/plugins/harris-pacs/index.js` | 18 | Harris | console.error('Failed to load Harris PACS status:', error); |
| `frontend/apps/os-shell/src/plugins/harris-pacs/index.js` | 26 | harris | const result = await pluginApi.invoke('harris.startImport'); |
| `frontend/apps/os-shell/src/plugins/harris-pacs/index.js` | 33 | harris | pluginApi.emit('harris.importStarted', result); |
| `frontend/apps/os-shell/src/plugins/harris-pacs/index.js` | 44 | Harris | children: 'Loading Harris PACS migration status...', |
| `frontend/apps/os-shell/src/plugins/harris-pacs/index.js` | 54 | Harris | _jsx('h2', { children: 'Harris PACS 9.0 Migration' }), |
| `frontend/apps/os-shell/src/plugins/harris-pacs/index.js` | 146 | PACS | 'PACS Parcel ID \u2192 ', |
| `frontend/apps/os-shell/src/plugins/harris-pacs/index.js` | 155 | PACS | 'PACS Owner Rec \u2192 ', |
| `frontend/apps/os-shell/src/plugins/harris-pacs/index.js` | 187 | PACS | children: importRunning ? 'Starting Import...' : 'Start PACS Import', |
| `frontend/apps/os-shell/src/plugins/harris-pacs/index.tsx` | 50 | harris | const result = await context.os.invoke('harris.importStatus'); |
| `frontend/apps/os-shell/src/plugins/harris-pacs/index.tsx` | 53 | Harris | console.error('Failed to load Harris PACS status:', error); |
| `frontend/apps/os-shell/src/plugins/harris-pacs/index.tsx` | 62 | harris | const _result = await context.os.invoke('harris.startImport'); |
| `frontend/apps/os-shell/src/plugins/harris-pacs/index.tsx` | 71 | harris | context.os.emit('harris.importStarted', _result); |
| `frontend/apps/os-shell/src/plugins/harris-pacs/manifest.json` | 2 | harris | "name": "harris-pacs", |
| `frontend/apps/os-shell/src/plugins/harris-pacs/manifest.json` | 4 | Harris | "displayName": "Harris PACS Migration", |
| `frontend/apps/os-shell/src/plugins/harris-pacs/manifest.json` | 5 | Harris | "description": "Harris PACS 9.0 legacy system migration and data import tools for Benton County", |
| `frontend/apps/os-shell/src/plugins/harris-pacs/manifest.json` | 9 | harris | "harris.importStatus", |
| `frontend/apps/os-shell/src/plugins/harris-pacs/manifest.json` | 10 | harris | "harris.startImport", |
| `frontend/apps/os-shell/src/plugins/harris-pacs/manifest.json` | 11 | harris | "harris.validateData", |
| `frontend/apps/os-shell/src/plugins/harris-pacs/manifest.json` | 12 | harris | "harris.exportReport" |
| `frontend/apps/os-shell/src/plugins/harris-pacs/manifest.json` | 19 | Harris | "system": "Harris PACS 9.0", |
| `frontend/apps/os-shell/src/plugins/harris-pacs/manifest.json` | 24 | harris | "hash": "sha256:harris-pacs-plugin-v1.0.0-benton-county", |
| `frontend/apps/os-shell/src/plugins/harris-pacs/manifest.json` | 25 | harris | "signature": "HMAC-SHA256:placeholder-signature-for-harris-pacs-plugin" |
| `frontend/apps/os-shell/src/Router.tsx` | 96 | PACS | // for durable 6+ hour PACS drains. Sibling to sync-readiness and |
| `frontend/apps/os-shell/src/routes/DocumentationRoutes.tsx` | 36 | pacs | { title: 'Assessment Data Integration', summary: 'County data sync protocol and field mapping.', route: '/docs/api#pacs' }, |
| `frontend/apps/os-shell/src/services/QuantumModuleManager.ts` | 181 | harris | await this.registerPluginModule(['harris', ['pa', 'cs'].join('')].join('-'), { |
| `frontend/apps/os-shell/src/types/domain.ts` | 49 | PACS | lotWidthFront?: number;       // Lot frontage width in feet (PACS land_detail) |
| `frontend/apps/os-shell/src/types/domain.ts` | 50 | PACS | lotDepth?: number;            // Lot depth in feet (PACS land_detail) |

## Required Fixes

- Public access posture is not explicit and usable for launch-control evidence.
- Product-load lineage is not proven by the TerraFusion DB ledger.
- Active product runtime still contains PACS/Harris/source-system references outside the allowed sync/admin/proof lanes.

## Interpretation

June 10 launch gate is red. Production approval must not rely on stale evidence, unproven lineage, unsuppressed Rust claims, or active runtime legacy leaks.

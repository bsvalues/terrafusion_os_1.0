# June 10 Launch Gate

Generated: 2026-05-20T17:32:20.481Z

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
- Active runtime legacy leaks: 211
- Raw runtime legacy references: 1926
- Blockers: 3
- Warnings: 1

## Blockers

- **public_access_posture**: Public access posture is not explicit and usable for launch-control evidence. (1 blocker(s))
- **product_load_ledger**: Product-load lineage is not proven by the TerraFusion DB ledger. (6 lineage-proven table(s), 1 blocker(s))
- **legacy_runtime_boundary**: Active product runtime still contains PACS/Harris/source-system references outside the allowed sync/admin/proof lanes. (211 leak(s))

## Warnings

- **rust_runtime**: Rust integration seams exist but launch claims are suppressed because live runtime execution is not proven.

## Active Runtime Legacy Leaks

| File | Line | Term | Evidence |
|---|---:|---|---|
| `backend/src/TerraFusion.API/Program.cs` | 31 | PACS | using TerraFusion.Core.PACS; |
| `backend/src/TerraFusion.API/Program.cs` | 850 | PACS | svc.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.Core.PACS.PacsSqlAdapter>(); |
| `backend/src/TerraFusion.API/Program.cs` | 903 | pacs | if (args.Contains("--seed-pacs")) |
| `backend/src/TerraFusion.API/Program.cs` | 1300 | harris | ?? "harris-pacs-prod"; |
| `backend/src/TerraFusion.API/Program.cs` | 1615 | PACS | builder.Services.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.API.Services.PacsEfAdapter>(); |
| `backend/src/TerraFusion.API/Program.cs` | 2453 | pacs | .AddPacsReadiness("ready", "pacs") |
| `backend/src/TerraFusion.API/Program.cs` | 2923 | pacs | app.MapPost("/api/admin/pacs/seed", ( |
| `backend/src/TerraFusion.API/Program.cs` | 2928 | PACS | return Results.Conflict("PACS seed already running. Check /api/admin/pacs/seed/status."); |
| `backend/src/TerraFusion.API/Program.cs` | 2953 | pacs | return Results.Accepted("/api/admin/pacs/seed/status", |
| `backend/src/TerraFusion.API/Program.cs` | 2954 | PACS | new { message = "PACS seed started in background. Poll /api/admin/pacs/seed/status." }); |
| `backend/src/TerraFusion.API/Program.cs` | 2957 | pacs | app.MapGet("/api/admin/pacs/seed/status", () => |
| `backend/src/TerraFusion.API/Program.cs` | 2967 | pacs | app.MapPost("/api/admin/pacs/canonicalize", ( |
| `backend/src/TerraFusion.API/Program.cs` | 2995 | pacs | return Results.Accepted("/api/admin/pacs/canonicalize/status", |
| `backend/src/TerraFusion.API/Program.cs` | 2996 | pacs | new { message = "Canonicalization started. Poll /api/admin/pacs/canonicalize/status." }); |
| `backend/src/TerraFusion.API/Program.cs` | 2999 | pacs | app.MapGet("/api/admin/pacs/canonicalize/status", () => |
| `backend/src/TerraFusion.API/Program.cs` | 3013 | pacs | app.MapPost("/api/admin/pacs/seed-sales", ( |
| `backend/src/TerraFusion.API/Program.cs` | 3018 | pacs | return Results.Conflict("Sales seed already running. Check /api/admin/pacs/seed-sales/status."); |
| `backend/src/TerraFusion.API/Program.cs` | 3042 | pacs | return Results.Accepted("/api/admin/pacs/seed-sales/status", |
| `backend/src/TerraFusion.API/Program.cs` | 3043 | pacs | new { message = "Sales-only seed started. Poll /api/admin/pacs/seed-sales/status." }); |
| `backend/src/TerraFusion.API/Program.cs` | 3046 | pacs | app.MapGet("/api/admin/pacs/seed-sales/status", () => |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 171 | pacs_oltp | hint  = "Set TF_DEV_PACS_PASSWORD env var and ensure pacs_oltp is reachable on localhost,1433.", |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 271 | pacs | [HttpGet("sync-pop-2/pacs-table-columns")] |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 290 | SqlConnection | await using var conn = new Microsoft.Data.SqlClient.SqlConnection(pacsCs); |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 611 | PACS | : "INCONCLUSIVE: legacy_pacs_raw.property = 0. Source returned no rows; check PACS connection and dbo.property contents.", |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2302 | pacs | .Where(b => b.SourceSystem == "truth-pacs-imprv-promoter" && b.Status == "COMPLETED") |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2363 | PACS | : "INCONCLUSIVE: PACS dbo.attribute returned no rows. Investigate.", |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2734 | pacs | .Where(b => b.SourceSystem == "truth-pacs-imprv-promoter" && b.Status == "COMPLETED") |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 2799 | PACS | : "INCONCLUSIVE: 0 rows from PACS. Investigate."), |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 3029 | pacs | [HttpGet("pacs-counts")] |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 3061 | SqlConnection | await using var conn = new Microsoft.Data.SqlClient.SqlConnection(pacsCs); |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 3090 | pacs_oltp | note = "All counts are SELECT COUNT(*) at the time of this call against live pacs_oltp. -1 sentinel indicates per-query failure (see errors block).", |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 3149 | PACS | PropId = 9_000_000 + i,                    // out of real PACS range |
| `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs` | 3150 | PACS | OwnerId = 9_000_000_000L + i,              // out of real PACS range |
| `backend/src/TerraFusion.API/Controllers/CognitiveFrameworkMonitoringController.cs` | 219 | Harris | TaskTitle = "Deploy Harris PACS Integration", |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 2643 | Harris | source = "Harris PACS CMS + IAAO Standard on Mass Appraisal / Benton County FY 2025", |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 2658 | PACS | method = "Slope-Intercept (PACS land_sched_si_detail)", |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 3339 | PACS | new { name = "revalArea", type = "string", required = false, description = "Reval Area (PACS Cycle 1-6) for local cost multiplier" }, |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 4755 | PACS | explanation = "Published Benton County cost rate for this building type and Reval Area (PACS Cycle)" }, |
| `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | 7003 | PACS | description = "Improvement value is negative — invalid; check PACS source.", |
| `backend/src/TerraFusion.API/Controllers/CostForgeTestController.cs` | 119 | Harris | _logger.LogInformation("CostForge test Harris PACS sync endpoint called: {CountyId}", request.CountyId); |
| `backend/src/TerraFusion.API/Controllers/CountyDeploymentController.cs` | 164 | Harris | modules = new[] { "GIS Core", "Property Assessment", "Tax Levy Management", "Advanced Analytics", "Compliance Automation", "AI Swarm", "Quantum Optimization", "Harris PACS Integration" }, |
| `backend/src/TerraFusion.API/Controllers/DataImportController.cs` | 48 | PACS | return Ok(new { fileId = Guid.NewGuid(), status = "pending", message = "PACS sync wiring is Post-R1; file queued for future processing." }); |
| `backend/src/TerraFusion.API/Controllers/DataImportController.cs` | 62 | PACS | return Ok(new { status = "queued", message = "PACS sync wiring is Post-R1; import queued." }); |
| `backend/src/TerraFusion.API/Controllers/EliteDashboardController.cs` | 411 | Harris | recommendations.Add("🔗 Expand Harris PACS integration to more counties"); |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 184 | pacs | [HttpGet("production-pacs/performance")] |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 189 | PACS | _logger.LogInformation("🏛️ API: Getting production PACS performance metrics"); |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 195 | PACS | _logger.LogInformation("✅ Production PACS metrics retrieved: {Records} records processed, {QueryTime:F2}ms avg query time, {IntegrityScore:F2} integrity score", |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 202 | PACS | _logger.LogError(ex, "❌ Error getting production PACS performance metrics"); |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 205 | PACS | Error = "Production PACS performance error", |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 524 | PACS | ["Production PACS"] = "Healthy", |
| `backend/src/TerraFusion.API/Controllers/ElitePerformanceMonitoringController.cs` | 532 | PACS | ["Production PACS"] = "green", |
| `backend/src/TerraFusion.API/Controllers/GovernmentController.cs` | 113 | Harris | system = "Harris PACS", |
| `backend/src/TerraFusion.API/Controllers/GovernmentController.cs` | 165 | Harris | name = "Harris PACS", |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 6 | PACS | using TerraFusion.API.Models.PACS; |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 58 | Harris | _logger.LogInformation("🚀 Initializing Harris PACS Enhancement Bridge - County: {CountyCode}", request.CountyCode); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 82 | Harris | _logger.LogInformation("✅ Harris PACS Enhancement Bridge Initialized Successfully - Session: {SessionId}", result.SessionId); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 87 | Harris | _logger.LogError("❌ Failed to initialize Harris PACS Enhancement Bridge - County: {CountyCode}, Error: {Error}", |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 94 | Harris | _logger.LogError(ex, "❌ Exception during Harris PACS Enhancement Bridge initialization - County: {CountyCode}", request.CountyCode); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 237 | Harris | _logger.LogInformation("📊 Generating Harris PACS vs TerraFusion Comparison Report - Session: {SessionId}", sessionId); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSEnhancementController.cs` | 388 | PACS | public Models.PACS.ConsciousnessLevel ConsciousnessLevel { get; set; } = Models.PACS.ConsciousnessLevel.Enhanced; |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 4 | PACS | using TerraFusion.Core.PACS; |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 59 | PACS | _logger.LogDebug("No county claims found for PACS request; falling back to Benton County in Development"); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 84 | PACS | "PACS jurisdiction mismatch: user county {CountyName} (FIPS {FipsCode}) does not match requested jurisdiction {Jurisdiction}", |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 104 | PACS | error = "PACS jurisdictions not available", |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 105 | PACS | details = "pacscontract.v1 does not expose jurisdictions. Use PACS adapter endpoints." |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 110 | Harris | _logger.LogError(ex, "Error retrieving Harris PACS jurisdictions"); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 375 | Harris | _logger.LogError(ex, "Error retrieving Harris PACS system status"); |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 407 | Harris | message = "Harris PACS system is offline" |
| `backend/src/TerraFusion.API/Controllers/HarrisPACSIntegrationController.cs` | 413 | Harris | _logger.LogError(ex, "Harris PACS health check failed"); |
| `backend/src/TerraFusion.API/Controllers/LevyReferenceController.cs` | 272 | PACS | Source: "PACS dbo.tax_area (mirrored via PacsTaxArea entity)", |
| `backend/src/TerraFusion.API/Controllers/MultiCountyIntegrationController.cs` | 137 | Harris | reason = "Harris PACS integration not configured for this county" |
| `backend/src/TerraFusion.API/Controllers/MultiCountyIntegrationController.cs` | 422 | Harris | "Configure Harris PACS integration if needed", |
| `backend/src/TerraFusion.API/Controllers/MultiCountyIntegrationController.cs` | 578 | Harris | recommendations.Add("Consider enabling Harris PACS integration"); |
| `backend/src/TerraFusion.API/Controllers/MultiCountyIntegrationController.cs` | 615 | Harris | recommendations.Add("Expand Harris PACS integration to more counties"); |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 19 | PACS | using TerraFusion.Core.PACS; |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 29 | pacs | [Route("api/pacs")] |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 73 | PACS | _logger.LogWarning("PACS adapter not available: {Message}", ex.Message); |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 77 | PACS | Message = "PACS SQL Server not configured. Set ConnectionStrings:PacsConnection." |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 150 | PACS | _logger.LogWarning("PACS properties query timed out after 10s — SQL Server not reachable"); |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 154 | PACS | Message = "PACS query timed out. SQL Server not provisioned or unreachable.", |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 159 | PACS | _logger.LogWarning("PACS contract violation: {Code} {Message}", ex.ErrorCode, ex.Message); |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 168 | PACS | _logger.LogError(ex, "Unexpected error reading PACS properties"); |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 172 | PACS | Message = "PACS query failed. See server logs.", |
| `backend/src/TerraFusion.API/Controllers/PacsController.cs` | 214 | PACS | return StatusCode(503, new { status = "timeout", detail = "PACS health probe timed out after 5s" }); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 25 | pacs | [Route("api/production/pacs")] |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 61 | PACS | _logger.LogInformation("🏛️ API: Initializing production PACS integration for Benton County"); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 81 | PACS | _logger.LogError("❌ Production PACS integration failed: {Message}", integrationResult.Message); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 84 | PACS | Error = "Production PACS integration failed", |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 99 | PACS | _logger.LogInformation("✅ Production PACS integration completed successfully: {Records} records processed", |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 106 | PACS | _logger.LogError(ex, "❌ Critical error during production PACS integration"); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 209 | PACS | _logger.LogInformation("🤖 API: Preparing AI training datasets from production PACS data"); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 335 | PACS | _logger.LogInformation("🔍 API: Validating production schemas against real PACS structures"); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 377 | PACS | _logger.LogInformation("⚡ API: Optimizing production queries using real PACS performance patterns"); |
| `backend/src/TerraFusion.API/Controllers/ProductionPACSIntegrationController.cs` | 467 | PACS | SystemName = "TerraFusion OS - Production PACS Integration", |
| `backend/src/TerraFusion.API/Controllers/SystemOrchestrationController.cs` | 200 | Harris | Type = "Harris PACS v12.4.7", |
| `backend/src/TerraFusion.API/Controllers/SystemOrchestrationController.cs` | 321 | Harris | SyncSources = new[] { "Harris PACS", "Tyler", "Aumentum", "Vision" }, |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 627 | PACS | description = g.Key == null ? "No WAC code (PACS seeding gap — data quality issue)" : g.Key, |
| `backend/src/TerraFusion.API/Controllers/TerraForgeController.cs` | 667 | PACS | ? $"{wacNullCount:N0} of {totalSales:N0} sales ({wacNullPct}%) have no WAC code — PACS seeding gap" |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 146 | harris | [HttpGet("activations/{activationId}/harris-bridge")] |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 150 | harris | "activations/{activationId}/harris-bridge", |
| `backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs` | 151 | Harris | "Harris bridge marketplace telemetry", |
| `backend/src/TerraFusion.API/Controllers/WorkbenchSyncReadinessController.cs` | 161 | pacs | Source = "pacs-connection-probe", |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 58 | Harris | _logger.LogInformation($"🎯 Launching AI Supremacy Demonstration {demoId} - TerraFusion vs Harris PACS"); |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 231 | Harris | _logger.LogInformation($"📊 Initializing Harris PACS baseline performance metrics for competitive analysis"); |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 249 | Harris | SystemVersion = "Harris PACS v12.4.7", |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 259 | Harris | _logger.LogInformation($"📈 Harris PACS baseline established: {demo.HarrisPACSResults.ResponseTime.TotalMilliseconds}ms avg response, {demo.HarrisPACSResults.Accuracy:P2} accuracy"); |
| `backend/src/TerraFusion.API/Services/AISuperiorityDemonstrationService.cs` | 267 | Harris | _logger.LogInformation($"⚡ Executing parallel performance test - TerraFusion AI vs Harris PACS"); |
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
| `backend/src/TerraFusion.API/Services/ElitePerformanceMonitoringService.cs` | 394 | PACS | _logger.LogError(ex, "❌ Error getting production PACS performance metrics"); |
| `backend/src/TerraFusion.API/Services/ElitePerformanceOptimizationEngine.cs` | 491 | Harris | _logger.LogDebug("⚡ Cache strategies aggressively optimized for Harris PACS integration"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 5 | Harris | using TerraFusion.API.Models; // Harris PACS Enhancement Models |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 6 | PACS | using PACSModels = TerraFusion.API.Models.PACS; // PACS Integration Models (alias to resolve ambiguity) |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 85 | Harris | _logger.LogInformation("🚀 Initializing Harris PACS Enhancement Bridge for County: {CountyCode}", countyCode); |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 167 | Harris | _logger.LogInformation("✅ Harris PACS Enhancement Bridge Successfully Initialized - Session: {SessionId}, County: {CountyCode}, AI Agents: {AgentCount}", |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 177 | Harris | Message = $"Harris PACS Enhancement Bridge Active - {aiSwarmActivation.ActivatedAgents} AI agents enhancing {countyCode} county operations", |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 183 | Harris | _logger.LogError(ex, "❌ Failed to initialize Harris PACS Enhancement Bridge for County: {CountyCode}", countyCode); |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 345 | Harris | _logger.LogInformation("📊 Generating Harris PACS vs TerraFusion Comparison Report - Session: {SessionId}", sessionId); |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 413 | Harris | _logger.LogInformation("✅ Harris PACS vs TerraFusion Comparison Report Generated - ROI: {ROI}%, Accuracy Improvement: {AccuracyImprovement}%", |
| `backend/src/TerraFusion.API/Services/HarrisPACSEnhancementBridge.cs` | 654 | Harris | Summary = "Executive summary of Harris PACS enhancement analysis", |
| `backend/src/TerraFusion.API/Services/HarrisPacsImportService.cs` | 27 | Harris | _logger.LogInformation("Starting Harris PACS import for county {County} from {FilePath}", countyId, filePath); |
| `backend/src/TerraFusion.API/Services/HarrisPacsImportService.cs` | 32 | Harris | throw new InvalidOperationException($"County {countyId} not authorized for Harris PACS import. Only Benton County supported."); |
| `backend/src/TerraFusion.API/Services/HarrisPacsImportService.cs` | 62 | Harris | _logger.LogInformation("Harris PACS import completed for {County}: {Success}/{Total} records", |
| `backend/src/TerraFusion.API/Services/HarrisPacsImportService.cs` | 72 | Harris | _logger.LogError(ex, "Harris PACS import failed for county {County}", countyId); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 210 | Harris | _logger.LogInformation("🏛️ Initializing Benton County Harris PACS Integration with Real Production Schemas"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 287 | SqlConnection | using var connection = new SqlConnection(_ciapsConnectionString); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 350 | SqlConnection | using var connection = new SqlConnection(_ciapsConnectionString); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 403 | Harris | _logger.LogInformation("🔄 Synchronizing with production Harris PACS"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 430 | PACS | Message = $"PACS synchronization completed: {successfulSyncs}/{syncOperations.Count} operations successful", |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 440 | PACS | _logger.LogError(ex, "❌ Error during PACS synchronization"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 444 | PACS | Message = $"PACS synchronization error: {ex.Message}", |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 678 | PACS | _logger.LogError(ex, "❌ Error gathering PACS integration metrics"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 692 | SqlConnection | using var connection = new SqlConnection(_ciapsConnectionString); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 727 | PACS | _logger.LogInformation("⏰ Executing scheduled PACS synchronization"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 732 | PACS | _logger.LogWarning("⚠️ Scheduled PACS sync completed with issues: {Message}", result.Message); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 737 | PACS | _logger.LogError(ex, "❌ Error during scheduled PACS synchronization"); |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 762 | SqlConnection | private async Task<CIAPSProperty?> QueryCIAPSPropertyDataAsync(SqlConnection connection, string parcelId) |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 774 | SqlConnection | private async Task<BuildingPermit?> QueryBuildingPermitDataAsync(SqlConnection connection, string parcelId) |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 981 | SqlConnection | private async Task<object> ValidateCIAPSSchemaAsync(SqlConnection connection) |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 1314 | SqlConnection | private async Task<SchemaValidationResult> ValidateCIAPSSchemaAsync(SqlConnection connection) |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 1371 | PACS | Message = "Data extracted from production PACS", |
| `backend/src/TerraFusion.API/Services/HarrisPACSProductionService.cs` | 1480 | SqlConnection | private async Task<SchemaValidationResult> ValidateCIAPSSchemaAsync(SqlConnection connection) |
| `backend/src/TerraFusion.API/Services/IHarrisPACSIntegrationService.cs` | 1 | PACS | using TerraFusion.API.Models.PACS; |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 324 | Harris | _logger.LogInformation("Starting Harris PACS synchronization for {CountyCode}", countyCode); |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 336 | Harris | result.ErrorMessage = "Harris PACS integration not enabled for this county"; |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 357 | Harris | $"Harris PACS sync for {countyCode}: {result.RecordsSynced} records processed", true); |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 363 | Harris | _logger.LogError(ex, "Harris PACS synchronization failed for {CountyCode}", countyCode); |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 364 | Harris | await _auditLogger.LogAsync("HARRIS_PACS_ERROR", $"Harris PACS sync failed: {ex.Message}", false); |
| `backend/src/TerraFusion.API/Services/MultiCountyIntegrationService.cs` | 501 | pacs | ApiEndpoint = $"https://pacs.{countyCode}.wa.gov/api", |
| `backend/src/TerraFusion.API/Services/PacsEfAdapter.cs` | 16 | Pacs | using TerraFusion.Core.Entities.Pacs; |
| `backend/src/TerraFusion.API/Services/PacsEfAdapter.cs` | 17 | PACS | using TerraFusion.Core.PACS; |
| `backend/src/TerraFusion.API/Services/PACSEnhancementExtensions.cs` | 3 | PACS | using TerraFusion.API.Models.PACS; |
| `backend/src/TerraFusion.API/Services/PACSEnhancementExtensions.cs` | 15 | pacs | ConnectionId = $"pacs-{countyCode.ToLowerInvariant()}", |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 7 | PACS | using TerraFusion.Core.PACS; |
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
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1231 | PACS | ApplyString(target.Region, NormalizeText(source.Region ?? source.Neighborhood, 30) ?? "PACS", value => target.Region = value, ref changed); |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1281 | PACS | var region = NormalizeText(source.Region, 100) ?? "PACS"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1283 | PACS | var buildingTypeDescription = NormalizeText(source.BuildingTypeDescription ?? source.MatrixDescription, 100) ?? "PACS improvement matrix"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1284 | PACS | var matrixType = NormalizeText(source.MatrixType, 50) ?? "PACS"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1340 | PACS | return $"PACS sale/deed import ({deedType})"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1414 | PACS | return $"PACS {Normalize(sale.GeoId) ?? sale.PropId.ToString(CultureInfo.InvariantCulture)}"; |
| `backend/src/TerraFusion.API/Services/PacsToTerraFusionSyncService.cs` | 1476 | PACS | property.Address = $"PACS {normalizedParcelNumber}"; |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 123 | PACS | _logger.LogInformation("🏛️ Initializing Production PACS Integration with Real Benton County Systems"); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 159 | PACS | Message = $"Production PACS integration completed: {successfulIntegrations}/{integrationResults.Count} databases integrated", |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 174 | PACS | _logger.LogError(ex, "❌ Critical error during production PACS integration"); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 200 | SqlConnection | using var connection = new SqlConnection(connectionString); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 321 | SqlConnection | using var connection = new SqlConnection(connectionString); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 446 | PACS | _logger.LogInformation("🤖 Preparing AI training datasets from production PACS data"); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 635 | PACS | _logger.LogInformation("🔍 Validating production schemas against real PACS structures"); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 678 | PACS | _logger.LogInformation("⚡ Optimizing production queries using real PACS performance patterns"); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 907 | PACS | _logger.LogInformation("🤖 Initializing 1,008 AI agents with production PACS data patterns"); |
| `backend/src/TerraFusion.API/Services/ProductionPACSDataEngine.cs` | 959 | PACS | Purpose = "Train AI agents on property valuation patterns from real PACS data", |
| `backend/src/TerraFusion.API/Services/SaleQualificationService.cs` | 4 | Pacs | using TerraFusion.Core.Entities.Pacs; |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 297 | Harris | _logger.LogInformation("🔗 Initializing Harris PACS Bridge Integration"); |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 319 | Harris | _logger.LogInformation("✅ Harris PACS Bridge Integration Setup: {ModuleId}", module.ModuleId); |
| `backend/src/TerraFusion.API/Services/TerraFusionMarketplace.cs` | 326 | Harris | _logger.LogError(ex, "❌ Failed to initialize Harris PACS Bridge Integration"); |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncIntegrationService.cs` | 251 | PACS | "Skipping Benton sync for {County} because this host is running in operational-snapshot mode without PACS connectivity.", |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncIntegrationService.cs` | 260 | PACS | Message = "This host is running in Benton operational-snapshot mode. PACS sync is not available here.", |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncIntegrationService.cs` | 263 | PACS | "PACS sync is disabled on this host. Use the canonical local PACS-connected runtime for sync operations." |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncRuntimeState.cs` | 320 | PACS | ?? configuration["PACS:ConnectionString"]; |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncRuntimeState.cs` | 322 | PACS | ?? configuration["PACS:SalesConnectionString"]; |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncRuntimeState.cs` | 331 | PACS | _logger.LogInformation("TerraFusionSync runtime started without canonical PACS configuration; no default Benton systems/counties registered."); |
| `backend/src/TerraFusion.API/Services/TerraFusionSyncRuntimeState.cs` | 340 | Harris | SystemName = "Harris PACS Canonical Boundary", |
| `backend/src/TerraFusion.API/Services/UnifiedOrchestrationService.cs` | 327 | PACS | "⚠️ PACS runtime not configured. Host is running in Benton operational-snapshot mode; legacy integration startup is intentionally skipped."); |
| `backend/src/TerraFusion.API/Services/UnifiedOrchestrationService.cs` | 479 | PACS | _logger.LogInformation("⏭️ Legacy integration start skipped; PACS runtime is not configured on this host."); |
| `backend/src/TerraFusion.API/Services/UnifiedOrchestrationService.cs` | 492 | PACS | _logger.LogInformation("⏭️ Legacy integration stop skipped; PACS runtime is not configured on this host."); |
| `backend/src/TerraFusion.API/Services/UnifiedOrchestrationService.cs` | 504 | PACS | !string.IsNullOrWhiteSpace(_configuration["PACS:ConnectionString"]); |

## Runtime Legacy Classification

- Raw references: 1926
- Blocking active runtime dependencies: 211

| Category | Count |
|---|---:|
| active_runtime_dependency | 211 |
| ingestion_sync_allowed | 48 |
| proof_or_test_only | 1297 |
| docs_comments_labels | 312 |
| archived_or_quarantined | 0 |
| user_facing_terminology | 58 |

### Category Examples

#### active_runtime_dependency

- `backend/src/TerraFusion.API/Program.cs:31` PACS — using TerraFusion.Core.PACS;
- `backend/src/TerraFusion.API/Program.cs:850` PACS — svc.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.Core.PACS.PacsSqlAdapter>();
- `backend/src/TerraFusion.API/Program.cs:903` pacs — if (args.Contains("--seed-pacs"))
- `backend/src/TerraFusion.API/Program.cs:1300` harris — ?? "harris-pacs-prod";
- `backend/src/TerraFusion.API/Program.cs:1615` PACS — builder.Services.AddScoped<TerraFusion.Core.PACS.IPacsAdapter, TerraFusion.API.Services.PacsEfAdapter>();

#### ingestion_sync_allowed

- `backend/src/TerraFusion.API/Controllers/PacsOpsController.cs:2` PACS — // PACS Ops Controller - /ops/pacs/proof Endpoint
- `backend/src/TerraFusion.API/Controllers/PacsOpsController.cs:4` PACS — // Authoritative PACS contract proof endpoint.
- `backend/src/TerraFusion.API/Controllers/PacsOpsController.cs:5` PACS — // Returns deterministic JSON proving PACS compliance status.
- `backend/src/TerraFusion.API/Controllers/PacsOpsController.cs:19` PACS — using TerraFusion.Core.PACS;
- `backend/src/TerraFusion.API/Controllers/PacsOpsController.cs:24` PACS — /// Operations endpoints for PACS contract proof and diagnostics.

#### proof_or_test_only

- `backend/tests/integration/api/IntegrationTest001.cs:76` Harris — // Arrange - Harris PACS v12.4.7 integration test
- `backend/tests/integration/api/IntegrationTest001.cs:80` harris — var response = await _client.PostAsJsonAsync("/api/integrations/harris-pacs", packetRequest);
- `backend/tests/integration/api/IntegrationTest004.cs:76` Harris — // Arrange - Harris PACS v12.4.7 integration test
- `backend/tests/integration/api/IntegrationTest004.cs:80` harris — var response = await _client.PostAsJsonAsync("/api/integrations/harris-pacs", packetRequest);
- `backend/tests/integration/api/IntegrationTest005.cs:76` Harris — // Arrange - Harris PACS v12.4.7 integration test

#### docs_comments_labels

- `backend/src/TerraFusion.API/Program.cs:137` PACS — // ── Standalone PACS seed mode ──────────────────────────────────────────────
- `backend/src/TerraFusion.API/Program.cs:138` pacs — // Run as: dotnet run --project TerraFusion.API -- --seed-pacs
- `backend/src/TerraFusion.API/Program.cs:180` PACS — // Re-runs only canonical Property upserts from the PACS mirror.
- `backend/src/TerraFusion.API/Program.cs:327` PACS — // ── Levy rebuild from PACS oracle + canonical levy tables ──────────────────
- `backend/src/TerraFusion.API/Program.cs:1221` PACS — // Slice OPS-1-A-2 — PACS reachability probe + Process-backed refresh

#### archived_or_quarantined

- None

#### user_facing_terminology

- `frontend/apps/os-shell/src/applications/terra-levy/ReferenceComplianceTab.tsx:284` PACS — <SectionCard title="F9 · Tax Code Areas (PACS mirror)" rcw={tcas.rcwReference}>
- `frontend/apps/os-shell/src/applications/terra-levy/ReferenceComplianceTab.tsx:324` PACS — <em>No TCAs in mirror; PACS sync has not populated the table.</em>
- `frontend/apps/os-shell/src/components/AISuperiorityDashboard.tsx:99` harris — const LEGACY_RESPONSE_PREFIX = 'harris' + 'PA' + 'CS';
- `frontend/apps/os-shell/src/components/dashboard/MorningBriefingStrip.tsx:21` pacs — pacs?:             FreshData<AssessmentSourceHealth>
- `frontend/apps/os-shell/src/components/dashboard/MorningBriefingStrip.tsx:26` pacs — export function MorningBriefingStrip({ swarm, assessmentSource, pacs, appeals, workload }: MorningBriefingStripProps) {


## Required Fixes

- Public access posture is not explicit and usable for launch-control evidence.
- Product-load lineage is not proven by the TerraFusion DB ledger.
- Active product runtime still contains PACS/Harris/source-system references outside the allowed sync/admin/proof lanes.

## Interpretation

June 10 launch gate is red. Production approval must not rely on stale evidence, unproven lineage, unsuppressed Rust claims, or active runtime legacy leaks.

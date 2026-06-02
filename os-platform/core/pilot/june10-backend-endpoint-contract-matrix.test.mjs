import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyEndpoint,
  composeRoute,
  extractEndpointContractsFromController,
  getDev39ProbePath,
  isSafeDev39GetProbeCandidate,
  summarizeEndpointMatrix
} from "./june10-backend-endpoint-contract-matrix.mjs";

const controllerFixture = `
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Roles = "Administrator")]
[Route("api/[controller]")]
public class SampleController : ControllerBase
{
    [HttpGet("live")]
    public IActionResult Live() => Ok();

    [HttpGet("{id}")]
    public IActionResult ById(Guid id) => Ok();

    [HttpPost("create")]
    [RequirePermission("write:sample")]
    public IActionResult Create([FromBody] object request) => Ok();

    [HttpGet("public")]
    [AllowAnonymous]
    public IActionResult Public() => Ok();
}
`;

test("extractEndpointContractsFromController parses controller routes, HTTP methods, and auth posture", () => {
  const endpoints = extractEndpointContractsFromController({
    filePath: "SampleController.cs",
    text: controllerFixture
  });

  assert.equal(endpoints.length, 4);
  assert.deepEqual(
    endpoints.map((endpoint) => `${endpoint.httpMethod} ${endpoint.route}`),
    ["GET /api/sample/live", "GET /api/sample/{id}", "POST /api/sample/create", "GET /api/sample/public"]
  );
  assert.equal(endpoints[0].authRequirement, "authorized");
  assert.equal(endpoints[0].expectedRoleOrPermission, "Roles=Administrator");
  assert.equal(endpoints[2].expectedRoleOrPermission, "Roles=Administrator; Permission=write:sample");
  assert.equal(endpoints[3].authRequirement, "anonymous");
});

test("composeRoute normalizes controller tokens and duplicate slashes", () => {
  assert.equal(composeRoute("api/[controller]", "db-content", "RuntimeTruthController"), "/api/runtimetruth/db-content");
  assert.equal(composeRoute("/api/runtime/truth", "", "RuntimeTruthController"), "/api/runtime/truth");
});

test("classifyEndpoint keeps inventory conservative before live proof", () => {
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/runtime/truth/db-identity",
      authRequirement: "unknown",
      body: "return Ok(new { status = \"ok\" });"
    }),
    "unknown"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/marketplace/health",
      authRequirement: "anonymous",
      body: "return StatusCode(501, new { message = \"Not implemented\" });"
    }),
    "dead"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/demo",
      authRequirement: "anonymous",
      body: "return Ok(new [] { \"mock\", \"sample\" });"
    }),
    "mock"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/aisuperiority/demo/{demoId}/dashboard",
      authRequirement: "authorized",
      body: "return StatusCode(503, new { error = \"Governed benchmark evidence is unavailable\" });"
    }),
    "dead"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/geoforge/ratio-study/sales",
      authRequirement: "authorized",
      body: "_db.ComparableSales.Where(s => s.CountyId == BentonCountyId)"
    }),
    "not_applicable"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/performance/elite/dashboard",
      authRequirement: "authorized",
      body: "return await _performanceService.GetPerformanceDashboardAsync();"
    }),
    "dead"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/knowledgebase/search",
      authRequirement: "authorized",
      body: "return await _knowledgeBaseService.SearchAsync(q, filters, page, limit);"
    }),
    "dead"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/codex/performance/health",
      authRequirement: "authorized",
      body: "return await _performanceService.GetPerformanceMetricsAsync();"
    }),
    "dead"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/realdata/property-stats",
      authRequirement: "authorized",
      body: "var stats = await _realDatabaseService.GetRealPropertyStatsAsync();"
    }),
    "not_applicable"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/production/pacs/ciaps/properties",
      authRequirement: "authorized",
      body: "var extractionResult = await _pacsDataEngine.ExtractCIAPSPropertyDataAsync();"
    }),
    "not_applicable"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/costforge/matrix",
      authRequirement: "authorized",
      body: "var result = await _costForgeService.GetCostMatrixAsync(buildingType, region);"
    }),
    "not_applicable"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/costforge/neighborhoods",
      authRequirement: "anonymous",
      body: "var rows = await _db.CamaCharacteristics.AsNoTracking().GroupBy(c => c.NeighborhoodCode).ToListAsync();"
    }),
    "not_applicable"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/costforge/traces",
      authRequirement: "anonymous",
      body: "var records = await _db.CamaCharacteristics.AsNoTracking().Where(c => c.ParcelId == parcelId).ToListAsync();"
    }),
    "not_applicable"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/equity/metrics",
      authRequirement: "unknown",
      body: "var groups = await _equity.GetMetricsAsync(countyId, taxYear, by, segment, ct);"
    }),
    "not_applicable"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/levy/dashboard/summary",
      authRequirement: "anonymous",
      body: "var hasScenarioRows = await _db.LevyMeasures.AsNoTracking().Join(_db.LevyScenarios.AsNoTracking(), measure => measure.Id, scenario => scenario.LevyMeasureId, (_, _) => 1).AnyAsync(cancellationToken);"
    }),
    "not_applicable"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/levy/budget/scenarios",
      authRequirement: "anonymous",
      body: "var scenarios = await _db.LevyScenarios.AsNoTracking().Include(scenario => scenario.LevyMeasure).ToListAsync(cancellationToken);"
    }),
    "not_applicable"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/codex/reports/daily",
      authRequirement: "authorized",
      body: "var report = await _reportService.GenerateDailyReportAsync(countyId, targetDate);"
    }),
    "dead"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/playground/health",
      authRequirement: "anonymous",
      body: "return Ok(new { status = \"playground-ready\", endpoints = new[] { \"/api/playground/start\" } });"
    }),
    "dead"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/market/metrics",
      authRequirement: "authorized",
      body: "var result = await _marketMetricsService.GetCurrentMetricsAsync(propertyClass);"
    }),
    "dead"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/aiorchestration/health",
      authRequirement: "authorized",
      body: "var health = await _orchestrator.GetAgentSwarmHealthAsync();"
    }),
    "dead"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/collaboration/users",
      authRequirement: "authorized",
      body: "return await _collaborationService.GetUsersAsync();"
    }),
    "dead"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/sync/doctrine/policy/ratio",
      authRequirement: "authorized",
      body: "var query = _db.TfDoctrineRatioPolicies.AsNoTracking().AsQueryable();"
    }),
    "not_applicable"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/sync/doctrine/state",
      authRequirement: "authorized",
      body: "var canonical = new { tf_parcel = await _db.TfParcels.CountAsync(cancellationToken), truth_pacs_sale = await _db.TruthPacsSales.CountAsync(cancellationToken) };"
    }),
    "not_applicable"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/sync/active-workbook",
      authRequirement: "authorized",
      body: "var snap = await _activeWorkbook.GetAsync(countyId, ct);"
    }),
    "not_applicable"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/sync/comps/stale/summary",
      authRequirement: "authorized",
      body: "var baseline = await ResolveBaselineWorkbookAsync(countyId, workbookId, ct);"
    }),
    "not_applicable"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/sync/schema/catalog/summary",
      authRequirement: "authorized",
      body: "return Ok(await _schemaCatalog.SummarizeAsync(ct));"
    }),
    "protected"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/fismacompliance/status",
      authRequirement: "authorized",
      body: "return await _complianceService.GetComplianceStatusAsync();"
    }),
    "dead"
  );
  assert.equal(
    classifyEndpoint({
      httpMethod: "GET",
      route: "/api/aisuperiority/swarm/status",
      authRequirement: "authorized",
      body: "var swarmStatus = await _aiOrchestrator.GetCurrentSwarmStatusAsync();"
    }),
    "dead"
  );
});

test("isSafeDev39GetProbeCandidate only allows finite static GET routes", () => {
  assert.equal(isSafeDev39GetProbeCandidate({ httpMethod: "GET", route: "/api/sample/live" }), true);
  assert.equal(
    isSafeDev39GetProbeCandidate({ httpMethod: "GET", route: "/api/gpt/system/atlas/live", action: "GetAtlasLiveStream" }),
    false
  );
  assert.equal(isSafeDev39GetProbeCandidate({ httpMethod: "GET", route: "/api/sample/stream" }), false);
  assert.equal(isSafeDev39GetProbeCandidate({ httpMethod: "POST", route: "/api/sample/create" }), false);
  assert.equal(isSafeDev39GetProbeCandidate({ httpMethod: "GET", route: "/api/sample/{id}" }), false);
  assert.equal(isSafeDev39GetProbeCandidate({ httpMethod: "GET", route: "/api/sample/public" }), true);
  assert.equal(
    isSafeDev39GetProbeCandidate({
      httpMethod: "GET",
      route: "/api/geoforge/ratio-study/sales",
      currentClassification: "not_applicable"
    }),
    false
  );
  assert.equal(
    isSafeDev39GetProbeCandidate({
      httpMethod: "GET",
      route: "/api/sample/static-mock",
      currentClassification: "mock"
    }),
    true
  );
  assert.equal(
    isSafeDev39GetProbeCandidate({
      httpMethod: "GET",
      route: "/api/performance/elite/dashboard",
      currentClassification: "dead"
    }),
    false
  );
});

test("getDev39ProbePath adds representative county scope for TerraForge read probes", () => {
  assert.equal(
    getDev39ProbePath({ httpMethod: "GET", route: "/api/terraforge/sale-qualification" }),
    "/api/terraforge/sale-qualification?countyId=spokane"
  );
  assert.equal(
    getDev39ProbePath({ httpMethod: "GET", route: "/api/terraforge/ratio-study?taxYear=2026" }),
    "/api/terraforge/ratio-study?taxYear=2026&countyId=spokane"
  );
  assert.equal(
    getDev39ProbePath({ httpMethod: "GET", route: "/api/runtime/truth/db-identity" }),
    "/api/runtime/truth/db-identity"
  );
  assert.equal(
    getDev39ProbePath({ httpMethod: "GET", route: "/api/atlas/gis/geocode" }),
    "/api/atlas/gis/geocode?address=415+W+6th+Ave%2C+Kennewick%2C+WA"
  );
  assert.equal(
    getDev39ProbePath({ httpMethod: "GET", route: "/api/atlas/gis/spatial-query" }),
    "/api/atlas/gis/spatial-query?bbox=-119.24%2C46.19%2C-119.18%2C46.24"
  );
});

test("summarizeEndpointMatrix reports classification and evidence counts", () => {
  const summary = summarizeEndpointMatrix([
    { currentClassification: "live", evidenceSource: "live dev39 probe" },
    { currentClassification: "protected", evidenceSource: "live dev39 probe" },
    { currentClassification: "unknown", evidenceSource: "static only" }
  ]);

  assert.equal(summary.totalEndpoints, 3);
  assert.equal(summary.classificationCounts.live, 1);
  assert.equal(summary.classificationCounts.protected, 1);
  assert.equal(summary.evidenceSourceCounts["static only"], 1);
});

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
    "protected"
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
      route: "/api/codex/reports/daily",
      authRequirement: "authorized",
      body: "var report = await _reportService.GenerateDailyReportAsync(countyId, targetDate);"
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
      route: "/api/fismacompliance/status",
      authRequirement: "authorized",
      body: "return await _complianceService.GetComplianceStatusAsync();"
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

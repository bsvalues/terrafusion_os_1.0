import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllersDir = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers");

const controllerProtectedCases = [
  {
    controller: "AnalyticsController.cs",
    classPattern: /\[Authorize\]\s*public class AnalyticsController/,
    routes: ['[HttpGet("property/{parcelId}")]'],
  },
  {
    controller: "CodexController.cs",
    classPattern: /\[Authorize\]\s*public class CodexController/,
    routes: ['[HttpPost("compare")]'],
  },
  {
    controller: "CostForgeTestController.cs",
    classPattern: /\[Authorize\]\s*public class CostForgeTestController/,
    routes: ['[HttpPost("agents/scale")]', '[HttpPost("sync/source-status")]', '[HttpPost("calculate")]'],
  },
  {
    controller: "FieldController.cs",
    classPattern: /\[Authorize\]\s*public class FieldController/,
    routes: [
      '[HttpPost("assignments")]',
      '[HttpPatch("assignments/{id}/status")]',
      '[HttpPost("assignments/{id}/assessment-review-flag")]',
    ],
  },
  {
    controller: "GlossaryController.cs",
    classPattern: /\[Authorize\]\s*public class GlossaryController/,
    routes: ['[HttpGet("term/{slug}")]'],
  },
  {
    controller: "MonitoringController.cs",
    classPattern: /\[Authorize\]\s*public class MonitoringController/,
    routes: ['[HttpPost("metrics/custom")]', '[HttpPost("test-event")]'],
  },
  {
    controller: "RealDataController.cs",
    classPattern: /\[Authorize\]\s*public class RealDataController/,
    routes: ['[HttpGet("properties/{parcelId}")]', '[HttpGet("properties/{parcelId}/assessments")]'],
  },
  {
    controller: "TerraForgeReportsController.cs",
    classPattern: /\[Authorize\]\s*public class TerraForgeReportsController/,
    routes: [
      '[HttpPost("rollback-notice")]',
      '[HttpPost("levy-certification")]',
      '[HttpPost("cost-valuation")]',
      '[HttpPost("ratio-study")]',
    ],
  },
  {
    controller: "TraceController.cs",
    classPattern: /\[Authorize\]\s*public sealed class TraceController/,
    routes: ['[HttpPost("events")]'],
  },
  {
    controller: "PublicLevyPortalController.cs",
    classPattern: /\[Authorize\]\s*public class PublicLevyPortalController/,
    routes: ['[HttpGet("property/{parcelId}")]'],
  },
  {
    controller: "DoctrineStatusController.cs",
    classPattern: /\[Authorize\]\s*public class DoctrineStatusController/,
    routes: ['[HttpGet("batch/{loadBatchId:guid}")]'],
  },
  {
    controller: "WorkbenchHController.cs",
    classPattern: /\[Authorize\]\s*public sealed class WorkbenchHController/,
    routes: ['[HttpGet("evidence/{commitId:guid}.zip")]', '[HttpGet("evidence/{commitId:guid}/manifest")]'],
  },
];

const routeProtectedCases = [
  {
    controller: "AuthController.cs",
    protectedRoutes: ['[HttpPost("revoke")]'],
    anonymousRoutes: ['[HttpPost("login")]', '[HttpGet("access-policy")]'],
  },
  {
    controller: "GeoForgeController.V2.cs",
    protectedRoutes: ['[HttpPost("v2/mass-adjust/simulate")]'],
  },
  {
    controller: "PacsOpsController.cs",
    protectedRoutes: ['[HttpGet("property/{geoId}")]'],
    anonymousRoutes: ['[HttpGet("proof")]', '[HttpGet("ping")]'],
  },
  {
    controller: "PilotController.cs",
    protectedRoutes: ['[HttpPost("invoke")]', '[HttpPost("validate")]'],
    anonymousRoutes: ['[HttpGet("router/status")]', '[HttpGet("tools")]', '[HttpGet("health")]'],
  },
  {
    controller: "PropertiesController.cs",
    protectedRoutes: ['[HttpGet("parcel/{parcelNumber}/activity")]'],
  },
  {
    controller: "WorkbenchGController.cs",
    protectedRoutes: ['[HttpGet("commits/{commitId:guid}")]'],
  },
];

function readController(controller) {
  return fs.readFileSync(path.join(controllersDir, controller), "utf8");
}

function assertRouteDoesNotAllowAnonymous(source, route, label) {
  const index = source.indexOf(route);
  assert.notEqual(index, -1, `missing route ${label} ${route}`);
  const publicIndex = source.indexOf("public ", index);
  assert.notEqual(publicIndex, -1, `missing method body after ${label} ${route}`);
  const methodWindow = source.slice(Math.max(0, index - 100), publicIndex);
  assert.doesNotMatch(methodWindow, /\[AllowAnonymous\]/, `${label} ${route} must not override authenticated access`);
}

test("Wave 3 unknown operational surfaces are authenticated by controller", () => {
  for (const item of controllerProtectedCases) {
    const source = readController(item.controller);
    assert.match(source, /using Microsoft\.AspNetCore\.Authorization;/, `${item.controller} must import authorization`);
    assert.match(source, item.classPattern, `${item.controller} must be controller-protected`);
    for (const route of item.routes) {
      assertRouteDoesNotAllowAnonymous(source, route, item.controller);
    }
  }
});

test("Wave 3 targeted routes are authenticated without closing intended public health/login routes", () => {
  for (const item of routeProtectedCases) {
    const source = readController(item.controller);
    assert.match(source, /using Microsoft\.AspNetCore\.Authorization;/, `${item.controller} must import authorization`);
    for (const route of item.protectedRoutes) {
      assertRouteDoesNotAllowAnonymous(source, route, item.controller);
    }
    for (const route of item.anonymousRoutes ?? []) {
      const index = source.indexOf(route);
      assert.notEqual(index, -1, `missing intended public route ${item.controller} ${route}`);
      const publicIndex = source.indexOf("public ", index);
      const methodWindow = source.slice(index, publicIndex);
      assert.match(methodWindow, /\[AllowAnonymous\]/, `${item.controller} ${route} should remain explicitly public`);
    }
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/CostForgeController.cs");

const protectedRoutes = [
  '[HttpPost("calibration/mass-adjust-preview")]',
  '[HttpPost("analytics/data-quality/assess")]',
  '[HttpGet("neighborhoods/{hoodCd}/parcels")]',
  '[HttpPost("effective-age")]',
  '[HttpPost("calibration/mass-adjust-apply")]',
  '[HttpPost("batch/apply")]',
  '[HttpGet("batch/status/{jobId}")]',
  '[HttpPost("batch/cancel/{jobId}")]',
];

test("CostForge operational mutation/readback endpoints inherit authenticated access", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.match(source, /\[Authorize\]\s*\[RequiresPermission\("access:costforge"\)\]\s*public class CostForgeController/);

  for (const route of protectedRoutes) {
    const index = source.indexOf(route);
    assert.notEqual(index, -1, `missing route ${route}`);
    const methodWindow = source.slice(index, source.indexOf("{", index));
    assert.doesNotMatch(methodWindow, /\[AllowAnonymous\]/, `${route} must not override controller auth`);
  }

  assert.match(source, /\[HttpGet\("building-types"\)\]\s*\[AllowAnonymous\]/);
});

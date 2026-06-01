import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/MassAppraisalController.cs");

const protectedRoutes = [
  '[HttpGet("ratio-study/{modelId}")]',
  '[HttpGet("ratio-study/{modelId}/strata")]',
  '[HttpGet("ratio-study/{modelId}/outliers")]',
  '[HttpPost("compare")]',
  '[HttpGet("segments/{modelId}")]',
];

test("MassAppraisal model and ratio-study surfaces inherit authenticated access", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.match(source, /\[Authorize\]\s*public class MassAppraisalController/);

  for (const route of protectedRoutes) {
    const index = source.indexOf(route);
    assert.notEqual(index, -1, `missing route ${route}`);
    const methodWindow = source.slice(Math.max(0, index - 80), source.indexOf("{", index));
    assert.doesNotMatch(methodWindow, /\[AllowAnonymous\]/, `${route} must not override controller auth`);
  }

  assert.match(source, /\[HttpGet\("models"\)\]/);
});

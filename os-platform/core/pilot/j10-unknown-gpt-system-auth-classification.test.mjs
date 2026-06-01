import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/GPTController.cs");

const protectedRoutes = [
  '[HttpPost("rag/index/{datasetId}")]',
  '[HttpPost("system/safe-mode")]',
  '[HttpPost("system/policy/evaluate")]',
  '[HttpGet("system/fleet/rag-readiness/{countyId}")]',
  '[HttpGet("system/atlas/live")]',
  '[HttpPost("explain")]',
];

test("GPT system/readiness/explain endpoints inherit authenticated controller access", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.match(source, /\[Authorize\]\s*\/\/ Requires authentication\s*public class GPTController/);

  for (const route of protectedRoutes) {
    const index = source.indexOf(route);
    assert.notEqual(index, -1, `missing route ${route}`);
    const methodWindow = source.slice(index, source.indexOf("{", index));
    assert.doesNotMatch(methodWindow, /\[AllowAnonymous\]/, `${route} must not override controller auth`);
  }

  assert.match(source, /\[HttpGet\("rag\/health"\)\]\s*\[AllowAnonymous\]/);
});

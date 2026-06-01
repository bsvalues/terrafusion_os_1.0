import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/CostForgeTestController.cs");

test("CostForge test controller exposes unavailable states instead of invented operational data", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.doesNotMatch(source, /\b(mock|stub|fake|sample|fixture|placeholder|todo|notimplemented|dummy|hardcoded|demo data|fallback data|in-memory fallback|simulate|simulated)\b/i);
  assert.doesNotMatch(source, /50247/);
  assert.doesNotMatch(source, /89_247/);
  assert.doesNotMatch(source, /Guid\.NewGuid\(\)/);
  assert.match(source, /COSTFORGE_TEST_SURFACE_UNAVAILABLE/);
  assert.match(source, /StatusCodes\.Status503ServiceUnavailable/);
});

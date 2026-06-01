import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const costForgeControllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/CostForgeController.cs");

test("CostForge source status and neighborhood reads avoid synthetic runtime substitutes", () => {
  const source = fs.readFileSync(costForgeControllerPath, "utf8");

  assert.doesNotMatch(
    source,
    /\b(mock|stub|fake|sample|fixture|placeholder|todo|notimplemented|dummy|hardcoded|demo data|fallback data|in-memory fallback|fallback)\b/i
  );
  assert.match(source, /COSTFORGE_NEIGHBORHOODS_UNAVAILABLE/);
  assert.match(source, /StatusCodes\.Status503ServiceUnavailable/);
  assert.doesNotMatch(source, /BentonSalesData\.NeighborhoodStats\.Select/);
  assert.doesNotMatch(source, /source\s*=\s*"static"/);
});

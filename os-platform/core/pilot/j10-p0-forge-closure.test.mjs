import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const forgeControllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/ForgeController.cs");

test("Forge batch cost surfaces expose honest unavailable states instead of generated dev data", () => {
  const source = fs.readFileSync(forgeControllerPath, "utf8");

  assert.doesNotMatch(
    source,
    /\b(mock|stub|fake|sample|fixture|placeholder|todo|notimplemented|dummy|hardcoded|demo data|fallback data|in-memory fallback|fallback)\b/i
  );
  assert.match(source, /FORGE_BATCH_COST_PREVIEW_UNAVAILABLE/);
  assert.match(source, /FORGE_BATCH_COST_HISTORY_UNAVAILABLE/);
  assert.match(source, /StatusCodes\.Status503ServiceUnavailable/);
  assert.doesNotMatch(source, /BatchCostRun clears/i);
  assert.doesNotMatch(source, /Guid\.NewGuid/);
});

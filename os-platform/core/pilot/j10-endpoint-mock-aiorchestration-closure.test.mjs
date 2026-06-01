import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/AIOrchestrationController.cs");

test("AI orchestration county agent read path does not synthesize county agent metrics", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.doesNotMatch(source, /new Random\(countyId\.GetHashCode\(\)\)/);
  assert.doesNotMatch(source, /countyAgentCount\s*=\s*20\s*\+/);
  assert.doesNotMatch(source, /15\s*\+\s*random\.NextDouble\(\)\s*\*\s*10/);
  assert.doesNotMatch(source, /25\s*\+\s*random\.NextDouble\(\)\s*\*\s*15/);
  assert.match(source, /AI_ORCHESTRATION_COUNTY_AGENTS_UNAVAILABLE/);
  assert.match(source, /StatusCodes\.Status503ServiceUnavailable/);
});

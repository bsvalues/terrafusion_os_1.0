import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const gptControllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/GPTController.cs");

test("GPT explain returns an honest unavailable state instead of synthetic explanation content", () => {
  const source = fs.readFileSync(gptControllerPath, "utf8");

  assert.doesNotMatch(source, /\b(stub|placeholder|fallback|fake|mock|sample data)\b/i);
  assert.match(source, /StatusCodes\.Status503ServiceUnavailable/);
  assert.match(source, /GPT_EXPLAIN_UNAVAILABLE/);
  assert.doesNotMatch(source, /GenerateExplanationAsync/);
  assert.doesNotMatch(source, /GetContextExplanation/);
});

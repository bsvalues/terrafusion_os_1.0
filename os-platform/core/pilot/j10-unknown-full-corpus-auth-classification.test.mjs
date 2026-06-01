import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/FullCorpusController.cs");

test("Full corpus sync endpoints require authorization", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.match(source, /using Microsoft\.AspNetCore\.Authorization;/);
  assert.match(source, /\[Authorize\]\s*public sealed class FullCorpusController/);
  assert.doesNotMatch(source, /\[AllowAnonymous\]\s*public sealed class FullCorpusController/);
  assert.match(source, /\[HttpPost\("start"\)\]/);
  assert.match(source, /\[HttpPost\("\{runId:guid\}\/resume"\)\]/);
  assert.match(source, /\[HttpGet\("\{runId:guid\}"\)\]/);
  assert.match(source, /\[HttpGet\("\{runId:guid\}\/reconciliation"\)\]/);
  assert.match(source, /\[HttpGet\("\{runId:guid\}\/evidence\.zip"\)\]/);
});

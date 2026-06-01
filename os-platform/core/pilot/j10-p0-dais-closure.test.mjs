import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const daisControllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/DaisController.cs");

test("DAIS queue endpoints do not return synthetic queue or escalation results", () => {
  const source = fs.readFileSync(daisControllerPath, "utf8");

  assert.doesNotMatch(
    source,
    /\b(mock|stub|fake|sample|fixture|placeholder|todo|notimplemented|dummy|hardcoded|demo data|fallback data|in-memory fallback|fallback)\b/i
  );
  assert.match(source, /DAIS_QUEUE_SUMMARY_UNAVAILABLE/);
  assert.match(source, /DAIS_QUEUE_TASK_NOT_FOUND/);
  assert.match(source, /DAIS_QUEUE_TASK_INVALID_TRANSITION/);
  assert.doesNotMatch(source, /return stub result/i);
  assert.doesNotMatch(source, /source\s*=\s*"fallback"/);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/CalibrationMemoController.cs");

test("Calibration memo endpoints require authorization by default", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.match(source, /using Microsoft\.AspNetCore\.Authorization;/);
  assert.match(source, /\[Authorize\]\s*public class CalibrationMemoController/);
  assert.doesNotMatch(source, /\[AllowAnonymous\]/);
  assert.match(source, /\[HttpPost\("auto-draft"\)\]/);
  assert.match(source, /\[HttpGet\("\{id:int\}"\)\]/);
  assert.match(source, /\[HttpPatch\("\{id:int\}\/section"\)\]/);
  assert.match(source, /\[HttpGet\("\{id:int\}\/completeness"\)\]/);
});

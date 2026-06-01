import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/WhatIfScenariosController.cs");

test("What-if scenario file-backed surface requires authenticated access", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.match(source, /using Microsoft\.AspNetCore\.Authorization;/);
  assert.match(source, /\[Authorize\]\s*public class WhatIfScenariosController/);
  assert.doesNotMatch(source, /\[AllowAnonymous\]/);
  assert.match(source, /\[HttpGet\]/);
  assert.match(source, /\[HttpGet\("\{id\}"\)\]/);
  assert.match(source, /\[HttpPost\]/);
  assert.match(source, /\[HttpPatch\("\{id\}"\)\]/);
  assert.match(source, /\[HttpDelete\("\{id\}"\)\]/);
});

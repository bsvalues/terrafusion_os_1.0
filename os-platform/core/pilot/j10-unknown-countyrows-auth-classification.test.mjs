import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/CountyRowsController.cs");

test("County runtime row endpoints require authenticated access", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.match(source, /using Microsoft\.AspNetCore\.Authorization;/);
  assert.match(source, /\[Authorize\]\s*public sealed class CountyRowsController/);
  assert.doesNotMatch(source, /\[AllowAnonymous\]/);
  assert.match(source, /\[HttpGet\("parcels"\)\]/);
  assert.match(source, /\[HttpGet\("sales"\)\]/);
  assert.match(source, /\[HttpGet\("runtime-lineage"\)\]/);
});

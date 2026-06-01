import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/TerraForgeController.cs");

test("TerraForge endpoints require authorization by default", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.match(source, /using Microsoft\.AspNetCore\.Authorization;/);
  assert.match(source, /\[Authorize\]\s*public class TerraForgeController/);
  assert.doesNotMatch(source, /\[AllowAnonymous\]/);
  assert.match(source, /\[HttpGet\("sale-qualification\/\{saleId:guid\}"\)\]/);
  assert.match(source, /\[HttpPost\("compute-qualifications"\)\]/);
  assert.match(source, /\[HttpPost\("apply-recommendations"\)\]/);
  assert.match(source, /\[HttpPatch\("sale-qualification\/bulk"\)\]/);
  assert.match(source, /\[HttpPatch\("sale-qualification\/\{saleId:guid\}"\)\]/);
});

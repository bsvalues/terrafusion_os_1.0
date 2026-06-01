import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/GeoForgeController.cs");
const v2ControllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/GeoForgeController.V2.cs");

test("GeoForge endpoints require authorization by default", () => {
  const source = fs.readFileSync(controllerPath, "utf8");
  const v2Source = fs.readFileSync(v2ControllerPath, "utf8");

  assert.match(source, /using Microsoft\.AspNetCore\.Authorization;/);
  assert.match(source, /\[Authorize\]\s*public partial class GeoForgeController/);
  assert.doesNotMatch(source, /\[AllowAnonymous\]/);
  assert.doesNotMatch(v2Source, /\[AllowAnonymous\]/);
  assert.match(source, /\[HttpPost\("ratio-study\/gwr"\)\]/);
  assert.match(source, /\[HttpPatch\("sales\/\{saleId\}\/qualification"\)\]/);
  assert.match(v2Source, /\[HttpPost\("v2\/mass-adjust\/simulate"\)\]/);
});

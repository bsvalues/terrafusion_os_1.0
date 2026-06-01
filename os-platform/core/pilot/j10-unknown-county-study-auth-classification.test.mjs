import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/CountyStudyController.cs");

test("CountyStudy endpoints declare app-level authorization instead of relying on gateway-only auth", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.match(source, /using Microsoft\.AspNetCore\.Authorization;/);
  assert.match(source, /\[Authorize\]\s*public class CountyStudyController/);
  assert.doesNotMatch(source, /Auth is handled at the gateway level; no \[Authorize\] attribute required/);
});

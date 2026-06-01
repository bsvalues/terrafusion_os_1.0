import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const pilotControllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/PilotController.cs");

test("Pilot runtime offline fallbacks are honest unavailable states, not stubs", () => {
  const source = fs.readFileSync(pilotControllerPath, "utf8");

  assert.doesNotMatch(source, /\bstub\b/i);
  assert.doesNotMatch(source, /source\s*=\s*"stub"/i);
  assert.match(source, /StatusCodes\.Status503ServiceUnavailable/);
  assert.match(source, /PILOT_RUNTIME_UNAVAILABLE/);
  assert.match(source, /runtimeOnline\s*=\s*false/);
});

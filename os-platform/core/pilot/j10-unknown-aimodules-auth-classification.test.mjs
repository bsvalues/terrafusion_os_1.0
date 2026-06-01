import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/AIModulesController.cs");

const protectedRoutes = [
  '[HttpPost("execute")]',
  '[HttpPost("predict-cost")]',
];

test("AI module command and prediction surfaces inherit OS core access policy", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.match(source, /\[Authorize\(Policy = "OSCoreAccess"\)\]\s*public class AIModulesController/);

  for (const route of protectedRoutes) {
    const index = source.indexOf(route);
    assert.notEqual(index, -1, `missing route ${route}`);
    const publicIndex = source.indexOf("public ", index);
    assert.notEqual(publicIndex, -1, `missing method body after ${route}`);
    const methodWindow = source.slice(index, publicIndex);
    assert.doesNotMatch(methodWindow, /\[AllowAnonymous\]/, `${route} must not override controller auth`);
  }

  assert.match(source, /\[HttpGet\("status"\)\]\s*\[AllowAnonymous\]/);
});

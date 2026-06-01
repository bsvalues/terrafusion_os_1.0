import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs");

test("Canonical debug endpoints require app-level authorization", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.match(source, /\[Authorize\]\s*public class CanonicalDebugController/);
  assert.doesNotMatch(source, /\[AllowAnonymous\]\s*public class CanonicalDebugController/);
  assert.match(source, /ALLOW_DESTRUCTIVE_DEBUG/);
});

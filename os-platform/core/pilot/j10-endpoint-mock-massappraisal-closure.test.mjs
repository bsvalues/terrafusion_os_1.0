import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/MassAppraisalController.cs");
const programPath = path.join(repoRoot, "backend/src/TerraFusion.API/Program.cs");

test("Mass appraisal API does not register or return synthetic appraisal service data", () => {
  const controller = fs.readFileSync(controllerPath, "utf8");
  const program = fs.readFileSync(programPath, "utf8");

  assert.doesNotMatch(controller, /\bMassAppraisalServiceStub\b/);
  assert.doesNotMatch(controller, /\bDev Stub\b/i);
  assert.doesNotMatch(controller, /LastCOD\s*=\s*8\.2m/);
  assert.doesNotMatch(controller, /SampleSize\s*=\s*120/);
  assert.match(controller, /\bUnavailableMassAppraisalService\b/);
  assert.match(program, /\bUnavailableMassAppraisalService\b/);
});

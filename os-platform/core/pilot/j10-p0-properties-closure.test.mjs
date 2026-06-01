import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const propertiesControllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/PropertiesController.cs");

test("Properties parcel activity returns an honest unavailable state instead of synthetic empty activity", () => {
  const source = fs.readFileSync(propertiesControllerPath, "utf8");

  assert.doesNotMatch(
    source,
    /\b(mock|stub|fake|sample|fixture|placeholder|todo|notimplemented|dummy|hardcoded|demo data|fallback data|in-memory fallback|fallback)\b/i
  );
  assert.match(source, /PROPERTY_ACTIVITY_UNAVAILABLE/);
  assert.match(source, /StatusCodes\.Status503ServiceUnavailable/);
  assert.doesNotMatch(source, /returning stub empty list/i);
  assert.doesNotMatch(source, /items\s*=\s*Array\.Empty<object>\(\),\s*total\s*=\s*0/);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const atlasControllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/AtlasController.cs");

test("Atlas synthetic utility surfaces return honest unavailable states", () => {
  const source = fs.readFileSync(atlasControllerPath, "utf8");

  assert.doesNotMatch(
    source,
    /\b(mock|stub|fake|sample|fixture|placeholder|todo|notimplemented|dummy|hardcoded|demo data|fallback data|in-memory fallback|fallback)\b/i
  );
  assert.match(source, /ATLAS_COORDINATE_CONVERSION_UNAVAILABLE/);
  assert.match(source, /ATLAS_SPATIAL_BUNDLE_UNAVAILABLE/);
  assert.match(source, /StatusCodes\.Status503ServiceUnavailable/);
  assert.doesNotMatch(source, /terra-dashboard-production webMercatorToGeographic/);
  assert.doesNotMatch(source, /GeoEquityDashboard and MassAppraisalGIS/);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const programText = fs.readFileSync("backend/src/TerraFusion.API/Program.cs", "utf8");
const connectorText = fs.readFileSync(
  "backend/src/TerraFusion.Core/GIS/Connectors/GisConnector.cs",
  "utf8"
);
const matrixText = fs.readFileSync(
  "os-platform/core/pilot/june10-backend-endpoint-contract-matrix.mjs",
  "utf8"
);

test("GisController dependencies are explicitly registered in the API host", () => {
  assert.match(
    programText,
    /AddHttpClient<\s*IGisConnector\s*,\s*GisConnector\s*>/,
    "IGisConnector must be registered so /api/gis/* does not fail controller activation"
  );
  assert.match(
    programText,
    /AddScoped<\s*IGeospatialEnricher\s*,\s*GeospatialEnricher\s*>/,
    "IGeospatialEnricher must be registered so /api/gis/geocode and proximity can execute"
  );
  assert.match(
    programText,
    /AddScoped<\s*ISpatialAnalysisService\s*,\s*SpatialAnalysisService\s*>/,
    "ISpatialAnalysisService must be registered so /api/gis/proximity can execute"
  );
});

test("GIS connector uses governed public catalog data instead of synthetic fallback rows", () => {
  assert.match(
    connectorText,
    /ArcGisServiceCatalog\.TryGetLayer/,
    "known GIS layers must resolve through the governed ArcGIS service catalog"
  );
  assert.match(
    connectorText,
    /return new FeatureCollection\(Array\.Empty<GisFeature>\(\), 0\)/,
    "unknown unconfigured GIS layers must return an honest empty source result"
  );
});

test("dev39 endpoint probe uses bounded GIS query parameters", () => {
  assert.match(matrixText, /endpoint\.route === "\/api\/gis\/geocode"/);
  assert.match(matrixText, /endpoint\.route === "\/api\/gis\/parcels\/spatial"/);
  assert.match(matrixText, /endpoint\.route === "\/api\/gis\/proximity"/);
});

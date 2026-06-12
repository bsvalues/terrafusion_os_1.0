import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const ATLAS_GIS_PATH = resolve(ROOT, 'backend/src/TerraFusion.API/Controllers/AtlasGisController.cs');
const DAIS_PATH = resolve(ROOT, 'backend/src/TerraFusion.API/Controllers/DaisController.cs');
const FORGE_CONTROLLER_PATH = resolve(ROOT, 'backend/src/TerraFusion.API/Controllers/ForgeController.cs');
const VALUATION_SERVICE_PATH = resolve(ROOT, 'backend/src/TerraFusion.API/Services/ValuationService.cs');
const GIS_SERVICE_PATH = resolve(ROOT, 'backend/src/TerraFusion.API/Services/GisDataService.cs');

const ATLAS_GIS_SRC = readFileSync(ATLAS_GIS_PATH, 'utf8');
const DAIS_SRC = readFileSync(DAIS_PATH, 'utf8');
const FORGE_CONTROLLER_SRC = readFileSync(FORGE_CONTROLLER_PATH, 'utf8');
const VALUATION_SERVICE_SRC = readFileSync(VALUATION_SERVICE_PATH, 'utf8');
const GIS_SERVICE_SRC = readFileSync(GIS_SERVICE_PATH, 'utf8');

describe('Property Workbench backend endpoint alignment', () => {
  it('Atlas combined parcel endpoint distinguishes missing geometry from missing parcel truth', () => {
    assert.match(
      ATLAS_GIS_SRC,
      /TerraFusionDbContext/,
      'Atlas GIS controller must be able to verify governed parcel truth outside the GIS geometry table',
    );
    assert.match(
      ATLAS_GIS_SRC,
      /Properties\s*\.\s*AsNoTracking\(\)\s*\.\s*AnyAsync\([^;]+ParcelNumber\s*==\s*parcelId/s,
      'Atlas combined endpoint must check the governed property source before treating unavailable geometry as parcel-not-found',
    );
    assert.doesNotMatch(
      ATLAS_GIS_SRC,
      /if\s*\(\s*boundary\.Source\s*==\s*["']unavailable["']\s*\)\s*return\s+NotFound/s,
      'Atlas combined endpoint must not reject real parcels only because ArcGIS boundary geometry is unavailable',
    );
  });

  it('Dais exposes the permit query route used by the Workbench Dais surface', () => {
    assert.match(
      DAIS_SRC,
      /\[HttpGet\(\s*["']permits["']\s*\)\]/,
      'Dais controller must align with frontend GET /api/dais/permits?parcelId=...',
    );
    assert.match(
      DAIS_SRC,
      /X-Dais-Permits-Source/,
      'Dais permits route must explicitly classify whether permit records are live or not-live',
    );
  });

  it('Forge governed endpoints reject missing parcels instead of returning fallback stubs', () => {
    assert.match(
      VALUATION_SERVICE_SRC,
      /throw\s+new\s+KeyNotFoundException\([^;]+parcelId/s,
      'Valuation service must stop missing parcels before any fallback valuation payload is built',
    );
    assert.match(
      FORGE_CONTROLLER_SRC,
      /catch\s*\(\s*KeyNotFoundException\s+ex\s*\)[\s\S]*?return\s+NotFound/,
      'Forge controller must map canonical parcel misses to 404 on governed Workbench endpoints',
    );
    assert.doesNotMatch(
      VALUATION_SERVICE_SRC,
      /Source\s*=\s*["']stub["']/,
      'Forge Workbench valuation sources must not label governed payloads as stub data',
    );
  });

  it('Atlas layer data does not fabricate flood metadata when FEMA enrichment is unavailable', () => {
    assert.doesNotMatch(
      GIS_SERVICE_SRC,
      /new\s+ParcelFloodLayer\([^)]*["']stub["'][^)]*\)/s,
      'Atlas GIS layers must not emit stub flood zones on governed Workbench paths',
    );
    assert.match(
      GIS_SERVICE_SRC,
      /new\s+ParcelFloodLayer\([^)]*["']unavailable["'][^)]*\)/s,
      'Atlas GIS layers must classify unavailable FEMA flood data explicitly',
    );
  });
});

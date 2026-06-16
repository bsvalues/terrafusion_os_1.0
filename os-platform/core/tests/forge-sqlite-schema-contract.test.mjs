import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..', '..', '..');
const valuationServicePath = resolve(
  repoRoot,
  'backend',
  'src',
  'TerraFusion.API',
  'Services',
  'ValuationService.cs',
);
const valuationService = readFileSync(valuationServicePath, 'utf8');

test('Workbench Forge sales comparison does not read missing PACS valuation mirror', () => {
  assert.equal(
    valuationService.includes('_db.PacsValuations'),
    false,
    'ValuationService must not query pacs_valuations/PacsValuations for Workbench Forge sales comparison.',
  );
  assert.match(
    valuationService,
    /var subjectHood = await _db\.CamaCharacteristics[\s\S]+\.Select\(c => c\.NeighborhoodCode\)/,
    'Sales comparison should resolve subject neighborhood from canonical CamaCharacteristics.',
  );
});

test('Workbench Forge cost tolerates missing optional CAMA segment projection', () => {
  assert.match(
    valuationService,
    /LoadSegmentRowsAsync\(parcelId, taxYear, ct\)/,
    'Cost approach should route optional segment reads through the guarded loader.',
  );
  assert.match(
    valuationService,
    /CanReadTableAsync\("cama_improvement_details", ct\)/,
    'SQLite cost approach should check the optional cama_improvement_details projection before querying it.',
  );
  assert.match(
    valuationService,
    /return \[\];/,
    'Missing segment projection should return empty segment details instead of throwing a 500.',
  );
});

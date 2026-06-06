import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, 'os-platform/core/pilot/county-studio-r1-production-proof.mjs');

function runProof(args = []) {
  const outDir = mkdtempSync(path.join(tmpdir(), 'county-studio-r1-proof-'));
  const outPath = path.join(outDir, 'proof.json');
  const markdownOut = path.join(outDir, 'proof.md');

  const result = spawnSync(
    process.execPath,
    [scriptPath, '--out', outPath, '--markdown-out', markdownOut, '--skip-runtime', ...args],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  try {
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    return {
      json: JSON.parse(readFileSync(outPath, 'utf8')),
      markdown: readFileSync(markdownOut, 'utf8'),
      stdout: result.stdout,
    };
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

test('County Studio R1 production proof emits the required evidence surfaces', () => {
  const { json, markdown } = runProof();
  const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(json.status, 'PASS');
  assert.equal(json.decision, 'COUNTY_STUDIO_R1_STATIC_PRODUCTION_PROOF_READY');
  assert.equal(json.scope.excluded.syncAndDbSeeding, true);
  assert.equal(json.invariants.primaryDrillPathsMustNotDependOnCity, true);

  const checkIds = new Set(json.checks.map((check) => check.id));
  for (const id of [
    'endpoint-contract.frontend-backend-county-study-routes',
    'data-flow.real-canonical-county-study-services',
    'mock-audit.no-county-studio-production-mocks',
    'city-doctrine.city-reference-only-primary-path-clean',
    'handoffs.atlas-dossier-workbench-valuation-context',
    'tools.cli-redis-rust-prometheus-inventory',
    'runtime.screenshot-contract-ready',
  ]) {
    assert.ok(checkIds.has(id), `missing proof check ${id}`);
  }

  const endpointCheck = json.checks.find((check) => check.id === 'endpoint-contract.frontend-backend-county-study-routes');
  assert.equal(endpointCheck.passed, true);
  assert.equal(endpointCheck.payload.missingFrontend.length, 0);
  assert.equal(endpointCheck.payload.missingBackend.length, 0);
  assert.ok(endpointCheck.payload.requiredRoutes.length >= 20);

  const dataCheck = json.checks.find((check) => check.id === 'data-flow.real-canonical-county-study-services');
  assert.equal(dataCheck.passed, true);
  assert.deepEqual(dataCheck.payload.requiredCanonicalSources.sort(), [
    'CamaCharacteristics',
    'ComparableSales',
    'CountySegments',
    'PacsValuation',
    'Properties',
  ].sort());

  const toolsCheck = json.checks.find((check) => check.id === 'tools.cli-redis-rust-prometheus-inventory');
  assert.equal(toolsCheck.passed, true);
  assert.ok(toolsCheck.payload.cli.length > 0);
  assert.ok(toolsCheck.payload.redis.length > 0);
  assert.ok(toolsCheck.payload.rustEngines.length > 0);
  assert.ok(toolsCheck.payload.prometheus.length > 0);

  assert.match(markdown, /# County Studio R1 Production Proof/);
  assert.match(markdown, /Primary drill paths must not depend on city/);
  assert.match(markdown, /Runtime Screenshot Contract/);
  assert.equal(
    packageJson.scripts['proof:county-studio:r1'],
    'node os-platform/core/pilot/county-studio-r1-production-proof.mjs',
  );
});

test('runtime proof waits on document readiness before explicit County Studio signals', () => {
  const source = readFileSync(scriptPath, 'utf8');

  assert.match(source, /waitUntil: 'domcontentloaded'/);
  assert.doesNotMatch(source, /waitUntil: 'networkidle'/);
  assert.match(source, /page\.waitForFunction/);
  assert.match(source, /requiredVisibleSignals/);
});

test('runtime proof waits for the embedded Atlas loading state to clear before screenshot', () => {
  const source = readFileSync(scriptPath, 'utf8');

  assert.match(source, /county-studio-atlas-loading/);
  assert.match(source, /state: 'hidden'/);
});

test('runtime proof opens a real County Studio study before capturing GIS evidence', () => {
  const source = readFileSync(scriptPath, 'utf8');

  assert.match(source, /getByRole\('button', \{ name: 'Open Study' \}\)/);
  assert.match(source, /Existing Studies/);
  assert.match(source, /studyChoice/);
  assert.match(source, /tf\.session\.dev/);
  assert.match(source, /19190019-1919-1919-1919-191919191919/);
});

test('runtime proof waits for live study data before capturing the screenshot', () => {
  const source = readFileSync(scriptPath, 'utf8');

  assert.match(source, /ATLAS LIVE/);
  assert.match(source, /Loading countywide health metrics/);
  assert.match(source, /segmentCount > 0/);
  assert.match(source, /riskObjectCount > 0/);
  assert.match(source, /extractVisibleCount/);
});

test('runtime proof fails when the map overlaps ledger, statistics, or inspector regions', () => {
  const source = readFileSync(scriptPath, 'utf8');

  assert.match(source, /county-studio-gis-stage/);
  assert.match(source, /county-studio-bottom-analytics/);
  assert.match(source, /cs-right-rail/);
  assert.match(source, /mapDoesNotOverlapAnalytics/);
  assert.match(source, /mapDoesNotOverlapRightRail/);
});

test('runtime proof matches visible GIS contract labels case-insensitively', () => {
  const source = readFileSync(scriptPath, 'utf8');

  assert.match(source, /bodyTextLower/);
  assert.match(source, /signal\.toLowerCase\(\)/);
  assert.match(source, /bodyTextLower\.includes/);
});

test('runtime proof requires Prometheus command-surface signals and risk map labels', () => {
  const source = readFileSync(scriptPath, 'utf8');

  assert.match(source, /Living County Risk Map/);
  assert.match(source, /Roll Readiness/);
  assert.match(source, /Selected Risk Object/);
  assert.match(source, /Operational Focus/);
  assert.match(source, /prometheus-risk-map-label/);
  assert.match(source, /prometheusRiskLabelCount > 0/);
});

#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');

const DEFAULT_OUT = path.join(evidenceDir, 'county-studio-r1-production-proof.latest.json');
const DEFAULT_MD_OUT = path.join(evidenceDir, 'county-studio-r1-production-proof.latest.md');

const files = {
  api: 'frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts',
  controller: 'backend/src/TerraFusion.API/Controllers/CountyStudyController.cs',
  service: 'backend/src/TerraFusion.Core/Services/CountyStudyService.cs',
  derivation: 'backend/src/TerraFusion.Core/Services/CountyStudySegmentDerivationService.cs',
  health: 'backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs',
  inspector: 'backend/src/TerraFusion.Core/Services/CountyStudyInspectorService.cs',
  ai: 'backend/src/TerraFusion.Core/Services/CountyStudioAiService.cs',
  invariant: 'frontend/apps/os-shell/src/pages/forge/county-studio/countyStudioInvariants.ts',
  riskSurface: 'frontend/apps/os-shell/src/pages/forge/county-studio/components/RiskSurfaceCommandCenter.tsx',
  embeddedAtlas: 'frontend/apps/os-shell/src/pages/forge/county-studio/components/EmbeddedAtlasGisWorkspace.tsx',
  healthPanel: 'frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyHealthPanel.tsx',
  countyPage: 'frontend/apps/os-shell/src/pages/forge/county-studio/CountyStudyPage.tsx',
  atlasLiveApi: 'frontend/apps/os-shell/src/pages/forge/atlas-live/atlasLiveApi.ts',
  geoforgeMap: 'frontend/apps/os-shell/src/pages/forge/geo/v2/GeoForgeV2Map.tsx',
  sanitizer: 'frontend/apps/os-shell/src/pages/forge/county-studio/utils/cityPrimarySanitizer.ts',
  objectInspector: 'frontend/apps/os-shell/src/pages/forge/county-studio/components/ObjectInspector.tsx',
  neighborhoodInspector: 'frontend/apps/os-shell/src/pages/forge/county-studio/components/NeighborhoodInspector.tsx',
  adjustmentPanel: 'frontend/apps/os-shell/src/pages/forge/county-studio/components/AdjustmentSetPanel.tsx',
  exportModal: 'frontend/apps/os-shell/src/pages/forge/county-studio/components/ExportPacketModal.tsx',
  markdown: 'frontend/apps/os-shell/src/pages/forge/county-studio/utils/evidencePacketMarkdown.ts',
};

const requiredRoutes = [
  ['GET studies', '/studies?', '[HttpGet("studies")]'],
  ['POST studies', '`${BASE}/studies`', '[HttpPost("studies")]'],
  ['GET study detail', '`${BASE}/studies/${studyId}`', '[HttpGet("studies/{studyId:guid}")]'],
  ['PATCH study status', '/status', '[HttpPatch("studies/{studyId:guid}/status")]'],
  ['POST derive segments', '/derive-segments', '[HttpPost("studies/{studyId:guid}/derive-segments")]'],
  ['GET segment sets', '/segment-sets', '[HttpGet("studies/{studyId:guid}/segment-sets")]'],
  ['POST segment sets', '/segment-sets', '[HttpPost("studies/{studyId:guid}/segment-sets")]'],
  ['GET segments', '/segments', '[HttpGet("segment-sets/{segmentSetId:guid}/segments")]'],
  ['GET cohorts', '/cohorts', '[HttpGet("studies/{studyId:guid}/cohorts")]'],
  ['POST cohorts', '`${BASE}/cohorts`', '[HttpPost("cohorts")]'],
  ['GET scenarios', '/scenarios', '[HttpGet("studies/{studyId:guid}/scenarios")]'],
  ['POST scenarios', '`${BASE}/scenarios`', '[HttpPost("scenarios")]'],
  ['SAVE scenario', '/save', '[HttpPost("scenarios/{scenarioId:guid}/save")]'],
  ['PREVIEW scenario', '/preview', '[HttpGet("scenarios/{scenarioId:guid}/preview")]'],
  ['COMPARE scenarios', '/compare?', '[HttpGet("scenarios/{scenarioIdA:guid}/compare")]'],
  ['PROMOTE scenario', '/scenarios/promote', '[HttpPost("scenarios/promote")]'],
  ['GET adjustment sets', '/adjustment-sets', '[HttpGet("studies/{studyId:guid}/adjustment-sets")]'],
  ['GET apply handoff receipts', '/apply-handoff-receipts', '[HttpGet("studies/{studyId:guid}/apply-handoff-receipts")]'],
  ['PATCH approval state', '/approval-state', '[HttpPatch("adjustment-sets/{id:guid}/approval-state")]'],
  ['PUT apply handoff receipt', '/apply-handoff-receipt', '[HttpPut("adjustment-sets/{id:guid}/apply-handoff-receipt")]'],
  ['GET exceptions', '/exceptions', '[HttpGet("studies/{studyId:guid}/exceptions")]'],
  ['GET downstream receipts', '/downstream-receipts', '[HttpGet("studies/{studyId:guid}/downstream-receipts")]'],
  ['GET city rollup reference', '/city-rollup', '[HttpGet("studies/{studyId:guid}/city-rollup")]'],
  ['GET neighborhood rollup', '/neighborhood-rollup', '[HttpGet("studies/{studyId:guid}/neighborhood-rollup")]'],
  ['GET health summary', '/health-summary', '[HttpGet("studies/{studyId:guid}/health-summary")]'],
  ['GET statistics compat', '/statistics-compat', '[HttpGet("studies/{studyId:guid}/statistics-compat")]'],
  ['GET segment detail', '/detail', '[HttpGet("segments/{segmentId:guid}/detail")]'],
  ['GET segment action context', '/action-context', '[HttpGet("segments/{segmentId:guid}/action-context")]'],
  ['GET segment diagnosis', '/diagnosis', '[HttpGet("segments/{segmentId:guid}/diagnosis")]'],
  ['GET study diagnosis', '/diagnosis', '[HttpGet("studies/{studyId:guid}/diagnosis")]'],
  ['GET evidence packet', '/evidence-packet', '[HttpGet("studies/{studyId:guid}/evidence-packet")]'],
];

function parseArgs(argv) {
  const args = argv.slice(2);
  const valueAfter = (flag, fallback = null) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] ?? fallback : fallback;
  };
  return {
    out: valueAfter('--out', process.env.COUNTY_STUDIO_R1_PROOF_OUT || DEFAULT_OUT),
    markdownOut: valueAfter('--markdown-out', process.env.COUNTY_STUDIO_R1_PROOF_MD_OUT || DEFAULT_MD_OUT),
    runtimeUrl: valueAfter('--runtime-url', process.env.COUNTY_STUDIO_R1_RUNTIME_URL || null),
    screenshotDir: valueAfter('--screenshot-dir', path.join(evidenceDir, 'screenshots')),
    skipRuntime: args.includes('--skip-runtime'),
  };
}

function read(relPath) {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function relExists(relPath) {
  return existsSync(path.join(repoRoot, relPath));
}

function findLine(relPath, needle) {
  const lines = read(relPath).split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(needle));
  return index >= 0 ? `${relPath}:${index + 1}` : relPath;
}

function listFiles(dir, predicate, excluded = new Set()) {
  const root = path.join(repoRoot, dir);
  if (!existsSync(root)) return [];
  const results = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const rel = path.relative(repoRoot, full).replace(/\\/g, '/');
      if ([...excluded].some((fragment) => rel.includes(fragment))) continue;
      if (entry.isDirectory()) {
        if (['.git', 'node_modules', 'bin', 'obj', 'dist', 'ARCHIVE', 'QUARANTINE'].includes(entry.name)) continue;
        walk(full);
      } else if (predicate(rel)) {
        results.push(rel);
      }
    }
  };
  walk(root);
  return results;
}

function makeCheck(id, passed, detail, payload = {}, proof = []) {
  return { id, passed, detail, payload, proof };
}

function extractVisibleCount(bodyText, label) {
  const match = bodyText.match(new RegExp(`([0-9][\\d,]*)\\s+${label}`, 'i'));
  return match ? Number(match[1].replace(/,/g, '')) : 0;
}

function endpointContractCheck() {
  const api = read(files.api);
  const controller = read(files.controller);
  const missingFrontend = [];
  const missingBackend = [];
  const routeProof = [];

  for (const [name, frontendNeedle, backendNeedle] of requiredRoutes) {
    const frontendOk = api.includes(frontendNeedle);
    const backendOk = controller.includes(backendNeedle);
    if (!frontendOk) missingFrontend.push(name);
    if (!backendOk) missingBackend.push(name);
    if (frontendOk && backendOk) {
      routeProof.push({
        name,
        frontend: findLine(files.api, frontendNeedle.replace('`${BASE}', '${BASE}')),
        backend: findLine(files.controller, backendNeedle),
      });
    }
  }

  return makeCheck(
    'endpoint-contract.frontend-backend-county-study-routes',
    missingFrontend.length === 0 && missingBackend.length === 0,
    `required=${requiredRoutes.length}, missingFrontend=${missingFrontend.length}, missingBackend=${missingBackend.length}`,
    {
      requiredRoutes: requiredRoutes.map(([name]) => name),
      missingFrontend,
      missingBackend,
      routeProof,
    },
    [files.api, files.controller],
  );
}

function dataFlowCheck() {
  const serviceText = [
    files.service,
    files.derivation,
    files.health,
    files.inspector,
    files.ai,
  ].map(read).join('\n');
  const requiredCanonicalSources = [
    'Properties',
    'CamaCharacteristics',
    'ComparableSales',
    'PacsValuation',
    'CountySegments',
  ];
  const missing = requiredCanonicalSources.filter((source) => !serviceText.includes(source));
  const hasEf = /AsNoTracking\(|ToListAsync\(|SaveChangesAsync\(/.test(serviceText);
  return makeCheck(
    'data-flow.real-canonical-county-study-services',
    missing.length === 0 && hasEf,
    missing.length === 0 && hasEf
      ? 'County Studio services derive health, segments, AI diagnosis, and inspector evidence from EF-backed canonical tables.'
      : `missing canonical sources=${missing.join(', ') || 'none'}, ef=${hasEf}`,
    {
      requiredCanonicalSources,
      missing,
      entityFrameworkEvidence: hasEf,
      serviceFiles: [files.service, files.derivation, files.health, files.inspector, files.ai],
    },
    [
      findLine(files.derivation, 'Properties'),
      findLine(files.derivation, 'ComparableSales'),
      findLine(files.derivation, 'PacsValuation'),
      findLine(files.health, 'CountySegments'),
    ],
  );
}

function mockAuditCheck() {
  const productionFiles = [
    ...listFiles('frontend/apps/os-shell/src/pages/forge/county-studio', (rel) =>
      /\.(ts|tsx)$/.test(rel) && !rel.includes('/__tests__/')),
    files.controller,
    files.service,
    files.derivation,
    files.health,
    files.inspector,
    files.ai,
  ];
  const disallowed = /\b(mock|stub|fixture|fake|sample data)\b/i;
  const hits = [];
  for (const rel of productionFiles) {
    const lines = read(rel).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (disallowed.test(line)) {
        hits.push({ file: rel, line: index + 1, text: line.trim().slice(0, 180) });
      }
    });
  }
  return makeCheck(
    'mock-audit.no-county-studio-production-mocks',
    hits.length === 0,
    hits.length === 0
      ? 'No mock/stub/fixture/fake/sample-data markers in County Studio production paths.'
      : `production mock markers found=${hits.length}`,
    { scannedFiles: productionFiles.length, hits },
    productionFiles.slice(0, 12),
  );
}

function cityDoctrineCheck() {
  const invariant = read(files.invariant);
  const riskSurface = read(files.riskSurface);
  const healthPanel = read(files.healthPanel);
  const sanitizer = read(files.sanitizer);
  const primaryLeakPatterns = [
    'setSelectedCity',
    "drillLevel: 'city'",
    "rollupScope: 'city'",
    'selectedCity',
    'City Rollups',
  ];
  const riskSurfaceLeaks = primaryLeakPatterns.filter((needle) => riskSurface.includes(needle));
  const healthPanelLeaks = primaryLeakPatterns.filter((needle) => healthPanel.includes(needle));
  const sanitizerOk = ['cityName', 'selectedCity', "rollupScope') === 'city'"].every((needle) => sanitizer.includes(needle));
  const invariantOk = invariant.includes('Primary drill paths must not depend on city.');
  return makeCheck(
    'city-doctrine.city-reference-only-primary-path-clean',
    invariantOk && sanitizerOk && riskSurfaceLeaks.length === 0 && healthPanelLeaks.length === 0,
    `invariant=${invariantOk}, sanitizer=${sanitizerOk}, riskSurfaceLeaks=${riskSurfaceLeaks.length}, healthPanelLeaks=${healthPanelLeaks.length}`,
    {
      invariant: 'Primary drill paths must not depend on city.',
      cityReferenceOnly: true,
      riskSurfaceLeaks,
      healthPanelLeaks,
    },
    [
      findLine(files.invariant, 'Primary drill paths must not depend on city.'),
      findLine(files.riskSurface, 'Unified Risk Ledger'),
      findLine(files.sanitizer, 'CITY_PRIMARY_KEYS'),
    ],
  );
}

function gisContractCheck() {
  const embeddedAtlas = read(files.embeddedAtlas);
  const riskSurface = read(files.riskSurface);
  const countyPage = read(files.countyPage);
  const atlasLiveApi = read(files.atlasLiveApi);
  const requiredEmbeddedTokens = [
    'county-studio-atlas-workspace',
    'county-studio-embedded-atlas-canvas',
    'primary-center-surface',
    'useAtlasMapData',
    'GeoForgeV2Map',
    'AtlasOverlayManager',
    'Parcels',
    'Parcel boundaries',
    'Neighborhoods',
    'County segments',
    'Reval areas',
    'Taxing districts',
    'Layer configuration',
    'Valuation risk',
    'Ratio / COD / PRD risk',
    'Comparable sales clusters',
    'Model groups',
    'Value tiers',
    'CAMA characteristic anomalies',
    'Segment health',
    "activateModule('property-workbench'",
    "initialTab: 'atlas'",
    "forge: 'parcel-valuation'",
    "dossier: 'evidence'",
  ];
  const missingEmbeddedTokens = requiredEmbeddedTokens.filter((token) => !embeddedAtlas.includes(token));
  const commandCenterEmbeds = riskSurface.includes('EmbeddedAtlasGisWorkspace');
  const atlasGeometryContracts = [
    'fetchAtlasCompatibilityMapData',
    'fetchGeoForgeCompatibilityOutlines',
    'fetchGeoForgeCompatibilityParcels',
  ].filter((token) => atlasLiveApi.includes(token));
  const popOutOnly =
    countyPage.includes('Open in TerraAtlas')
    && !riskSurface.includes('EmbeddedAtlasGisWorkspace')
    && !embeddedAtlas.includes('county-studio-embedded-atlas-canvas');
  const countyStudioFiles = listFiles('frontend/apps/os-shell/src/pages/forge/county-studio', (rel) =>
    /\.(ts|tsx)$/.test(rel) && !rel.includes('/__tests__/'));
  const forbiddenWritePatterns = [
    /\baddSource\s*\(/,
    /\bsetData\s*\(/,
    /\baddLayer\s*\(/,
    /\bsetPaintProperty\s*\(/,
    /\bsetLayoutProperty\s*\(/,
    /method:\s*['"](?:POST|PUT|PATCH|DELETE)['"].*atlas/si,
  ];
  const writeHits = [];
  for (const rel of countyStudioFiles) {
    const lines = read(rel).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (forbiddenWritePatterns.some((pattern) => pattern.test(line))) {
        writeHits.push({ file: rel, line: index + 1, text: line.trim().slice(0, 180) });
      }
    });
  }

  return makeCheck(
    'gis-contract.embedded-atlas-primary-center-surface',
    missingEmbeddedTokens.length === 0
      && commandCenterEmbeds
      && atlasGeometryContracts.length === 3
      && !popOutOnly
      && writeHits.length === 0,
    `missingEmbeddedTokens=${missingEmbeddedTokens.length}, commandCenterEmbeds=${commandCenterEmbeds}, atlasGeometryContracts=${atlasGeometryContracts.length}, popOutOnly=${popOutOnly}, countyStudioGisWriteHits=${writeHits.length}`,
    {
      requiredEmbeddedTokens,
      missingEmbeddedTokens,
      commandCenterEmbeds,
      atlasGeometryContracts,
      popOutOnly,
      countyStudioGisWriteHits: writeHits,
      ownership: {
        terraAtlas: ['geometry', 'layers', 'symbology', 'boundaries', 'annotations', 'bookmarks', 'neighborhood definitions'],
        terraForge: ['valuation risk overlay', 'ratio/COD/PRD context', 'model groups', 'value tiers', 'segment health'],
      },
    },
    [
      findLine(files.embeddedAtlas, 'county-studio-embedded-atlas-canvas'),
      findLine(files.embeddedAtlas, 'GeoForgeV2Map'),
      findLine(files.embeddedAtlas, "activateModule('property-workbench'"),
      findLine(files.riskSurface, 'EmbeddedAtlasGisWorkspace'),
      findLine(files.atlasLiveApi, 'fetchAtlasCompatibilityMapData'),
    ],
  );
}

function handoffCheck() {
  const objectInspector = read(files.objectInspector);
  const neighborhoodInspector = read(files.neighborhoodInspector);
  const adjustmentPanel = read(files.adjustmentPanel);
  const exportModal = read(files.exportModal);
  const markdown = read(files.markdown);
  const required = [
    [files.objectInspector, objectInspector, 'sanitizeCountyStudioHandoffQuery'],
    [files.objectInspector, objectInspector, "activateModule('property-workbench'"],
    [files.objectInspector, objectInspector, "window.open(`/forge/atlas-live?"],
    [files.objectInspector, objectInspector, "'_blank'"],
    [files.objectInspector, objectInspector, "'noopener,noreferrer'"],
    [files.objectInspector, objectInspector, "moduleId: 'suite-dais' | 'suite-dossier'"],
    [files.neighborhoodInspector, neighborhoodInspector, "rollupScope: 'neighborhood'"],
    [files.adjustmentPanel, adjustmentPanel, 'stripCityPrimaryKeys'],
    [files.adjustmentPanel, adjustmentPanel, 'metadata.effectiveScope'],
    [files.adjustmentPanel, adjustmentPanel, "activateModule('suite-dossier'"],
    [files.exportModal, exportModal, 'stripCityPrimaryKeys'],
    [files.markdown, markdown, 'Top Risk Segment Signals'],
  ];
  const missing = required
    .filter(([, content, needle]) => !content.includes(needle))
    .map(([rel, , needle]) => `${rel} :: ${needle}`);
  return makeCheck(
    'handoffs.atlas-dossier-workbench-valuation-context',
    missing.length === 0,
    missing.length === 0
      ? 'Atlas, Dossier, Workbench, evidence export, and apply handoff paths carry valuation context through city sanitizers.'
      : `missing handoff context tokens=${missing.length}`,
    { missing },
    [
      findLine(files.objectInspector, 'sanitizeCountyStudioHandoffQuery'),
      findLine(files.objectInspector, "activateModule('property-workbench'"),
      findLine(files.adjustmentPanel, 'metadata.effectiveScope'),
      findLine(files.exportModal, 'stripCityPrimaryKeys'),
    ],
  );
}

function toolsInventoryCheck() {
  const cli = [
    'tools/tdc/cli/src/index.ts',
    'tools/bin/commands/FORGE_CLI.md',
    'os-platform/core/pilot/local-agent/help.ts',
  ].filter(relExists);
  const redis = [
    'backend/src/TerraFusion.Core/Services/RedisCacheService.cs',
    'backend/src/TerraFusion.Core/Services/Monitoring/HealthChecks/RedisHealthCheck.cs',
    'config/redis/redis-master.conf',
  ].filter(relExists);
  const rustEngines = [
    'packages/terrabuild/kernels/terraforge.kernel.valuation/Cargo.toml',
    'packages/terrabuild/kernels/terraforge.kernel.cost/Cargo.toml',
    'tools/tf-designctl-rust/Cargo.toml',
  ].filter(relExists);
  const prometheus = [
    'backend/src/TerraFusion.API/Monitoring/PrometheusConfig.cs',
    'backend/monitoring/prometheus.yml',
    'compose/prometheus.yml',
    'backend/tests/TerraFusion.Unit.Tests/Observability/PrometheusLaneMetricsTests.cs',
  ].filter(relExists);
  return makeCheck(
    'tools.cli-redis-rust-prometheus-inventory',
    cli.length > 0 && redis.length > 0 && rustEngines.length > 0 && prometheus.length > 0,
    `cli=${cli.length}, redis=${redis.length}, rustEngines=${rustEngines.length}, prometheus=${prometheus.length}`,
    {
      cli,
      redis,
      rustEngines,
      prometheus,
      excludedAsNotCodexScope: ['packages/terra-sync/**', '.claude/worktrees/**', 'DB seeding lanes'],
      note: 'Inventory proves these layers exist; this gate does not claim County Studio uses every engine or that Prometheus/Redis are deployed in the current runtime.',
    },
    [...cli, ...redis, ...rustEngines, ...prometheus],
  );
}

async function runtimeCheck(options) {
  if (options.skipRuntime || !options.runtimeUrl) {
    return makeCheck(
      'runtime.screenshot-contract-ready',
      true,
      'Runtime capture skipped; screenshot contract is ready. Run with --runtime-url to capture proof.',
      {
        mode: 'skipped',
        command: 'node os-platform/core/pilot/county-studio-r1-production-proof.mjs --runtime-url http://127.0.0.1:5175/forge/county-studio',
        requiredVisibleSignals: ['County Studio', 'Roll Posture', 'Embedded TerraAtlas GIS', 'Lens: Roll Readiness', 'Layers: Atlas live', 'Critical equity failure', 'Not defensible for certification', 'Unified Risk Ledger'],
      },
      ['os-platform/core/pilot/ops/june10-benton-uat-screenshot-checklist-2026-05-13.md'],
    );
  }

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch (error) {
    return makeCheck(
      'runtime.screenshot-contract-ready',
      false,
      `Playwright unavailable: ${error.message}`,
      { mode: 'runtime', url: options.runtimeUrl, screenshot: null, consoleErrors: [] },
    );
  }

  mkdirSync(options.screenshotDir, { recursive: true });
  const screenshotPath = path.join(options.screenshotDir, 'county-studio-r1-production-proof.png');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    await page.addInitScript(() => {
      localStorage.setItem('tf.session.dev', JSON.stringify({
        userId: 'dev-user',
        countyId: '19190019-1919-1919-1919-191919191919',
        role: 'dev',
        mode: 'pilot',
      }));
    });
    await page.goto(options.runtimeUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.getByRole('button', { name: 'Open Study' }).click({ timeout: 30000 }).catch(() => null);
    await page.getByText('Existing Studies').waitFor({ timeout: 30000 }).catch(() => null);
    const studyChoices = page
      .locator('button')
      .filter({ hasText: /RatioStudy|MassAppraisal|IncomeApproach|CostApproach/ });
    await studyChoices.first().waitFor({ timeout: 30000 }).catch(() => null);
    const studyChoiceCount = await studyChoices.count().catch(() => 0);
    for (let index = 0; index < studyChoiceCount; index += 1) {
      if (index > 0) {
        await page.getByRole('button', { name: 'Open Study' }).click({ timeout: 30000 }).catch(() => null);
        await page.getByText('Existing Studies').waitFor({ timeout: 30000 }).catch(() => null);
      }
      await studyChoices.nth(index).click({ timeout: 30000 }).catch(() => null);
      await page.waitForFunction(
        () => !document.body.innerText.includes('No study open'),
        { timeout: 30000 },
      ).catch(() => null);
      const dataReady = await page.waitForFunction(
        () => {
          const text = document.body.innerText;
          const count = (label) => {
            const match = text.match(new RegExp(`([1-9][\\d,]*)\\s+${label}`, 'i'));
            return match ? Number(match[1].replace(/,/g, '')) : 0;
          };
          return text.includes('ATLAS LIVE')
            && !text.includes('No study open')
            && !text.includes('Loading countywide health metrics')
            && count('segments') > 0
            && count('risk objects') > 0;
        },
        { timeout: 20000 },
      ).then(() => true).catch(() => false);
      if (dataReady) break;
    }
    const requiredVisibleSignals = [
      'County Studio',
      'Roll Posture',
      'Embedded TerraAtlas GIS',
      'Lens: Roll Readiness',
      'Layers: Atlas live',
      'Roll Readiness',
      'Critical equity failure',
      'Not defensible for certification',
      'Unified Risk Ledger',
      'Open in TerraAtlas',
    ];
    const disallowedVisibleSignals = [
      'City Rollups',
      'Mapbox token missing',
      'Atlas map data unavailable',
      'map-unavailable',
      'ATLAS DISCONNECTED',
      'Living County Risk Map',
      'TerraAtlas-owned layers',
      'Forge-owned overlays',
      'Selected Risk Object',
      'Operational Focus',
      'Next best action',
      'Statistics Compat',
      'command-metric-ratio',
    ];
    await page.waitForFunction(
      (signals) => signals.some((signal) => document.body.innerText.includes(signal)),
      requiredVisibleSignals,
      { timeout: 30000 },
    ).catch(() => null);
    await page.waitForSelector('[data-testid="county-studio-embedded-atlas-canvas"]', { timeout: 30000 }).catch(() => null);
    await page.waitForSelector('[data-testid="county-studio-atlas-loading"]', { state: 'hidden', timeout: 45000 }).catch(() => null);
    await page.waitForFunction(
      () => {
        const text = document.body.innerText;
        const count = (label) => {
          const match = text.match(new RegExp(`([1-9][\\d,]*)\\s+${label}`, 'i'));
          return match ? Number(match[1].replace(/,/g, '')) : 0;
        };
        return text.includes('ATLAS LIVE')
          && !text.includes('No study open')
          && !text.includes('Loading countywide health metrics')
          && count('segments') > 0
          && count('risk objects') > 0;
      },
      { timeout: 60000 },
    ).catch(() => null);
    const bodyText = await page.locator('body').innerText({ timeout: 10000 });
    const bodyTextLower = bodyText.toLowerCase();
    const embeddedCanvasCount = await page.locator('[data-testid="county-studio-embedded-atlas-canvas"]').count();
    const mapCanvasCount = await page.locator('[data-testid="county-studio-embedded-atlas-canvas"] canvas').count();
    const prometheusRiskLabelCount = await page.locator('[data-testid="prometheus-risk-map-label"]').count();
    const segmentCount = extractVisibleCount(bodyText, 'segments');
    const riskObjectCount = extractVisibleCount(bodyText, 'risk objects');
    const atlasLiveVisible = bodyText.includes('ATLAS LIVE');
    const studyOpenVisible = !bodyText.includes('No study open');
    const loadingHealthMetricsVisible = bodyText.includes('Loading countywide health metrics');
    const layoutGeometry = await page.evaluate(() => {
      const rectFor = (selector) => {
        const node = document.querySelector(selector);
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
      };
      const overlaps = (a, b) => Boolean(a && b
        && a.left < b.right
        && a.right > b.left
        && a.top < b.bottom
        && a.bottom > b.top);
      const stage = rectFor('[data-testid="county-studio-gis-stage"]');
      const analytics = rectFor('[data-testid="county-studio-bottom-analytics"]');
      const rightRail = rectFor('[data-testid="cs-right-rail"]');
      const commandSurface = rectFor('[data-testid="cs-drill-panel"]');
      const visibleWithin = (rect, clip) => {
        if (!rect || !clip) return rect;
        return {
          ...rect,
          top: Math.max(rect.top, clip.top),
          right: Math.min(rect.right, clip.right),
          bottom: Math.min(rect.bottom, clip.bottom),
          left: Math.max(rect.left, clip.left),
          width: Math.max(0, Math.min(rect.right, clip.right) - Math.max(rect.left, clip.left)),
          height: Math.max(0, Math.min(rect.bottom, clip.bottom) - Math.max(rect.top, clip.top)),
        };
      };
      const visibleAnalytics = visibleWithin(analytics, commandSurface);
      const dock = Array.from(document.querySelectorAll('[role="navigation"]'))
        .map((node) => {
          const style = window.getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return {
            node,
            style,
            rect: {
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            },
          };
        })
        .find((entry) => entry.style.position === 'fixed' && entry.rect.bottom > window.innerHeight - 140)?.rect ?? null;
      return {
        stage,
        analytics,
        visibleAnalytics,
        rightRail,
        commandSurface,
        dock,
        mapDoesNotOverlapAnalytics: Boolean(stage && analytics && !overlaps(stage, analytics)),
        mapDoesNotOverlapRightRail: Boolean(stage && rightRail && !overlaps(stage, rightRail)),
        dockDoesNotOverlapCommandSurface: Boolean(!dock || (commandSurface && !overlaps(dock, commandSurface))),
        dockDoesNotOverlapBottomQueue: Boolean(!dock || (visibleAnalytics && !overlaps(dock, visibleAnalytics))),
      };
    });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const missingVisibleSignals = requiredVisibleSignals.filter((signal) => !bodyTextLower.includes(signal.toLowerCase()));
    const disallowedVisibleHits = disallowedVisibleSignals.filter((signal) => bodyTextLower.includes(signal.toLowerCase()));
    return makeCheck(
      'runtime.screenshot-contract-ready',
      missingVisibleSignals.length === 0
        && disallowedVisibleHits.length === 0
        && embeddedCanvasCount > 0
        && mapCanvasCount > 0
        && prometheusRiskLabelCount > 0
        && atlasLiveVisible
        && studyOpenVisible
        && segmentCount > 0
        && riskObjectCount > 0
        && !loadingHealthMetricsVisible
        && layoutGeometry.mapDoesNotOverlapAnalytics
        && layoutGeometry.mapDoesNotOverlapRightRail
        && layoutGeometry.dockDoesNotOverlapCommandSurface
        && layoutGeometry.dockDoesNotOverlapBottomQueue
        && consoleErrors.length === 0,
      `missingVisibleSignals=${missingVisibleSignals.length}, disallowedVisibleHits=${disallowedVisibleHits.length}, embeddedCanvasCount=${embeddedCanvasCount}, mapCanvasCount=${mapCanvasCount}, prometheusRiskLabelCount=${prometheusRiskLabelCount}, segmentCount=${segmentCount}, riskObjectCount=${riskObjectCount}, atlasLiveVisible=${atlasLiveVisible}, loadingHealthMetricsVisible=${loadingHealthMetricsVisible}, mapDoesNotOverlapAnalytics=${layoutGeometry.mapDoesNotOverlapAnalytics}, mapDoesNotOverlapRightRail=${layoutGeometry.mapDoesNotOverlapRightRail}, dockDoesNotOverlapCommandSurface=${layoutGeometry.dockDoesNotOverlapCommandSurface}, dockDoesNotOverlapBottomQueue=${layoutGeometry.dockDoesNotOverlapBottomQueue}, consoleErrors=${consoleErrors.length}`,
      {
        mode: 'runtime',
        url: options.runtimeUrl,
        screenshot: path.relative(repoRoot, screenshotPath).replace(/\\/g, '/'),
        requiredVisibleSignals,
        missingVisibleSignals,
        disallowedVisibleSignals,
        disallowedVisibleHits,
        embeddedCanvasCount,
        mapCanvasCount,
        prometheusRiskLabelCount,
        segmentCount,
        riskObjectCount,
        atlasLiveVisible,
        studyOpenVisible,
        loadingHealthMetricsVisible,
        layoutGeometry,
        consoleErrors,
      },
      [path.relative(repoRoot, screenshotPath).replace(/\\/g, '/')],
    );
  } finally {
    await browser.close();
  }
}

function markdownReport(report) {
  const lines = [
    '# County Studio R1 Production Proof',
    '',
    `Checked: ${report.checkedAt}`,
    `Status: ${report.status}`,
    `Decision: ${report.decision}`,
    '',
    '## Doctrine',
    '',
    '- Primary drill paths must not depend on city.',
    '- City is reference metadata only; valuation analysis runs through risk surfaces, revaluation cycle, neighborhood, segment/model context, taxing district exposure, and parcel evidence.',
    '- Sync and DB seeding lanes are excluded from this Codex scope.',
    '',
    '## Checks',
    '',
    '| Check | Result | Detail | Proof |',
    '| --- | --- | --- | --- |',
    ...report.checks.map((check) =>
      `| ${check.id} | ${check.passed ? 'PASS' : 'FAIL'} | ${check.detail} | ${check.proof.map((item) => `\`${item}\``).join('<br>')} |`),
    '',
    '## Runtime Screenshot Contract',
    '',
    `Mode: \`${report.runtime.mode}\``,
    report.runtime.screenshot ? `Screenshot: \`${report.runtime.screenshot}\`` : 'Screenshot: not captured in this run',
    '',
    '## Tooling Inventory',
    '',
    `- CLI surfaces: ${report.tooling.cli.map((item) => `\`${item}\``).join(', ')}`,
    `- Redis surfaces: ${report.tooling.redis.map((item) => `\`${item}\``).join(', ')}`,
    `- Rust engines: ${report.tooling.rustEngines.map((item) => `\`${item}\``).join(', ')}`,
    `- Prometheus surfaces: ${report.tooling.prometheus.map((item) => `\`${item}\``).join(', ')}`,
    '',
  ];
  return `${lines.join('\n')}\n`;
}

async function main() {
  const options = parseArgs(process.argv);
  const checks = [
    endpointContractCheck(),
    dataFlowCheck(),
    mockAuditCheck(),
    cityDoctrineCheck(),
    gisContractCheck(),
    handoffCheck(),
    toolsInventoryCheck(),
    await runtimeCheck(options),
  ];
  const failures = checks.filter((check) => !check.passed);
  const tools = checks.find((check) => check.id === 'tools.cli-redis-rust-prometheus-inventory').payload;
  const runtime = checks.find((check) => check.id === 'runtime.screenshot-contract-ready').payload;
  const runtimeCaptured = runtime.mode === 'runtime' && failures.length === 0;

  const report = {
    checkedAt: new Date().toISOString(),
    slice: 'county-studio-r1-production-proof',
    status: failures.length === 0 ? 'PASS' : 'FAIL',
    decision: failures.length === 0
      ? runtimeCaptured
        ? 'COUNTY_STUDIO_R1_RUNTIME_PRODUCTION_PROOF_READY'
        : 'COUNTY_STUDIO_R1_STATIC_PRODUCTION_PROOF_READY'
      : 'COUNTY_STUDIO_R1_PRODUCTION_PROOF_BLOCKED',
    scope: {
      included: ['County Studio', 'TerraForge suite handoffs', 'core pilot evidence gate'],
      excluded: {
        syncAndDbSeeding: true,
        paths: ['packages/terra-sync/**', '.claude/worktrees/**', 'DB seeding lanes'],
      },
    },
    invariants: {
      primaryDrillPathsMustNotDependOnCity: checks.find((check) => check.id === 'city-doctrine.city-reference-only-primary-path-clean').passed,
    },
    checks,
    failures,
    runtime,
    tooling: {
      cli: tools.cli,
      redis: tools.redis,
      rustEngines: tools.rustEngines,
      prometheus: tools.prometheus,
    },
  };

  mkdirSync(path.dirname(options.out), { recursive: true });
  mkdirSync(path.dirname(options.markdownOut), { recursive: true });
  writeFileSync(options.out, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(options.markdownOut, markdownReport(report));

  console.log(JSON.stringify({
    status: report.status,
    decision: report.decision,
    failures: failures.length,
    evidence: [
      path.relative(repoRoot, options.out).replace(/\\/g, '/'),
      path.relative(repoRoot, options.markdownOut).replace(/\\/g, '/'),
    ],
    screenshot: report.runtime.screenshot ?? null,
  }, null, 2));

  if (failures.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

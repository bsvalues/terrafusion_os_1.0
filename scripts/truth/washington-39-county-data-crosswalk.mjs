#!/usr/bin/env node

/**
 * June 10 - Washington 39-County Data Crosswalk
 *
 * Read-only evidence crosswalk. This proves what county data assets exist and
 * whether they have runtime lineage evidence. It does not promote counties,
 * repair ingestion, or certify runtime readiness by registry presence alone.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const outDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(outDir, 'washington-39-county-data-crosswalk.json');
const outMd = path.join(outDir, 'washington-39-county-data-crosswalk.md');

const counties = [
  'Adams',
  'Asotin',
  'Benton',
  'Chelan',
  'Clallam',
  'Clark',
  'Columbia',
  'Cowlitz',
  'Douglas',
  'Ferry',
  'Franklin',
  'Garfield',
  'Grant',
  'Grays Harbor',
  'Island',
  'Jefferson',
  'King',
  'Kitsap',
  'Kittitas',
  'Klickitat',
  'Lewis',
  'Lincoln',
  'Mason',
  'Okanogan',
  'Pacific',
  'Pend Oreille',
  'Pierce',
  'San Juan',
  'Skagit',
  'Skamania',
  'Snohomish',
  'Spokane',
  'Stevens',
  'Thurston',
  'Wahkiakum',
  'Walla Walla',
  'Whatcom',
  'Whitman',
  'Yakima',
];

const scanRoots = [
  'docs/Washington Counties/implementation/reports/payloads',
  'data/benton',
  'data/cost-matrices',
  'data/county-intelligence',
  'data/intelligence',
  'data/databases/county-databases',
  'data/public',
  'data/yakima',
  'scripts/public-data',
  'backend/src/TerraFusion.Core/Sync/Scrapers',
  'backend/src/TerraFusion.API/Controllers/CountyRowsController.cs',
  'backend/src/TerraFusion.API/Controllers/CountyStudyController.cs',
  'backend/src/TerraFusion.API/Controllers/CostForgeController.cs',
  'backend/src/TerraFusion.API/Controllers/SalesAuditController.cs',
  'backend/src/TerraFusion.API/Controllers/TerraForgeController.cs',
  'frontend/apps/os-shell/src/pages/forge',
];

const ignoredPathParts = new Set([
  '.git',
  '.cache',
  '.claude',
  '.codex',
  '.next',
  '.turbo',
  'node_modules',
  'generated',
  'obj',
  'bin',
  'target',
  'coverage',
  'dist',
]);

const textExtensions = new Set([
  '.cs',
  '.csv',
  '.json',
  '.jsonl',
  '.js',
  '.mjs',
  '.md',
  '.sql',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeJson(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch {
    return null;
  }
}

function safeRead(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 1_000_000) return '';
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function countyAppears(filePath, content, county) {
  const relative = rel(filePath);
  const joined = `${relative}\n${content}`;
  const tokenPattern = county.split(/\s+/).filter(Boolean).map(escapeRegex).join('[^a-z0-9]+');
  const boundaryRegex = new RegExp(`(^|[^a-z0-9])${tokenPattern}([^a-z0-9]|$)`, 'i');

  if (boundaryRegex.test(joined)) return true;
  if (county.includes(' ')) return normalize(relative).includes(normalize(county));

  return false;
}

function isIgnored(filePath) {
  const parts = rel(filePath).split('/');
  return parts.some(part => ignoredPathParts.has(part) || /^archive$/i.test(part));
}

function listFiles() {
  const walkedFiles = scanRoots.flatMap(root => walk(path.join(repoRoot, root)));

  try {
    const output = execFileSync(
      'git',
      ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    );

    const gitFiles = output
      .split('\0')
      .filter(Boolean)
      .map(file => path.join(repoRoot, file))
      .filter(file => fs.existsSync(file) && fs.statSync(file).isFile())
      .filter(file => scanRoots.some(root => rootMatches(rel(file), root)))
      .filter(file => !isIgnored(file));

    return [...new Set([...gitFiles, ...walkedFiles])].filter(file => !isIgnored(file));
  } catch {
    return walkedFiles.filter(file => !isIgnored(file));
  }
}

function rootMatches(relativePath, root) {
  const lowerRelative = relativePath.toLowerCase();
  const lowerRoot = root.toLowerCase();
  return (
    lowerRelative === lowerRoot || lowerRelative.startsWith(`${lowerRoot.replace(/\/$/, '')}/`)
  );
}

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const rootStat = fs.statSync(dir);
  if (rootStat.isFile()) {
    results.push(dir);
    return results;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredPathParts.has(entry.name)) walk(fullPath, results);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function estimateRows(filePath, content) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.csv') {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    return Math.max(0, lines.length - 1);
  }

  if (ext === '.jsonl') {
    return content.split(/\r?\n/).filter(line => line.trim()).length;
  }

  if (ext === '.json') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed.length;
      if (parsed && typeof parsed === 'object') {
        const arrays = Object.values(parsed).filter(Array.isArray);
        if (arrays.length) return Math.max(...arrays.map(value => value.length));
      }
    } catch {
      return null;
    }
  }

  if (ext === '.sql') {
    return (content.match(/\binsert\s+into\b/gi) ?? []).length;
  }

  return null;
}

function classifyAsset(filePath, content) {
  const relative = rel(filePath).toLowerCase();
  const lowerContent = content.toLowerCase();
  const categories = [];

  if (relative.includes('/payloads/')) categories.push('public_payload');
  if (relative.startsWith('data/')) categories.push('local_data');
  if (
    /scrap|crawler|adapter|harvest|acquisition/.test(relative) ||
    /\b(scraper|crawler|adapter|harvest)\b/.test(lowerContent)
  ) {
    categories.push('scraper_or_adapter');
  }
  if (
    /controller|api|route|fetch\(|axios\.|endpoint/.test(relative) ||
    /router\.|app\.|fetch\(/.test(lowerContent)
  ) {
    categories.push('api_or_ui');
  }
  if (
    /demo|sample|synthetic|fake|mock|fixture/.test(relative) ||
    /demo|sample|synthetic|fake|mock|fixture/.test(lowerContent)
  ) {
    categories.push('demo_or_sample');
  }

  return categories.length ? categories : ['other_evidence'];
}

function evidenceByCounty(files) {
  const byCounty = new Map(counties.map(county => [county, []]));

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const content = textExtensions.has(ext) ? safeRead(filePath) : '';

    for (const county of counties) {
      if (!countyAppears(filePath, content, county)) continue;

      byCounty.get(county).push({
        path: rel(filePath),
        categories: classifyAsset(filePath, content),
        rowEstimate: estimateRows(filePath, content),
      });
    }
  }

  return byCounty;
}

function runtimeInfo(county, runtimeLedger, candidateSet) {
  const ledgerRow = runtimeLedger?.rows?.find(row => row.county === county);
  const candidateRow = candidateSet?.rows?.find(row => row.county === county);

  return {
    runtimeClass: ledgerRow?.readinessClass ?? candidateRow?.runtimeReadinessClass ?? 'unknown',
    runtimeRows: ledgerRow?.parcelRows ?? ledgerRow?.runtimeRows ?? candidateRow?.runtimeRows ?? 0,
    runtimeAction: ledgerRow?.recommendedAction ?? candidateRow?.recommendedAction ?? 'unknown',
    runtimeBlockers: ledgerRow?.blockers ?? candidateRow?.blockers ?? [],
  };
}

function classifyCounty({ registry, assets, runtime }) {
  const hasRuntimeRows = Number(runtime.runtimeRows) > 0;
  const hasRuntimeProven = runtime.runtimeClass === 'runtime_proven';
  const hasPayload = assets.some(asset => asset.categories.includes('public_payload'));
  const hasLocalData = assets.some(asset => asset.categories.includes('local_data'));
  const hasAdapter = assets.some(asset => asset.categories.includes('scraper_or_adapter'));
  const demoOnly =
    assets.length > 0 && assets.every(asset => asset.categories.includes('demo_or_sample'));

  if (hasRuntimeProven && hasRuntimeRows) return 'runtime_proven';
  if (hasRuntimeRows || runtime.runtimeClass === 'registered_empty') return 'runtime_unproven';
  if ((hasPayload || hasLocalData || hasAdapter) && !demoOnly) return 'public_source_seed';
  return 'provenance_inventory_only';
}

function buildRows() {
  const coverage = safeJson(
    'os-platform/core/pilot/evidence/washington-39-county-coverage.latest.json'
  );
  const inventory = safeJson('generated/truth/data-source-truth-inventory.json');
  const runtimeLedger = safeJson('generated/truth/county-runtime-registration-ledger.json');
  const candidateSet = safeJson('generated/truth/runtime-candidate-set.json');
  const productLoadLedger = safeJson('generated/truth/terrafusion-db-product-load-ledger.json');
  const byCounty = evidenceByCounty(listFiles());
  const coverageRows = new Map((coverage?.counties ?? []).map(row => [row.county, row]));
  const inventoryRows = new Map((inventory?.rows ?? []).map(row => [row.county, row]));

  return counties.map(county => {
    const registry = coverageRows.get(county) ?? {};
    const inventoryRow = inventoryRows.get(county) ?? {};
    const assets = byCounty.get(county) ?? [];
    const runtime = runtimeInfo(county, runtimeLedger, candidateSet);
    const rowEstimate = assets.reduce(
      (sum, asset) => sum + (Number.isFinite(asset.rowEstimate) ? asset.rowEstimate : 0),
      0
    );
    const classification = classifyCounty({ registry, assets, runtime });
    const blockers = [];

    if (registry.status === 'not-started') blockers.push('Registry status is not-started.');
    if (registry.acquisitionFamily === 'Unknown') blockers.push('Acquisition family is unknown.');
    if (classification !== 'runtime_proven') blockers.push('No county runtime lineage proof.');
    if (!productLoadLedger || productLoadLedger.summary?.lineageProven === 0) {
      blockers.push('No product-load receipt proof is available.');
    }
    if (assets.some(asset => asset.categories.includes('demo_or_sample'))) {
      blockers.push('Demo/sample evidence is present and must not be treated as runtime truth.');
    }
    if (runtime.runtimeBlockers?.length) blockers.push(...runtime.runtimeBlockers);

    return {
      county,
      state: 'WA',
      registryStatus: registry.status ?? 'unknown',
      priority: registry.priority ?? 'unknown',
      acquisitionFamily: registry.acquisitionFamily ?? 'unknown',
      officialAssessorBaseUrl: registry.officialAssessorBaseUrl ?? null,
      primarySalesSource: registry.primarySalesSource ?? null,
      payloadFiles: assets
        .filter(asset => asset.categories.includes('public_payload'))
        .map(asset => asset.path)
        .sort(),
      localDataFiles: assets
        .filter(asset => asset.categories.includes('local_data'))
        .map(asset => asset.path)
        .sort(),
      adapterEvidenceFiles: assets
        .filter(asset => asset.categories.includes('scraper_or_adapter'))
        .map(asset => asset.path)
        .sort(),
      apiOrUiEvidenceFiles: assets
        .filter(asset => asset.categories.includes('api_or_ui'))
        .map(asset => asset.path)
        .sort(),
      evidenceFiles: assets.map(asset => asset.path).sort(),
      rowEstimate,
      inventoryClassification: inventoryRow.classification ?? null,
      costForgeReadinessTier:
        inventoryRow.costForgeReadinessTier ?? inventoryRow.costForge?.readinessTier ?? 'unknown',
      costForgeCountyMode:
        inventoryRow.costForgeCountyMode ?? inventoryRow.costForge?.countyMode ?? 'unknown',
      runtimeClass: runtime.runtimeClass,
      runtimeRows: runtime.runtimeRows,
      runtimeAction: runtime.runtimeAction,
      classification,
      blockers: [...new Set(blockers)],
    };
  });
}

function summarize(rows) {
  const byClassification = {};
  const byRegistryStatus = {};

  for (const row of rows) {
    byClassification[row.classification] = (byClassification[row.classification] ?? 0) + 1;
    byRegistryStatus[row.registryStatus] = (byRegistryStatus[row.registryStatus] ?? 0) + 1;
  }

  return {
    countiesChecked: rows.length,
    byClassification,
    byRegistryStatus,
    runtimeProven: rows.filter(row => row.classification === 'runtime_proven').length,
    publicSourceSeed: rows.filter(row => row.classification === 'public_source_seed').length,
    runtimeUnproven: rows.filter(row => row.classification === 'runtime_unproven').length,
    provenanceInventoryOnly: rows.filter(row => row.classification === 'provenance_inventory_only')
      .length,
    countiesWithPayloadFiles: rows.filter(row => row.payloadFiles.length > 0).length,
    countiesWithLocalDataFiles: rows.filter(row => row.localDataFiles.length > 0).length,
    countiesWithAdapterEvidence: rows.filter(row => row.adapterEvidenceFiles.length > 0).length,
    prohibit39CountyRuntimeClaim: rows.some(row => row.classification !== 'runtime_proven'),
  };
}

function renderMd(rows, summary) {
  const table = rows.map(row => {
    const blockers = row.blockers.length ? row.blockers.join('<br>') : '-';
    return [
      row.county,
      row.registryStatus,
      row.acquisitionFamily,
      String(row.payloadFiles.length),
      String(row.localDataFiles.length),
      String(row.adapterEvidenceFiles.length),
      String(row.rowEstimate),
      row.runtimeClass,
      String(row.runtimeRows),
      row.classification,
      blockers,
    ].join(' | ');
  });

  return [
    '# Washington 39-County Data Crosswalk',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    'This is an evidence crosswalk, not a runtime readiness certification.',
    '',
    '## Summary',
    '',
    `- Counties checked: ${summary.countiesChecked}`,
    `- Runtime proven: ${summary.runtimeProven}`,
    `- Runtime unproven: ${summary.runtimeUnproven}`,
    `- Public-source seed: ${summary.publicSourceSeed}`,
    `- Provenance inventory only: ${summary.provenanceInventoryOnly}`,
    `- Counties with payload files: ${summary.countiesWithPayloadFiles}`,
    `- Counties with local data files: ${summary.countiesWithLocalDataFiles}`,
    `- Counties with adapter evidence: ${summary.countiesWithAdapterEvidence}`,
    `- Prohibit 39-county runtime claim: ${summary.prohibit39CountyRuntimeClaim}`,
    '',
    '## County Matrix',
    '',
    '| County | Registry | Family | Payload Files | Local Files | Adapter Files | Row Estimate | Runtime Class | Runtime Rows | Classification | Blockers |',
    '|---|---|---|---:|---:|---:|---:|---|---:|---|---|',
    ...table,
    '',
    '## Rule',
    '',
    'A county is not runtime-ready because it appears in the registry. Runtime readiness requires TerraFusion DB rows, county identity proof, product-load receipts, active/current semantics, and no fallback.',
  ].join('\n');
}

function main() {
  const rows = buildRows();
  const missing = counties.filter(county => !rows.some(row => row.county === county));
  if (missing.length) {
    throw new Error(`Crosswalk missing counties: ${missing.join(', ')}`);
  }

  const summary = summarize(rows);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    outJson,
    JSON.stringify({ generatedAt: new Date().toISOString(), summary, rows }, null, 2)
  );
  fs.writeFileSync(outMd, renderMd(rows, summary));

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(JSON.stringify(summary, null, 2));
}

main();

#!/usr/bin/env node

/**
 * Track 1 - Data Source Truth Inventory
 *
 * Discovers public-data, scraper, database, API, and UI evidence by county.
 * This does not certify runtime lineage and does not repair any flow.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const outDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(outDir, 'data-source-truth-inventory.json');
const outMd = path.join(outDir, 'data-source-truth-inventory.md');
const maxTextBytes = 1_000_000;

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

const ignoreDirs = new Set([
  '.cache',
  '.claude',
  '.codex',
  '.git',
  '.next',
  '.pnpm-store',
  '.turbo',
  'ARCHIVE',
  'build',
  'coverage',
  'dist',
  'generated',
  'node_modules',
  'obj',
  'QUARANTINE',
  'target',
  'vendor',
]);

const textExtensions = new Set([
  '.cs',
  '.csv',
  '.cjs',
  '.env',
  '.js',
  '.json',
  '.jsonl',
  '.jsx',
  '.md',
  '.mjs',
  '.py',
  '.rs',
  '.sql',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);

const dataExtensions = new Set([
  '.csv',
  '.db',
  '.duckdb',
  '.geojson',
  '.gpkg',
  '.json',
  '.jsonl',
  '.parquet',
  '.sqlite',
  '.sqlite3',
  '.sql',
  '.xlsx',
  '.zip',
]);

function normalize(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countyAppears(filePath, content, county) {
  const relative = rel(filePath);
  const joined = `${relative}\n${content}`;
  const tokenPattern = county.split(/\s+/).filter(Boolean).map(escapeRegex).join('[^a-z0-9]+');
  const boundaryRegex = new RegExp(`(^|[^a-z0-9])${tokenPattern}([^a-z0-9]|$)`, 'i');

  if (boundaryRegex.test(joined)) return true;

  // File systems often collapse multi-word county names, e.g. sanjuan_data.sql.
  if (county.includes(' ')) {
    return normalize(relative).includes(normalize(county));
  }

  return false;
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoreDirs.has(entry.name)) continue;
    if (/archive/i.test(entry.name) && entry.isDirectory()) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, results);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}

function safeRead(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > maxTextBytes) return '';
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function isIgnoredPath(filePath) {
  const relative = path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
  if (/^scripts\/truth\/data-source-truth-inventory(\.test)?\.mjs$/.test(relative)) return true;
  const parts = relative.split('/');
  return parts.some(part => ignoreDirs.has(part) || /^archive$/i.test(part));
}

function isInventoryCandidate(filePath) {
  const relative = path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
  const lower = relative.toLowerCase();

  return (
    lower.startsWith('docs/washington counties/') ||
    lower.startsWith('docs/proof/washington-39-county-coverage') ||
    lower.startsWith('backend/src/terrafusion.datamining/') ||
    lower.startsWith('backend/src/terrafusion.core/sync/scrapers/') ||
    lower.startsWith('backend/src/terrafusion.api/controllers/county') ||
    lower.startsWith('backend/src/terrafusion.api/controllers/terraforge') ||
    lower.startsWith('backend/src/terrafusion.api/controllers/salesaudit') ||
    lower.startsWith('backend/src/terrafusion.api/controllers/realdata') ||
    lower.startsWith('backend/src/terrafusion.api/controllers/dataimport') ||
    lower.startsWith('backend/src/terrafusion.api/services/countystudy') ||
    lower.startsWith('data/benton/') ||
    lower.startsWith('data/county-intelligence/') ||
    lower.startsWith('data/intelligence/') ||
    lower.startsWith('data/public/') ||
    lower.startsWith('data/databases/county-databases/') ||
    lower.startsWith('database/migrations/') ||
    lower.startsWith('api/') ||
    lower.startsWith('scripts/public-data/') ||
    lower.startsWith('frontend/apps/os-shell/src/pages/forge/') ||
    lower.startsWith('os-platform/core/pilot/washington-39-county-coverage-proof.mjs') ||
    lower.startsWith('os-platform/core/pilot/evidence/washington-39-county-coverage')
  );
}

function gitVisibleFiles() {
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
    return output
      .split('\0')
      .filter(Boolean)
      .map(item => path.resolve(repoRoot, item))
      .filter(item => fs.existsSync(item) && fs.statSync(item).isFile())
      .filter(item => !isIgnoredPath(item))
      .filter(isInventoryCandidate);
  } catch {
    return null;
  }
}

function commandExists(command) {
  try {
    execFileSync(command, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function estimateRows(filePath, content) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.csv') {
    return Math.max(0, content.split(/\r?\n/).filter(Boolean).length - 1);
  }

  if (ext === '.jsonl') {
    return content.split(/\r?\n/).filter(Boolean).length;
  }

  if (ext === '.json') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed.length;
      if (parsed && typeof parsed === 'object') {
        for (const value of Object.values(parsed)) {
          if (Array.isArray(value)) return value.length;
        }
      }
    } catch {
      return null;
    }
  }

  if (ext === '.sql') {
    return content.match(/insert\s+into/gi)?.length ?? null;
  }

  if ((ext === '.sqlite' || ext === '.sqlite3' || ext === '.db') && commandExists('sqlite3')) {
    try {
      const tableOutput = execFileSync(
        'sqlite3',
        [
          filePath,
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
        ],
        { encoding: 'utf8' }
      );
      const tables = tableOutput
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);
      let total = 0;
      for (const table of tables) {
        const escaped = table.replaceAll('"', '""');
        const countOutput = execFileSync(
          'sqlite3',
          [filePath, `SELECT COUNT(*) FROM "${escaped}";`],
          { encoding: 'utf8' }
        );
        const count = Number.parseInt(countOutput.trim(), 10);
        if (Number.isFinite(count)) total += count;
      }
      return total;
    } catch {
      return null;
    }
  }

  return null;
}

function classifyFile(filePath, content) {
  const relative = rel(filePath);
  const lowerPath = relative.toLowerCase();
  const lowerContent = content.toLowerCase();
  const ext = path.extname(filePath).toLowerCase();
  const isDoc = ext === '.md' || lowerPath.startsWith('docs/');
  const isCode = ['.cs', '.js', '.jsx', '.mjs', '.cjs', '.py', '.rs', '.ts', '.tsx'].includes(ext);
  const isFrontend =
    lowerPath.startsWith('frontend/') ||
    lowerPath.includes('/frontend/') ||
    lowerPath.includes('/client/');
  const isBackend =
    lowerPath.startsWith('backend/') ||
    lowerPath.startsWith('api/') ||
    lowerPath.includes('/server/') ||
    lowerPath.includes('/api/');
  const isWashingtonImplementation = lowerPath.startsWith(
    'docs/washington counties/implementation/'
  );
  const isCountyDataAsset =
    lowerPath.startsWith('data/county-intelligence/') ||
    lowerPath.startsWith('data/intelligence/') ||
    lowerPath.startsWith('data/databases/county-databases/') ||
    isWashingtonImplementation;

  const evidence = {
    path: relative,
    scraperOrAdapter: false,
    dbTarget: false,
    runtimeApi: false,
    uiSurface: false,
    acquisitionArtifact: false,
    publicSeed: false,
    demoArtifact: false,
    stubIncomplete: false,
    obsolete: false,
    pacsMention: false,
    rowEstimate: null,
  };

  if (
    isCode &&
    (/scraper|crawler|crawl|ingest|etl|extract|adapter|harvest|import/.test(lowerPath) ||
      /class\s+\w*scraper|function\s+\w*scrape|export\s+(async\s+)?function\s+\w*scrape/.test(
        lowerContent
      ))
  ) {
    evidence.scraperOrAdapter = true;
  }

  if (
    (dataExtensions.has(ext) &&
      (isCountyDataAsset || lowerPath.startsWith('database/') || lowerPath.startsWith('data/'))) ||
    (!isDoc &&
      /create\s+table|insert\s+into|dbcontext|migration|duckdb|sqlite|postgres/i.test(content))
  ) {
    evidence.dbTarget = true;
  }

  if (
    !isDoc &&
    isBackend &&
    (/api|route|controller|endpoint|handler|router/.test(lowerPath) ||
      /app\.(get|post|put|delete)|router\.(get|post|put|delete)|fetch\(|axios\.|openapi|swagger|\[http(get|post|put|delete)/i.test(
        content
      ))
  ) {
    evidence.runtimeApi = true;
  }

  if (
    !isDoc &&
    isFrontend &&
    (/county studio|countystudio|atlas|salesforge|workbench|terraforge|react|tsx|jsx|surface|panel|screen/i.test(
      content
    ) ||
      /studio|atlas|salesforge|workbench|components|pages|frontend|app\//.test(lowerPath))
  ) {
    evidence.uiSurface = true;
  }

  if (
    isWashingtonImplementation ||
    lowerPath.startsWith('docs/washington counties/') ||
    /39.*county|county.*registry|acquisition|source.*url|sourceurl|officialassessor|public.*data/i.test(
      content
    )
  ) {
    evidence.acquisitionArtifact = true;
  }

  if (
    isCountyDataAsset ||
    /public.*seed|seed.*public|source.*public|county.*source|official assessor|public source/i.test(
      content
    )
  ) {
    evidence.publicSeed = true;
  }

  if (
    /demo|sample|synthetic|fake|fixture/i.test(content) ||
    /demo|sample|fixture|synthetic/i.test(lowerPath)
  ) {
    evidence.demoArtifact = true;
  }

  if (/stub|todo|placeholder|coming soon|not implemented|mock/i.test(content)) {
    evidence.stubIncomplete = true;
  }

  if (
    /obsolete|deprecated|legacy/i.test(content) ||
    /obsolete|deprecated|legacy/i.test(lowerPath)
  ) {
    evidence.obsolete = true;
  }

  if (/\bPACS\b|harris|cama/i.test(content)) {
    evidence.pacsMention = true;
  }

  evidence.rowEstimate = estimateRows(filePath, content);
  return evidence;
}

function getCountyEvidence(files) {
  const byCounty = new Map(counties.map(county => [county, []]));

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const content = textExtensions.has(ext) ? safeRead(filePath) : '';
    for (const county of counties) {
      if (!countyAppears(filePath, content, county)) continue;
      byCounty.get(county).push(classifyFile(filePath, content));
    }
  }

  return byCounty;
}

function chooseClassification(evidence) {
  if (evidence.length === 0) return 'unknown_untrusted';

  const hasOperationalShape =
    evidence.some(item => item.scraperOrAdapter) &&
    evidence.some(item => item.dbTarget) &&
    evidence.some(item => item.runtimeApi) &&
    evidence.some(item => item.uiSurface);

  if (hasOperationalShape) return 'possible_runtime_chain_unproven';
  if (evidence.some(item => item.demoArtifact)) return 'demo_artifact';
  if (evidence.some(item => item.stubIncomplete)) return 'stub_incomplete';
  if (evidence.some(item => item.obsolete)) return 'obsolete';
  if (evidence.some(item => item.scraperOrAdapter || item.dbTarget || item.publicSeed))
    return 'public_data_seed';

  return 'unknown_untrusted';
}

function trustTier(classification, rowsLanded) {
  if (classification === 'possible_runtime_chain_unproven' && rowsLanded > 0) {
    return 'public_source_pilot_unproven';
  }
  if (classification === 'public_data_seed' && rowsLanded > 0) {
    return 'public_source_seed';
  }
  if (classification === 'demo_artifact') return 'demo_only';
  return 'unknown_untrusted';
}

function pick(evidence, predicate) {
  return evidence.find(predicate)?.path ?? null;
}

function buildRows(byCounty) {
  return counties.map(county => {
    const evidence = byCounty.get(county) ?? [];
    const rowsLanded = evidence.reduce((sum, item) => {
      return sum + (Number.isFinite(item.rowEstimate) ? item.rowEstimate : 0);
    }, 0);
    const classification = chooseClassification(evidence);
    const scraperPath = pick(evidence, item => item.scraperOrAdapter);
    const dbPath = pick(evidence, item => item.dbTarget);
    const apiPath = pick(evidence, item => item.runtimeApi);
    const uiPath = pick(evidence, item => item.uiSurface);
    const sourcePath = pick(
      evidence,
      item => item.acquisitionArtifact || item.publicSeed || item.scraperOrAdapter
    );

    const blockingReasons = [];
    if (!sourcePath) blockingReasons.push('No source/acquisition evidence found.');
    if (!scraperPath) blockingReasons.push('No scraper/adapter evidence found.');
    if (!dbPath) blockingReasons.push('No DB/table target evidence found.');
    if (rowsLanded <= 0) blockingReasons.push('No landed row evidence found.');
    if (!apiPath) blockingReasons.push('No runtime API consumer evidence found.');
    if (!uiPath) blockingReasons.push('No UI/surface consumer evidence found.');
    if (classification === 'demo_artifact')
      blockingReasons.push('Evidence appears demo/sample/synthetic.');
    if (classification === 'stub_incomplete')
      blockingReasons.push('Evidence contains mock/stub/placeholder language.');
    if (classification === 'possible_runtime_chain_unproven') {
      blockingReasons.push('Full-looking chain still needs source-to-UI runtime proof.');
    }

    return {
      county,
      state: 'WA',
      sourceUrlOrSystem: sourcePath,
      scraperOrAdapterExists: Boolean(scraperPath),
      scraperOrAdapterPath: scraperPath,
      dbTableTargetExists: Boolean(dbPath),
      dbTableTarget: dbPath,
      rowsLanded,
      runtimeApiConsumesIt: Boolean(apiPath),
      runtimeApiPath: apiPath,
      uiSurfacePath: uiPath,
      trustTier: trustTier(classification, rowsLanded),
      classification,
      pacsMentionDetected: evidence.some(item => item.pacsMention),
      evidenceCount: evidence.length,
      evidencePaths: evidence.map(item => item.path).sort(),
      blockingReasons,
    };
  });
}

function summarize(rows) {
  return {
    countiesScanned: rows.length,
    withScraper: rows.filter(row => row.scraperOrAdapterExists).length,
    withDb: rows.filter(row => row.dbTableTargetExists).length,
    withRows: rows.filter(row => row.rowsLanded > 0).length,
    withApi: rows.filter(row => row.runtimeApiConsumesIt).length,
    withUi: rows.filter(row => Boolean(row.uiSurfacePath)).length,
    withApparentFullChain: rows.filter(
      row =>
        row.sourceUrlOrSystem &&
        row.scraperOrAdapterExists &&
        row.dbTableTargetExists &&
        row.rowsLanded > 0 &&
        row.runtimeApiConsumesIt &&
        row.uiSurfacePath
    ).length,
    withPacsMentions: rows.filter(row => row.pacsMentionDetected).length,
  };
}

function renderMarkdown(rows, summary) {
  const table = rows.map(row =>
    [
      row.county,
      row.sourceUrlOrSystem ? `\`${row.sourceUrlOrSystem}\`` : '-',
      row.scraperOrAdapterPath ? `\`${row.scraperOrAdapterPath}\`` : 'No',
      row.dbTableTarget ? `\`${row.dbTableTarget}\`` : 'No',
      String(row.rowsLanded),
      row.runtimeApiPath ? `\`${row.runtimeApiPath}\`` : 'No',
      row.uiSurfacePath ? `\`${row.uiSurfacePath}\`` : 'No',
      row.trustTier,
      row.classification,
      row.blockingReasons.length > 0 ? row.blockingReasons.join('<br>') : '-',
    ].join(' | ')
  );

  return [
    '# Data Source Truth Inventory',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| County | Source/System | Scraper | DB Target | Rows | API | UI | Trust Tier | Classification | Blockers |',
    '|---|---|---|---|---:|---|---|---|---|---|',
    ...table,
    '',
    '## Summary',
    '',
    `- Counties scanned: ${summary.countiesScanned}`,
    `- Counties with scraper evidence: ${summary.withScraper}`,
    `- Counties with DB evidence: ${summary.withDb}`,
    `- Counties with landed row evidence: ${summary.withRows}`,
    `- Counties with API evidence: ${summary.withApi}`,
    `- Counties with UI evidence: ${summary.withUi}`,
    `- Counties with apparent full chain: ${summary.withApparentFullChain}`,
    `- Counties with PACS/Harris/CAMA mentions: ${summary.withPacsMentions}`,
    '',
    '## Certification Note',
    '',
    'This inventory is evidence discovery only. It does not certify runtime lineage. A county is not June 10 ready until a separate runtime proof demonstrates source to scraper to DB to API to UI with real data and no silent fallback.',
    '',
  ].join('\n');
}

function main() {
  const files =
    gitVisibleFiles() ??
    walk(repoRoot).filter(item => !isIgnoredPath(item) && isInventoryCandidate(item));
  const rows = buildRows(getCountyEvidence(files));
  const summary = summarize(rows);
  const totalEvidence = rows.reduce((sum, row) => sum + row.evidenceCount, 0);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    outJson,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        repoRoot,
        summary,
        rows,
      },
      null,
      2
    )
  );
  fs.writeFileSync(outMd, renderMarkdown(rows, summary));

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(JSON.stringify(summary, null, 2));

  if (totalEvidence === 0) {
    console.error('No county evidence found. Inventory cannot support Track 1.');
    process.exit(2);
  }
}

main();

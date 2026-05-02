#!/usr/bin/env node

/**
 * Track 2C - Runtime Data Boundary Audit
 *
 * Static truth gate for the June 10 data boundary:
 * product runtime must consume TerraFusion canonical/runtime data, while legacy
 * source systems remain limited to Sync/admin/proof/test zones.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const outDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(outDir, 'runtime-data-boundary-audit.json');
const outMd = path.join(outDir, 'runtime-data-boundary-audit.md');
const strict = process.env.TF_RUNTIME_DATA_BOUNDARY_STRICT !== '0';

const ignoredDirs = new Set([
  '.git',
  '.next',
  '.turbo',
  'bin',
  'build',
  'coverage',
  'dist',
  'dist-livefix',
  'node_modules',
  'obj',
  'out',
  'publish',
  'target',
  'vendor',
]);

const frontendExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const backendExtensions = new Set(['.cs']);

const legacyPatterns = [
  /\bPACS\b/i,
  /\bHarris\b/i,
  /\bpacs_oltp\b/i,
  /\bPACS_Training\b/i,
  /\bPacmls\b/i,
  /\bPACMLS\b/i,
  /\bCAMA\b/i,
  /\bSyncSourceConnection\b/i,
  /\bsourceConnectionId\b/i,
  /\btf-mssql\b/i,
  /\bSqlConnection\b/i,
  /\bOdbcConnection\b/i,
  /\blegacy source\b/i,
];

const directLegacySourcePatterns = [
  /\bpacs_oltp\b/i,
  /\bPACS_Training\b/i,
  /\bPacmls\b/i,
  /\bPACMLS\b/i,
  /\bSyncSourceConnection\b/i,
  /\bsourceConnectionId\b/i,
  /\btf-mssql\b/i,
  /\bnew\s+SqlConnection\b/i,
  /(?<![A-Za-z])SqlConnection\s*\(/i,
  /\bOdbcConnection\s*\(/i,
];

const legacyRoutePatterns = [/pacs/i, /harris/i, /cama/i];

const canonicalPatterns = [
  /\bTerraFusionDbContext\b/i,
  /\bCanonical\b/i,
  /\bCanonicalSale\b/i,
  /\bCanonicalSaleQualification\b/i,
  /\bQualifiedSales\b/i,
  /\bRuntime\b/i,
  /\bCountyData\b/i,
  /\bParcel\b/i,
  /\bAssessment\b/i,
  /\bDbSet\b/i,
  /\bRepository\b/i,
  /\bComparableSales\b/i,
  /\bCamaCharacteristics\b/i,
  /\bCamaImprovementDetails\b/i,
];

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
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
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function matches(patterns, value) {
  return patterns.filter(pattern => pattern.test(value)).map(pattern => pattern.source);
}

function surfaceFor(filePath, content) {
  const text = `${rel(filePath)}\n${content}`.toLowerCase();
  if (
    text.includes('county-studio') ||
    text.includes('countystudio') ||
    text.includes('county studio')
  ) {
    return 'county_studio';
  }
  if (text.includes('costforge')) return 'costforge';
  if (text.includes('salesforge')) return 'salesforge';
  if (text.includes('atlas')) return 'atlas';
  if (text.includes('workbench')) return 'workbench';
  return 'unknown';
}

function isFrontendFile(filePath) {
  const relative = rel(filePath);
  return (
    (relative.startsWith('frontend/') ||
      relative.startsWith('applications/') ||
      relative.startsWith('packages/')) &&
    frontendExtensions.has(path.extname(filePath).toLowerCase())
  );
}

function isBackendFile(filePath) {
  const relative = rel(filePath);
  return (
    relative.startsWith('backend/') && backendExtensions.has(path.extname(filePath).toLowerCase())
  );
}

function extractFrontendCalls(files) {
  const calls = [];
  const endpointPattern =
    /(?:fetch|axios\.(?:get|post|put|patch|delete)|api\.(?:get|post|put|patch|delete))\s*\(\s*['"`]([^'"`]+)['"`]/g;

  for (const filePath of files.filter(isFrontendFile)) {
    const content = safeRead(filePath);
    const surface = surfaceFor(filePath, content);
    const legacyTerms = uniqueTermMatches(legacyPatterns, content);
    const blockers =
      surface !== 'unknown' && legacyTerms.length
        ? ['Frontend product surface contains user-facing legacy source terminology.']
        : [];
    let match;
    while ((match = endpointPattern.exec(content)) !== null) {
      const endpoint = match[1];
      if (!endpoint.startsWith('/api') && !endpoint.includes('/api/')) continue;
      calls.push({
        filePath: rel(filePath),
        endpoint,
        surface,
        legacyTerms,
        blockers,
      });
    }
  }

  return calls.sort((a, b) =>
    `${a.filePath}:${a.endpoint}`.localeCompare(`${b.filePath}:${b.endpoint}`)
  );
}

function extractRouteHints(content) {
  const hints = [];
  const routePattern =
    /\[(?:Route|HttpGet|HttpPost|HttpPut|HttpPatch|HttpDelete)\s*\(\s*"([^"]*)"/g;
  let match;
  while ((match = routePattern.exec(content)) !== null) {
    hints.push(match[1]);
  }
  return [...new Set(hints)];
}

function isEndpointLike(filePath, content) {
  const relative = rel(filePath).toLowerCase();
  return (
    relative.endsWith('controller.cs') ||
    /\[(?:ApiController|Route|HttpGet|HttpPost|HttpPut|HttpPatch|HttpDelete)\b/.test(content) ||
    /Map(?:Get|Post|Put|Patch|Delete)\s*\(/.test(content)
  );
}

function zoneFor(filePath, content) {
  const relative = rel(filePath).replaceAll('\\', '/');
  const lower = `${relative}\n${content}`.toLowerCase();

  if (relative.includes('/tests/') || relative.startsWith('backend/tests/')) return 'allowed_tests';

  if (
    /(^|\/)(sync|etl|scrapers?|datamining)(\/|$)/i.test(relative) ||
    /(^|\/)(admin|proof)([^/]*)(controller|service)?\.cs$/i.test(relative) ||
    /SyncController\.cs$/i.test(relative)
  ) {
    return 'allowed_sync_ingest';
  }

  if (
    lower.includes('countystudio') ||
    lower.includes('county studio') ||
    lower.includes('countystudy') ||
    lower.includes('costforge') ||
    lower.includes('salesforge') ||
    lower.includes('atlas') ||
    lower.includes('workbench') ||
    lower.includes('forgecontroller') ||
    lower.includes('countyrowscontroller')
  ) {
    return 'forbidden_product_runtime';
  }

  return 'unknown';
}

function routeLegacyTerms(routeHints) {
  return uniqueTermMatches(legacyRoutePatterns, routeHints.join('\n'));
}

function classifyDataSource(directLegacyTerms, canonicalTerms) {
  if (directLegacyTerms.length && canonicalTerms.length) return 'mixed_canonical_and_legacy';
  if (directLegacyTerms.length) return 'legacy_source_direct';
  if (canonicalTerms.length) return 'terrafusion_canonical';
  return 'unproven';
}

function uniqueTermMatches(patterns, content) {
  const found = [];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) found.push(match[0]);
  }
  return [...new Set(found)].sort((a, b) => a.localeCompare(b));
}

function classifyBackendEndpoint(filePath, content) {
  const routeHints = extractRouteHints(content);
  const zone = zoneFor(filePath, content);
  const legacyTerms = uniqueTermMatches(legacyPatterns, content);
  const directLegacyTerms = uniqueTermMatches(directLegacySourcePatterns, content);
  const legacyRouteTerms = routeLegacyTerms(routeHints);
  const canonicalTerms = uniqueTermMatches(canonicalPatterns, content);
  const dataSourceClass = classifyDataSource(directLegacyTerms, canonicalTerms);
  const blockers = [];
  const warnings = [];

  if (zone === 'forbidden_product_runtime') {
    if (
      dataSourceClass === 'legacy_source_direct' ||
      dataSourceClass === 'mixed_canonical_and_legacy'
    ) {
      blockers.push('Product runtime endpoint has direct legacy source dependency evidence.');
    }
    if (legacyRouteTerms.length) {
      blockers.push(
        'Product runtime endpoint exposes legacy source terminology in route contract.'
      );
    }
    if (dataSourceClass === 'unproven') {
      blockers.push('Product runtime endpoint has no TerraFusion canonical/runtime data evidence.');
    }
  }

  if (zone === 'unknown' && dataSourceClass === 'legacy_source_direct') {
    warnings.push(
      'Unknown endpoint references legacy source terms; classify before June 10 readiness.'
    );
  }
  if (zone === 'unknown' && dataSourceClass === 'unproven') {
    warnings.push('Unknown endpoint has no static data-source evidence.');
  }

  if (legacyTerms.length && !directLegacyTerms.length && !legacyRouteTerms.length) {
    warnings.push(
      'Legacy/provenance terminology detected without direct source dependency evidence.'
    );
  }

  return {
    filePath: rel(filePath),
    routeHints,
    zone,
    dataSourceClass,
    legacyTerms,
    directLegacyTerms,
    legacyRouteTerms,
    canonicalTerms,
    blockers,
    warnings,
  };
}

function backendEndpoints(files) {
  return files
    .filter(isBackendFile)
    .map(filePath => ({ filePath, content: safeRead(filePath) }))
    .filter(({ filePath, content }) => isEndpointLike(filePath, content))
    .map(({ filePath, content }) => classifyBackendEndpoint(filePath, content))
    .sort((a, b) => a.filePath.localeCompare(b.filePath));
}

function summarizeReport(endpoints, frontendCalls) {
  const product = endpoints.filter(endpoint => endpoint.zone === 'forbidden_product_runtime');
  const syncAdmin = endpoints.filter(endpoint =>
    ['allowed_sync_ingest', 'allowed_admin_proof', 'allowed_tests'].includes(endpoint.zone)
  );

  return {
    productEndpointsScanned: product.length,
    syncAdminEndpointsScanned: syncAdmin.length,
    productLegacyViolations: product.filter(
      endpoint => endpoint.directLegacyTerms.length > 0 || endpoint.legacyRouteTerms.length > 0
    ).length,
    productCanonicalEndpoints: product.filter(
      endpoint => endpoint.dataSourceClass === 'terrafusion_canonical'
    ).length,
    productUnprovenEndpoints: product.filter(endpoint => endpoint.dataSourceClass === 'unproven')
      .length,
    frontendLegacyViolations: frontendCalls.filter(call => call.blockers.length > 0).length,
  };
}

function renderMarkdown(report) {
  const lines = [
    '# Runtime Data Boundary Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Passed: **${report.passed ? 'yes' : 'no'}**`,
    '',
    '## Summary',
    '',
    `- Product endpoints scanned: ${report.summary.productEndpointsScanned}`,
    `- Sync/admin/test endpoints scanned: ${report.summary.syncAdminEndpointsScanned}`,
    `- Product legacy violations: ${report.summary.productLegacyViolations}`,
    `- Product canonical endpoints: ${report.summary.productCanonicalEndpoints}`,
    `- Product unproven endpoints: ${report.summary.productUnprovenEndpoints}`,
    `- Frontend legacy terminology violations: ${report.summary.frontendLegacyViolations}`,
    '',
    '## Product Runtime Endpoints',
    '',
    '| File | Routes | Source Class | Direct Legacy Terms | Route Legacy Terms | Legacy/Provenance Terms | Canonical Terms | Blockers | Warnings |',
    '|---|---|---|---|---|---|---|---|---|',
  ];

  for (const endpoint of report.backendEndpoints.filter(
    item => item.zone === 'forbidden_product_runtime'
  )) {
    lines.push(
      [
        `\`${endpoint.filePath}\``,
        endpoint.routeHints.length
          ? endpoint.routeHints.map(route => `\`${route}\``).join('<br>')
          : '-',
        endpoint.dataSourceClass,
        endpoint.directLegacyTerms.length
          ? endpoint.directLegacyTerms.map(term => `\`${term}\``).join('<br>')
          : '-',
        endpoint.legacyRouteTerms.length
          ? endpoint.legacyRouteTerms.map(term => `\`${term}\``).join('<br>')
          : '-',
        endpoint.legacyTerms.length
          ? endpoint.legacyTerms.map(term => `\`${term}\``).join('<br>')
          : '-',
        endpoint.canonicalTerms.length
          ? endpoint.canonicalTerms.map(term => `\`${term}\``).join('<br>')
          : '-',
        endpoint.blockers.length ? endpoint.blockers.join('<br>') : '-',
        endpoint.warnings.length ? endpoint.warnings.join('<br>') : '-',
      ].join(' | ')
    );
  }

  lines.push('', '## Sync/Admin/Test Legacy Zones', '');
  lines.push('| File | Zone | Source Class | Legacy Terms |');
  lines.push('|---|---|---|---|');
  for (const endpoint of report.backendEndpoints.filter(item =>
    ['allowed_sync_ingest', 'allowed_admin_proof', 'allowed_tests'].includes(item.zone)
  )) {
    lines.push(
      [
        `\`${endpoint.filePath}\``,
        endpoint.zone,
        endpoint.dataSourceClass,
        endpoint.legacyTerms.length
          ? endpoint.legacyTerms.map(term => `\`${term}\``).join('<br>')
          : '-',
      ].join(' | ')
    );
  }

  lines.push('', '## Frontend API Calls', '');
  lines.push('| File | Surface | Endpoint | Legacy Terms | Blockers |');
  lines.push('|---|---|---|---|---|');
  for (const call of report.frontendCalls) {
    lines.push(
      [
        `\`${call.filePath}\``,
        call.surface,
        `\`${call.endpoint}\``,
        call.legacyTerms?.length ? call.legacyTerms.map(term => `\`${term}\``).join('<br>') : '-',
        call.blockers?.length ? call.blockers.join('<br>') : '-',
      ].join(' | ')
    );
  }

  lines.push(
    '',
    '## Interpretation',
    '',
    'Product runtime endpoints may not depend directly on legacy source connections. Sync/admin/proof/test code may reference legacy sources, but those references do not certify product runtime truth.'
  );

  return `${lines.join('\n')}\n`;
}

function main() {
  const files = walk(repoRoot);
  const report = {
    generatedAt: new Date().toISOString(),
    frontendCalls: extractFrontendCalls(files),
    backendEndpoints: backendEndpoints(files),
    summary: null,
    passed: false,
  };
  report.summary = summarizeReport(report.backendEndpoints, report.frontendCalls);
  report.passed =
    report.summary.productLegacyViolations === 0 &&
    report.summary.productUnprovenEndpoints === 0 &&
    report.summary.frontendLegacyViolations === 0;

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(outMd, renderMarkdown(report));

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(JSON.stringify(report.summary, null, 2));

  if (strict && !report.passed) {
    process.exitCode = 1;
  }
}

main();

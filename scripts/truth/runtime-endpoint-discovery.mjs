#!/usr/bin/env node

/**
 * Track 1C - Runtime Endpoint Discovery / API Crosswalk
 *
 * Finds backend route evidence, frontend API call evidence, candidate runtime
 * URLs, and probe results for the Track 1B county-data candidates.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const outDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(outDir, 'runtime-endpoint-discovery.json');
const outMd = path.join(outDir, 'runtime-endpoint-discovery.md');
const runtimeBaseUrl =
  process.env.TF_RUNTIME_BASE_URL ??
  process.env.TERRAFUSION_RUNTIME_BASE_URL ??
  'http://localhost:5046';
const probeTimeoutMs = Number(process.env.TF_RUNTIME_ENDPOINT_PROBE_TIMEOUT_MS ?? 5000);
const counties = (process.env.TF_RUNTIME_ROW_CANDIDATES ?? 'Benton,Pacific,Franklin,Walla Walla')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean);

const relevantTokens = [
  'county',
  'counties',
  'costforge',
  'realdata',
  'real-data',
  'salesaudit',
  'sales-audit',
  'terraforge',
  'county-study',
  'countystudy',
  'dataimport',
  'data-import',
  'pacmls',
  'parcel',
  'parcels',
  'property',
  'properties',
  'benton',
  'pacific',
  'franklin',
  'walla',
];

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function gitFiles() {
  try {
    return execFileSync('git', ['ls-files', '-z'], {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\0')
      .filter(Boolean)
      .map(item => path.resolve(repoRoot, item));
  } catch {
    return [];
  }
}

function isRelevant(text) {
  const lower = text.toLowerCase();
  return relevantTokens.some(token => lower.includes(token));
}

function backendFiles(files) {
  return files.filter(filePath => {
    const relative = rel(filePath).toLowerCase();
    return (
      (relative.startsWith('backend/src/terrafusion.api/controllers/') ||
        relative.startsWith('backend/src/terrafusion.datamining/api/') ||
        relative.startsWith('api/')) &&
      /\.(cs|ts|js|mjs)$/.test(relative)
    );
  });
}

function frontendFiles(files) {
  return files.filter(filePath => {
    const relative = rel(filePath).toLowerCase();
    return (
      relative.startsWith('frontend/apps/os-shell/src/pages/forge/') &&
      /\.(ts|tsx|js|jsx)$/.test(relative)
    );
  });
}

function extractBackendRoutes(files) {
  const routes = [];

  for (const filePath of files) {
    const content = safeRead(filePath);
    if (!isRelevant(`${rel(filePath)}\n${content}`)) continue;

    const classRoute = extractClassRoute(filePath, content);
    const controllerName = path
      .basename(filePath)
      .replace(/Controller\.cs$/i, '')
      .replace(/Routes\.cs$/i, '')
      .replace(/\..+$/, '');
    const controllerRoute = normalizeRoute(classRoute || `api/${controllerName}`);

    for (const item of extractHttpAttributeRoutes(content)) {
      const routePattern = combineRoutes(controllerRoute, item.route);
      routes.push(routeEvidence(filePath, routePattern, item.verb, content));
    }

    for (const item of extractMapRoutes(content)) {
      routes.push(routeEvidence(filePath, normalizeRoute(item.route), item.verb, content));
    }
  }

  return uniqueBy(routes, route => `${route.filePath}:${route.verb}:${route.routePattern}`);
}

function extractClassRoute(filePath, content) {
  const classIndex = content.search(/\bclass\s+\w+/);
  const prefix = classIndex >= 0 ? content.slice(0, classIndex) : content;
  const matches = [...prefix.matchAll(/\[Route\s*\(\s*"([^"]+)"\s*\)\]/gi)];
  const route = matches.at(-1)?.[1] ?? null;
  if (!route) return null;

  const controllerName = path.basename(filePath).replace(/Controller\.cs$/i, '');
  return route.replace(/\[controller\]/gi, controllerName);
}

function extractHttpAttributeRoutes(content) {
  const routes = [];
  const regex = /\[(HttpGet|HttpPost|HttpPut|HttpDelete|HttpPatch)\s*(?:\(\s*"([^"]*)"\s*\))?/gi;
  for (const match of content.matchAll(regex)) {
    routes.push({
      verb: match[1].replace(/^Http/i, '').toUpperCase(),
      route: match[2] ?? '',
    });
  }
  return routes;
}

function extractMapRoutes(content) {
  const routes = [];
  const regex = /\bMap(Get|Post|Put|Delete|Patch)\s*\(\s*"([^"]+)"/gi;
  for (const match of content.matchAll(regex)) {
    routes.push({
      verb: match[1].toUpperCase(),
      route: match[2],
    });
  }
  return routes;
}

function routeEvidence(filePath, routePattern, verb, content) {
  const evidenceText = `${rel(filePath)}\n${routePattern}\n${content}`;
  return {
    filePath: rel(filePath),
    source: rel(filePath).includes('/api/') ? 'backend_route' : 'backend_controller',
    verb,
    routePattern,
    supportsCountyParameter: supportsCountyParameter(routePattern, evidenceText),
    appearsTestOnly: appearsTestOnly(evidenceText),
    appearsDemoOnly: appearsDemoOnly(evidenceText),
    appearsPacsOrLegacyNamed: appearsPacsOrLegacyNamed(evidenceText),
  };
}

function extractFrontendCalls(files) {
  const calls = [];

  for (const filePath of files) {
    const content = safeRead(filePath);
    if (!isRelevant(`${rel(filePath)}\n${content}`)) continue;

    const regex =
      /(?:fetch|axios\.(?:get|post|put|delete|patch)|apiClient\.(?:get|post|put|delete|patch)|request)\s*\(\s*([`'"])([^`'"]+)\1/g;
    for (const match of content.matchAll(regex)) {
      const routePattern = normalizeRoute(match[2]);
      if (!isRelevant(routePattern)) continue;
      const evidenceText = `${rel(filePath)}\n${routePattern}\n${content}`;
      calls.push({
        filePath: rel(filePath),
        routePattern,
        supportsCountyParameter: supportsCountyParameter(routePattern, evidenceText),
        appearsTestOnly: appearsTestOnly(evidenceText),
        appearsDemoOnly: appearsDemoOnly(evidenceText),
        appearsPacsOrLegacyNamed: appearsPacsOrLegacyNamed(evidenceText),
      });
    }
  }

  return uniqueBy(calls, call => `${call.filePath}:${call.routePattern}`);
}

function normalizeRoute(route) {
  return String(route ?? '')
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\[controller\]/gi, 'controller');
}

function combineRoutes(prefix, suffix) {
  const cleanPrefix = normalizeRoute(prefix);
  const cleanSuffix = normalizeRoute(suffix);
  return [cleanPrefix, cleanSuffix].filter(Boolean).join('/');
}

function supportsCountyParameter(routePattern, text) {
  void text;
  return /(\{county(?:Name|Id|Code|Slug|Token)?\??\}|:county(?:Name|Id|Code|Slug|Token)?|\$\{county(?:Name|Id|Code|Slug|Token)?\}|\/benton(?:\/|$)|\/pacific(?:\/|$)|\/franklin(?:\/|$)|\/walla-walla(?:\/|$))/i.test(
    routePattern
  );
}

function appearsTestOnly(text) {
  return /(?:^|[\\/\s])(?:__tests__|tests?|fixtures?|playground|samples?)(?:[\\/\s.]|$)|\b\w*TestController\b|costforge-test/i.test(
    text
  );
}

function appearsDemoOnly(text) {
  return /demo|synthetic|fake|placeholder|coming soon/i.test(text);
}

function appearsPacsOrLegacyNamed(text) {
  return /\bPACS\b|harris|cama|legacy/i.test(text);
}

function buildCandidates(backendRoutes, frontendCalls) {
  const candidates = [];

  for (const county of counties) {
    for (const route of backendRoutes) {
      maybePushCandidate(candidates, county, {
        source: route.source,
        filePath: route.filePath,
        routePattern: route.routePattern,
        supportsCountyParameter: route.supportsCountyParameter,
        appearsTestOnly: route.appearsTestOnly,
        appearsDemoOnly: route.appearsDemoOnly,
        appearsPacsOrLegacyNamed: route.appearsPacsOrLegacyNamed,
      });
    }

    for (const call of frontendCalls) {
      maybePushCandidate(candidates, county, {
        source: 'frontend_call',
        filePath: call.filePath,
        routePattern: call.routePattern,
        supportsCountyParameter: call.supportsCountyParameter,
        appearsTestOnly: call.appearsTestOnly,
        appearsDemoOnly: call.appearsDemoOnly,
        appearsPacsOrLegacyNamed: call.appearsPacsOrLegacyNamed,
      });
    }

    for (const routePattern of inferredRoutes(county)) {
      maybePushCandidate(candidates, county, {
        source: 'inferred',
        filePath: 'scripts/truth/runtime-row-path-proof.mjs',
        routePattern,
        supportsCountyParameter: true,
        appearsTestOnly: false,
        appearsDemoOnly: false,
        appearsPacsOrLegacyNamed: false,
      });
    }
  }

  return uniqueBy(
    candidates,
    item => `${item.county}:${item.source}:${item.filePath}:${item.candidateUrl}`
  );
}

function inferredRoutes(county) {
  const slug = slugifyCounty(county);
  return [
    `api/counties/${slug}/data`,
    `api/counties/${slug}/rows`,
    `api/counties/${slug}/parcels`,
    `api/counties/${slug}/sales`,
    `api/county/${slug}/data`,
    `api/real-data/${slug}`,
    `api/terraforge/counties/${slug}/data`,
    `api/costforge/counties/${slug}/data`,
  ];
}

function maybePushCandidate(candidates, county, base) {
  if (!base.supportsCountyParameter && base.source !== 'inferred') return;

  const urlPath = materializeRoute(base.routePattern, county);
  if (!urlPath || /[{}`$]/.test(urlPath)) return;

  const candidateUrl = new URL(`/${urlPath.replace(/^\/+/, '')}`, runtimeBaseUrl).toString();
  candidates.push({
    county,
    ...base,
    candidateUrl,
    probe: {
      attempted: false,
      status: null,
      contentType: null,
      rowCount: null,
      payloadCounty: null,
      error: null,
    },
    recommendation: 'unknown',
  });
}

function materializeRoute(routePattern, county) {
  let route = normalizeRoute(routePattern);
  if (!route || route.startsWith('http')) return route;

  const slug = slugifyCounty(county);
  for (const literalCounty of counties.map(slugifyCounty)) {
    if (literalCounty !== slug && new RegExp(`(^|/)${literalCounty}(/|$)`, 'i').test(route)) {
      return null;
    }
  }

  route = route
    .replace(/\{county(?:Name|Id|Code|Slug|Token)?\??\}/gi, slug)
    .replace(/:county(?:Name|Id|Code|Slug|Token)?/gi, slug)
    .replace(/\$\{county(?:Name|Id|Code|Slug|Token)?\}/gi, slug);

  // Do not invent IDs for non-county parameters. This is discovery, not repair.
  if (/\{[^}]+\}/.test(route) || /:[a-zA-Z]/.test(route)) return null;
  return route;
}

function slugifyCounty(county) {
  return String(county)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function probeCandidates(candidates) {
  for (const candidate of candidates) {
    candidate.probe = await probe(candidate.candidateUrl);
    candidate.recommendation = recommendation(candidate);
  }
  return candidates;
}

async function probe(candidateUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), probeTimeoutMs);

  try {
    const response = await fetch(candidateUrl, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    let payload = null;

    if ((contentType ?? '').includes('json') || /^[\s\r\n]*[{[]/.test(text)) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    return {
      attempted: true,
      status: response.status,
      contentType,
      rowCount: countRows(payload),
      payloadCounty: collectCountyValues(payload)[0] ?? null,
      error: null,
    };
  } catch (error) {
    return {
      attempted: true,
      status: null,
      contentType: null,
      rowCount: null,
      payloadCounty: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function countRows(value) {
  if (!value) return 0;
  if (Array.isArray(value)) return value.length;
  if (typeof value !== 'object') return 0;

  for (const key of [
    'rows',
    'data',
    'items',
    'results',
    'records',
    'parcels',
    'sales',
    'properties',
  ]) {
    if (Array.isArray(value[key])) return value[key].length;
  }
  for (const key of ['rowCount', 'count', 'total', 'totalCount']) {
    const count = Number(value[key]);
    if (Number.isFinite(count)) return count;
  }
  return 0;
}

function collectCountyValues(value, values = []) {
  if (!value || typeof value !== 'object') return values;
  if (Array.isArray(value)) {
    for (const item of value) collectCountyValues(item, values);
    return values;
  }
  for (const [key, child] of Object.entries(value)) {
    if (/county|countyName|selectedCounty/i.test(key) && typeof child === 'string') {
      values.push(child);
    }
    if (child && typeof child === 'object') collectCountyValues(child, values);
  }
  return [...new Set(values)];
}

function recommendation(candidate) {
  if (candidate.appearsTestOnly) return 'test_only_do_not_use';
  if (candidate.appearsDemoOnly) return 'demo_only_do_not_use';
  if (!candidate.supportsCountyParameter) return 'not_county_scoped';
  if (candidate.probe.status === 200 && candidate.probe.rowCount > 0) return 'use_for_track_1b';
  if (candidate.probe.status === null) return 'wrong_base_url_possible';
  if (candidate.probe.status === 404 && candidate.probe.payloadCounty) {
    return 'county_not_registered_or_no_runtime_rows';
  }
  if (candidate.probe.status === 404) return 'route_unregistered';
  return 'unknown';
}

function summarize(backendRoutes, frontendCalls, candidateEndpoints) {
  return {
    backendRoutesFound: backendRoutes.length,
    frontendCallsFound: frontendCalls.length,
    candidateEndpointsFound: candidateEndpoints.length,
    liveEndpoints: candidateEndpoints.filter(item => item.probe.status === 200).length,
    countyScopedEndpoints: candidateEndpoints.filter(item => item.supportsCountyParameter).length,
    testOrDemoEndpoints: candidateEndpoints.filter(
      item => item.appearsTestOnly || item.appearsDemoOnly
    ).length,
  };
}

function renderMarkdown(report) {
  const candidateRows = report.candidateEndpoints.map(item =>
    [
      item.county,
      item.source,
      `\`${item.filePath}\``,
      `\`${item.routePattern}\``,
      `\`${item.candidateUrl}\``,
      item.supportsCountyParameter ? 'yes' : 'no',
      item.appearsTestOnly ? 'yes' : 'no',
      item.appearsDemoOnly ? 'yes' : 'no',
      String(item.probe.status),
      String(item.probe.rowCount),
      item.probe.payloadCounty ?? '-',
      item.recommendation,
    ].join(' | ')
  );

  return [
    '# Runtime Endpoint Discovery',
    '',
    `Generated: ${report.generatedAt}`,
    `Runtime base URL: \`${report.runtimeBaseUrl}\``,
    '',
    '## Summary',
    '',
    `- Backend routes found: ${report.summary.backendRoutesFound}`,
    `- Frontend calls found: ${report.summary.frontendCallsFound}`,
    `- Candidate endpoints found: ${report.summary.candidateEndpointsFound}`,
    `- Live endpoints: ${report.summary.liveEndpoints}`,
    `- County-scoped endpoints: ${report.summary.countyScopedEndpoints}`,
    `- Test/demo endpoints: ${report.summary.testOrDemoEndpoints}`,
    '',
    '## Candidate Endpoints',
    '',
    '| County | Source | File | Route Pattern | Candidate URL | County Scoped | Test Only | Demo Only | Status | Rows | Payload County | Recommendation |',
    '|---|---|---|---|---|---|---|---|---:|---:|---|---|',
    ...candidateRows,
    '',
    '## Scope Note',
    '',
    'This crosswalk discovers and probes endpoint evidence only. It does not repair route registration, frontend calls, scraper landing, or database contents.',
    '',
  ].join('\n');
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

async function main() {
  const files = gitFiles();
  const backendRoutes = extractBackendRoutes(backendFiles(files));
  const frontendCalls = extractFrontendCalls(frontendFiles(files));
  const candidateEndpoints = await probeCandidates(buildCandidates(backendRoutes, frontendCalls));
  const report = {
    generatedAt: new Date().toISOString(),
    runtimeBaseUrl,
    backendRoutes,
    frontendCalls,
    candidateEndpoints,
    summary: summarize(backendRoutes, frontendCalls, candidateEndpoints),
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2));
  fs.writeFileSync(outMd, renderMarkdown(report));

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(JSON.stringify(report.summary, null, 2));
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
});

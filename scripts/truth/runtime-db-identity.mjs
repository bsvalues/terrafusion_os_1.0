#!/usr/bin/env node

/**
 * Track 0R - Runtime TerraFusion DB Identity
 *
 * Proves which TerraFusion DB backs the running API before row-count proofs
 * are trusted. This script does not inspect upstream source systems.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const truthDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(truthDir, 'runtime-db-identity.json');
const outMd = path.join(truthDir, 'runtime-db-identity.md');
const runtimeBaseUrl =
  process.env.TF_RUNTIME_BASE_URL ??
  process.env.TERRAFUSION_RUNTIME_BASE_URL ??
  'http://localhost:5046';

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

async function getJson(endpoint) {
  try {
    const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
    const text = await response.text();
    let payload = null;
    if (
      (response.headers.get('content-type') ?? '').includes('json') ||
      /^[\s\r\n]*[{[]/.test(text)
    ) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }
    return { status: response.status, payload, error: null };
  } catch (error) {
    return {
      status: null,
      payload: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function pick(object, ...names) {
  if (!object || typeof object !== 'object') return undefined;
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(object, name)) return object[name];
  }
  return undefined;
}

function normalizePayload(payload) {
  const rowCounts = pick(payload, 'rowCounts', 'RowCounts') ?? {};
  const migrationState = pick(payload, 'migrationState', 'MigrationState') ?? {};
  return {
    apiBaseUrl: pick(payload, 'apiBaseUrl', 'ApiBaseUrl') ?? null,
    environment: pick(payload, 'environment', 'Environment') ?? null,
    provider: pick(payload, 'provider', 'Provider') ?? null,
    connectionStringName: pick(payload, 'connectionStringName', 'ConnectionStringName') ?? null,
    serverRedacted: pick(payload, 'serverRedacted', 'ServerRedacted') ?? null,
    database: pick(payload, 'database', 'Database') ?? null,
    expectedJune10Database:
      pick(payload, 'expectedJune10Database', 'ExpectedJune10Database') ?? null,
    isExpectedJune10RuntimeDb: Boolean(
      pick(payload, 'isExpectedJune10RuntimeDb', 'IsExpectedJune10RuntimeDb')
    ),
    migrationState: {
      appliedCount: pick(migrationState, 'appliedCount', 'AppliedCount') ?? null,
      pendingCount: pick(migrationState, 'pendingCount', 'PendingCount') ?? null,
      latestApplied: pick(migrationState, 'latestApplied', 'LatestApplied') ?? null,
    },
    rowCounts: {
      counties: pick(rowCounts, 'counties', 'Counties') ?? null,
      properties: pick(rowCounts, 'properties', 'Properties') ?? null,
      comparableSales: pick(rowCounts, 'comparableSales', 'ComparableSales') ?? null,
      canonicalSaleQualifications:
        pick(rowCounts, 'canonicalSaleQualifications', 'CanonicalSaleQualifications') ?? null,
    },
    passed: Boolean(pick(payload, 'passed', 'Passed')),
    blockers: pick(payload, 'blockers', 'Blockers') ?? [],
    warnings: pick(payload, 'warnings', 'Warnings') ?? [],
  };
}

function evaluate(probe) {
  const blockers = [];
  const warnings = [];

  if (probe.status !== 200) {
    blockers.push(`Runtime DB identity endpoint did not return 200. Status: ${probe.status}.`);
  }
  if (probe.error) blockers.push(`Runtime DB identity endpoint failed: ${probe.error}`);
  if (!probe.payload) blockers.push('Runtime DB identity endpoint did not return JSON payload.');

  const identity = probe.payload ? normalizePayload(probe.payload) : null;
  if (identity) {
    if (!identity.passed) {
      blockers.push(...identity.blockers);
    }
    warnings.push(...identity.warnings);
  }

  return {
    endpointStatus: probe.status,
    passed: blockers.length === 0,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    identity,
  };
}

function renderMarkdown(report) {
  const identity = report.identity ?? {};
  const rowCounts = identity.rowCounts ?? {};
  const migrationState = identity.migrationState ?? {};
  return [
    '# Runtime TerraFusion DB Identity',
    '',
    `Generated: ${report.generatedAt}`,
    `Runtime base URL: \`${report.runtimeBaseUrl}\``,
    '',
    '## Status',
    '',
    `- Result: ${report.passed ? 'PASS' : 'FAIL'}`,
    `- Endpoint status: ${report.endpointStatus ?? 'unreachable'}`,
    `- API base URL: ${identity.apiBaseUrl ?? '-'}`,
    `- Environment: ${identity.environment ?? '-'}`,
    `- Provider: ${identity.provider ?? '-'}`,
    `- Connection string name: ${identity.connectionStringName ?? '-'}`,
    `- Server/host: ${identity.serverRedacted ?? '-'}`,
    `- Database: ${identity.database ?? '-'}`,
    `- Expected June 10 DB: ${identity.expectedJune10Database ?? '-'}`,
    `- Expected runtime DB: ${identity.isExpectedJune10RuntimeDb ? 'yes' : 'no'}`,
    '',
    '## Migration State',
    '',
    `- Applied migrations: ${migrationState.appliedCount ?? '-'}`,
    `- Pending migrations: ${migrationState.pendingCount ?? '-'}`,
    `- Latest applied: ${migrationState.latestApplied ?? '-'}`,
    '',
    '## Row Counts',
    '',
    `- Counties: ${rowCounts.counties ?? '-'}`,
    `- Properties: ${rowCounts.properties ?? '-'}`,
    `- ComparableSales: ${rowCounts.comparableSales ?? '-'}`,
    `- CanonicalSaleQualifications: ${rowCounts.canonicalSaleQualifications ?? '-'}`,
    '',
    '## Blockers',
    '',
    ...(report.blockers.length ? report.blockers.map(item => `- ${item}`) : ['- none']),
    '',
    '## Warnings',
    '',
    ...(report.warnings.length ? report.warnings.map(item => `- ${item}`) : ['- none']),
    '',
    '## Trust Rule',
    '',
    'Runtime row counts are not trusted for June 10 readiness unless this proof passes. Product runtime must read TerraFusion DB through TerraFusion API; upstream source systems are outside this proof.',
  ].join('\n');
}

async function main() {
  const endpoint = new URL('/api/runtime/truth/db-identity', runtimeBaseUrl).toString();
  const fixturePath = process.env.TF_RUNTIME_DB_IDENTITY_FIXTURE;
  const probe = fixturePath
    ? { status: 200, payload: JSON.parse(fs.readFileSync(fixturePath, 'utf8')), error: null }
    : await getJson(endpoint);
  const evaluated = evaluate(probe);
  const report = {
    generatedAt: new Date().toISOString(),
    runtimeBaseUrl,
    endpoint,
    ...evaluated,
  };

  fs.mkdirSync(truthDir, { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(outMd, `${renderMarkdown(report)}\n`);

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(
    JSON.stringify(
      {
        passed: report.passed,
        blockers: report.blockers.length,
        warnings: report.warnings.length,
        database: report.identity?.database ?? null,
        provider: report.identity?.provider ?? null,
      },
      null,
      2
    )
  );

  if (!report.passed) process.exitCode = 1;
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});

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
import { runtimeFetch } from './runtime-auth.mjs';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const truthDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(truthDir, 'runtime-db-identity.json');
const outMd = path.join(truthDir, 'runtime-db-identity.md');
const runtimeBaseUrl =
  process.env.TF_RUNTIME_BASE_URL ??
  process.env.TERRAFUSION_RUNTIME_BASE_URL ??
  'http://localhost:5046';
const configSearchFiles = [
  'backend/src/TerraFusion.API/appsettings.Development.json',
  'backend/src/TerraFusion.API/appsettings.BentonCounty.json',
  'backend/src/TerraFusion.API/appsettings.json',
];
const bentonParcelSanityPath = path.join(truthDir, 'benton-parcel-count-sanity.json');

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

async function getJson(endpoint) {
  try {
    const response = await runtimeFetch(endpoint, { headers: { accept: 'application/json' } });
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
  const contentRootPath = pick(payload, 'contentRootPath', 'ContentRootPath') ?? null;
  const expectedContentRootPath = path.join(repoRoot, 'backend', 'src', 'TerraFusion.API');
  const environment = pick(payload, 'environment', 'Environment') ?? null;
  const isExpectedWorkspace = isExpectedRuntimeContentRoot({
    contentRootPath,
    expectedContentRootPath,
    environment,
  });

  const derivedBentonExpectation = readBentonParcelSanityExpectation();
  const runtimeExpectedBentonParcelCount =
    pick(payload, 'expectedBentonParcelCount', 'ExpectedBentonParcelCount') ?? null;
  const expectedBentonParcelCount =
    runtimeExpectedBentonParcelCount ?? derivedBentonExpectation?.expectedBentonParcelCount ?? null;
  const isBentonParcelCountExpected =
    Boolean(pick(payload, 'isBentonParcelCountExpected', 'IsBentonParcelCountExpected')) ||
    Boolean(derivedBentonExpectation?.isBentonParcelCountExpected);

  return {
    apiBaseUrl: pick(payload, 'apiBaseUrl', 'ApiBaseUrl') ?? null,
    environment,
    contentRootPath,
    expectedContentRootPath,
    isExpectedWorkspace,
    provider: pick(payload, 'provider', 'Provider') ?? null,
    connectionStringName: pick(payload, 'connectionStringName', 'ConnectionStringName') ?? null,
    serverRedacted: pick(payload, 'serverRedacted', 'ServerRedacted') ?? null,
    database: pick(payload, 'database', 'Database') ?? null,
    expectedJune10Database:
      pick(payload, 'expectedJune10Database', 'ExpectedJune10Database') ?? null,
    isExpectedJune10RuntimeDb: Boolean(
      pick(payload, 'isExpectedJune10RuntimeDb', 'IsExpectedJune10RuntimeDb')
    ),
    expectedBentonParcelCount,
    expectedBentonParcelCountSource:
      runtimeExpectedBentonParcelCount !== null && runtimeExpectedBentonParcelCount !== undefined
        ? 'runtime_config'
        : (derivedBentonExpectation?.source ?? null),
    isBentonParcelCountExpected,
    migrationState: {
      appliedCount: pick(migrationState, 'appliedCount', 'AppliedCount') ?? null,
      pendingCount: pick(migrationState, 'pendingCount', 'PendingCount') ?? null,
      latestApplied: pick(migrationState, 'latestApplied', 'LatestApplied') ?? null,
    },
    rowCounts: {
      counties: pick(rowCounts, 'counties', 'Counties') ?? null,
      properties: pick(rowCounts, 'properties', 'Properties') ?? null,
      comparableSales: pick(rowCounts, 'comparableSales', 'ComparableSales') ?? null,
      tfParcels: pick(rowCounts, 'tfParcels', 'TfParcels') ?? null,
      tfSales: pick(rowCounts, 'tfSales', 'TfSales') ?? null,
      canonicalSaleQualifications:
        pick(rowCounts, 'canonicalSaleQualifications', 'CanonicalSaleQualifications') ?? null,
    },
    passed: Boolean(pick(payload, 'passed', 'Passed')),
    blockers: pick(payload, 'blockers', 'Blockers') ?? [],
    warnings: pick(payload, 'warnings', 'Warnings') ?? [],
  };
}

function isExpectedRuntimeContentRoot({ contentRootPath, expectedContentRootPath, environment }) {
  if (typeof contentRootPath !== 'string' || !contentRootPath.trim()) return false;

  if (
    String(environment ?? '').toLowerCase() === 'production' &&
    contentRootPath.replaceAll('\\', '/').replace(/\/+$/, '') === '/app'
  ) {
    return true;
  }

  return (
    path.resolve(contentRootPath).toLowerCase() ===
    path.resolve(expectedContentRootPath).toLowerCase()
  );
}

function readBentonParcelSanityExpectation() {
  if (!fs.existsSync(bentonParcelSanityPath)) return null;
  try {
    const proof = JSON.parse(fs.readFileSync(bentonParcelSanityPath, 'utf8'));
    const expectedBentonParcelCount = Number.parseInt(
      String(proof.distinctActiveParcelNumbers ?? ''),
      10
    );
    if (
      proof.passed === true &&
      proof.endpointBehavior?.activeCurrentSemanticsProven === true &&
      Number.isFinite(expectedBentonParcelCount) &&
      expectedBentonParcelCount > 0
    ) {
      return {
        expectedBentonParcelCount,
        isBentonParcelCountExpected: true,
        source: 'benton_parcel_count_sanity',
      };
    }
  } catch {
    return null;
  }
  return null;
}

function readConfigExpectationSources(identity) {
  const expectedCount = identity?.expectedBentonParcelCount;
  const expectedDb = identity?.expectedJune10Database;
  const sources = [];
  const derivedBentonExpectation = readBentonParcelSanityExpectation();

  if (derivedBentonExpectation) {
    sources.push({
      path: rel(bentonParcelSanityPath),
      key: 'BentonParcelSanity.distinctActiveParcelNumbers',
      value: derivedBentonExpectation.expectedBentonParcelCount,
      matchesRuntimeExpectation:
        expectedCount !== null &&
        expectedCount !== undefined &&
        String(derivedBentonExpectation.expectedBentonParcelCount) === String(expectedCount),
    });
  }

  for (const relativePath of configSearchFiles) {
    const filePath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(filePath)) continue;

    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      continue;
    }

    const values = [
      {
        key: 'RuntimeTruth.ExpectedJune10Database',
        value: parsed.RuntimeTruth?.ExpectedJune10Database,
      },
      {
        key: 'RuntimeTruth.ExpectedBentonParcelCount',
        value: parsed.RuntimeTruth?.ExpectedBentonParcelCount,
      },
    ];

    if (expectedCount !== null && expectedCount !== undefined) {
      values.push(
        {
          key: 'BentonCounty.ParcelCount',
          value: parsed.BentonCounty?.ParcelCount,
        },
        {
          key: 'County.PropertyCount',
          value: parsed.County?.PropertyCount,
        }
      );
    }

    for (const entry of values) {
      if (entry.value === undefined || entry.value === null) continue;
      const valueText = String(entry.value);
      const matchesExpected =
        (expectedCount !== null &&
          expectedCount !== undefined &&
          valueText === String(expectedCount)) ||
        (expectedDb && valueText.toLowerCase() === String(expectedDb).toLowerCase());
      sources.push({
        path: rel(filePath),
        key: entry.key,
        value: entry.value,
        matchesRuntimeExpectation: Boolean(matchesExpected),
      });
    }
  }

  return sources;
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
    if (!identity.contentRootPath) {
      blockers.push('Runtime API did not report a content root path.');
    } else if (!identity.isExpectedWorkspace) {
      blockers.push(
        `Runtime API content root belongs to a different workspace: ${identity.contentRootPath}.`
      );
    }
    warnings.push(...identity.warnings);
  }

  return {
    endpointStatus: probe.status,
    passed: blockers.length === 0,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    identity,
    configExpectationSources: readConfigExpectationSources(identity),
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
    `- Content root: ${identity.contentRootPath ?? '-'}`,
    `- Expected content root: ${identity.expectedContentRootPath ?? '-'}`,
    `- Expected workspace: ${identity.isExpectedWorkspace ? 'yes' : 'no'}`,
    `- Provider: ${identity.provider ?? '-'}`,
    `- Connection string name: ${identity.connectionStringName ?? '-'}`,
    `- Server/host: ${identity.serverRedacted ?? '-'}`,
    `- Database: ${identity.database ?? '-'}`,
    `- Expected June 10 DB: ${identity.expectedJune10Database ?? '-'}`,
    `- Expected runtime DB: ${identity.isExpectedJune10RuntimeDb ? 'yes' : 'no'}`,
    `- Expected Benton parcel count: ${identity.expectedBentonParcelCount ?? '-'}`,
    `- Expected Benton parcel count source: ${identity.expectedBentonParcelCountSource ?? '-'}`,
    `- Benton parcel count expected: ${identity.isBentonParcelCountExpected ? 'yes' : 'no'}`,
    '',
    '## Config Expectation Sources',
    '',
    '| Path | Key | Value | Matches Runtime Expectation |',
    '|---|---|---:|---|',
    ...(report.configExpectationSources?.length
      ? report.configExpectationSources.map(source =>
          [
            `\`${source.path}\``,
            source.key,
            String(source.value),
            source.matchesRuntimeExpectation ? 'yes' : 'no',
          ].join(' | ')
        )
      : ['| - | - | - | - |']),
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
    `- canonical_tf.tf_parcel: ${rowCounts.tfParcels ?? '-'}`,
    `- canonical_tf.tf_sale: ${rowCounts.tfSales ?? '-'}`,
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

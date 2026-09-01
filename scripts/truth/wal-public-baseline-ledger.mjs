#!/usr/bin/env node

/**
 * WO-WAL-001A - deterministic public-baseline ledger contract.
 *
 * This tool consumes source-registry evidence only. It deliberately does not
 * probe public sources, runtime endpoints, or databases, and it never promotes
 * registry readiness into landed-data or runtime-registration truth.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const CONTRACT_ID = 'wal.public-baseline-ledger.v1';

export const EXPECTED_COUNTIES = Object.freeze([
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
]);

const DEFAULT_INPUT = path.join(
  'os-platform',
  'core',
  'pilot',
  'evidence',
  'washington-39-county-coverage.latest.json'
);

function normalizeCounty(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  return normalized.endsWith('county') ? normalized.slice(0, -'county'.length) : normalized;
}

function countyToken(county) {
  return county.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function nullableString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function containsBentonReference(value) {
  if (typeof value === 'string') {
    const compact = value
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
    return compact.includes('benton');
  }
  if (Array.isArray(value)) return value.some(containsBentonReference);
  if (value && typeof value === 'object') {
    return Object.values(value).some(containsBentonReference);
  }
  return false;
}

function validateAndIndexCounties(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    throw new Error('Coverage proof must be a JSON object.');
  }
  if (!Array.isArray(report.counties)) {
    throw new Error('Coverage proof must contain a counties array.');
  }

  const expectedByKey = new Map(EXPECTED_COUNTIES.map(county => [normalizeCounty(county), county]));
  const rowsByKey = new Map();
  const duplicates = new Set();
  const unexpected = new Set();

  for (const row of report.counties) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error('Every coverage proof county row must be an object.');
    }

    const rawCounty = nullableString(row.county);
    if (!rawCounty) throw new Error('Every coverage proof row must name a county.');

    const key = normalizeCounty(rawCounty);
    if (!expectedByKey.has(key)) unexpected.add(rawCounty);
    if (rowsByKey.has(key)) duplicates.add(expectedByKey.get(key) ?? rawCounty);
    rowsByKey.set(key, row);
  }

  const missing = EXPECTED_COUNTIES.filter(county => !rowsByKey.has(normalizeCounty(county)));
  const errors = [];
  if (duplicates.size) errors.push(`duplicate counties: ${[...duplicates].sort().join(', ')}`);
  if (missing.length) errors.push(`missing counties: ${missing.join(', ')}`);
  if (unexpected.size) errors.push(`unexpected counties: ${[...unexpected].sort().join(', ')}`);
  if (report.counties.length !== EXPECTED_COUNTIES.length) {
    errors.push(
      `expected ${EXPECTED_COUNTIES.length} county rows, received ${report.counties.length}`
    );
  }
  if (errors.length) throw new Error(`Coverage proof county invariant failed: ${errors.join('; ')}.`);

  return rowsByKey;
}

function sourceInventoryGaps(row) {
  const gaps = [];
  if (!nullableString(row.officialAssessorBaseUrl)) gaps.push('official_assessor_url_missing');
  if (!nullableString(row.primarySalesSource)) gaps.push('primary_sales_source_missing');
  if (!nullableString(row.acquisitionFamily)) gaps.push('acquisition_family_missing');
  return gaps;
}

function buildRow(county, inputRow) {
  const sourceInventory = {
    observationStatus: 'observed_from_coverage_proof',
    officialAssessorBaseUrl: nullableString(inputRow.officialAssessorBaseUrl),
    primarySalesSourceDescription: nullableString(inputRow.primarySalesSource),
    alternatePublicSourceDescription: nullableString(inputRow.fallbackSource),
    gisMapSurfaceDescription: nullableString(inputRow.gisMapSurface),
  };

  const registryStatus = nullableString(inputRow.status) ?? 'unknown';
  const acquisitionReadiness = {
    observationStatus: 'observed_from_coverage_proof',
    registryStatus,
    registryStatusMeaning: 'source_decision_only',
    acquisitionFamily: nullableString(inputRow.acquisitionFamily),
    priority: nullableString(inputRow.priority),
    adapterExecutionStatus: 'not_observed',
  };

  if (
    county !== 'Benton' &&
    containsBentonReference({ sourceInventory, acquisitionReadiness })
  ) {
    throw new Error(
      `Non-Benton county ${county} contains Benton source evidence or acquisition readiness metadata; silent fallback is prohibited.`
    );
  }

  const explicitGaps = {
    sourceInventory: sourceInventoryGaps(inputRow),
    acquisition:
      registryStatus === 'adapter-ready' ? [] : ['acquisition_not_adapter_ready_in_registry'],
    landedData: ['parcel_rows_not_observed', 'sales_rows_not_observed'],
    runtime: ['parcel_runtime_registration_not_observed', 'sales_runtime_registration_not_observed'],
    freshnessProvenance: [
      'acquisition_freshness_not_observed',
      'row_provenance_not_observed',
      'transform_version_not_observed',
    ],
  };

  return {
    county,
    countyToken: countyToken(county),
    sourceInventory,
    acquisitionReadiness,
    landedRowsEvidence: {
      observationStatus: 'not_observed',
      parcelRows: null,
      salesRows: null,
      quarantinedRows: null,
    },
    runtimeRegistrationEvidence: {
      observationStatus: 'not_observed',
      parcels: {
        registrationStatus: 'not_observed',
        endpoint: null,
        rows: null,
      },
      sales: {
        registrationStatus: 'not_observed',
        endpoint: null,
        rows: null,
      },
      selectedCountyEchoed: null,
    },
    freshnessProvenanceEvidence: {
      observationStatus: 'not_observed',
      acquiredAtUtc: null,
      sourceRevision: null,
      contentHash: null,
      transformVersion: null,
      trustTier: null,
    },
    fallbackEvidence: {
      observationStatus: 'not_observed',
      silentBentonFallbackDetected: null,
      fallbackCounty: null,
    },
    capabilityEvidence: {
      observationStatus: 'not_assessed',
      supportedCapabilities: [],
    },
    explicitGaps,
  };
}

function summarize(rows) {
  const registryStatusCounts = {};
  let sourceInventoryGapCount = 0;

  for (const row of rows) {
    const status = row.acquisitionReadiness.registryStatus;
    registryStatusCounts[status] = (registryStatusCounts[status] ?? 0) + 1;
    if (row.explicitGaps.sourceInventory.length) sourceInventoryGapCount += 1;
  }

  return {
    expectedCountyCount: EXPECTED_COUNTIES.length,
    countyRowCount: rows.length,
    registryStatusCounts: Object.fromEntries(
      Object.entries(registryStatusCounts).sort(([left], [right]) => left.localeCompare(right))
    ),
    sourceInventoryGapCount,
    landedRowsObservedCountyCount: 0,
    runtimeRegistrationObservedCountyCount: 0,
    freshnessProvenanceObservedCountyCount: 0,
    capabilityAssessedCountyCount: 0,
  };
}

export function buildLedger(coverageProof) {
  const rowsByKey = validateAndIndexCounties(coverageProof);
  const rows = EXPECTED_COUNTIES.map(county =>
    buildRow(county, rowsByKey.get(normalizeCounty(county)))
  );

  return {
    contract: CONTRACT_ID,
    evidenceScope: 'source_registry_only',
    sourceEvidence: {
      slice: nullableString(coverageProof.slice),
      generatedAtUtc: nullableString(coverageProof.generatedAtUtc),
      status: nullableString(coverageProof.status),
      workbook: nullableString(coverageProof.source?.workbook),
      workbookSha256: nullableString(coverageProof.source?.workbookSha256),
      supplementalResearchAtUtc: nullableString(coverageProof.source?.supplementalResearchAtUtc),
    },
    assertions: {
      exactCanonicalCountySet: true,
      exactlyOneRowPerCounty: true,
      deterministicCanonicalOrder: true,
      registryReadinessDoesNotImplyLandedRows: true,
      registryReadinessDoesNotImplyRuntimeRegistration: true,
      noBentonFallbackMaterialized: true,
    },
    summary: summarize(rows),
    rows,
  };
}

export function serializeLedger(ledger) {
  return `${JSON.stringify(ledger, null, 2)}\n`;
}

function pathIsWithin(rootPath, candidatePath, allowRoot) {
  const relativePath = path.relative(rootPath, candidatePath);
  if (relativePath === '') return allowRoot;

  return (
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

function tempContainmentError(tempRoot) {
  return new Error(
    `--output must resolve strictly inside the operating system temporary directory: ${tempRoot}`
  );
}

function resolveTempOutputTarget(outputPath, cwd) {
  const tempRoot = path.resolve(os.tmpdir());
  const resolvedOutputPath = path.resolve(cwd, outputPath);

  if (!pathIsWithin(tempRoot, resolvedOutputPath, false)) {
    throw tempContainmentError(tempRoot);
  }

  const canonicalTempRoot = fs.realpathSync.native(tempRoot);
  let canonicalOutputParent;
  try {
    canonicalOutputParent = fs.realpathSync.native(path.dirname(resolvedOutputPath));
  } catch (error) {
    throw new Error(
      `--output parent must already exist inside the operating system temporary directory: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!pathIsWithin(canonicalTempRoot, canonicalOutputParent, true)) {
    throw tempContainmentError(canonicalTempRoot);
  }

  const canonicalOutputPath = path.join(canonicalOutputParent, path.basename(resolvedOutputPath));
  if (process.platform === 'win32' && path.basename(canonicalOutputPath).includes(':')) {
    throw new Error('--output must not use a Windows alternate data stream.');
  }
  const existingTarget = fs.lstatSync(canonicalOutputPath, { throwIfNoEntry: false });
  if (existingTarget?.isSymbolicLink()) {
    throw new Error('--output must not be an existing symbolic link or junction.');
  }
  if (existingTarget) {
    throw new Error('--output must name a new file; existing targets are not overwritten.');
  }

  return { canonicalTempRoot, canonicalOutputPath };
}

export function resolveTempOutputPath(outputPath, cwd = process.cwd()) {
  return resolveTempOutputTarget(outputPath, cwd).canonicalOutputPath;
}

function sameFileIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function validateOpenedTempFile(descriptor, target) {
  const openedRealPath = fs.realpathSync.native(target.canonicalOutputPath);
  const descriptorStat = fs.fstatSync(descriptor);
  const pathStat = fs.statSync(openedRealPath);
  if (
    !pathIsWithin(target.canonicalTempRoot, openedRealPath, false) ||
    !descriptorStat.isFile() ||
    !sameFileIdentity(descriptorStat, pathStat)
  ) {
    throw tempContainmentError(target.canonicalTempRoot);
  }

  return openedRealPath;
}

function removeOpenedFileIfStillSame(descriptor, candidatePaths) {
  const descriptorStat = fs.fstatSync(descriptor);
  for (const candidatePath of new Set(candidatePaths.filter(Boolean))) {
    try {
      const candidateStat = fs.statSync(candidatePath);
      if (sameFileIdentity(descriptorStat, candidateStat)) {
        fs.rmSync(candidatePath, { force: true });
        return;
      }
    } catch {
      // A missing, moved, or non-removable path is safer than deleting an unverified replacement.
    }
  }
}

export function writeTempOutputFile(outputPath, output, cwd = process.cwd()) {
  const target = resolveTempOutputTarget(outputPath, cwd);
  const noFollowFlag = fs.constants.O_NOFOLLOW ?? 0;
  const openFlags =
    fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | noFollowFlag;
  let descriptor;
  let openedRealPath;
  let removeOnFailure = false;

  try {
    descriptor = fs.openSync(target.canonicalOutputPath, openFlags, 0o600);
    removeOnFailure = true;

    openedRealPath = validateOpenedTempFile(descriptor, target);
    fs.writeFileSync(descriptor, output, { encoding: 'utf8' });
    fs.fsyncSync(descriptor);
    openedRealPath = validateOpenedTempFile(descriptor, target);
    removeOnFailure = false;
  } catch (error) {
    if (descriptor !== undefined && removeOnFailure) {
      try {
        fs.ftruncateSync(descriptor, 0);
        fs.fsyncSync(descriptor);
      } catch {
        // Preserve the original failure; cleanup below remains identity-checked.
      }
    }
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'EEXIST' || error.code === 'ELOOP') {
        throw new Error('--output must name a new non-link file; existing targets are not overwritten.');
      }
    }
    throw error;
  } finally {
    if (descriptor !== undefined && removeOnFailure) {
      removeOpenedFileIfStillSame(descriptor, [openedRealPath, target.canonicalOutputPath]);
    }
    if (descriptor !== undefined) {
      fs.closeSync(descriptor);
    }
  }
}

function parseArguments(args) {
  let inputPath = DEFAULT_INPUT;
  let outputPath = null;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--input') {
      inputPath = args[index + 1];
      if (!inputPath) throw new Error('--input requires a path.');
      index += 1;
      continue;
    }
    if (argument === '--output') {
      outputPath = args[index + 1];
      if (!outputPath) throw new Error('--output requires a path.');
      index += 1;
      continue;
    }
    if (argument === '--help') {
      return { help: true, inputPath, outputPath };
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  return { help: false, inputPath, outputPath };
}

function usage() {
  return [
    'Usage: node scripts/truth/wal-public-baseline-ledger.mjs [options]',
    '',
    'Options:',
    '  --input <path>   Coverage proof JSON (defaults to the repository proof)',
    '  --output <path>  Write canonical JSON strictly inside the OS temp directory',
    '  --help           Show this help',
  ].join('\n');
}

export function runCli(args, io = {}) {
  const cwd = io.cwd ?? process.cwd();
  const stdout = io.stdout ?? process.stdout;
  const options = parseArguments(args);

  if (options.help) {
    stdout.write(`${usage()}\n`);
    return;
  }

  const inputPath = path.resolve(cwd, options.inputPath);
  const coverageProof = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const output = serializeLedger(buildLedger(coverageProof));

  if (options.outputPath) {
    writeTempOutputFile(options.outputPath, output, cwd);
  } else {
    stdout.write(output);
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

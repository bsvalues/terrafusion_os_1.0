#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  canonicalJsonSha256,
  loadVerifiedRetainedWashingtonPackage,
  publishWashingtonLaunchPackage,
} from './kitsap_public_sales.mjs';

const COUNTY = 'Clark';
const COUNTY_CODE = '011';
const SOURCE_MODE = 'public_assessor_residential_sales_csv';
const SOURCE_NAME = 'clark-official-residential-sales-2026';
const MANIFEST_SCHEMA = 'terrafusion.washington.launch-manifest.v1';
const STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const DETAIL_SCHEMA = 'terrafusion.washington.county-detail.v1';
const SHARD_SCHEMA = 'terrafusion.washington.sales-shard.v1';
const SOURCE_SET_SCHEMA = 'terrafusion.washington.public-source-set.v1';
const RECEIPT_SCHEMA = 'terrafusion.washington.public-source-receipt.v1';
const SHA256_PATTERN = /^[a-f\d]{64}$/;
const EXPECTED_HEADERS = [
  'Property Identification #',
  'Assessment Group',
  'Parcel Size (Sq Ft)',
  'Parcel Size (Acres)',
  'Building Type',
  'Style',
  'Quality',
  'Year Built',
  'Main and Upper Living Area',
  'Basement Area',
  'Sale Date',
  'View?',
  'Waterfront?',
  'Original Sale Amount',
  'Parcel Address',
  'Class (Original)',
  'Adjusted Sale Amount',
];
const SOURCE_CONFIG_PATH = fileURLToPath(
  new URL('./sources/clark_residential_sales_2026.json', import.meta.url)
);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nullableString(value) {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : null;
}

function finiteNumber(value, label, { positive = false } = {}) {
  const parsed = Number(String(value ?? '').replace(/[$,\s]/g, ''));
  invariant(
    Number.isFinite(parsed) && (!positive || parsed > 0),
    `Clark source row has an invalid ${label}.`
  );
  return parsed;
}

function nullablePositiveNumber(value, label) {
  const normalized = nullableString(value);
  if (normalized === null) return null;
  const parsed = finiteNumber(normalized, label);
  return parsed > 0 ? parsed : null;
}

export function canonicalClarkSaleDate(value) {
  const normalized = String(value ?? '').trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(normalized);
  invariant(match, 'Clark sale date is not M/D/YYYY.');
  const year = Number(match[3]);
  const month = Number(match[1]);
  const day = Number(match[2]);
  const date = new Date(Date.UTC(year, month - 1, day));
  invariant(
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day,
    'Clark sale date is not a real calendar date.'
  );
  return date.toISOString().slice(0, 10);
}

function canonicalIsoDate(value) {
  const normalized = String(value ?? '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? normalized
    : null;
}

export function parseClarkCsv(text) {
  invariant(typeof text === 'string', 'Clark CSV input must be text.');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let index = text.charCodeAt(0) === 0xfeff ? 1 : 0;

  while (index < text.length) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        quoted = false;
        index += 1;
        continue;
      }
      field += character;
      index += 1;
      continue;
    }

    if (character === '"') {
      invariant(field.length === 0, 'Clark CSV has an unexpected quote in an unquoted field.');
      quoted = true;
      index += 1;
    } else if (character === ',') {
      row.push(field);
      field = '';
      index += 1;
    } else if (character === '\n' || character === '\r') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      index += 1;
    } else {
      field += character;
      index += 1;
    }
  }

  invariant(!quoted, 'Clark CSV ends inside a quoted field.');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  while (rows.length > 0 && rows.at(-1).every(value => value === '')) rows.pop();
  invariant(rows.length > 1, 'Clark CSV contains no data rows.');
  const headers = rows[0].map(header => header.trim());
  invariant(
    headers.length === EXPECTED_HEADERS.length &&
      headers.every((header, headerIndex) => header === EXPECTED_HEADERS[headerIndex]),
    'Clark CSV header does not match the residential-sales contract.'
  );

  return rows.slice(1).map((values, rowIndex) => {
    invariant(
      values.length === EXPECTED_HEADERS.length,
      `Clark CSV row ${rowIndex + 2} has ${values.length} fields; expected ${EXPECTED_HEADERS.length}.`
    );
    return Object.fromEntries(EXPECTED_HEADERS.map((header, column) => [header, values[column]]));
  });
}

function canonicalIdentity(row) {
  return [
    row['Property Identification #'],
    canonicalClarkSaleDate(row['Sale Date']),
    finiteNumber(row['Original Sale Amount'], 'original sale amount', { positive: true }),
  ]
    .map(value => String(value ?? '').trim())
    .join('|');
}

function parseSitusAddress(value) {
  const address = nullableString(value);
  if (!address) return { streetAddress: null, city: null, zip: null };
  return {
    streetAddress: address,
    city: null,
    // Clark publishes one undivided address string that already includes state
    // and ZIP. Keep that value lossless and do not publish a second ZIP field,
    // which the SalesForge display adapter would append again.
    zip: null,
  };
}

function validYearBuilt(value, saleYear) {
  const normalized = nullableString(value);
  if (!normalized || !/^\d+$/.test(normalized)) return null;
  const year = Number(normalized);
  return Number.isInteger(year) && year >= 1700 && year <= saleYear ? year : null;
}

function mapRecord(row, source, ordinal, generatedAt) {
  const saleDate = canonicalClarkSaleDate(row['Sale Date']);
  const saleYear = Number(saleDate.slice(0, 4));
  const salePrice = finiteNumber(row['Original Sale Amount'], 'original sale amount', {
    positive: true,
  });
  const adjustedSalePrice = finiteNumber(row['Adjusted Sale Amount'], 'adjusted sale amount', {
    positive: true,
  });
  const parcelNumber = nullableString(row['Property Identification #']);
  invariant(parcelNumber, 'Clark source row has no property identification number.');
  invariant(saleDate <= generatedAt.slice(0, 10), 'Clark source row is future-dated.');
  const identityDigest = createHash('sha256').update(canonicalIdentity(row)).digest('hex');
  const situs = parseSitusAddress(row['Parcel Address']);
  const lotSizeSqft = nullablePositiveNumber(row['Parcel Size (Sq Ft)'], 'parcel square feet');
  const reportedAcres = nullablePositiveNumber(row['Parcel Size (Acres)'], 'parcel acres');
  const acres = reportedAcres
    ?? (lotSizeSqft === null ? null : Math.round((lotSizeSqft / 43_560) * 10_000) / 10_000);
  const neighborhoodCode = nullableString(row['Assessment Group']);

  return {
    saleId: `WA-${COUNTY_CODE}-${identityDigest.slice(0, 32)}`,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    parcelNumber,
    saleDate,
    saleYear,
    salePrice,
    adjustedSalePrice,
    documentNumber: null,
    deedType: null,
    situsAddress: situs.streetAddress,
    situsCity: situs.city,
    situsZip: situs.zip,
    useCode: nullableString(row['Building Type']),
    acres,
    grantor: null,
    grantee: null,
    saleNote: null,
    neighborhoodCode,
    currentNeighborhoodCode: neighborhoodCode,
    sourceMode: SOURCE_MODE,
    candidateSource: SOURCE_NAME,
    confidenceScore: 1,
    qualityScore: 1,
    qualityBand: 'official_assessor_validated_sale',
    reviewStatus: 'ready',
    grossLivingArea: nullablePositiveNumber(
      row['Main and Upper Living Area'],
      'main and upper living area'
    ),
    lotSizeSqft,
    yearBuilt: validYearBuilt(row['Year Built'], saleYear),
    bedrooms: null,
    bathrooms: null,
    condition: null,
    qualityGrade: nullableString(row['Quality']),
    provenance: {
      sourceUrl: source.url,
      sourceFinalUrl: source.finalUrl,
      sourcePayloadPath: source.file,
      sourcePayloadSha256: source.sha256,
      candidateIndexSource: `${source.file}#row:${ordinal}`,
      candidateRecordType: 'official-assessor-residential-sale',
      candidateSourceOrdinal: ordinal,
    },
    flags: {
      duplicateRisk: false,
      needsReview: false,
      futureSaleDate: false,
      manualException: false,
    },
  };
}

function topNeighborhoodCodes(records) {
  const counts = new Map();
  for (const record of records) {
    if (!record.neighborhoodCode) continue;
    counts.set(record.neighborhoodCode, (counts.get(record.neighborhoodCode) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts.entries()]
      .sort(
        ([leftCode, leftCount], [rightCode, rightCount]) =>
          rightCount - leftCount || leftCode.localeCompare(rightCode)
      )
      .slice(0, 25)
  );
}

async function readSourceConfig(configPath = SOURCE_CONFIG_PATH) {
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  invariant(isRecord(config), 'Clark source-set config is not an object.');
  invariant(config.schemaVersion === SOURCE_SET_SCHEMA, 'Clark source-set schema is invalid.');
  invariant(
    config.county === COUNTY && config.countyCode === COUNTY_CODE,
    'Clark source-set county is invalid.'
  );
  invariant(
    Array.isArray(config.sources) && config.sources.length === 1,
    'Clark source-set must name one official residential CSV.'
  );
  let officialSource;
  try {
    officialSource = new URL(config.officialSourceBaseUrl);
  } catch {
    throw new Error('Clark official source URL is invalid.');
  }
  invariant(
    officialSource.protocol === 'https:' &&
      officialSource.username === '' &&
      officialSource.password === '' &&
      officialSource.search === '' &&
      officialSource.hash === '',
    'Clark official source must be credential-free HTTPS.'
  );
  let indexUrl;
  try {
    indexUrl = new URL(config.indexUrl);
  } catch {
    throw new Error('Clark source index URL is invalid.');
  }
  invariant(
    indexUrl.origin === officialSource.origin && indexUrl.search === '' && indexUrl.hash === '',
    'Clark source index is outside the official county origin.'
  );
  invariant(isRecord(config.sourceDateRange), 'Clark source date range is invalid.');
  const sourceDateStart = canonicalIsoDate(config.sourceDateRange.start);
  const sourceDateEnd = canonicalIsoDate(config.sourceDateRange.end);
  invariant(
    sourceDateStart !== null && sourceDateEnd !== null && sourceDateStart <= sourceDateEnd,
    'Clark source date range is invalid.'
  );
  const [source] = config.sources;
  invariant(isRecord(source), 'Clark source-set entry is invalid.');
  invariant(
    source.key === 'residential' &&
      typeof source.file === 'string' &&
      basename(source.file) === source.file &&
      typeof source.archiveFile === 'string' &&
      basename(source.archiveFile) === source.archiveFile &&
      source.archiveFile !== source.file,
    'Clark source identity is invalid.'
  );
  for (const key of ['url', 'finalUrl']) {
    let url;
    try {
      url = new URL(source[key]);
    } catch {
      throw new Error(`Clark ${key} is invalid.`);
    }
    invariant(
      url.protocol === 'https:' &&
        url.origin === officialSource.origin &&
        url.username === '' &&
        url.password === '' &&
        url.search === '' &&
        url.hash === '',
      `Clark ${key} is outside the official county origin.`
    );
  }
  invariant(
    SHA256_PATTERN.test(source.sha256) && SHA256_PATTERN.test(source.archiveSha256),
    'Clark source SHA-256 identity is invalid.'
  );
  return config;
}

export async function buildClarkCountyPackage(
  sourceDirectory,
  generatedAt,
  configPath = SOURCE_CONFIG_PATH
) {
  invariant(
    new Date(generatedAt).toISOString() === generatedAt,
    'Generated-at must be a canonical ISO timestamp.'
  );
  const config = await readSourceConfig(configPath);
  const source = config.sources[0];
  const sourcePath = resolve(sourceDirectory, source.file);
  const archivePath = resolve(sourceDirectory, source.archiveFile);
  invariant(
    sourcePath.startsWith(`${resolve(sourceDirectory)}${sep}`) &&
      archivePath.startsWith(`${resolve(sourceDirectory)}${sep}`),
    'Clark source payload escaped its source directory.'
  );
  const [bytes, archiveBytes] = await Promise.all([readFile(sourcePath), readFile(archivePath)]);
  const observedSha256 = createHash('sha256').update(bytes).digest('hex');
  const observedArchiveSha256 = createHash('sha256').update(archiveBytes).digest('hex');
  invariant(
    observedSha256 === source.sha256,
    'Clark official CSV does not match its expected SHA-256.'
  );
  invariant(
    observedArchiveSha256 === source.archiveSha256,
    'Clark official ZIP does not match its expected SHA-256.'
  );
  const candidates = parseClarkCsv(bytes.toString('utf8'));

  const uniqueCandidates = new Map();
  const duplicateIdentities = new Map();
  for (const [candidateIndex, row] of candidates.entries()) {
    const identity = canonicalIdentity(row);
    const previous = uniqueCandidates.get(identity);
    if (!previous) {
      uniqueCandidates.set(identity, { row, ordinal: candidateIndex + 2 });
      continue;
    }
    invariant(
      JSON.stringify(previous.row) === JSON.stringify(row),
      'Clark official CSV contains conflicting rows for one sale identity.'
    );
    const identitySha256 = createHash('sha256').update(identity).digest('hex');
    duplicateIdentities.set(identitySha256, (duplicateIdentities.get(identitySha256) ?? 0) + 1);
  }

  const records = [...uniqueCandidates.values()].map(({ row, ordinal }) =>
    mapRecord(row, source, ordinal, generatedAt)
  );
  invariant(
    records.every(
      record =>
        record.saleDate >= config.sourceDateRange.start &&
        record.saleDate <= config.sourceDateRange.end
    ),
    'Clark source contains a sale outside its published date range.'
  );
  records.sort(
    (left, right) =>
      right.saleDate.localeCompare(left.saleDate) || left.saleId.localeCompare(right.saleId)
  );
  invariant(records.length > 0, 'Clark official CSV produced no public residential sales.');
  invariant(
    new Set(records.map(record => record.saleId)).size === records.length,
    'Clark generated duplicate sale identifiers.'
  );

  const duplicateRows = candidates.length - records.length;
  const recordsWithNeighborhoodCode = records.filter(record => record.neighborhoodCode).length;
  const latestSaleDate = records[0].saleDate;
  const salesRoute = `/launch-data/washington/sales/by-county/${COUNTY_CODE}.json`;
  const detailRoute = `/launch-data/washington/counties/${COUNTY_CODE}.json`;
  const shard = {
    schemaVersion: SHARD_SCHEMA,
    generatedAt,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    summary: {
      records: records.length,
      latestSaleDate,
      reviewRecords: 0,
      recordsWithNeighborhoodCode,
      topNeighborhoodCodes: topNeighborhoodCodes(records),
    },
    records,
  };
  const statusEntry = {
    county: COUNTY,
    countyCode: COUNTY_CODE,
    priority: 'washington_assessor_launch',
    prometheusStatus: 'public_data_ready',
    primarySourceMode: SOURCE_MODE,
    latestSaleDate,
    candidateSales: candidates.length,
    stagedSales: records.length,
    needsReview: duplicateRows,
    confidence: {
      averageQualityScore: 1,
      parserStatus: 'ready',
      rawStatus: 'official_residential_sales_csv_verified',
      rawDriftDetected: false,
    },
    staticRoutes: { detail: detailRoute, salesShard: salesRoute },
  };
  const detail = {
    schemaVersion: DETAIL_SCHEMA,
    generatedAt,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    operationalState: {
      primarySourceMode: SOURCE_MODE,
      prometheusStatus: 'public_data_ready',
    },
    summary: { records: records.length, latestSaleDate },
    salesRoute,
  };
  const attestation = {
    algorithm: 'SHA-256',
    canonicalJsonSha256: canonicalJsonSha256(shard),
    county: COUNTY,
    countyCode: COUNTY_CODE,
    officialSourceBaseUrl: config.officialSourceBaseUrl,
    route: salesRoute,
    sourcePayloadSha256: [source.sha256],
    sourcePosture: SOURCE_MODE,
  };
  const receipt = {
    schemaVersion: RECEIPT_SCHEMA,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    generatedAt,
    indexUrl: config.indexUrl,
    publishedLabel: config.publishedLabel,
    sourceDateRange: config.sourceDateRange,
    candidateSales: candidates.length,
    stagedSales: records.length,
    quarantinedSales: duplicateRows,
    quarantine: {
      exactDuplicateRows: duplicateRows,
      duplicateIdentities: [...duplicateIdentities.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([identitySha256, duplicateCount]) => ({ identitySha256, duplicateCount })),
      conflictingSaleRows: 0,
      conflictingSaleIdentities: [],
    },
    sources: [
      {
        key: source.key,
        archiveFile: source.archiveFile,
        file: source.file,
        url: source.url,
        finalUrl: source.finalUrl,
        bytes: bytes.byteLength,
        sha256: observedSha256,
        archiveBytes: archiveBytes.byteLength,
        archiveSha256: observedArchiveSha256,
        candidateSales: candidates.length,
      },
    ],
    omittedFields: ['owner', 'grantor', 'grantee', 'buyer', 'seller'],
  };
  return { config, shard, statusEntry, detail, attestation, receipt };
}

export async function publishClarkPackage(
  sourceDirectory,
  outputPath,
  generatedAt,
  configPath = SOURCE_CONFIG_PATH
) {
  const clark = await buildClarkCountyPackage(sourceDirectory, generatedAt, configPath);
  let manifestDigest = null;
  await publishWashingtonLaunchPackage(outputPath, async ({ outputRoot, writeJson }) => {
    const retained = await loadVerifiedRetainedWashingtonPackage(
      outputRoot,
      COUNTY_CODE,
      generatedAt,
      [join('receipts', 'clark-source.json')]
    );
    for (const [relativePath, artifact] of retained.artifacts) {
      await writeJson(relativePath, artifact);
    }

    const status = {
      schemaVersion: STATUS_SCHEMA,
      generatedAt,
      sourcePosture:
        retained.statusEntries.length > 0 ? 'mixed_public_assessor_sources' : SOURCE_MODE,
      counties: [...retained.statusEntries, clark.statusEntry].sort((left, right) =>
        left.countyCode.localeCompare(right.countyCode)
      ),
    };
    const attestations = [...retained.attestations, clark.attestation].sort((left, right) =>
      left.countyCode.localeCompare(right.countyCode)
    );
    const shards = new Map(retained.shards);
    shards.set(COUNTY_CODE, clark.shard);
    for (const attestation of attestations) {
      const shard = shards.get(attestation.countyCode);
      invariant(shard, `Existing Washington shard ${attestation.countyCode} is missing.`);
      invariant(
        canonicalJsonSha256(shard) === attestation.canonicalJsonSha256,
        `Existing Washington shard ${attestation.countyCode} does not match its attestation.`
      );
    }
    const recordsWithNeighborhoodCode = [...shards.values()].reduce(
      (total, shard) => total + shard.summary.recordsWithNeighborhoodCode,
      0
    );
    const futureSaleDateRecords = [...shards.values()].reduce(
      (total, shard) =>
        total + shard.records.filter(record => record.flags?.futureSaleDate === true).length,
      0
    );
    const manifest = {
      schemaVersion: MANIFEST_SCHEMA,
      statusSchemaVersion: STATUS_SCHEMA,
      statusCanonicalJsonSha256: canonicalJsonSha256(status),
      generatedAt,
      sourcePosture: status.sourcePosture,
      salesShardAttestations: attestations,
      summary: {
        counties: status.counties.length,
        rawLanded: status.counties.length,
        parserReady: status.counties.filter(county => county.confidence?.parserStatus === 'ready')
          .length,
        candidateSales: status.counties.reduce((total, county) => total + county.candidateSales, 0),
        stagedSales: status.counties.reduce((total, county) => total + county.stagedSales, 0),
        needsReview: status.counties.reduce((total, county) => total + county.needsReview, 0),
        prometheusNeedsReview: status.counties.filter(
          county => county.prometheusStatus === 'needs_review'
        ).length,
        recordsWithNeighborhoodCode,
        futureSaleDateRecords,
        criticalContradictions: 0,
        garfieldExceptions: 0,
        bentonCityAsNeighborhoodRecords: 0,
      },
    };
    manifestDigest = canonicalJsonSha256(manifest);
    await writeJson('manifest.json', manifest);
    await writeJson(join('counties', 'status.json'), status);
    await writeJson(join('counties', `${COUNTY_CODE}.json`), clark.detail);
    await writeJson(join('sales', 'by-county', `${COUNTY_CODE}.json`), clark.shard);
    await writeJson(join('receipts', 'clark-source.json'), clark.receipt);
  });

  console.log(
    JSON.stringify(
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        manifestCanonicalJsonSha256: manifestDigest,
        candidateSales: clark.receipt.candidateSales,
        stagedSales: clark.receipt.stagedSales,
        quarantinedSales: clark.receipt.quarantinedSales,
        latestSaleDate: clark.shard.summary.latestSaleDate,
        outputPath: resolve(outputPath),
      },
      null,
      2
    )
  );
}

async function main() {
  const [sourceDirectory, outputPath, generatedAt] = process.argv.slice(2);
  invariant(
    sourceDirectory && outputPath && generatedAt,
    'Usage: clark_public_sales.mjs <source-directory> <output-directory> <generated-at-iso>'
  );
  await publishClarkPackage(sourceDirectory, outputPath, generatedAt);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}

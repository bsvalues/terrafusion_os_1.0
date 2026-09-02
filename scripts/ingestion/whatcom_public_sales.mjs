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

const COUNTY = 'Whatcom';
const COUNTY_CODE = '073';
const SOURCE_MODE = 'public_assessor_qualified_sales_csv';
const SOURCE_NAME_PREFIX = 'whatcom-official-qualified-sales';
const MANIFEST_SCHEMA = 'terrafusion.washington.launch-manifest.v1';
const STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const DETAIL_SCHEMA = 'terrafusion.washington.county-detail.v1';
const SHARD_SCHEMA = 'terrafusion.washington.sales-shard.v1';
const SOURCE_SET_SCHEMA = 'terrafusion.washington.public-source-set.v1';
const RECEIPT_SCHEMA = 'terrafusion.washington.public-source-receipt.v1';
const SHA256_PATTERN = /^[a-f\d]{64}$/;
const EXPECTED_HEADERS = [
  'Sale Date',
  'Sale Price',
  'Sale Type Code',
  'DOR State Code',
  'Site Size',
  'Property ID',
  'Parcel Number/Geo ID',
  'Neighborhood Code',
  'Property Type',
  'Tax Code Area',
  'Region Code',
  'Situs Address',
];
const SOURCE_CONFIG_PATH = fileURLToPath(
  new URL('./sources/whatcom_valuation_sales_2025.json', import.meta.url)
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
    `Whatcom source row has an invalid ${label}.`
  );
  return parsed;
}

function nullableFiniteNumber(value, label) {
  const normalized = nullableString(value);
  return normalized === null ? null : finiteNumber(normalized, label);
}

function canonicalSaleDate(value) {
  const normalized = String(value ?? '').trim();
  invariant(/^\d{4}-\d{2}-\d{2}$/.test(normalized), 'Whatcom sale date is not YYYY-MM-DD.');
  const timestamp = Date.parse(`${normalized}T00:00:00.000Z`);
  invariant(
    Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === normalized,
    'Whatcom sale date is not a real calendar date.'
  );
  return normalized;
}

export function parseWhatcomCsv(text) {
  invariant(typeof text === 'string', 'Whatcom CSV input must be text.');
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
      invariant(field.length === 0, 'Whatcom CSV has an unexpected quote in an unquoted field.');
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

  invariant(!quoted, 'Whatcom CSV ends inside a quoted field.');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  while (rows.length > 0 && rows.at(-1).every(value => value === '')) rows.pop();
  invariant(rows.length > 1, 'Whatcom CSV contains no data rows.');
  invariant(
    rows[0].length === EXPECTED_HEADERS.length &&
      rows[0].every((header, headerIndex) => header === EXPECTED_HEADERS[headerIndex]),
    'Whatcom CSV header does not match the qualified-sales contract.'
  );

  return rows.slice(1).map((values, rowIndex) => {
    invariant(
      values.length === EXPECTED_HEADERS.length,
      `Whatcom CSV row ${rowIndex + 2} has ${values.length} fields; expected ${EXPECTED_HEADERS.length}.`
    );
    return Object.fromEntries(EXPECTED_HEADERS.map((header, column) => [header, values[column]]));
  });
}

function saleIdentity(row) {
  return [row['Property ID'], row['Sale Date'], row['Sale Price'], row['Parcel Number/Geo ID']]
    .map(value => String(value ?? '').trim())
    .join('|');
}

function parseSitusCity(address) {
  if (!address) return null;
  const separator = address.lastIndexOf(',');
  return separator >= 0 ? nullableString(address.slice(separator + 1)) : null;
}

function mapRecord(candidate, generatedAt) {
  const { row, source, ordinal } = candidate;
  const saleDate = canonicalSaleDate(row['Sale Date']);
  const salePrice = finiteNumber(row['Sale Price'], 'sale price', { positive: true });
  const parcelNumber = nullableString(row['Parcel Number/Geo ID']);
  const propertyId = nullableString(row['Property ID']);
  const saleTypeCode = nullableString(row['Sale Type Code']);
  const situsAddress = nullableString(row['Situs Address']);
  invariant(parcelNumber, 'Whatcom source row has no parcel/Geo ID.');
  invariant(propertyId, 'Whatcom source row has no property ID.');
  invariant(
    ['K', 'L', 'M', 'Q'].includes(saleTypeCode),
    'Whatcom source row has an unknown sale type.'
  );
  invariant(saleDate <= generatedAt.slice(0, 10), 'Whatcom source row is future-dated.');

  const identity = saleIdentity(row);
  const identityDigest = createHash('sha256').update(identity).digest('hex');
  const neighborhoodCode = nullableString(row['Neighborhood Code']);
  return {
    saleId: `WA-${COUNTY_CODE}-${identityDigest.slice(0, 32)}`,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    parcelNumber,
    saleDate,
    saleYear: Number(saleDate.slice(0, 4)),
    salePrice,
    adjustedSalePrice: null,
    documentNumber: null,
    deedType: null,
    situsAddress,
    situsCity: parseSitusCity(situsAddress),
    situsZip: null,
    useCode: nullableString(row['DOR State Code']),
    acres: nullableFiniteNumber(row['Site Size'], 'site size'),
    grantor: null,
    grantee: null,
    saleNote: `Official qualified sale type ${saleTypeCode}`,
    neighborhoodCode,
    currentNeighborhoodCode: neighborhoodCode,
    sourceMode: SOURCE_MODE,
    candidateSource: `${SOURCE_NAME_PREFIX}-${source.key}`,
    confidenceScore: 1,
    qualityScore: 1,
    qualityBand: 'official_qualified_sale',
    reviewStatus: 'ready',
    grossLivingArea: null,
    lotSizeSqft: null,
    yearBuilt: null,
    bedrooms: null,
    bathrooms: null,
    condition: null,
    qualityGrade: null,
    provenance: {
      sourceUrl: source.url,
      sourceFinalUrl: source.url,
      sourcePayloadPath: source.file,
      sourcePayloadSha256: source.sha256,
      candidateIndexSource: `${source.file}#row:${ordinal}`,
      candidateRecordType:
        source.key === 'commercial'
          ? 'official-qualified-commercial-sale'
          : 'official-qualified-valuation-sale',
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
  invariant(isRecord(config), 'Whatcom source-set config is not an object.');
  invariant(config.schemaVersion === SOURCE_SET_SCHEMA, 'Whatcom source-set schema is invalid.');
  invariant(
    config.county === COUNTY && config.countyCode === COUNTY_CODE,
    'Whatcom source-set county is invalid.'
  );
  invariant(
    Array.isArray(config.sources) && config.sources.length === 8,
    'Whatcom source-set must name eight official CSV files.'
  );
  const officialSource = new URL(config.officialSourceBaseUrl);
  invariant(
    officialSource.protocol === 'https:' &&
      officialSource.username === '' &&
      officialSource.password === '',
    'Whatcom official source must be credential-free HTTPS.'
  );
  const officialOrigin = officialSource.origin;
  const indexUrl = new URL(config.indexUrl);
  invariant(
    indexUrl.origin === officialOrigin && indexUrl.search === '' && indexUrl.hash === '',
    'Whatcom source index is outside the official county origin.'
  );
  invariant(isRecord(config.sourceDateRange), 'Whatcom source date range is invalid.');
  const sourceStart = canonicalSaleDate(config.sourceDateRange.start);
  const sourceEnd = canonicalSaleDate(config.sourceDateRange.end);
  invariant(sourceStart <= sourceEnd, 'Whatcom source date range is reversed.');
  const keys = new Set();
  const files = new Set();
  for (const source of config.sources) {
    invariant(isRecord(source), 'Whatcom source-set entry is invalid.');
    invariant(
      typeof source.key === 'string' && source.key.length > 0,
      'Whatcom source key is invalid.'
    );
    invariant(
      typeof source.file === 'string' && basename(source.file) === source.file,
      'Whatcom source file is invalid.'
    );
    invariant(
      typeof source.url === 'string' && new URL(source.url).origin === officialOrigin,
      'Whatcom source URL is outside the official county origin.'
    );
    invariant(
      typeof source.sha256 === 'string' && SHA256_PATTERN.test(source.sha256),
      'Whatcom source SHA-256 is invalid.'
    );
    invariant(
      !keys.has(source.key) && !files.has(source.file),
      'Whatcom source-set contains duplicate identity.'
    );
    keys.add(source.key);
    files.add(source.file);
  }
  return config;
}

export async function buildWhatcomCountyPackage(
  sourceDirectory,
  generatedAt,
  configPath = SOURCE_CONFIG_PATH
) {
  invariant(
    new Date(generatedAt).toISOString() === generatedAt,
    'Generated-at must be a canonical ISO timestamp.'
  );
  const config = await readSourceConfig(configPath);
  const candidates = [];
  const sourceReceipts = [];
  for (const source of [...config.sources].sort((left, right) =>
    left.key.localeCompare(right.key)
  )) {
    const sourcePath = resolve(sourceDirectory, source.file);
    invariant(
      sourcePath.startsWith(`${resolve(sourceDirectory)}${sep}`),
      'Whatcom source file escaped its source directory.'
    );
    const bytes = await readFile(sourcePath);
    const observedSha256 = createHash('sha256').update(bytes).digest('hex');
    invariant(
      observedSha256 === source.sha256,
      `Whatcom source ${source.file} does not match its expected SHA-256.`
    );
    const rows = parseWhatcomCsv(bytes.toString('utf8'));
    rows.forEach((row, rowIndex) => {
      candidates.push({ row, source, ordinal: rowIndex + 2 });
    });
    sourceReceipts.push({
      key: source.key,
      file: source.file,
      url: source.url,
      bytes: bytes.byteLength,
      sha256: observedSha256,
      candidateSales: rows.length,
    });
  }

  const uniqueCandidates = new Map();
  const duplicates = new Map();
  for (const candidate of candidates) {
    const identity = saleIdentity(candidate.row);
    const previous = uniqueCandidates.get(identity);
    if (!previous) {
      uniqueCandidates.set(identity, candidate);
      continue;
    }
    invariant(
      JSON.stringify(previous.row) === JSON.stringify(candidate.row),
      `Whatcom official files conflict for sale identity ${identity}.`
    );
    const sources = duplicates.get(identity) ?? new Set([previous.source.key]);
    sources.add(candidate.source.key);
    duplicates.set(identity, sources);
  }

  const records = [...uniqueCandidates.values()].map(candidate =>
    mapRecord(candidate, generatedAt)
  );
  invariant(
    records.every(
      record =>
        record.saleDate >= config.sourceDateRange.start &&
        record.saleDate <= config.sourceDateRange.end
    ),
    'Whatcom source contains a sale outside its published date range.'
  );
  records.sort(
    (left, right) =>
      right.saleDate.localeCompare(left.saleDate) || left.saleId.localeCompare(right.saleId)
  );
  invariant(records.length > 0, 'Whatcom official files produced no qualified public sales.');
  const saleIds = new Set();
  for (const record of records) {
    invariant(!saleIds.has(record.saleId), `Whatcom saleId collision ${record.saleId}.`);
    saleIds.add(record.saleId);
  }

  const candidateSales = candidates.length;
  const duplicateSales = candidateSales - records.length;
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
    candidateSales,
    stagedSales: records.length,
    needsReview: duplicateSales,
    confidence: {
      averageQualityScore: 1,
      parserStatus: 'ready',
      rawStatus: 'official_qualified_sales_csv_verified',
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
    sourcePayloadSha256: sourceReceipts.map(source => source.sha256).sort(),
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
    candidateSales,
    stagedSales: records.length,
    quarantinedSales: duplicateSales,
    quarantine: {
      exactDuplicateRows: duplicateSales,
      duplicateIdentities: [...duplicates.entries()].map(([identity, sourceKeys]) => ({
        identitySha256: createHash('sha256').update(identity).digest('hex'),
        sourceKeys: [...sourceKeys].sort(),
      })),
    },
    sources: sourceReceipts,
    omittedFields: ['owner', 'grantor', 'grantee', 'buyer', 'seller'],
  };
  return { config, shard, statusEntry, detail, attestation, receipt };
}

export async function publishWhatcomPackage(
  sourceDirectory,
  outputPath,
  generatedAt,
  configPath = SOURCE_CONFIG_PATH
) {
  const whatcom = await buildWhatcomCountyPackage(sourceDirectory, generatedAt, configPath);

  let manifestDigest = null;
  await publishWashingtonLaunchPackage(outputPath, async ({ outputRoot, writeJson }) => {
    const retained = await loadVerifiedRetainedWashingtonPackage(
      outputRoot,
      COUNTY_CODE,
      generatedAt,
      [join('receipts', 'whatcom-source.json')]
    );
    for (const [relativePath, artifact] of retained.artifacts) {
      await writeJson(relativePath, artifact);
    }

    const status = {
      schemaVersion: STATUS_SCHEMA,
      generatedAt,
      sourcePosture: 'mixed_public_assessor_sources',
      counties: [...retained.statusEntries, whatcom.statusEntry].sort((left, right) =>
        left.countyCode.localeCompare(right.countyCode)
      ),
    };
    const attestations = [...retained.attestations, whatcom.attestation].sort((left, right) =>
      left.countyCode.localeCompare(right.countyCode)
    );

    for (const attestation of attestations) {
      const shard =
        attestation.countyCode === COUNTY_CODE
          ? whatcom.shard
          : retained.shards.get(attestation.countyCode);
      invariant(shard, `Existing Washington shard ${attestation.countyCode} is missing.`);
      invariant(
        canonicalJsonSha256(shard) === attestation.canonicalJsonSha256,
        `Existing Washington shard ${attestation.countyCode} does not match its attestation.`
      );
    }

    const shards = new Map(retained.shards);
    shards.set(COUNTY_CODE, whatcom.shard);
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
    await writeJson(join('counties', `${COUNTY_CODE}.json`), whatcom.detail);
    await writeJson(join('sales', 'by-county', `${COUNTY_CODE}.json`), whatcom.shard);
    await writeJson(join('receipts', 'whatcom-source.json'), whatcom.receipt);
  });

  console.log(
    JSON.stringify(
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        manifestCanonicalJsonSha256: manifestDigest,
        candidateSales: whatcom.receipt.candidateSales,
        stagedSales: whatcom.receipt.stagedSales,
        quarantinedSales: whatcom.receipt.quarantinedSales,
        latestSaleDate: whatcom.shard.summary.latestSaleDate,
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
    'Usage: whatcom_public_sales.mjs <source-directory> <output-directory> <generated-at-iso>'
  );
  await publishWhatcomPackage(sourceDirectory, outputPath, generatedAt);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}

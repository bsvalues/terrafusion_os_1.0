#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import XLSX from 'xlsx';
import {
  canonicalJsonSha256,
  loadVerifiedRetainedWashingtonPackage,
  publishWashingtonLaunchPackage,
} from './kitsap_public_sales.mjs';

XLSX.set_fs(fs);

const COUNTY = 'Chelan';
const COUNTY_CODE = '007';
const SOURCE_MODE = 'public_assessor_monthly_sales_xls';
const SOURCE_CONFIG_PATH = fileURLToPath(
  new URL('./sources/chelan_monthly_sales_2026.json', import.meta.url)
);
const SOURCE_SET_SCHEMA = 'terrafusion.washington.public-source-set.v1';
const RECEIPT_SCHEMA = 'terrafusion.washington.public-source-receipt.v1';
const STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const DETAIL_SCHEMA = 'terrafusion.washington.county-detail.v1';
const SHARD_SCHEMA = 'terrafusion.washington.sales-shard.v1';
const MANIFEST_SCHEMA = 'terrafusion.washington.launch-manifest.v1';
const SHA256_PATTERN = /^[a-f\d]{64}$/;
const EXPECTED_HEADERS = [
  'prop_id',
  'geo_id',
  'NBHD',
  'Region',
  'Sale_Price',
  'Deed_Date',
  'Sale_Date',
  'state_cd',
  'situs_num',
  'situs_street_prefx',
  'situs_street',
  'situs_street_sufix',
  'situs_city',
  'legal_acreage',
  'living_area',
  'Basement_Area',
  'Part_Finish',
  'Minimal_Finish',
  'Year Built',
  'Width',
  'Length',
  'Bedrooms',
  'Bathrooms',
  'Heat_Cool',
  'Number_of_Units',
  'Garage_Area',
  'Pool',
  'FIREPLACE',
  'Number_of_Fireplaces',
  'Deed_Type',
  'Reject_Code',
  'Aff_#',
  'Auditor_File_#',
  'Market',
  'Buyer',
  'Seller',
  'Tax Area',
];
const SAFE_HEADERS = EXPECTED_HEADERS.filter(header => !['Buyer', 'Seller'].includes(header));

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nullableString(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function finiteNumber(value, label, { positive = false } = {}) {
  const parsed = Number(String(value ?? '').replace(/[$,\s]/g, ''));
  invariant(
    Number.isFinite(parsed) && (!positive || parsed > 0),
    `Chelan row has invalid ${label}.`
  );
  return parsed;
}

function nullableFiniteNumber(value, label) {
  return nullableString(value) === null ? null : finiteNumber(value, label);
}

function validYearBuilt(value, label, saleYear) {
  const year = nullableFiniteNumber(value, label);
  return year !== null && Number.isInteger(year) && year >= 1700 && year <= saleYear ? year : null;
}

function credentialFreeHttpsUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be valid credential-free HTTPS.`);
  }
  invariant(
    parsed.protocol === 'https:' &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash,
    `${label} must be credential-free HTTPS without a query or fragment.`
  );
  return parsed;
}

export function canonicalSaleDate(value) {
  if (value instanceof Date) {
    invariant(Number.isFinite(value.getTime()), 'Chelan sale date is invalid.');
    return [
      String(value.getFullYear()).padStart(4, '0'),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0'),
    ].join('-');
  }
  const normalized = String(value ?? '').trim();
  const match = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(normalized);
  invariant(match, 'Chelan sale date is not YYYY/MM/DD.');
  const canonical = `${match[1]}-${match[2]}-${match[3]}`;
  const timestamp = Date.parse(`${canonical}T00:00:00.000Z`);
  invariant(
    Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === canonical,
    'Chelan sale date is not a real calendar date.'
  );
  return canonical;
}

function sanitizeWorkbookRow(raw, rowNumber) {
  invariant(isRecord(raw), `Chelan workbook row ${rowNumber} is invalid.`);
  // Buyer and Seller are deliberately not copied out of the XLS parser boundary.
  return Object.fromEntries(SAFE_HEADERS.map(header => [header, raw[header] ?? null]));
}

export function parseChelanWorkbook(bytes) {
  const workbook = XLSX.read(bytes, { type: 'buffer', cellDates: true });
  invariant(workbook.SheetNames.length === 1, 'Chelan workbook must contain exactly one sheet.');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const table = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
  invariant(table.length > 1, 'Chelan workbook contains no sales rows.');
  const headers = table[0].map(value => String(value ?? '').trim());
  invariant(
    headers.length === EXPECTED_HEADERS.length &&
      headers.every((header, index) => header === EXPECTED_HEADERS[index]),
    'Chelan workbook header does not match the monthly-sales contract.'
  );
  return table.slice(1).map((values, index) => {
    invariant(
      values.length <= EXPECTED_HEADERS.length,
      `Chelan workbook row ${index + 2} has extra fields.`
    );
    const raw = Object.fromEntries(
      EXPECTED_HEADERS.map((header, column) => [header, values[column] ?? null])
    );
    return sanitizeWorkbookRow(raw, index + 2);
  });
}

function transactionIdentity(row) {
  return [row.prop_id, row.geo_id, canonicalSaleDate(row.Sale_Date), row['Aff_#']]
    .map(value => String(value ?? '').trim())
    .join('|');
}

function unanimous(group, header, label, converter = nullableString) {
  const values = group.map(candidate => converter(candidate.row[header], label));
  const distinct = new Map(values.map(value => [JSON.stringify(value), value]));
  invariant(distinct.size <= 1, `Chelan transaction has conflicting ${label}.`);
  return values[0] ?? null;
}

function optionalUnanimousNumber(group, header, label) {
  const values = group.map(candidate => nullableFiniteNumber(candidate.row[header], label));
  const present = values.filter(value => value !== null);
  return present.length > 0 && present.every(value => value === present[0]) ? present[0] : null;
}

function optionalUnanimousYearBuilt(group, saleYear) {
  const values = group.map(candidate =>
    validYearBuilt(candidate.row['Year Built'], 'year built', saleYear)
  );
  const present = values.filter(value => value !== null);
  return present.length > 0 && present.every(value => value === present[0]) ? present[0] : null;
}

function situsAddress(row) {
  return (
    [row.situs_num, row.situs_street_prefx, row.situs_street, row.situs_street_sufix]
      .map(nullableString)
      .filter(Boolean)
      .join(' ') || null
  );
}

function mapTransaction(group, generatedAt) {
  const first = group[0];
  const identity = transactionIdentity(first.row);
  const identityDigest = createHash('sha256').update(identity).digest('hex');
  const saleDate = canonicalSaleDate(first.row.Sale_Date);
  const saleYear = Number(saleDate.slice(0, 4));
  invariant(saleDate <= generatedAt.slice(0, 10), 'Chelan transaction is future-dated.');
  const parcelNumber = unanimous(group, 'geo_id', 'parcel number');
  const propertyId = unanimous(group, 'prop_id', 'property ID');
  invariant(parcelNumber && propertyId, 'Chelan transaction lacks parcel identity.');
  const salePrice = unanimous(group, 'Sale_Price', 'sale price', (value, label) =>
    finiteNumber(value, label, { positive: true })
  );
  const rejectCode = unanimous(group, 'Reject_Code', 'official reject code');
  const neighborhoodCode = unanimous(group, 'NBHD', 'neighborhood code');
  const deedType = unanimous(group, 'Deed_Type', 'deed type');
  const mappedSitusAddress = situsAddress({
    situs_num: unanimous(group, 'situs_num', 'situs number'),
    situs_street_prefx: unanimous(group, 'situs_street_prefx', 'situs street prefix'),
    situs_street: unanimous(group, 'situs_street', 'situs street'),
    situs_street_sufix: unanimous(group, 'situs_street_sufix', 'situs street suffix'),
  });
  const needsReview = rejectCode !== null;
  return {
    saleId: `WA-${COUNTY_CODE}-${identityDigest.slice(0, 32)}`,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    parcelNumber,
    saleDate,
    saleYear,
    salePrice,
    adjustedSalePrice: null,
    documentNumber: unanimous(group, 'Auditor_File_#', 'auditor file number'),
    deedType,
    situsAddress: mappedSitusAddress,
    situsCity: unanimous(group, 'situs_city', 'situs city'),
    situsZip: null,
    useCode: unanimous(group, 'state_cd', 'state use code'),
    acres: unanimous(group, 'legal_acreage', 'acreage', nullableFiniteNumber),
    grantor: null,
    grantee: null,
    saleNote: needsReview ? `Official Chelan reject code ${rejectCode}` : null,
    neighborhoodCode,
    currentNeighborhoodCode: neighborhoodCode,
    sourceMode: SOURCE_MODE,
    candidateSource: `chelan-official-monthly-sales-${first.source.key}`,
    confidenceScore: 1,
    qualityScore: needsReview ? 0.8 : 1,
    qualityBand: needsReview ? 'official_review_required' : 'official_assessor_sale',
    reviewStatus: needsReview ? 'review_required' : 'ready',
    grossLivingArea: unanimous(group, 'living_area', 'living area', nullableFiniteNumber),
    lotSizeSqft: null,
    yearBuilt: optionalUnanimousYearBuilt(group, saleYear),
    bedrooms: optionalUnanimousNumber(group, 'Bedrooms', 'bedrooms'),
    bathrooms: optionalUnanimousNumber(group, 'Bathrooms', 'bathrooms'),
    condition: null,
    qualityGrade: null,
    provenance: {
      sourceUrl: first.source.url,
      sourceFinalUrl: first.source.url,
      sourcePayloadPath: first.source.file,
      sourcePayloadSha256: first.source.sha256,
      candidateIndexSource: `${first.source.file}#row:${first.ordinal}`,
      candidateRecordType: 'official-monthly-assessor-sale',
      candidateSourceOrdinal: first.ordinal,
      componentRows: group.map(candidate => ({
        sourceKey: candidate.source.key,
        sourceUrl: candidate.source.url,
        sourcePayloadPath: candidate.source.file,
        sourcePayloadSha256: candidate.source.sha256,
        candidateIndexSource: `${candidate.source.file}#row:${candidate.ordinal}`,
      })),
    },
    flags: { duplicateRisk: false, needsReview, futureSaleDate: false, manualException: false },
  };
}

function topNeighborhoodCodes(records) {
  const counts = new Map();
  for (const record of records) {
    if (record.neighborhoodCode)
      counts.set(record.neighborhoodCode, (counts.get(record.neighborhoodCode) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 25)
  );
}

async function readSourceConfig(configPath = SOURCE_CONFIG_PATH) {
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  invariant(
    isRecord(config) && config.schemaVersion === SOURCE_SET_SCHEMA,
    'Chelan source-set schema is invalid.'
  );
  invariant(
    config.county === COUNTY && config.countyCode === COUNTY_CODE,
    'Chelan source-set county is invalid.'
  );
  invariant(
    Array.isArray(config.sources) && config.sources.length === 7,
    'Chelan source-set must name seven monthly files.'
  );
  const official = credentialFreeHttpsUrl(config.officialSourceBaseUrl, 'Chelan official source');
  const indexUrl = credentialFreeHttpsUrl(config.indexUrl, 'Chelan source index');
  invariant(
    indexUrl.origin === official.origin,
    'Chelan source index must be on the official origin.'
  );
  const start = canonicalSaleDate(config.sourceDateRange?.start);
  const end = canonicalSaleDate(config.sourceDateRange?.end);
  invariant(start <= end, 'Chelan source date range is reversed.');
  const keys = new Set();
  const files = new Set();
  for (const source of config.sources) {
    invariant(
      isRecord(source) && typeof source.key === 'string' && source.key,
      'Chelan source entry is invalid.'
    );
    invariant(
      typeof source.file === 'string' && basename(source.file) === source.file,
      'Chelan source filename is invalid.'
    );
    const sourceUrl = credentialFreeHttpsUrl(source.url, 'Chelan source URL');
    invariant(
      sourceUrl.origin === official.origin,
      'Chelan source URL must be on the official origin.'
    );
    invariant(SHA256_PATTERN.test(source.sha256), 'Chelan source SHA-256 is invalid.');
    invariant(
      !keys.has(source.key) && !files.has(source.file),
      'Chelan source-set contains duplicate identity.'
    );
    keys.add(source.key);
    files.add(source.file);
  }
  return { ...config, sourceDateRange: { start, end } };
}

export async function buildChelanCountyPackage(
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
  for (const source of [...config.sources].sort((a, b) => a.key.localeCompare(b.key))) {
    const sourcePath = resolve(sourceDirectory, source.file);
    invariant(
      sourcePath.startsWith(`${resolve(sourceDirectory)}${sep}`),
      'Chelan source escaped its directory.'
    );
    const bytes = await readFile(sourcePath);
    const observedSha256 = createHash('sha256').update(bytes).digest('hex');
    invariant(
      observedSha256 === source.sha256,
      `Chelan source ${source.file} does not match its expected SHA-256.`
    );
    const rows = parseChelanWorkbook(bytes);
    rows.forEach((row, index) => candidates.push({ row, source, ordinal: index + 2 }));
    sourceReceipts.push({
      key: source.key,
      file: source.file,
      url: source.url,
      bytes: bytes.byteLength,
      sha256: observedSha256,
      candidateSales: rows.length,
    });
  }

  const groups = new Map();
  for (const candidate of candidates) {
    const identity = transactionIdentity(candidate.row);
    const group = groups.get(identity) ?? [];
    group.push(candidate);
    groups.set(identity, group);
  }
  const records = [];
  const conflicts = [];
  let componentRowsConsolidated = 0;
  let multiComponentTransactions = 0;
  for (const [identity, group] of groups) {
    if (group.length > 1) {
      multiComponentTransactions += 1;
      componentRowsConsolidated += group.length - 1;
    }
    const prices = [
      ...new Set(
        group.map(candidate =>
          finiteNumber(candidate.row.Sale_Price, 'sale price', { positive: true })
        )
      ),
    ];
    if (prices.length > 1) {
      conflicts.push({
        identitySha256: createHash('sha256').update(identity).digest('hex'),
        sourceKeys: [...new Set(group.map(candidate => candidate.source.key))].sort(),
        observedSalePrices: prices.sort((a, b) => a - b),
        rows: group.length,
      });
      continue;
    }
    records.push(mapTransaction(group, generatedAt));
  }
  records.sort((a, b) => b.saleDate.localeCompare(a.saleDate) || a.saleId.localeCompare(b.saleId));
  invariant(records.length > 0, 'Chelan official files produced no public sales.');
  invariant(
    records.every(
      record =>
        record.saleDate >= config.sourceDateRange.start &&
        record.saleDate <= config.sourceDateRange.end
    ),
    'Chelan source contains a sale outside its published date range.'
  );
  invariant(
    new Set(records.map(record => record.saleId)).size === records.length,
    'Chelan saleId collision detected.'
  );
  const latestSaleDate = records[0].saleDate;
  const reviewRecords = records.filter(record => record.flags.needsReview).length;
  const quarantinedSales = conflicts.reduce((total, conflict) => total + conflict.rows, 0);
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
      reviewRecords,
      recordsWithNeighborhoodCode: records.filter(record => record.neighborhoodCode).length,
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
    needsReview: reviewRecords + quarantinedSales,
    confidence: {
      averageQualityScore:
        records.reduce((sum, record) => sum + record.qualityScore, 0) / records.length,
      parserStatus: 'ready',
      rawStatus: 'official_monthly_sales_xls_verified',
      rawDriftDetected: false,
    },
    staticRoutes: { detail: detailRoute, salesShard: salesRoute },
  };
  const detail = {
    schemaVersion: DETAIL_SCHEMA,
    generatedAt,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    operationalState: { primarySourceMode: SOURCE_MODE, prometheusStatus: 'public_data_ready' },
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
    candidateSales: candidates.length,
    stagedSales: records.length,
    reviewRequiredSales: reviewRecords,
    quarantinedSales,
    consolidation: { componentRowsConsolidated, multiComponentTransactions },
    quarantine: {
      conflictingSaleRows: quarantinedSales,
      conflictingSaleIdentities: conflicts.map(({ rows, ...conflict }) => conflict),
    },
    sources: sourceReceipts,
    omittedFields: ['owner', 'grantor', 'grantee', 'buyer', 'seller'],
  };
  return { config, shard, statusEntry, detail, attestation, receipt };
}

export async function publishChelanPackage(
  sourceDirectory,
  outputPath,
  generatedAt,
  configPath = SOURCE_CONFIG_PATH
) {
  const chelan = await buildChelanCountyPackage(sourceDirectory, generatedAt, configPath);
  let manifestDigest = null;
  await publishWashingtonLaunchPackage(outputPath, async ({ outputRoot, writeJson }) => {
    const retained = await loadVerifiedRetainedWashingtonPackage(
      outputRoot,
      COUNTY_CODE,
      generatedAt,
      [join('receipts', 'chelan-source.json')]
    );
    for (const [relativePath, artifact] of retained.artifacts)
      await writeJson(relativePath, artifact);
    const status = {
      schemaVersion: STATUS_SCHEMA,
      generatedAt,
      sourcePosture: retained.statusEntries.length ? 'mixed_public_assessor_sources' : SOURCE_MODE,
      counties: [...retained.statusEntries, chelan.statusEntry].sort((a, b) =>
        a.countyCode.localeCompare(b.countyCode)
      ),
    };
    const attestations = [...retained.attestations, chelan.attestation].sort((a, b) =>
      a.countyCode.localeCompare(b.countyCode)
    );
    const shards = new Map(retained.shards);
    shards.set(COUNTY_CODE, chelan.shard);
    for (const attestation of attestations) {
      const shard = shards.get(attestation.countyCode);
      invariant(
        shard && canonicalJsonSha256(shard) === attestation.canonicalJsonSha256,
        `Existing Washington shard ${attestation.countyCode} does not match its attestation.`
      );
    }
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
        candidateSales: status.counties.reduce((sum, county) => sum + county.candidateSales, 0),
        stagedSales: status.counties.reduce((sum, county) => sum + county.stagedSales, 0),
        needsReview: status.counties.reduce((sum, county) => sum + county.needsReview, 0),
        prometheusNeedsReview: status.counties.filter(
          county => county.prometheusStatus === 'needs_review'
        ).length,
        recordsWithNeighborhoodCode: [...shards.values()].reduce(
          (sum, shard) => sum + shard.summary.recordsWithNeighborhoodCode,
          0
        ),
        futureSaleDateRecords: [...shards.values()].reduce(
          (sum, shard) => sum + shard.records.filter(record => record.flags?.futureSaleDate).length,
          0
        ),
        criticalContradictions: 0,
        garfieldExceptions: 0,
        bentonCityAsNeighborhoodRecords: 0,
      },
    };
    manifestDigest = canonicalJsonSha256(manifest);
    await writeJson('manifest.json', manifest);
    await writeJson(join('counties', 'status.json'), status);
    await writeJson(join('counties', `${COUNTY_CODE}.json`), chelan.detail);
    await writeJson(join('sales', 'by-county', `${COUNTY_CODE}.json`), chelan.shard);
    await writeJson(join('receipts', 'chelan-source.json'), chelan.receipt);
  });
  console.log(
    JSON.stringify(
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        manifestCanonicalJsonSha256: manifestDigest,
        candidateSales: chelan.receipt.candidateSales,
        stagedSales: chelan.receipt.stagedSales,
        reviewRequiredSales: chelan.receipt.reviewRequiredSales,
        quarantinedSales: chelan.receipt.quarantinedSales,
        latestSaleDate: chelan.shard.summary.latestSaleDate,
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
    'Usage: chelan_public_sales.mjs <source-directory> <output-directory> <generated-at-iso>'
  );
  await publishChelanPackage(sourceDirectory, outputPath, generatedAt);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  await main();

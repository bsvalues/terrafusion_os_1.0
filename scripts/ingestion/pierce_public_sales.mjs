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

const COUNTY = 'Pierce';
const COUNTY_CODE = '053';
const SOURCE_MODE = 'public_assessor_weekly_datamart';
const SOURCE_NAME = 'pierce-official-assessor-datamart-2026-08-28';
const MANIFEST_SCHEMA = 'terrafusion.washington.launch-manifest.v1';
const STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const DETAIL_SCHEMA = 'terrafusion.washington.county-detail.v1';
const SHARD_SCHEMA = 'terrafusion.washington.sales-shard.v1';
const SOURCE_SET_SCHEMA = 'terrafusion.washington.public-source-set.v1';
const RECEIPT_SCHEMA = 'terrafusion.washington.public-source-receipt.v1';
const SHA256_PATTERN = /^[a-f\d]{64}$/;
const SALE_FIELD_COUNT = 13;
const TAX_ACCOUNT_FIELD_COUNT = 28;
const ALLOWED_SOURCE_HOSTS = new Set([
  'www.co.pierce.wa.us',
  'www.piercecountywa.gov',
  'online.co.pierce.wa.us',
]);
const SOURCE_CONFIG_PATH = fileURLToPath(
  new URL('./sources/pierce_datamart_sales_2026.json', import.meta.url)
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

export function canonicalPierceSaleDate(value) {
  const normalized = String(value ?? '').trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalized);
  invariant(match, 'Pierce sale date is not MM/DD/YYYY.');
  const year = Number(match[3]);
  const month = Number(match[1]);
  const day = Number(match[2]);
  const date = new Date(Date.UTC(year, month - 1, day));
  invariant(
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day,
    'Pierce sale date is not a real calendar date.'
  );
  return date.toISOString().slice(0, 10);
}

export function parsePiercePipeRows(text, expectedFields, label) {
  invariant(typeof text === 'string', `${label} input must be text.`);
  invariant(
    Number.isInteger(expectedFields) && expectedFields > 0,
    `${label} field count is invalid.`
  );
  const normalized = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = normalized.trimEnd().split(/\r?\n/);
  invariant(lines.length > 0 && lines[0].length > 0, `${label} contains no rows.`);
  return lines.map((line, index) => {
    invariant(
      !line.includes('\r') && !line.includes('\n'),
      `${label} row ${index + 1} is malformed.`
    );
    const fields = line.split('|');
    invariant(
      fields.length === expectedFields,
      `${label} row ${index + 1} has ${fields.length} fields; expected ${expectedFields}.`
    );
    return fields;
  });
}

function positiveNumber(value) {
  const parsed = Number(String(value ?? '').trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function canonicalIdentity(row, saleDate, salePrice) {
  return [row[0], row[2], saleDate, salePrice].map(value => String(value).trim()).join('|');
}

function validateOfficialUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Pierce ${label} URL is invalid.`);
  }
  invariant(
    url.protocol === 'https:' &&
      ALLOWED_SOURCE_HOSTS.has(url.hostname) &&
      url.username === '' &&
      url.password === '' &&
      url.search === '' &&
      url.hash === '',
    `Pierce ${label} URL is outside the official county hosts.`
  );
  return url;
}

async function readSourceConfig(configPath = SOURCE_CONFIG_PATH) {
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  invariant(isRecord(config), 'Pierce source-set config is not an object.');
  invariant(config.schemaVersion === SOURCE_SET_SCHEMA, 'Pierce source-set schema is invalid.');
  invariant(
    config.county === COUNTY && config.countyCode === COUNTY_CODE,
    'Pierce source-set county is invalid.'
  );
  invariant(
    Array.isArray(config.sources) &&
      config.sources.length === 2 &&
      config.sources.map(source => source?.key).join(',') === 'sale,tax_account',
    'Pierce source-set must name the sale and tax-account extracts.'
  );
  validateOfficialUrl(config.officialSourceBaseUrl, 'official source');
  validateOfficialUrl(config.indexUrl, 'source index');
  invariant(isRecord(config.sourceDateRange), 'Pierce source date range is invalid.');
  const sourceDateStart = canonicalIsoDate(config.sourceDateRange.start);
  const sourceDateEnd = canonicalIsoDate(config.sourceDateRange.end);
  invariant(
    sourceDateStart !== null && sourceDateEnd !== null && sourceDateStart <= sourceDateEnd,
    'Pierce source date range is invalid.'
  );
  const identities = new Set();
  for (const source of config.sources) {
    invariant(isRecord(source), 'Pierce source-set entry is invalid.');
    invariant(
      typeof source.file === 'string' &&
        basename(source.file) === source.file &&
        typeof source.archiveFile === 'string' &&
        basename(source.archiveFile) === source.archiveFile &&
        source.archiveFile !== source.file &&
        !identities.has(source.file) &&
        !identities.has(source.archiveFile),
      'Pierce source identity is invalid.'
    );
    identities.add(source.file);
    identities.add(source.archiveFile);
    validateOfficialUrl(source.url, `${source.key} source`);
    validateOfficialUrl(source.finalUrl, `${source.key} final source`);
    invariant(
      SHA256_PATTERN.test(source.sha256) && SHA256_PATTERN.test(source.archiveSha256),
      'Pierce source SHA-256 identity is invalid.'
    );
  }
  return config;
}

async function readVerifiedSource(sourceDirectory, source) {
  const root = resolve(sourceDirectory);
  const sourcePath = resolve(root, source.file);
  const archivePath = resolve(root, source.archiveFile);
  invariant(
    sourcePath.startsWith(`${root}${sep}`) && archivePath.startsWith(`${root}${sep}`),
    'Pierce source payload escaped its source directory.'
  );
  const [bytes, archiveBytes] = await Promise.all([readFile(sourcePath), readFile(archivePath)]);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const archiveSha256 = createHash('sha256').update(archiveBytes).digest('hex');
  invariant(sha256 === source.sha256, `Pierce ${source.key} extract does not match its SHA-256.`);
  invariant(
    archiveSha256 === source.archiveSha256,
    `Pierce ${source.key} ZIP does not match its SHA-256.`
  );
  return { ...source, bytes, archiveBytes, sha256, archiveSha256 };
}

function taxAccountByParcel(rows) {
  const accounts = new Map();
  for (const [index, row] of rows.entries()) {
    const parcelNumber = nullableString(row[0]);
    invariant(parcelNumber, `Pierce tax-account row ${index + 1} has no parcel number.`);
    const previous = accounts.get(parcelNumber);
    invariant(
      previous === undefined || JSON.stringify(previous.row) === JSON.stringify(row),
      `Pierce tax-account extract has conflicting rows for parcel ${parcelNumber}.`
    );
    if (!previous) accounts.set(parcelNumber, { row, ordinal: index + 1 });
  }
  return accounts;
}

function mapRecord(row, ordinal, saleDate, salePrice, saleSource, taxSource, taxAccount) {
  const parcelNumber = nullableString(row[2]);
  const documentNumber = nullableString(row[0]);
  invariant(
    parcelNumber && documentNumber,
    'Pierce sale is missing its parcel or recording identity.'
  );
  const identityDigest = createHash('sha256')
    .update(canonicalIdentity(row, saleDate, salePrice))
    .digest('hex');
  const siteAddress = nullableString(taxAccount.row[3]);
  invariant(siteAddress, `Pierce staged parcel ${parcelNumber} has no official site address.`);
  return {
    saleId: `WA-${COUNTY_CODE}-${identityDigest.slice(0, 32)}`,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    parcelNumber,
    saleDate,
    saleYear: Number(saleDate.slice(0, 4)),
    salePrice,
    adjustedSalePrice: null,
    documentNumber,
    deedType: nullableString(row[5]),
    situsAddress: siteAddress,
    situsCity: null,
    situsZip: null,
    useCode: nullableString(row[12]) ?? nullableString(taxAccount.row[5]),
    acres: null,
    grantor: null,
    grantee: null,
    saleNote: null,
    neighborhoodCode: null,
    currentNeighborhoodCode: null,
    sourceMode: SOURCE_MODE,
    candidateSource: SOURCE_NAME,
    confidenceScore: 1,
    qualityScore: 1,
    qualityBand: 'official_assessor_valid_confirmed_sale',
    reviewStatus: 'ready',
    grossLivingArea: null,
    lotSizeSqft: null,
    yearBuilt: null,
    bedrooms: null,
    bathrooms: null,
    condition: null,
    qualityGrade: null,
    provenance: {
      sourceUrl: saleSource.url,
      sourceFinalUrl: saleSource.finalUrl,
      sourcePayloadPath: saleSource.file,
      sourcePayloadSha256: saleSource.sha256,
      candidateIndexSource: `${saleSource.file}#row:${ordinal}`,
      candidateRecordType: 'official-assessor-valid-confirmed-sale',
      candidateSourceOrdinal: ordinal,
      componentRows: [
        {
          sourceUrl: saleSource.url,
          sourcePayloadPath: saleSource.file,
          sourcePayloadSha256: saleSource.sha256,
          candidateIndexSource: `${saleSource.file}#row:${ordinal}`,
        },
        {
          sourceUrl: taxSource.url,
          sourcePayloadPath: taxSource.file,
          sourcePayloadSha256: taxSource.sha256,
          candidateIndexSource: `${taxSource.file}#row:${taxAccount.ordinal}`,
        },
      ],
    },
    flags: {
      duplicateRisk: false,
      needsReview: false,
      futureSaleDate: false,
      manualException: false,
    },
  };
}

export async function buildPierceCountyPackage(
  sourceDirectory,
  generatedAt,
  configPath = SOURCE_CONFIG_PATH
) {
  invariant(
    new Date(generatedAt).toISOString() === generatedAt,
    'Generated-at must be a canonical ISO timestamp.'
  );
  const generatedDate = generatedAt.slice(0, 10);
  const config = await readSourceConfig(configPath);
  invariant(
    config.sourceDateRange.end <= generatedDate,
    'Pierce source range extends into the future.'
  );
  const [saleSource, taxSource] = await Promise.all(
    config.sources.map(source => readVerifiedSource(sourceDirectory, source))
  );
  const saleRows = parsePiercePipeRows(
    saleSource.bytes.toString('utf8'),
    SALE_FIELD_COUNT,
    'Pierce sale extract'
  );
  const taxRows = parsePiercePipeRows(
    taxSource.bytes.toString('utf8'),
    TAX_ACCOUNT_FIELD_COUNT,
    'Pierce tax-account extract'
  );
  const accounts = taxAccountByParcel(taxRows);
  const seen = new Map();
  const duplicateIdentities = new Map();
  const quarantine = {
    exactDuplicateRows: 0,
    invalidSales: 0,
    unconfirmedSales: 0,
    assessorExcludedSales: 0,
    nonPositiveSalePrice: 0,
  };
  const excludedReasons = new Map();
  const records = [];
  let candidateSales = 0;

  for (const [index, row] of saleRows.entries()) {
    const saleDate = canonicalPierceSaleDate(row[3]);
    invariant(saleDate <= generatedDate, 'Pierce source contains a future-dated sale.');
    if (saleDate < config.sourceDateRange.start || saleDate > config.sourceDateRange.end) continue;
    candidateSales += 1;
    const salePrice = positiveNumber(row[4]);
    const identity = canonicalIdentity(row, saleDate, salePrice ?? row[4]);
    const previous = seen.get(identity);
    if (previous) {
      invariant(
        JSON.stringify(previous.row) === JSON.stringify(row),
        'Pierce sale extract contains conflicting rows for one sale identity.'
      );
      quarantine.exactDuplicateRows += 1;
      const digest = createHash('sha256').update(identity).digest('hex');
      duplicateIdentities.set(digest, (duplicateIdentities.get(digest) ?? 0) + 1);
      continue;
    }
    seen.set(identity, { row, ordinal: index + 1 });

    if (salePrice === null) {
      quarantine.nonPositiveSalePrice += 1;
      continue;
    }
    if (row[8] !== '1') {
      quarantine.invalidSales += 1;
      continue;
    }
    if (row[9] !== '1') {
      quarantine.unconfirmedSales += 1;
      continue;
    }
    const excludeReason = nullableString(row[10]);
    if (excludeReason) {
      quarantine.assessorExcludedSales += 1;
      excludedReasons.set(excludeReason, (excludedReasons.get(excludeReason) ?? 0) + 1);
      continue;
    }
    const parcelNumber = nullableString(row[2]);
    const taxAccount = parcelNumber ? accounts.get(parcelNumber) : null;
    invariant(taxAccount, `Pierce staged sale has no tax-account join for parcel ${parcelNumber}.`);
    records.push(mapRecord(row, index + 1, saleDate, salePrice, saleSource, taxSource, taxAccount));
  }

  records.sort(
    (left, right) =>
      right.saleDate.localeCompare(left.saleDate) || left.saleId.localeCompare(right.saleId)
  );
  invariant(records.length > 0, 'Pierce extracts produced no public confirmed sales.');
  invariant(
    new Set(records.map(record => record.saleId)).size === records.length,
    'Pierce generated duplicate sale identifiers.'
  );
  const quarantinedSales = candidateSales - records.length;
  invariant(
    quarantinedSales === Object.values(quarantine).reduce((total, count) => total + count, 0),
    'Pierce quarantine accounting is inconsistent.'
  );
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
      recordsWithNeighborhoodCode: 0,
      topNeighborhoodCodes: {},
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
    needsReview: quarantinedSales,
    confidence: {
      averageQualityScore: 1,
      parserStatus: 'ready',
      rawStatus: 'official_weekly_datamart_sha_verified',
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
    sourcePayloadSha256: config.sources.map(source => source.sha256),
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
    sourceRows: { sale: saleRows.length, taxAccount: taxRows.length },
    candidateSales,
    stagedSales: records.length,
    quarantinedSales,
    quarantine: {
      ...quarantine,
      duplicateIdentities: [...duplicateIdentities.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([identitySha256, duplicateCount]) => ({ identitySha256, duplicateCount })),
      excludedReasons: Object.fromEntries(
        [...excludedReasons.entries()].sort(([left], [right]) => left.localeCompare(right))
      ),
      conflictingSaleRows: 0,
      conflictingSaleIdentities: [],
    },
    sources: [saleSource, taxSource].map(source => ({
      key: source.key,
      archiveFile: source.archiveFile,
      file: source.file,
      url: source.url,
      finalUrl: source.finalUrl,
      bytes: source.bytes.byteLength,
      sha256: source.sha256,
      archiveBytes: source.archiveBytes.byteLength,
      archiveSha256: source.archiveSha256,
      candidateSales: source.key === 'sale' ? candidateSales : 0,
    })),
    omittedFields: ['owner', 'taxpayer', 'mailingAddress', 'grantor', 'grantee', 'buyer', 'seller'],
  };
  return { config, shard, statusEntry, detail, attestation, receipt };
}

export async function publishPiercePackage(
  sourceDirectory,
  outputPath,
  generatedAt,
  configPath = SOURCE_CONFIG_PATH
) {
  const pierce = await buildPierceCountyPackage(sourceDirectory, generatedAt, configPath);
  let manifestDigest = null;
  await publishWashingtonLaunchPackage(outputPath, async ({ outputRoot, writeJson }) => {
    const retained = await loadVerifiedRetainedWashingtonPackage(
      outputRoot,
      COUNTY_CODE,
      generatedAt,
      [join('receipts', 'pierce-source.json')]
    );
    for (const [relativePath, artifact] of retained.artifacts) {
      await writeJson(relativePath, artifact);
    }
    const status = {
      schemaVersion: STATUS_SCHEMA,
      generatedAt,
      sourcePosture:
        retained.statusEntries.length > 0 ? 'mixed_public_assessor_sources' : SOURCE_MODE,
      counties: [...retained.statusEntries, pierce.statusEntry].sort((left, right) =>
        left.countyCode.localeCompare(right.countyCode)
      ),
    };
    const attestations = [...retained.attestations, pierce.attestation].sort((left, right) =>
      left.countyCode.localeCompare(right.countyCode)
    );
    const shards = new Map(retained.shards);
    shards.set(COUNTY_CODE, pierce.shard);
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
    await writeJson(join('counties', `${COUNTY_CODE}.json`), pierce.detail);
    await writeJson(join('sales', 'by-county', `${COUNTY_CODE}.json`), pierce.shard);
    await writeJson(join('receipts', 'pierce-source.json'), pierce.receipt);
  });
  console.log(
    JSON.stringify(
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        manifestCanonicalJsonSha256: manifestDigest,
        candidateSales: pierce.receipt.candidateSales,
        stagedSales: pierce.receipt.stagedSales,
        quarantinedSales: pierce.receipt.quarantinedSales,
        latestSaleDate: pierce.shard.summary.latestSaleDate,
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
    'Usage: pierce_public_sales.mjs <source-directory> <output-directory> <generated-at-iso>'
  );
  await publishPiercePackage(sourceDirectory, outputPath, generatedAt);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}

#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { basename, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import MDBReader from 'mdb-reader';
import {
  canonicalJsonSha256,
  loadVerifiedRetainedWashingtonPackage,
  publishWashingtonLaunchPackage,
} from './kitsap_public_sales.mjs';

const COUNTY = 'Thurston';
const COUNTY_CODE = '067';
const SOURCE_MODE = 'public_assessor_sale_valid_apte';
const SOURCE_NAME = 'thurston-official-apte-2026-09-02';
const SOURCE_SET_SCHEMA = 'terrafusion.washington.public-source-set.v1';
const MANIFEST_SCHEMA = 'terrafusion.washington.launch-manifest.v1';
const STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const DETAIL_SCHEMA = 'terrafusion.washington.county-detail.v1';
const SHARD_SCHEMA = 'terrafusion.washington.sales-shard.v1';
const RECEIPT_SCHEMA = 'terrafusion.washington.public-source-receipt.v1';
const SHA256_PATTERN = /^[a-f\d]{64}$/;
const SOURCE_CONFIG_PATH = fileURLToPath(
  new URL('./sources/thurston_assessor_sales_2026.json', import.meta.url)
);
const APTE_TABLE = 'apte';
const CODE_TABLE = 'All_Codes';
export const THURSTON_APTE_HEADERS = [
  'PARCEL_NO',
  'PACT_CODE',
  'ADDRESS1',
  'ADDRESS2',
  'CITY',
  'STATE',
  'ZIP',
  'COUNTRY',
  'SITUS_STRE',
  'SITUS_CITY',
  'SITUS_ZIP',
  'SECTTIE',
  'SD_NAME',
  'LEGAL_DESC',
  'TOTAL_ACRE',
  'BLDG_VALUE',
  'LAND_VALUE',
  'TOTAL_VALU',
  'ANNUAL_TAX',
  'STATUS_IND',
  'PROP_SUBTY',
  'O_NEIGHBOR',
  'PROP_TYPE',
  'INSPCT_CYC',
  'REGION',
  'REC_VOLPAG',
  'MULT_PARCL',
  'SALE_DATE',
  'SALE_PRICE',
  'SALE_VRFY',
  'CODE2',
  'SIGMA_YEAR',
  'TAXABLE',
  'EXEMPT_TY',
  'LOCAL_IND',
  'TCA',
  'CURR_USE',
  'INCORP',
  'YEAR_BUILT',
  'EFF_YR_BUI',
  'RES_QUAL',
  'RES_COND',
  'FireDist',
];
const PROHIBITED_COLUMNS = [
  'ADDRESS1',
  'ADDRESS2',
  'CITY',
  'STATE',
  'ZIP',
  'COUNTRY',
  'LEGAL_DESC',
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function nullableString(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function nullablePositiveNumber(value) {
  const normalized = nullableString(value);
  if (normalized === null) return null;
  const parsed = Number(normalized.replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function nullableBoundedInteger(value, minimum, maximum) {
  const normalized = nullableString(value);
  if (normalized === null) return null;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function canonicalIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? '').trim());
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? match[0]
    : null;
}

function validateCountyUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Thurston ${label} URL is invalid.`);
  }
  invariant(
    parsed.protocol === 'https:' &&
      [
        'thurstoncountywa.gov',
        'www.thurstoncountywa.gov',
        'co.thurston.wa.us',
        'www.co.thurston.wa.us',
        'map.co.thurston.wa.us',
      ].includes(parsed.hostname) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash,
    `Thurston ${label} URL is outside the official county hosts.`
  );
  return parsed;
}

async function readSourceConfig(configPath) {
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  invariant(config?.schemaVersion === SOURCE_SET_SCHEMA, 'Thurston source-set schema is invalid.');
  invariant(
    config.county === COUNTY && config.countyCode === COUNTY_CODE,
    'Thurston source-set county is invalid.'
  );
  invariant(
    Array.isArray(config.sources) &&
      config.sources.length === 1 &&
      config.sources[0]?.key === 'assessor',
    'Thurston source-set must name exactly one assessor source.'
  );
  const officialSourceUrl = validateCountyUrl(config.officialSourceBaseUrl, 'official source');
  validateCountyUrl(config.indexUrl, 'source index');
  const start = canonicalIsoDate(config.sourceDateRange?.start);
  const end = canonicalIsoDate(config.sourceDateRange?.end);
  invariant(start && end && start <= end, 'Thurston source date range is invalid.');
  const source = config.sources[0];
  invariant(
    basename(source.file) === source.file &&
      basename(source.archiveFile) === source.archiveFile &&
      source.file !== source.archiveFile &&
      SHA256_PATTERN.test(source.sha256) &&
      SHA256_PATTERN.test(source.archiveSha256),
    'Thurston assessor source identity is invalid.'
  );
  const sourceUrl = validateCountyUrl(source.url, 'assessor source');
  const finalUrl = validateCountyUrl(source.finalUrl, 'assessor final source');
  const officialHostname = officialSourceUrl.hostname.toLowerCase().replace(/^www\./, '');
  invariant(
    [sourceUrl, finalUrl].every(url => {
      const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
      return hostname === officialHostname || hostname.endsWith(`.${officialHostname}`);
    }),
    'Thurston assessor payload is outside the attested official source family.'
  );
  return { ...config, sourceDateRange: { start, end } };
}

async function sha256File(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

function sourcePath(sourceDirectory, file) {
  const root = resolve(sourceDirectory);
  const path = resolve(root, file);
  invariant(path.startsWith(`${root}${sep}`), 'Thurston source escaped its source directory.');
  return path;
}

function hashedIdentity(value) {
  return createHash('sha256').update(value).digest('hex');
}

function readOfficialTables(bytes) {
  const database = new MDBReader(bytes);
  const tableNames = database.getTableNames();
  invariant(
    tableNames.includes(APTE_TABLE) && tableNames.includes(CODE_TABLE),
    'Thurston APTE database is missing its assessor or code table.'
  );
  const apteTable = database.getTable(APTE_TABLE);
  const columns = apteTable.getColumnNames();
  invariant(
    columns.length === THURSTON_APTE_HEADERS.length &&
      columns.every((column, index) => column === THURSTON_APTE_HEADERS[index]),
    'Thurston APTE table does not match its exact public-data contract.'
  );
  invariant(
    PROHIBITED_COLUMNS.every(column => columns.includes(column)),
    'Thurston APTE privacy boundary cannot be verified against the exact source contract.'
  );
  const codeTable = database.getTable(CODE_TABLE);
  invariant(
    ['TABLE_NAME', 'COLUMN_NAM', 'CODE', 'DESCRIPTIO'].every(column =>
      codeTable.getColumnNames().includes(column)
    ),
    'Thurston code table does not match its contract.'
  );
  const codes = codeTable.getData();
  invariant(
    codes.some(
      row =>
        row.TABLE_NAME === 'PAR_SALES' &&
        row.COLUMN_NAM === 'SALE_VRFY' &&
        row.CODE === 'AA' &&
        row.DESCRIPTIO === 'SALE-VALID'
    ),
    'Thurston AA sale-valid authority is missing or changed.'
  );
  return { rows: apteTable.getData(), columns };
}

export function projectThurstonPublicCandidate(row, ordinal) {
  // Owner mailing fields and the legal description are deliberately never copied out of this boundary.
  return {
    ordinal,
    parcelNumber: nullableString(row.PARCEL_NO),
    saleDate: canonicalIsoDate(row.SALE_DATE),
    salePrice: nullablePositiveNumber(row.SALE_PRICE),
    verificationCode: nullableString(row.SALE_VRFY),
    multiParcel: nullableString(row.MULT_PARCL),
    status: nullableString(row.STATUS_IND),
    recordingReference: nullableString(row.REC_VOLPAG),
    situsAddress: nullableString(row.SITUS_STRE),
    situsCity: nullableString(row.SITUS_CITY),
    situsZip: nullableString(row.SITUS_ZIP),
    propertyType: nullableString(row.PROP_TYPE),
    propertySubtype: nullableString(row.PROP_SUBTY),
    currentUse: nullableString(row.CURR_USE),
    neighborhoodCode: nullableString(row.O_NEIGHBOR),
    acres: nullablePositiveNumber(row.TOTAL_ACRE),
    yearBuilt: nullableBoundedInteger(row.YEAR_BUILT, 1700, 2200),
  };
}

function mapRecord(candidate, source) {
  const saleYear = Number(candidate.saleDate.slice(0, 4));
  const safeYearBuilt =
    candidate.yearBuilt !== null && candidate.yearBuilt <= saleYear ? candidate.yearBuilt : null;
  const identity = `${candidate.parcelNumber}|${candidate.saleDate}|${candidate.recordingReference ?? ''}`;
  const useCode = [candidate.propertyType, candidate.propertySubtype, candidate.currentUse]
    .filter(Boolean)
    .join(':');
  return {
    saleId: `WA-${COUNTY_CODE}-${hashedIdentity(identity).slice(0, 32)}`,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    parcelNumber: candidate.parcelNumber,
    saleDate: candidate.saleDate,
    saleYear,
    salePrice: candidate.salePrice,
    adjustedSalePrice: null,
    documentNumber: candidate.recordingReference,
    deedType: null,
    situsAddress: candidate.situsAddress,
    situsCity: candidate.situsCity,
    situsZip: candidate.situsZip,
    useCode: useCode || null,
    acres: candidate.acres,
    grantor: null,
    grantee: null,
    saleNote: null,
    neighborhoodCode: candidate.neighborhoodCode,
    currentNeighborhoodCode: candidate.neighborhoodCode,
    sourceMode: SOURCE_MODE,
    candidateSource: SOURCE_NAME,
    confidenceScore: 1,
    qualityScore: 1,
    qualityBand: 'official_assessor_sale_valid',
    reviewStatus: 'ready',
    grossLivingArea: null,
    lotSizeSqft: candidate.acres === null ? null : Math.round(candidate.acres * 43_560),
    yearBuilt: safeYearBuilt,
    bedrooms: null,
    bathrooms: null,
    condition: null,
    qualityGrade: null,
    provenance: {
      sourceUrl: source.url,
      sourceFinalUrl: source.finalUrl,
      sourcePayloadPath: source.file,
      sourcePayloadSha256: source.sha256,
      candidateIndexSource: `${source.file}#${APTE_TABLE}:row:${candidate.ordinal}`,
      candidateRecordType: 'official-assessor-sale-valid',
      candidateSourceOrdinal: candidate.ordinal,
      componentRows: [
        {
          sourceUrl: source.url,
          sourcePayloadPath: source.file,
          sourcePayloadSha256: source.sha256,
          candidateIndexSource: `${source.file}#${APTE_TABLE}:row:${candidate.ordinal}`,
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

function topNeighborhoodCodes(records) {
  const counts = new Map();
  for (const record of records) {
    if (record.neighborhoodCode)
      counts.set(record.neighborhoodCode, (counts.get(record.neighborhoodCode) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 25)
  );
}

export async function buildThurstonCountyPackage(
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
    'Thurston source range extends into the future.'
  );
  const source = config.sources[0];
  const databasePath = sourcePath(sourceDirectory, source.file);
  const archivePath = sourcePath(sourceDirectory, source.archiveFile);
  const [databaseSha256, archiveSha256] = await Promise.all([
    sha256File(databasePath),
    sha256File(archivePath),
  ]);
  invariant(databaseSha256 === source.sha256, 'Thurston APTE database does not match its SHA-256.');
  invariant(
    archiveSha256 === source.archiveSha256,
    'Thurston APTE archive does not match its SHA-256.'
  );
  const { rows, columns } = readOfficialTables(await readFile(databasePath));
  const sourceDisposition = {
    notOfficiallySaleValid: 0,
    invalidOrFutureSaleDate: 0,
    outsideStudyWindow: 0,
  };
  const candidates = [];
  rows.forEach((row, index) => {
    const candidate = projectThurstonPublicCandidate(row, index + 1);
    if (candidate.verificationCode !== 'AA') {
      sourceDisposition.notOfficiallySaleValid += 1;
      return;
    }
    if (!candidate.saleDate || candidate.saleDate > generatedDate) {
      sourceDisposition.invalidOrFutureSaleDate += 1;
      return;
    }
    if (
      candidate.saleDate < config.sourceDateRange.start ||
      candidate.saleDate > config.sourceDateRange.end
    ) {
      sourceDisposition.outsideStudyWindow += 1;
      return;
    }
    candidates.push(candidate);
  });
  const quarantine = {
    missingParcelIdentity: 0,
    nonPositiveSalePrice: 0,
    multiParcelSales: 0,
    inactiveSales: 0,
    missingSitusAddress: 0,
    duplicateParcelSales: 0,
  };
  const records = [];
  const seenParcels = new Set();
  for (const candidate of candidates) {
    if (!candidate.parcelNumber) {
      quarantine.missingParcelIdentity += 1;
      continue;
    }
    if (candidate.salePrice === null) {
      quarantine.nonPositiveSalePrice += 1;
      continue;
    }
    if (candidate.multiParcel !== 'N') {
      quarantine.multiParcelSales += 1;
      continue;
    }
    if (candidate.status !== 'A') {
      quarantine.inactiveSales += 1;
      continue;
    }
    if (
      !candidate.situsAddress ||
      !candidate.situsCity ||
      !/^\d{5}(?:-\d{4})?$/.test(candidate.situsZip ?? '')
    ) {
      quarantine.missingSitusAddress += 1;
      continue;
    }
    if (seenParcels.has(candidate.parcelNumber)) {
      quarantine.duplicateParcelSales += 1;
      continue;
    }
    seenParcels.add(candidate.parcelNumber);
    records.push(mapRecord(candidate, source));
  }
  records.sort(
    (left, right) =>
      right.saleDate.localeCompare(left.saleDate) || left.saleId.localeCompare(right.saleId)
  );
  invariant(records.length > 0, 'Thurston source produced no public sale-valid records.');
  invariant(
    new Set(records.map(record => record.saleId)).size === records.length,
    'Thurston generated duplicate sale identifiers.'
  );
  const quarantinedSales = Object.values(quarantine).reduce((total, count) => total + count, 0);
  invariant(
    candidates.length === records.length + quarantinedSales,
    'Thurston candidate disposition accounting is inconsistent.'
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
    needsReview: quarantinedSales,
    confidence: {
      averageQualityScore: 1,
      parserStatus: 'ready',
      rawStatus: 'official_sale_valid_apte_sha_verified',
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
    sourcePayloadSha256: [databaseSha256],
    sourcePosture: SOURCE_MODE,
  };
  const [databaseStats, archiveStats] = await Promise.all([stat(databasePath), stat(archivePath)]);
  const receipt = {
    schemaVersion: RECEIPT_SCHEMA,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    generatedAt,
    indexUrl: config.indexUrl,
    publishedLabel: config.publishedLabel,
    sourceDateRange: config.sourceDateRange,
    sourceRows: { assessor: rows.length },
    sourceColumns: columns,
    saleValidityAuthority: {
      table: 'PAR_SALES',
      column: 'SALE_VRFY',
      code: 'AA',
      description: 'SALE-VALID',
    },
    sourceDisposition,
    candidateSales: candidates.length,
    stagedSales: records.length,
    quarantinedSales,
    quarantine,
    sources: [
      {
        key: source.key,
        archiveFile: source.archiveFile,
        file: source.file,
        url: source.url,
        finalUrl: source.finalUrl,
        bytes: databaseStats.size,
        sha256: databaseSha256,
        archiveBytes: archiveStats.size,
        archiveSha256,
      },
    ],
    omittedFields: [
      ...PROHIBITED_COLUMNS,
      'owner',
      'mailingAddress',
      'legalDescription',
      'grantor',
      'grantee',
      'buyer',
      'seller',
    ],
  };
  return { config, shard, statusEntry, detail, attestation, receipt };
}

export async function publishThurstonPackage(
  sourceDirectory,
  outputPath,
  generatedAt,
  configPath = SOURCE_CONFIG_PATH
) {
  const thurston = await buildThurstonCountyPackage(sourceDirectory, generatedAt, configPath);
  let manifestDigest = null;
  await publishWashingtonLaunchPackage(outputPath, async ({ outputRoot, writeJson }) => {
    const retained = await loadVerifiedRetainedWashingtonPackage(
      outputRoot,
      COUNTY_CODE,
      generatedAt,
      [join('receipts', 'thurston-source.json')]
    );
    for (const [relativePath, artifact] of retained.artifacts)
      await writeJson(relativePath, artifact);
    const status = {
      schemaVersion: STATUS_SCHEMA,
      generatedAt,
      sourcePosture: retained.statusEntries.length ? 'mixed_public_assessor_sources' : SOURCE_MODE,
      counties: [...retained.statusEntries, thurston.statusEntry].sort((left, right) =>
        left.countyCode.localeCompare(right.countyCode)
      ),
    };
    const attestations = [...retained.attestations, thurston.attestation].sort((left, right) =>
      left.countyCode.localeCompare(right.countyCode)
    );
    const shards = new Map(retained.shards);
    shards.set(COUNTY_CODE, thurston.shard);
    for (const attestation of attestations) {
      const shard = shards.get(attestation.countyCode);
      invariant(
        shard && canonicalJsonSha256(shard) === attestation.canonicalJsonSha256,
        `Washington shard ${attestation.countyCode} does not match its attestation.`
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
        candidateSales: status.counties.reduce((total, county) => total + county.candidateSales, 0),
        stagedSales: status.counties.reduce((total, county) => total + county.stagedSales, 0),
        needsReview: status.counties.reduce((total, county) => total + county.needsReview, 0),
        prometheusNeedsReview: status.counties.filter(
          county => county.prometheusStatus === 'needs_review'
        ).length,
        recordsWithNeighborhoodCode: [...shards.values()].reduce(
          (total, shard) => total + shard.summary.recordsWithNeighborhoodCode,
          0
        ),
        futureSaleDateRecords: [...shards.values()].reduce(
          (total, shard) =>
            total + shard.records.filter(record => record.flags?.futureSaleDate === true).length,
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
    await writeJson(join('counties', `${COUNTY_CODE}.json`), thurston.detail);
    await writeJson(join('sales', 'by-county', `${COUNTY_CODE}.json`), thurston.shard);
    await writeJson(join('receipts', 'thurston-source.json'), thurston.receipt);
  });
  console.log(
    JSON.stringify(
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        manifestCanonicalJsonSha256: manifestDigest,
        candidateSales: thurston.receipt.candidateSales,
        stagedSales: thurston.receipt.stagedSales,
        quarantinedSales: thurston.receipt.quarantinedSales,
        latestSaleDate: thurston.shard.summary.latestSaleDate,
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
    'Usage: thurston_public_sales.mjs <source-directory> <output-directory> <generated-at-iso>'
  );
  await publishThurstonPackage(sourceDirectory, outputPath, generatedAt);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  await main();

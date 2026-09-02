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

const COUNTY = 'Skagit';
const COUNTY_CODE = '057';
const SOURCE_MODE = 'public_assessor_daily_sales_export';
const SOURCE_NAME = 'skagit-official-assessor-data-download-2026-09-02';
const SOURCE_SET_SCHEMA = 'terrafusion.washington.public-source-set.v1';
const MANIFEST_SCHEMA = 'terrafusion.washington.launch-manifest.v1';
const STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const DETAIL_SCHEMA = 'terrafusion.washington.county-detail.v1';
const SHARD_SCHEMA = 'terrafusion.washington.sales-shard.v1';
const RECEIPT_SCHEMA = 'terrafusion.washington.public-source-receipt.v1';
const SHA256_PATTERN = /^[a-f\d]{64}$/;
const OFFICIAL_HOSTS = new Set(['skagitcounty.net', 'www.skagitcounty.net']);
export const SKAGIT_SALE_HEADERS = [
  'SaleID',
  'Parcel Number',
  'Account Number',
  'seller name',
  'buyer name',
  'sale price',
  'sale date',
  'sale type',
  'Recording Number',
  'Deed Type',
  'deed date',
  'reval area',
  'Excise Number',
];
export const SKAGIT_ASSESSOR_HEADERS = [
  'AID',
  'Parcel Number',
  'Account Number',
  'Legal Description',
  'Situs Street Number',
  'Situs Street Name',
  'Situs City State Zip',
  'Old Street Number',
  'Old Street Name',
  'Old City State Zip',
  'Owner Name',
  'Owner Add 1',
  'Owner Add 2',
  'Owner Add 3',
  'Owner City',
  'Owner State',
  'Owner Zip',
  'Exemptions',
  'Neighborhood Code',
  'Building Value',
  'Land Use',
  'Impr Land Value',
  'Unimpr Land Value',
  'Timber Land Value',
  'Assessed Value',
  'Taxable Value',
  'Total Market Value',
  'Acres',
  'Sale Date',
  'Sale Price',
  'Sale Deed Type',
  'Total Taxes',
  'Year Built',
  'Living Area',
  'Tot Special Assessments',
  'General Taxes',
  'Inactive Date',
  'BuildingStyle',
  'Foundation',
  'Exterior Walls',
  'Roof Covering',
  'Roof Style',
  'Floor Covering',
  'Floor Construction',
  'Interior Finish',
  'Plumbing',
  'GarageSqFt',
  'Heat Air Cond',
  'Fireplace',
  'FinishedBasement',
  'Number of Bedrooms',
  'Eff Year Built',
  'UnfinishedBasement',
  'Fire District',
  'School District',
  'City District',
  'Unit',
  'Levy Code',
  'Current Use Adjustment',
  'Tide Land Value',
  'Senior Exemption Adjustment',
  'Township',
  'Range',
  'Section',
  'Quarter Section',
  'Tax Year',
  'Appraisal Year',
  'Utilities',
  'Tax Statement Taxable Value',
  'PropType',
  'HasSeptic',
];
const SOURCE_CONFIG_PATH = fileURLToPath(
  new URL('./sources/skagit_assessor_sales_2026.json', import.meta.url)
);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function nullableString(value) {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : null;
}

function positiveNumber(value) {
  const parsed = Number(String(value ?? '').trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function boundedInteger(value, minimum, maximum) {
  const normalized = String(value ?? '').trim();
  if (normalized === '') return null;
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

export function canonicalSkagitSaleDate(value) {
  const normalized = String(value ?? '').trim();
  const match = /^(\d{4}-\d{2}-\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?$/.exec(normalized);
  if (!match) return null;
  if (
    match[2] !== undefined &&
    (Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4]) > 59)
  ) {
    return null;
  }
  return canonicalIsoDate(match[1]);
}

export function parseSkagitPipeRows(text, expectedHeaders, label) {
  invariant(typeof text === 'string', `${label} input must be text.`);
  const normalized = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = normalized.trimEnd().split(/\r?\n/);
  invariant(lines.length > 1, `${label} contains no data rows.`);
  invariant(lines[0] === expectedHeaders.join('|'), `${label} header does not match its contract.`);
  return lines.slice(1).map((line, index) => {
    const fields = line.split('|');
    invariant(
      fields.length === expectedHeaders.length,
      `${label} row ${index + 2} has ${fields.length} fields; expected ${expectedHeaders.length}.`
    );
    return { fields, ordinal: index + 2 };
  });
}

function validateOfficialUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Skagit ${label} URL is invalid.`);
  }
  invariant(
    url.protocol === 'https:' &&
      OFFICIAL_HOSTS.has(url.hostname) &&
      url.username === '' &&
      url.password === '' &&
      url.search === '' &&
      url.hash === '',
    `Skagit ${label} URL is outside the official county host.`
  );
  return url;
}

async function readSourceConfig(configPath) {
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  invariant(config?.schemaVersion === SOURCE_SET_SCHEMA, 'Skagit source-set schema is invalid.');
  invariant(
    config.county === COUNTY && config.countyCode === COUNTY_CODE,
    'Skagit source-set county is invalid.'
  );
  invariant(
    Array.isArray(config.sources) &&
      config.sources.length === 2 &&
      config.sources.map(source => source?.key).join(',') === 'sale,assessor',
    'Skagit source-set must name sale and assessor extracts.'
  );
  validateOfficialUrl(config.officialSourceBaseUrl, 'official source');
  validateOfficialUrl(config.indexUrl, 'source index');
  const start = canonicalIsoDate(config.sourceDateRange?.start);
  const end = canonicalIsoDate(config.sourceDateRange?.end);
  invariant(start && end && start <= end, 'Skagit source date range is invalid.');
  const identities = new Set();
  for (const source of config.sources) {
    invariant(
      typeof source?.file === 'string' &&
        basename(source.file) === source.file &&
        typeof source.archiveFile === 'string' &&
        basename(source.archiveFile) === source.archiveFile &&
        source.archiveFile !== source.file &&
        !identities.has(source.file) &&
        !identities.has(source.archiveFile),
      'Skagit source identity is invalid.'
    );
    identities.add(source.file);
    identities.add(source.archiveFile);
    validateOfficialUrl(source.url, `${source.key} source`);
    validateOfficialUrl(source.finalUrl, `${source.key} final source`);
    invariant(
      SHA256_PATTERN.test(source.sha256) && SHA256_PATTERN.test(source.archiveSha256),
      'Skagit source SHA-256 identity is invalid.'
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
    'Skagit source payload escaped its source directory.'
  );
  const [bytes, archiveBytes] = await Promise.all([readFile(sourcePath), readFile(archivePath)]);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const archiveSha256 = createHash('sha256').update(archiveBytes).digest('hex');
  invariant(sha256 === source.sha256, `Skagit ${source.key} extract does not match its SHA-256.`);
  invariant(
    archiveSha256 === source.archiveSha256,
    `Skagit ${source.key} ZIP does not match its SHA-256.`
  );
  return { ...source, bytes, archiveBytes, sha256, archiveSha256 };
}

function publicProperty(fields) {
  const streetNumber = nullableString(fields[4]);
  const streetName = nullableString(fields[5]);
  const cityStateZip = nullableString(fields[6]);
  const unit = nullableString(fields[56]);
  const cityMatch = /^(.+),\s*WA\s+(\d{5}(?:-\d{4})?)$/i.exec(cityStateZip ?? '');
  const situsAddress =
    streetName && cityMatch ? [streetNumber, streetName, unit].filter(Boolean).join(' ') : null;
  const acres = positiveNumber(fields[27]);
  return {
    situsAddress,
    situsCity: cityMatch?.[1]?.trim() ?? null,
    situsZip: cityMatch?.[2] ?? null,
    neighborhoodCode: nullableString(fields[18]),
    useCode: nullableString(fields[20]),
    acres,
    lotSizeSqft: acres === null ? null : Math.round(acres * 43_560),
    yearBuilt: boundedInteger(fields[32], 1700, 2200),
    grossLivingArea: positiveNumber(fields[33]),
    bedrooms: boundedInteger(fields[50], 0, 99),
    inactiveDate: nullableString(fields[36]),
    propertyType: nullableString(fields[69]),
  };
}

function assessorProperties(rows) {
  const byParcel = new Map();
  for (const row of rows) {
    const parcel = nullableString(row.fields[1]);
    invariant(parcel, `Skagit assessor row ${row.ordinal} has no parcel number.`);
    const property = publicProperty(row.fields);
    const entry = byParcel.get(parcel) ?? { variants: new Map(), ordinals: [] };
    const identity = JSON.stringify(property);
    if (!entry.variants.has(identity)) entry.variants.set(identity, property);
    entry.ordinals.push(row.ordinal);
    byParcel.set(parcel, entry);
  }
  return byParcel;
}

function transactionKey(fields) {
  const recording = nullableString(fields[8]);
  invariant(recording, 'Skagit eligible sale is missing its recorded conveyance identity.');
  return recording;
}

function saleIdentity(fields, saleDate, salePrice) {
  return [fields[0], fields[1], saleDate, salePrice, fields[8], fields[12]]
    .map(value => String(value ?? '').trim())
    .join('|');
}

function saleCollisionIdentity(fields, saleDate, salePrice) {
  return [fields[1], saleDate, salePrice]
    .map(value => String(value ?? '').trim())
    .join('|');
}

function mapRecord(candidate, saleSource, assessorSource, property, propertyOrdinal) {
  const { fields, ordinal, saleDate, salePrice } = candidate;
  const parcelNumber = nullableString(fields[1]);
  const documentNumber = nullableString(fields[8]);
  invariant(
    parcelNumber && documentNumber && property.situsAddress,
    'Skagit staged sale is missing required public fields.'
  );
  const identityDigest = createHash('sha256')
    .update(saleIdentity(fields, saleDate, salePrice))
    .digest('hex');
  const safeYearBuilt =
    property.yearBuilt !== null && property.yearBuilt <= Number(saleDate.slice(0, 4))
      ? property.yearBuilt
      : null;
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
    deedType: nullableString(fields[9]),
    situsAddress: property.situsAddress,
    situsCity: property.situsCity,
    situsZip: property.situsZip,
    useCode: property.useCode,
    acres: property.acres,
    grantor: null,
    grantee: null,
    saleNote: null,
    neighborhoodCode: property.neighborhoodCode,
    currentNeighborhoodCode: property.neighborhoodCode,
    sourceMode: SOURCE_MODE,
    candidateSource: SOURCE_NAME,
    confidenceScore: 1,
    qualityScore: 1,
    qualityBand: 'official_assessor_valid_sale',
    reviewStatus: 'ready',
    grossLivingArea: safeYearBuilt === null ? null : property.grossLivingArea,
    lotSizeSqft: property.lotSizeSqft,
    yearBuilt: safeYearBuilt,
    bedrooms: safeYearBuilt === null ? null : property.bedrooms,
    bathrooms: null,
    condition: null,
    qualityGrade: null,
    provenance: {
      sourceUrl: saleSource.url,
      sourceFinalUrl: saleSource.finalUrl,
      sourcePayloadPath: saleSource.file,
      sourcePayloadSha256: saleSource.sha256,
      candidateIndexSource: `${saleSource.file}#row:${ordinal}`,
      candidateRecordType: 'official-assessor-valid-sale',
      candidateSourceOrdinal: ordinal,
      componentRows: [
        {
          sourceUrl: saleSource.url,
          sourcePayloadPath: saleSource.file,
          sourcePayloadSha256: saleSource.sha256,
          candidateIndexSource: `${saleSource.file}#row:${ordinal}`,
        },
        {
          sourceUrl: assessorSource.url,
          sourcePayloadPath: assessorSource.file,
          sourcePayloadSha256: assessorSource.sha256,
          candidateIndexSource: `${assessorSource.file}#row:${propertyOrdinal}`,
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

export async function buildSkagitCountyPackage(
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
    'Skagit source range extends into the future.'
  );
  const [saleSource, assessorSource] = await Promise.all(
    config.sources.map(source => readVerifiedSource(sourceDirectory, source))
  );
  const saleRows = parseSkagitPipeRows(
    saleSource.bytes.toString('utf8'),
    SKAGIT_SALE_HEADERS,
    'Skagit sale extract'
  );
  const assessorRows = parseSkagitPipeRows(
    assessorSource.bytes.toString('utf8'),
    SKAGIT_ASSESSOR_HEADERS,
    'Skagit assessor extract'
  );
  const properties = assessorProperties(assessorRows);
  const sourceDisposition = {
    nonValidSaleType: 0,
    invalidOrFutureSaleDate: 0,
    outsideStudyWindow: 0,
  };
  const candidates = [];
  for (const row of saleRows) {
    if (row.fields[7] !== 'VALID SALE') {
      sourceDisposition.nonValidSaleType += 1;
      continue;
    }
    const saleDate = canonicalSkagitSaleDate(row.fields[6]);
    if (!saleDate || saleDate > generatedDate) {
      sourceDisposition.invalidOrFutureSaleDate += 1;
      continue;
    }
    if (saleDate < config.sourceDateRange.start || saleDate > config.sourceDateRange.end) {
      sourceDisposition.outsideStudyWindow += 1;
      continue;
    }
    candidates.push({ ...row, saleDate, salePrice: positiveNumber(row.fields[5]) });
  }
  const transactionParcels = new Map();
  for (const candidate of candidates) {
    const key = transactionKey(candidate.fields);
    const parcels = transactionParcels.get(key) ?? new Set();
    const parcel = nullableString(candidate.fields[1]);
    invariant(parcel, 'Skagit eligible sale has no parcel number.');
    parcels.add(parcel);
    transactionParcels.set(key, parcels);
  }
  const multiParcelTransactions = new Map(
    [...transactionParcels.entries()].filter(([, parcels]) => parcels.size > 1)
  );
  const sameParcelConveyanceGroups = new Map();
  for (const candidate of candidates) {
    if (candidate.salePrice === null) continue;
    const parcel = nullableString(candidate.fields[1]);
    invariant(parcel, 'Skagit eligible sale has no parcel number.');
    const identity = `${transactionKey(candidate.fields)}|${parcel}`;
    const group = sameParcelConveyanceGroups.get(identity) ?? [];
    group.push(candidate);
    sameParcelConveyanceGroups.set(identity, group);
  }
  const conflictingSingleParcelConveyances = new Map(
    [...sameParcelConveyanceGroups.entries()].filter(([, group]) => {
      if (group.length < 2) return false;
      const recording = transactionKey(group[0].fields);
      if (transactionParcels.get(recording)?.size !== 1) return false;
      return (
        new Set(
          group.map(candidate =>
            saleIdentity(candidate.fields, candidate.saleDate, candidate.salePrice)
          )
        ).size > 1
      );
    })
  );
  const conflictingSingleParcelCandidates = new Set(
    [...conflictingSingleParcelConveyances.values()].flatMap(group => group)
  );
  const collisionGroups = new Map();
  for (const candidate of candidates) {
    if (candidate.salePrice === null) continue;
    const identity = saleCollisionIdentity(
      candidate.fields,
      candidate.saleDate,
      candidate.salePrice
    );
    const group = collisionGroups.get(identity) ?? [];
    group.push(candidate);
    collisionGroups.set(identity, group);
  }
  const crossRecordingCollisions = new Map(
    [...collisionGroups.entries()].filter(([, group]) => {
      const recordings = new Set(group.map(candidate => transactionKey(candidate.fields)));
      return recordings.size > 1;
    })
  );
  const crossRecordingCandidates = new Set(
    [...crossRecordingCollisions.values()].flatMap(group => group)
  );
  const quarantine = {
    nonPositiveSalePrice: 0,
    multiParcelSales: 0,
    crossRecordingDuplicateSales: 0,
    conflictingConveyanceRows: 0,
    exactDuplicateRows: 0,
    missingAssessorJoin: 0,
    ambiguousAssessorJoin: 0,
    nonRealProperty: 0,
    inactiveProperty: 0,
    missingSitusAddress: 0,
  };
  const seen = new Set();
  const records = [];
  for (const candidate of candidates) {
    if (candidate.salePrice === null) {
      quarantine.nonPositiveSalePrice += 1;
      continue;
    }
    const txKey = transactionKey(candidate.fields);
    if (multiParcelTransactions.has(txKey)) {
      quarantine.multiParcelSales += 1;
      continue;
    }
    if (crossRecordingCandidates.has(candidate)) {
      quarantine.crossRecordingDuplicateSales += 1;
      continue;
    }
    if (conflictingSingleParcelCandidates.has(candidate)) {
      quarantine.conflictingConveyanceRows += 1;
      continue;
    }
    const identity = saleIdentity(candidate.fields, candidate.saleDate, candidate.salePrice);
    if (seen.has(identity)) {
      quarantine.exactDuplicateRows += 1;
      continue;
    }
    seen.add(identity);
    const parcel = nullableString(candidate.fields[1]);
    const propertyEntry = parcel ? properties.get(parcel) : null;
    if (!propertyEntry) {
      quarantine.missingAssessorJoin += 1;
      continue;
    }
    if (propertyEntry.variants.size !== 1) {
      quarantine.ambiguousAssessorJoin += 1;
      continue;
    }
    const property = [...propertyEntry.variants.values()][0];
    if (property.propertyType !== 'R') {
      quarantine.nonRealProperty += 1;
      continue;
    }
    if (property.inactiveDate !== null) {
      quarantine.inactiveProperty += 1;
      continue;
    }
    if (property.situsAddress === null) {
      quarantine.missingSitusAddress += 1;
      continue;
    }
    records.push(
      mapRecord(candidate, saleSource, assessorSource, property, propertyEntry.ordinals[0])
    );
  }
  records.sort(
    (left, right) =>
      right.saleDate.localeCompare(left.saleDate) || left.saleId.localeCompare(right.saleId)
  );
  invariant(records.length > 0, 'Skagit extracts produced no public valid sales.');
  invariant(
    new Set(records.map(record => record.saleId)).size === records.length,
    'Skagit generated duplicate sale identifiers.'
  );
  const quarantinedSales = candidates.length - records.length;
  invariant(
    quarantinedSales === Object.values(quarantine).reduce((total, count) => total + count, 0),
    'Skagit quarantine accounting is inconsistent.'
  );
  const latestSaleDate = records[0].saleDate;
  const salesRoute = `/launch-data/washington/sales/by-county/${COUNTY_CODE}.json`;
  const detailRoute = `/launch-data/washington/counties/${COUNTY_CODE}.json`;
  const recordsWithNeighborhoodCode = records.filter(
    record => record.neighborhoodCode !== null
  ).length;
  const topNeighborhoodCodes = Object.fromEntries(
    [
      ...records
        .reduce((counts, record) => {
          if (record.neighborhoodCode)
            counts.set(record.neighborhoodCode, (counts.get(record.neighborhoodCode) ?? 0) + 1);
          return counts;
        }, new Map())
        .entries(),
    ]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 10)
  );
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
      topNeighborhoodCodes,
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
      rawStatus: 'official_daily_exports_sha_verified',
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
    sourceRows: { sale: saleRows.length, assessor: assessorRows.length },
    sourceDisposition,
    candidateSales: candidates.length,
    stagedSales: records.length,
    quarantinedSales,
    quarantine: {
      ...quarantine,
      multiParcelTransactions: [...multiParcelTransactions.entries()]
        .map(([identity, parcels]) => ({
          identitySha256: createHash('sha256').update(identity).digest('hex'),
          parcelCount: parcels.size,
        }))
        .sort((left, right) => left.identitySha256.localeCompare(right.identitySha256)),
      crossRecordingDuplicateIdentities: [...crossRecordingCollisions.entries()]
        .map(([identity, group]) => ({
          identitySha256: createHash('sha256').update(identity).digest('hex'),
          recordingCount: new Set(group.map(candidate => transactionKey(candidate.fields))).size,
          rowCount: group.length,
        }))
        .sort((left, right) => left.identitySha256.localeCompare(right.identitySha256)),
      conflictingSaleRows: quarantine.conflictingConveyanceRows,
      conflictingSaleIdentities: [...conflictingSingleParcelConveyances.entries()]
        .map(([identity, group]) => ({
          identitySha256: createHash('sha256').update(identity).digest('hex'),
          rowCount: group.length,
        }))
        .sort((left, right) => left.identitySha256.localeCompare(right.identitySha256)),
    },
    sources: [saleSource, assessorSource].map(source => ({
      key: source.key,
      archiveFile: source.archiveFile,
      file: source.file,
      url: source.url,
      finalUrl: source.finalUrl,
      bytes: source.bytes.byteLength,
      sha256: source.sha256,
      archiveBytes: source.archiveBytes.byteLength,
      archiveSha256: source.archiveSha256,
      candidateSales: source.key === 'sale' ? candidates.length : 0,
    })),
    omittedFields: [
      'owner',
      'ownerAddress',
      'taxpayer',
      'mailingAddress',
      'grantor',
      'grantee',
      'buyer',
      'seller',
    ],
  };
  return { config, shard, statusEntry, detail, attestation, receipt };
}

export async function publishSkagitPackage(
  sourceDirectory,
  outputPath,
  generatedAt,
  configPath = SOURCE_CONFIG_PATH
) {
  const skagit = await buildSkagitCountyPackage(sourceDirectory, generatedAt, configPath);
  let manifestDigest = null;
  await publishWashingtonLaunchPackage(outputPath, async ({ outputRoot, writeJson }) => {
    const retained = await loadVerifiedRetainedWashingtonPackage(
      outputRoot,
      COUNTY_CODE,
      generatedAt,
      [join('receipts', 'skagit-source.json')]
    );
    for (const [relativePath, artifact] of retained.artifacts)
      await writeJson(relativePath, artifact);
    const status = {
      schemaVersion: STATUS_SCHEMA,
      generatedAt,
      sourcePosture:
        retained.statusEntries.length > 0 ? 'mixed_public_assessor_sources' : SOURCE_MODE,
      counties: [...retained.statusEntries, skagit.statusEntry].sort((left, right) =>
        left.countyCode.localeCompare(right.countyCode)
      ),
    };
    const attestations = [...retained.attestations, skagit.attestation].sort((left, right) =>
      left.countyCode.localeCompare(right.countyCode)
    );
    const shards = new Map(retained.shards);
    shards.set(COUNTY_CODE, skagit.shard);
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
    await writeJson(join('counties', `${COUNTY_CODE}.json`), skagit.detail);
    await writeJson(join('sales', 'by-county', `${COUNTY_CODE}.json`), skagit.shard);
    await writeJson(join('receipts', 'skagit-source.json'), skagit.receipt);
  });
  console.log(
    JSON.stringify(
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        manifestCanonicalJsonSha256: manifestDigest,
        candidateSales: skagit.receipt.candidateSales,
        stagedSales: skagit.receipt.stagedSales,
        quarantinedSales: skagit.receipt.quarantinedSales,
        latestSaleDate: skagit.shard.summary.latestSaleDate,
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
    'Usage: skagit_public_sales.mjs <source-directory> <output-directory> <generated-at-iso>'
  );
  await publishSkagitPackage(sourceDirectory, outputPath, generatedAt);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  await main();

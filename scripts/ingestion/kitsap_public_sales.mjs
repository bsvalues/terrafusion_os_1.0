#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import XLSX from 'xlsx';

XLSX.set_fs(fs);

const COUNTY = 'Kitsap';
const COUNTY_CODE = '035';
const SOURCE_URL = 'https://www.kitsap.gov/assessor/Documents/Residential_Sales_2021-2026.xlsx';
const SOURCE_BASE_URL = 'https://www.kitsap.gov/assessor/';
const SOURCE_MODE = 'public_assessor_workbook';
const SOURCE_NAME = 'kitsap-official-residential-sales';
const MANIFEST_SCHEMA = 'terrafusion.washington.launch-manifest.v1';
const STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const DETAIL_SCHEMA = 'terrafusion.washington.county-detail.v1';
const SHARD_SCHEMA = 'terrafusion.washington.sales-shard.v1';
const SHA256_PATTERN = /^[a-f\d]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function canonicalizeJson(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    const serialized = JSON.stringify(value);
    if (serialized !== undefined) return serialized;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalizeJson).join(',')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`)
      .join(',')}}`;
  }
  throw new Error('Kitsap launch package contains a non-JSON value.');
}

function canonicalJsonSha256(value) {
  return createHash('sha256').update(canonicalizeJson(value)).digest('hex');
}

function nullableString(value) {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : null;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function canonicalSaleDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${String(parsed.y).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }
  const normalized = String(value ?? '').trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(normalized);
  if (!match) return null;
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  const month = Number(match[1]);
  const day = Number(match[2]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return date.toISOString().slice(0, 10);
}

function makeSaleId(sheetName, row, ordinal) {
  const reet = nullableString(row['REET no.']);
  const parcel = nullableString(row['Tax parcel no.']);
  invariant(reet && parcel, `${sheetName} row ${ordinal} is missing REET or parcel identity.`);
  const token = `${reet}-${parcel}`.replace(/[^A-Za-z0-9-]+/g, '-').replace(/-+/g, '-');
  return `WA-${COUNTY_CODE}-${token}`;
}

function mapRecord(sheetName, row, ordinal, payloadSha256, generatedAt) {
  const saleDate = canonicalSaleDate(row['Sale Dt']);
  const salePrice = nullableNumber(row.Price);
  const parcelNumber = nullableString(row['Tax parcel no.']);
  invariant(saleDate, `${sheetName} row ${ordinal} has no canonical sale date.`);
  invariant(
    salePrice !== null && salePrice >= 0,
    `${sheetName} row ${ordinal} has no valid sale price.`
  );
  invariant(parcelNumber, `${sheetName} row ${ordinal} has no parcel number.`);

  const neighborhoodCode = nullableString(row.Nbrhd);
  const generatedDate = generatedAt.slice(0, 10);
  const isDwelling = sheetName === 'Dwellings';
  return {
    saleId: makeSaleId(sheetName, row, ordinal),
    county: COUNTY,
    countyCode: COUNTY_CODE,
    parcelNumber,
    saleDate,
    saleYear: nullableNumber(row.Yr),
    salePrice,
    adjustedSalePrice: null,
    documentNumber: nullableString(row['REET no.']),
    deedType: null,
    situsAddress: nullableString(row['Property address']),
    situsCity: null,
    situsZip: null,
    useCode: nullableString(row.Class),
    acres: nullableNumber(row.Acres),
    grantor: null,
    grantee: null,
    saleNote: nullableString(row.Validity),
    neighborhoodCode,
    currentNeighborhoodCode: neighborhoodCode,
    sourceMode: SOURCE_MODE,
    candidateSource: SOURCE_NAME,
    confidenceScore: 1,
    qualityScore: 1,
    qualityBand: 'official_valid_sale',
    reviewStatus: 'ready',
    grossLivingArea: isDwelling ? nullableNumber(row['Living area']) : null,
    lotSizeSqft: null,
    yearBuilt: isDwelling ? nullableNumber(row['Yr blt']) : null,
    bedrooms: null,
    bathrooms: null,
    condition: isDwelling ? nullableString(row.Condition) : null,
    qualityGrade: null,
    provenance: {
      sourceUrl: SOURCE_URL,
      sourceFinalUrl: SOURCE_URL,
      sourcePayloadPath: basename(process.argv[2]),
      sourcePayloadSha256: payloadSha256,
      candidateIndexSource: `${basename(process.argv[2])}#${sheetName}`,
      candidateRecordType: isDwelling ? 'official-dwelling-sale' : 'official-vacant-land-sale',
      candidateSourceOrdinal: ordinal,
    },
    flags: {
      duplicateRisk: false,
      needsReview: false,
      futureSaleDate: saleDate > generatedDate,
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
      .sort(([aCode, aCount], [bCode, bCount]) => bCount - aCount || aCode.localeCompare(bCode))
      .slice(0, 25)
  );
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value)}\n`, { flag: 'wx', mode: 0o644 });
}

async function main() {
  const [sourcePath, expectedSha256, outputPath, generatedAt] = process.argv.slice(2);
  invariant(
    sourcePath && expectedSha256 && outputPath && generatedAt,
    'Usage: kitsap_public_sales.mjs <source.xlsx> <expected-sha256> <output-directory> <generated-at-iso>'
  );
  invariant(SHA256_PATTERN.test(expectedSha256), 'Expected workbook SHA-256 is invalid.');
  invariant(
    new Date(generatedAt).toISOString() === generatedAt,
    'Generated-at must be a canonical ISO timestamp.'
  );

  const workbookBytes = await readFile(sourcePath);
  const payloadSha256 = createHash('sha256').update(workbookBytes).digest('hex');
  invariant(
    payloadSha256 === expectedSha256,
    'Official Kitsap workbook does not match its expected SHA-256.'
  );

  const workbook = XLSX.read(workbookBytes, { type: 'buffer', cellDates: true });
  const expectedSheets = ['Dwellings', 'Vacant land'];
  invariant(
    expectedSheets.every(sheetName => workbook.SheetNames.includes(sheetName)),
    'Official Kitsap workbook is missing an expected sheet.'
  );

  const records = [];
  const quarantine = {};
  let candidateSales = 0;
  for (const sheetName of expectedSheets) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: null,
      raw: true,
    });
    candidateSales += rows.length;
    const reasons = {};
    let staged = 0;
    rows.forEach((row, rowIndex) => {
      const validity = nullableString(row.Validity) ?? 'missing';
      if (validity.toLowerCase() !== 'valid sale') {
        reasons[validity] = (reasons[validity] ?? 0) + 1;
        return;
      }
      records.push(mapRecord(sheetName, row, rowIndex + 2, payloadSha256, generatedAt));
      staged += 1;
    });
    quarantine[sheetName] = { candidates: rows.length, staged, reasons };
  }

  records.sort(
    (left, right) =>
      right.saleDate.localeCompare(left.saleDate) || left.saleId.localeCompare(right.saleId)
  );
  const saleIds = new Set();
  for (const record of records) {
    invariant(
      !saleIds.has(record.saleId),
      `Official Kitsap workbook duplicates sale identity ${record.saleId}.`
    );
    saleIds.add(record.saleId);
  }
  invariant(records.length > 0, 'Official Kitsap workbook produced no valid public sales.');

  const latestSaleDate = records[0].saleDate;
  const needsReview = candidateSales - records.length;
  const neighborhoodCounts = topNeighborhoodCodes(records);
  const recordsWithNeighborhoodCode = records.filter(
    record => record.neighborhoodCode !== null
  ).length;
  const futureSaleDateRecords = records.filter(record => record.flags.futureSaleDate).length;
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
      topNeighborhoodCodes: neighborhoodCounts,
    },
    records,
  };
  const status = {
    schemaVersion: STATUS_SCHEMA,
    generatedAt,
    sourcePosture: SOURCE_MODE,
    counties: [
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        priority: 'washington_assessor_launch',
        prometheusStatus: 'public_data_ready',
        primarySourceMode: SOURCE_MODE,
        latestSaleDate,
        candidateSales,
        stagedSales: records.length,
        needsReview,
        confidence: {
          averageQualityScore: 1,
          parserStatus: 'ready',
          rawStatus: 'official_workbook_verified',
          rawDriftDetected: false,
        },
        staticRoutes: { detail: detailRoute, salesShard: salesRoute },
      },
    ],
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
  const manifest = {
    schemaVersion: MANIFEST_SCHEMA,
    statusSchemaVersion: STATUS_SCHEMA,
    statusCanonicalJsonSha256: canonicalJsonSha256(status),
    generatedAt,
    sourcePosture: SOURCE_MODE,
    salesShardAttestations: [
      {
        algorithm: 'SHA-256',
        canonicalJsonSha256: canonicalJsonSha256(shard),
        county: COUNTY,
        countyCode: COUNTY_CODE,
        officialSourceBaseUrl: SOURCE_BASE_URL,
        route: salesRoute,
        sourcePayloadSha256: [payloadSha256],
        sourcePosture: SOURCE_MODE,
      },
    ],
    summary: {
      counties: 1,
      rawLanded: 1,
      parserReady: 1,
      candidateSales,
      stagedSales: records.length,
      needsReview,
      prometheusNeedsReview: 0,
      recordsWithNeighborhoodCode,
      futureSaleDateRecords,
      criticalContradictions: 0,
      garfieldExceptions: 0,
      bentonCityAsNeighborhoodRecords: 0,
    },
  };

  const outputRoot = resolve(outputPath);
  const operationId = `${process.pid}-${randomUUID()}`;
  const temporaryRoot = `${outputRoot}.tmp-${operationId}`;
  const backupRoot = `${outputRoot}.bak-${operationId}`;
  await mkdir(dirname(outputRoot), { recursive: true });
  await mkdir(temporaryRoot, { recursive: false });
  let movedExistingOutput = false;
  try {
    await writeJson(join(temporaryRoot, 'manifest.json'), manifest);
    await writeJson(join(temporaryRoot, 'counties/status.json'), status);
    await writeJson(join(temporaryRoot, `counties/${COUNTY_CODE}.json`), detail);
    await writeJson(join(temporaryRoot, `sales/by-county/${COUNTY_CODE}.json`), shard);
    await writeJson(join(temporaryRoot, 'receipts/kitsap-source.json'), {
      schemaVersion: 'terrafusion.washington.public-source-receipt.v1',
      county: COUNTY,
      countyCode: COUNTY_CODE,
      generatedAt,
      sourceUrl: SOURCE_URL,
      sourcePayloadPath: basename(sourcePath),
      sourcePayloadBytes: workbookBytes.byteLength,
      sourcePayloadSha256: payloadSha256,
      candidateSales,
      stagedSales: records.length,
      quarantinedSales: needsReview,
      quarantine,
      omittedFields: ['owner', 'grantor', 'grantee', 'buyer', 'seller'],
    });
    try {
      await rename(outputRoot, backupRoot);
      movedExistingOutput = true;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    try {
      await rename(temporaryRoot, outputRoot);
    } catch (error) {
      if (movedExistingOutput) {
        await rename(backupRoot, outputRoot);
        movedExistingOutput = false;
      }
      throw error;
    }
    if (movedExistingOutput) {
      movedExistingOutput = false;
      await rm(backupRoot, { recursive: true, force: true });
    }
  } catch (error) {
    await rm(temporaryRoot, { recursive: true, force: true });
    if (movedExistingOutput) {
      await rename(backupRoot, outputRoot);
    }
    throw error;
  }

  console.log(
    JSON.stringify(
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        manifestCanonicalJsonSha256: canonicalJsonSha256(manifest),
        sourcePayloadSha256: payloadSha256,
        candidateSales,
        stagedSales: records.length,
        quarantinedSales: needsReview,
        latestSaleDate,
        outputRoot,
      },
      null,
      2
    )
  );
}

await main();

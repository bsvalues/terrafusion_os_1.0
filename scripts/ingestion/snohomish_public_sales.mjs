#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs, { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { basename, join, resolve, sep } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';
import XLSX from 'xlsx';
import {
  canonicalJsonSha256,
  loadVerifiedRetainedWashingtonPackage,
  publishWashingtonLaunchPackage,
} from './kitsap_public_sales.mjs';

XLSX.set_fs(fs);

const COUNTY = 'Snohomish';
const COUNTY_CODE = '061';
const SOURCE_MODE = 'public_assessor_qualified_sales_xlsx';
const SOURCE_NAME = 'snohomish-official-all-sales-2026-09-02';
const SOURCE_SET_SCHEMA = 'terrafusion.washington.public-source-set.v1';
const MANIFEST_SCHEMA = 'terrafusion.washington.launch-manifest.v1';
const STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const DETAIL_SCHEMA = 'terrafusion.washington.county-detail.v1';
const SHARD_SCHEMA = 'terrafusion.washington.sales-shard.v1';
const RECEIPT_SCHEMA = 'terrafusion.washington.public-source-receipt.v1';
const SHA256_PATTERN = /^[a-f\d]{64}$/;
const ARCGIS_ITEM_DATA_URL =
  'https://www.arcgis.com/sharing/rest/content/items/ee76dfa5905947cc9af1605a25cf216a/data';
const SOURCE_CONFIG_PATH = fileURLToPath(
  new URL('./sources/snohomish_assessor_sales_2026.json', import.meta.url)
);

export const SNOHOMISH_SALES_HEADERS = [
  'LRSN',
  'Parcel_Id',
  'Status',
  'SD_Nbr',
  'Nbhd',
  'TRSQ',
  'Prop_Class',
  'PropertyStreet',
  'OwnerName1',
  'Sale_Date',
  'Sale_Price',
  'Excise_Nbr',
  'Deed_Type',
  'Sale_Qual_Code',
  'V/I',
  'LL1_Type',
  'LL1_Calc_Method',
  'LL1_Acres',
  'Ll1_SqFt',
  'Ll1_FF',
  'Ll1_EFF',
  'Total_Land_Size',
  'zoning',
  'Ll1_Inf_1',
  'Last_Value_Update',
  'Imp_Value',
  'Mkt_Land_Value',
  'Total_Market_Value',
  'Land_Use_Value',
  'Change_Reason',
  'Eff_Year',
  'Exten',
  'Imp_Type',
  'Imp_Width',
  'Imp_Length',
  'Grade',
  'year_built',
  'eff_year_built',
  'Bedrooms',
  'MH_Length',
  'MH_Width',
  'Imp_Size',
  'B_L_SqFt',
  '1st_SqFt',
  'Upper_SqFt',
  'Total_SqFt',
  'Hse_Type_Desc',
  'House_Type_Code',
  'PCT_Comp',
  'mkt_rdf',
  'Transfer_Update_Date',
  'Cert_Value_Ratio',
];
export const SNOHOMISH_ASSESSOR_HEADERS = [
  'ID',
  'PropId',
  'parcel_number',
  'alt_parcel_nr',
  'tax_year',
  'TCAnumber',
  'UseCode',
  'UnitMeas',
  'SIZE',
  'SitusLine1',
  'SitusLine2',
  'SitusLine3',
  'SitusCity',
  'SitusState',
  'SitusZip',
  'TVR',
  'MKIMP',
  'MKLND',
  'CUIMP',
  'CULND',
  'MKTTL',
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function nullableString(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function normalizedParcelIdentifier(value) {
  const compact =
    nullableString(value)
      ?.toUpperCase()
      .replace(/[^A-Z0-9]/g, '') || null;
  // The sales workbook zero-pads Snohomish's numeric parcel number to 14
  // characters while MainData.csv exposes the same identifier without that
  // display padding. Preserve alphanumeric identifiers exactly.
  return compact && /^\d+$/.test(compact) ? compact.replace(/^0+(?=\d)/, '') : compact;
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

export function canonicalSnohomishExcelDate(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return canonicalIsoDate(
      `${String(parsed.y).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
    );
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return canonicalIsoDate(
      `${String(value.getFullYear()).padStart(4, '0')}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    );
  }
  return canonicalIsoDate(value);
}

export function parseSnohomishCsvLine(line) {
  const fields = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quoted) {
      if (character === '"') {
        if (line[index + 1] === '"') {
          value += '"';
          index += 1;
        } else quoted = false;
      } else value += character;
    } else if (character === ',') {
      fields.push(value);
      value = '';
    } else if (character === '"' && value === '') quoted = true;
    else value += character;
  }
  invariant(!quoted, 'Snohomish assessor CSV contains an unterminated quoted field.');
  fields.push(value);
  return fields;
}

function validateCountyUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Snohomish ${label} URL is invalid.`);
  }
  invariant(
    parsed.protocol === 'https:' &&
      ['snohomishcountywa.gov', 'www.snohomishcountywa.gov'].includes(parsed.hostname) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash,
    `Snohomish ${label} URL is outside the official county host.`
  );
  return parsed;
}

function validateArcGisUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Snohomish ${label} URL is invalid.`);
  }
  invariant(
    parsed.href === ARCGIS_ITEM_DATA_URL && !parsed.username && !parsed.password,
    `Snohomish ${label} URL is not the exact official GIS item payload.`
  );
  return parsed;
}

async function readSourceConfig(configPath) {
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  invariant(config?.schemaVersion === SOURCE_SET_SCHEMA, 'Snohomish source-set schema is invalid.');
  invariant(
    config.county === COUNTY && config.countyCode === COUNTY_CODE,
    'Snohomish source-set county is invalid.'
  );
  invariant(
    Array.isArray(config.sources) &&
      config.sources.length === 2 &&
      config.sources.map(source => source?.key).join(',') === 'sales,assessor',
    'Snohomish source-set must name sales and assessor sources.'
  );
  validateCountyUrl(config.officialSourceBaseUrl, 'official source');
  validateCountyUrl(config.indexUrl, 'source index');
  const start = canonicalIsoDate(config.sourceDateRange?.start);
  const end = canonicalIsoDate(config.sourceDateRange?.end);
  invariant(start && end && start <= end, 'Snohomish source date range is invalid.');
  const [sales, assessor] = config.sources;
  invariant(
    basename(sales.file) === sales.file && SHA256_PATTERN.test(sales.sha256),
    'Snohomish sales source identity is invalid.'
  );
  validateCountyUrl(sales.url, 'sales source');
  validateCountyUrl(sales.finalUrl, 'sales final source');
  invariant(
    basename(assessor.file) === assessor.file &&
      basename(assessor.archiveFile) === assessor.archiveFile &&
      assessor.file !== assessor.archiveFile &&
      SHA256_PATTERN.test(assessor.sha256) &&
      SHA256_PATTERN.test(assessor.archiveSha256),
    'Snohomish assessor source identity is invalid.'
  );
  validateArcGisUrl(assessor.url, 'assessor source');
  validateArcGisUrl(assessor.finalUrl, 'assessor final source');
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
  invariant(path.startsWith(`${root}${sep}`), 'Snohomish source escaped its source directory.');
  return path;
}

function publicAssessorProperty(fields) {
  const address = [fields[9], fields[10], fields[11]].map(nullableString).filter(Boolean).join(' ');
  const city = nullableString(fields[12]);
  const state = nullableString(fields[13]);
  const zip = nullableString(fields[14]);
  const size = nullablePositiveNumber(fields[8]);
  const unit = nullableString(fields[7])?.toLowerCase() ?? null;
  const acres = unit === 'acres' ? size : null;
  const lotSizeSqft =
    acres !== null ? Math.round(acres * 43_560) : unit === 'square feet' ? size : null;
  return {
    parcelNumber: nullableString(fields[2]),
    situsAddress: address || null,
    situsCity: city,
    situsZip: zip && /^\d{5}(?:-\d{4})?$/.test(zip) ? zip : null,
    situsState: state,
    useCode: nullableString(fields[6]),
    acres,
    lotSizeSqft,
  };
}

async function readAssessorProperties(path) {
  const properties = new Map();
  let rows = 0;
  const lines = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const lineValue of lines) {
    const line = rows === 0 && lineValue.charCodeAt(0) === 0xfeff ? lineValue.slice(1) : lineValue;
    const fields = parseSnohomishCsvLine(line);
    if (rows === 0) {
      invariant(
        fields.length === SNOHOMISH_ASSESSOR_HEADERS.length &&
          fields.every((field, index) => field === SNOHOMISH_ASSESSOR_HEADERS[index]),
        'Snohomish assessor CSV header does not match its contract.'
      );
      rows += 1;
      continue;
    }
    invariant(
      fields.length === SNOHOMISH_ASSESSOR_HEADERS.length,
      `Snohomish assessor row ${rows + 1} has an invalid field count.`
    );
    const propertyId = nullableString(fields[1]);
    const parcel = nullableString(fields[2]);
    invariant(propertyId && parcel, `Snohomish assessor row ${rows + 1} has no property identity.`);
    const property = publicAssessorProperty(fields);
    const existing = properties.get(propertyId);
    if (!existing) properties.set(propertyId, { property, ordinal: rows + 1, ambiguous: false });
    else if (JSON.stringify(existing.property) !== JSON.stringify(property))
      existing.ambiguous = true;
    rows += 1;
  }
  invariant(rows > 1, 'Snohomish assessor CSV contains no property rows.');
  return { properties, rows: rows - 1 };
}

function workbookCandidate(values, ordinal) {
  // OwnerName1 (column I) is deliberately never copied out of the workbook parser boundary.
  return {
    ordinal,
    // Hash every source value except OwnerName1. This distinguishes legitimate
    // improvement-component rows while making exact source-row repeats detectable
    // without carrying private owner data beyond the parser boundary.
    sourceRowSha256: hashedIdentity(
      JSON.stringify(values.map((value, index) => (index === 8 ? null : (value ?? null))))
    ),
    lrsn: nullableString(values[0]),
    parcel: nullableString(values[1]),
    status: nullableString(values[2]),
    neighborhoodCode: nullableString(values[4]),
    saleDate: canonicalSnohomishExcelDate(values[9]),
    salePrice: nullablePositiveNumber(values[10]),
    excise: nullableString(values[11]),
    deedType: nullableString(values[12]),
    qualificationCode: nullableString(values[13]),
    yearBuilt: nullableBoundedInteger(values[36], 1700, 2200),
    bedrooms: nullableBoundedInteger(values[38], 0, 99),
    grossLivingArea: nullablePositiveNumber(values[45]),
  };
}

export function parseSnohomishWorkbook(bytes) {
  const workbook = XLSX.read(bytes, { type: 'buffer', cellDates: false });
  invariant(
    workbook.SheetNames.length === 2 &&
      workbook.SheetNames[0] === 'Disclaimer' &&
      workbook.SheetNames[1] === 'All Sales',
    'Snohomish workbook sheets do not match the All Sales contract.'
  );
  const table = XLSX.utils.sheet_to_json(workbook.Sheets['All Sales'], {
    header: 1,
    raw: true,
    defval: null,
    range: 1,
  });
  invariant(table.length > 1, 'Snohomish workbook contains no sales rows.');
  const headers = table[0].map(value => String(value ?? '').trim());
  invariant(
    headers.length === SNOHOMISH_SALES_HEADERS.length &&
      headers.every((header, index) => header === SNOHOMISH_SALES_HEADERS[index]),
    'Snohomish workbook header does not match the All Sales contract.'
  );
  return table.slice(1).map((values, index) => {
    invariant(
      values.length <= SNOHOMISH_SALES_HEADERS.length,
      `Snohomish workbook row ${index + 3} has extra fields.`
    );
    return workbookCandidate(values, index + 3);
  });
}

function unanimous(group, key) {
  const present = group.map(candidate => candidate[key]).filter(value => value !== null);
  return present.length > 0 && present.every(value => value === present[0]) ? present[0] : null;
}

function conflicting(group, key) {
  return new Set(group.map(candidate => JSON.stringify(candidate[key]))).size > 1;
}

function hashedIdentity(value) {
  return createHash('sha256').update(value).digest('hex');
}

function mapRecord(group, propertyEntry, salesSource, assessorSource) {
  const first = group[0];
  const saleDate = first.saleDate;
  const saleYear = Number(saleDate.slice(0, 4));
  const yearBuilt = unanimous(group, 'yearBuilt');
  const safeYearBuilt = yearBuilt !== null && yearBuilt <= saleYear ? yearBuilt : null;
  const identity = `${first.excise}|${first.lrsn}|${saleDate}`;
  return {
    saleId: `WA-${COUNTY_CODE}-${hashedIdentity(identity).slice(0, 32)}`,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    parcelNumber: propertyEntry.property.parcelNumber,
    saleDate,
    saleYear,
    salePrice: first.salePrice,
    adjustedSalePrice: null,
    documentNumber: first.excise,
    deedType: first.deedType,
    situsAddress: propertyEntry.property.situsAddress,
    situsCity: propertyEntry.property.situsCity,
    situsZip: propertyEntry.property.situsZip,
    useCode: propertyEntry.property.useCode,
    acres: propertyEntry.property.acres,
    grantor: null,
    grantee: null,
    saleNote: null,
    neighborhoodCode: unanimous(group, 'neighborhoodCode'),
    currentNeighborhoodCode: unanimous(group, 'neighborhoodCode'),
    sourceMode: SOURCE_MODE,
    candidateSource: SOURCE_NAME,
    confidenceScore: 1,
    qualityScore: 1,
    qualityBand: 'official_assessor_qualified_sale',
    reviewStatus: 'ready',
    grossLivingArea: safeYearBuilt === null ? null : unanimous(group, 'grossLivingArea'),
    lotSizeSqft: propertyEntry.property.lotSizeSqft,
    yearBuilt: safeYearBuilt,
    bedrooms: safeYearBuilt === null ? null : unanimous(group, 'bedrooms'),
    bathrooms: null,
    condition: null,
    qualityGrade: null,
    provenance: {
      sourceUrl: salesSource.url,
      sourceFinalUrl: salesSource.finalUrl,
      sourcePayloadPath: salesSource.file,
      sourcePayloadSha256: salesSource.sha256,
      candidateIndexSource: `${salesSource.file}#row:${first.ordinal}`,
      candidateRecordType: 'official-assessor-qualified-sale',
      candidateSourceOrdinal: first.ordinal,
      componentRows: [
        ...group.map(candidate => ({
          sourceUrl: salesSource.url,
          sourcePayloadPath: salesSource.file,
          sourcePayloadSha256: salesSource.sha256,
          candidateIndexSource: `${salesSource.file}#row:${candidate.ordinal}`,
        })),
        {
          sourceUrl: assessorSource.url,
          sourcePayloadPath: assessorSource.file,
          sourcePayloadSha256: assessorSource.sha256,
          candidateIndexSource: `${assessorSource.file}#row:${propertyEntry.ordinal}`,
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

export async function buildSnohomishCountyPackage(
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
    'Snohomish source range extends into the future.'
  );
  const [salesSource, assessorSource] = config.sources;
  const salesPath = sourcePath(sourceDirectory, salesSource.file);
  const assessorPath = sourcePath(sourceDirectory, assessorSource.file);
  const assessorArchivePath = sourcePath(sourceDirectory, assessorSource.archiveFile);
  const [salesSha256, assessorSha256, assessorArchiveSha256] = await Promise.all([
    sha256File(salesPath),
    sha256File(assessorPath),
    sha256File(assessorArchivePath),
  ]);
  invariant(
    salesSha256 === salesSource.sha256,
    'Snohomish sales workbook does not match its SHA-256.'
  );
  invariant(
    assessorSha256 === assessorSource.sha256,
    'Snohomish assessor extract does not match its SHA-256.'
  );
  invariant(
    assessorArchiveSha256 === assessorSource.archiveSha256,
    'Snohomish assessor archive does not match its SHA-256.'
  );
  const assessor = await readAssessorProperties(assessorPath);
  const salesBytes = await readFile(salesPath);
  const workbookRows = parseSnohomishWorkbook(salesBytes);
  const sourceDisposition = {
    notOfficiallyQualified: 0,
    invalidOrFutureSaleDate: 0,
    outsideStudyWindow: 0,
    qualificationCodes: {},
  };
  const candidates = [];
  for (const row of workbookRows) {
    if (row.qualificationCode !== 'Q') {
      sourceDisposition.notOfficiallyQualified += 1;
      const code = row.qualificationCode ?? 'BLANK';
      sourceDisposition.qualificationCodes[code] =
        (sourceDisposition.qualificationCodes[code] ?? 0) + 1;
      continue;
    }
    if (!row.saleDate || row.saleDate > generatedDate) {
      sourceDisposition.invalidOrFutureSaleDate += 1;
      continue;
    }
    if (row.saleDate < config.sourceDateRange.start || row.saleDate > config.sourceDateRange.end) {
      sourceDisposition.outsideStudyWindow += 1;
      continue;
    }
    candidates.push(row);
  }
  const transactionParcels = new Map();
  for (const candidate of candidates) {
    if (!candidate.excise || !candidate.lrsn) continue;
    const parcels = transactionParcels.get(candidate.excise) ?? new Set();
    parcels.add(candidate.lrsn);
    transactionParcels.set(candidate.excise, parcels);
  }
  const multiParcelTransactions = new Map(
    [...transactionParcels].filter(([, parcels]) => parcels.size > 1)
  );
  const collisionGroups = new Map();
  for (const candidate of candidates) {
    if (!candidate.lrsn || !candidate.saleDate || candidate.salePrice === null) continue;
    const identity = `${candidate.lrsn}|${candidate.saleDate}|${candidate.salePrice}`;
    const group = collisionGroups.get(identity) ?? [];
    group.push(candidate);
    collisionGroups.set(identity, group);
  }
  const crossConveyanceCollisions = new Map(
    [...collisionGroups].filter(
      ([, group]) => new Set(group.map(candidate => candidate.excise)).size > 1
    )
  );
  const crossConveyanceCandidates = new Set(
    [...crossConveyanceCollisions.values()].flatMap(group => group)
  );
  const groups = new Map();
  const duplicateSourceRows = new Map();
  for (const candidate of candidates) {
    const repeated = duplicateSourceRows.get(candidate.sourceRowSha256) ?? [];
    repeated.push(candidate);
    duplicateSourceRows.set(candidate.sourceRowSha256, repeated);
  }
  const exactDuplicateCandidates = new Set(
    [...duplicateSourceRows.values()].filter(group => group.length > 1).flat()
  );
  const quarantine = {
    missingParcelIdentity: 0,
    missingConveyanceIdentity: 0,
    nonPositiveSalePrice: 0,
    multiParcelSales: 0,
    crossConveyanceDuplicateSales: 0,
    exactDuplicateRows: 0,
    inactiveSales: 0,
    conflictingTransactionRows: 0,
    missingAssessorJoin: 0,
    ambiguousAssessorJoin: 0,
    parcelAssessorContradictions: 0,
    missingSitusAddress: 0,
  };
  for (const candidate of candidates) {
    if (!candidate.parcel || !candidate.lrsn) {
      quarantine.missingParcelIdentity += 1;
      continue;
    }
    if (!candidate.excise) {
      quarantine.missingConveyanceIdentity += 1;
      continue;
    }
    if (exactDuplicateCandidates.has(candidate)) {
      quarantine.exactDuplicateRows += 1;
      continue;
    }
    const key = `${candidate.excise}|${candidate.lrsn}`;
    const group = groups.get(key) ?? [];
    group.push(candidate);
    groups.set(key, group);
  }
  const records = [];
  const conflicts = [];
  let componentRowsConsolidated = 0;
  let multiComponentTransactions = 0;
  for (const [identity, group] of groups) {
    if (multiParcelTransactions.has(group[0].excise)) {
      quarantine.multiParcelSales += group.length;
      continue;
    }
    if (group.some(candidate => crossConveyanceCandidates.has(candidate))) {
      quarantine.crossConveyanceDuplicateSales += group.length;
      continue;
    }
    const conflictKeys = ['saleDate', 'salePrice', 'status', 'deedType'];
    if (conflictKeys.some(key => conflicting(group, key))) {
      quarantine.conflictingTransactionRows += group.length;
      conflicts.push({ identitySha256: hashedIdentity(identity), rowCount: group.length });
      continue;
    }
    if (group[0].salePrice === null) {
      quarantine.nonPositiveSalePrice += group.length;
      continue;
    }
    if (group[0].status !== 'A') {
      quarantine.inactiveSales += group.length;
      continue;
    }
    const propertyEntry = assessor.properties.get(group[0].lrsn);
    if (!propertyEntry) {
      quarantine.missingAssessorJoin += group.length;
      continue;
    }
    if (propertyEntry.ambiguous) {
      quarantine.ambiguousAssessorJoin += group.length;
      continue;
    }
    const joinedParcel = normalizedParcelIdentifier(propertyEntry.property.parcelNumber);
    if (
      !joinedParcel ||
      group.some(candidate => normalizedParcelIdentifier(candidate.parcel) !== joinedParcel)
    ) {
      quarantine.parcelAssessorContradictions += group.length;
      continue;
    }
    if (
      !propertyEntry.property.situsAddress ||
      !propertyEntry.property.situsCity ||
      propertyEntry.property.situsState !== 'WA' ||
      !propertyEntry.property.situsZip
    ) {
      quarantine.missingSitusAddress += group.length;
      continue;
    }
    if (group.length > 1) {
      multiComponentTransactions += 1;
      componentRowsConsolidated += group.length - 1;
    }
    records.push(mapRecord(group, propertyEntry, salesSource, assessorSource));
  }
  records.sort(
    (left, right) =>
      right.saleDate.localeCompare(left.saleDate) || left.saleId.localeCompare(right.saleId)
  );
  invariant(records.length > 0, 'Snohomish sources produced no public qualified sales.');
  invariant(
    new Set(records.map(record => record.saleId)).size === records.length,
    'Snohomish generated duplicate sale identifiers.'
  );
  const quarantinedSales = Object.values(quarantine).reduce((total, count) => total + count, 0);
  invariant(
    candidates.length === records.length + componentRowsConsolidated + quarantinedSales,
    'Snohomish candidate disposition accounting is inconsistent.'
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
      rawStatus: 'official_qualified_sales_and_gis_roll_sha_verified',
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
    sourcePayloadSha256: [salesSha256, assessorSha256],
    sourcePosture: SOURCE_MODE,
  };
  const [salesStats, assessorStats, archiveStats] = await Promise.all([
    stat(salesPath),
    stat(assessorPath),
    stat(assessorArchivePath),
  ]);
  const receipt = {
    schemaVersion: RECEIPT_SCHEMA,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    generatedAt,
    indexUrl: config.indexUrl,
    publishedLabel: config.publishedLabel,
    sourceDateRange: config.sourceDateRange,
    sourceRows: { sales: workbookRows.length, assessor: assessor.rows },
    sourceDisposition,
    candidateSales: candidates.length,
    stagedSales: records.length,
    quarantinedSales,
    consolidation: { componentRowsConsolidated, multiComponentTransactions },
    quarantine: {
      ...quarantine,
      multiParcelTransactions: [...multiParcelTransactions]
        .map(([identity, parcels]) => ({
          identitySha256: hashedIdentity(identity),
          parcelCount: parcels.size,
        }))
        .sort((left, right) => left.identitySha256.localeCompare(right.identitySha256)),
      crossConveyanceDuplicateIdentities: [...crossConveyanceCollisions]
        .map(([identity, group]) => ({
          identitySha256: hashedIdentity(identity),
          recordingCount: new Set(group.map(candidate => candidate.excise)).size,
          rowCount: group.length,
        }))
        .sort((left, right) => left.identitySha256.localeCompare(right.identitySha256)),
      conflictingSaleIdentities: conflicts.sort((left, right) =>
        left.identitySha256.localeCompare(right.identitySha256)
      ),
    },
    sources: [
      {
        key: salesSource.key,
        file: salesSource.file,
        url: salesSource.url,
        finalUrl: salesSource.finalUrl,
        bytes: salesStats.size,
        sha256: salesSha256,
      },
      {
        key: assessorSource.key,
        archiveFile: assessorSource.archiveFile,
        file: assessorSource.file,
        url: assessorSource.url,
        finalUrl: assessorSource.finalUrl,
        bytes: assessorStats.size,
        sha256: assessorSha256,
        archiveBytes: archiveStats.size,
        archiveSha256: assessorArchiveSha256,
      },
    ],
    omittedFields: [
      'OwnerName1',
      'NameAddr.csv',
      'owner',
      'mailingAddress',
      'grantor',
      'grantee',
      'buyer',
      'seller',
    ],
  };
  return { config, shard, statusEntry, detail, attestation, receipt };
}

export async function publishSnohomishPackage(
  sourceDirectory,
  outputPath,
  generatedAt,
  configPath = SOURCE_CONFIG_PATH
) {
  const snohomish = await buildSnohomishCountyPackage(sourceDirectory, generatedAt, configPath);
  let manifestDigest = null;
  await publishWashingtonLaunchPackage(outputPath, async ({ outputRoot, writeJson }) => {
    const retained = await loadVerifiedRetainedWashingtonPackage(
      outputRoot,
      COUNTY_CODE,
      generatedAt,
      [join('receipts', 'snohomish-source.json')]
    );
    for (const [relativePath, artifact] of retained.artifacts)
      await writeJson(relativePath, artifact);
    const status = {
      schemaVersion: STATUS_SCHEMA,
      generatedAt,
      sourcePosture: retained.statusEntries.length ? 'mixed_public_assessor_sources' : SOURCE_MODE,
      counties: [...retained.statusEntries, snohomish.statusEntry].sort((left, right) =>
        left.countyCode.localeCompare(right.countyCode)
      ),
    };
    const attestations = [...retained.attestations, snohomish.attestation].sort((left, right) =>
      left.countyCode.localeCompare(right.countyCode)
    );
    const shards = new Map(retained.shards);
    shards.set(COUNTY_CODE, snohomish.shard);
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
    await writeJson(join('counties', `${COUNTY_CODE}.json`), snohomish.detail);
    await writeJson(join('sales', 'by-county', `${COUNTY_CODE}.json`), snohomish.shard);
    await writeJson(join('receipts', 'snohomish-source.json'), snohomish.receipt);
  });
  console.log(
    JSON.stringify(
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        manifestCanonicalJsonSha256: manifestDigest,
        candidateSales: snohomish.receipt.candidateSales,
        stagedSales: snohomish.receipt.stagedSales,
        quarantinedSales: snohomish.receipt.quarantinedSales,
        latestSaleDate: snohomish.shard.summary.latestSaleDate,
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
    'Usage: snohomish_public_sales.mjs <source-directory> <output-directory> <generated-at-iso>'
  );
  await publishSnohomishPackage(sourceDirectory, outputPath, generatedAt);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  await main();

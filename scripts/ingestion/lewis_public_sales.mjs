#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  canonicalJsonSha256,
  loadVerifiedRetainedWashingtonPackage,
  publishWashingtonLaunchPackage,
} from './kitsap_public_sales.mjs';

const COUNTY = 'Lewis';
const COUNTY_CODE = '041';
const SOURCE_MODE = 'public_assessor_benchmarked_valid_sales_pdf';
const SOURCE_NAME = 'lewis-official-2024-benchmarked-valid-sales';
const SOURCE_SET_SCHEMA = 'terrafusion.washington.public-source-set.v1';
const MANIFEST_SCHEMA = 'terrafusion.washington.launch-manifest.v1';
const STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const DETAIL_SCHEMA = 'terrafusion.washington.county-detail.v1';
const SHARD_SCHEMA = 'terrafusion.washington.sales-shard.v1';
const RECEIPT_SCHEMA = 'terrafusion.washington.public-source-receipt.v1';
const SHA256_PATTERN = /^[a-f\d]{64}$/;
const EXPECTED_PAGE_COUNT = 59;
const EXPECTED_ROWS_PER_PAGE = 31;
const SOURCE_CONFIG_PATH = fileURLToPath(
  new URL('./sources/lewis_assessor_sales_2024.json', import.meta.url)
);
export const LEWIS_PDF_HEADERS = [
  'Parcel ID',
  'NBHD',
  'Prop Type',
  'Excise',
  'Deed Type',
  'Sale Vrfy',
  'Multi Parcel',
  'Bench Mark',
  'Sale Date',
  'Sale Price',
  'Address',
  'School District',
  'Acres Sold',
  'Det Str Value',
  'Land Flag',
];
const EXPECTED_HEADER_TEXT =
  'Parcel ID NBHD Prop Type Excise Deed Type Sale Vrfy Multi Parcel Bench Mark Sale Date Sale Price Address School District Acres Sold Det Str Value Land Flag';
const MONTHS = new Map(
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
    (month, index) => [month, index + 1]
  )
);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function nullableString(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function nullableNonnegativeNumber(value) {
  const normalized = nullableString(value);
  if (normalized === null) return null;
  const parsed = Number(normalized.replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function nullablePositiveNumber(value) {
  const parsed = nullableNonnegativeNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
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

function parseLewisPdfDate(value) {
  const match = /^(\d{2})-([A-Z][a-z]{2})-(\d{2})$/.exec(String(value ?? '').trim());
  if (!match || !MONTHS.has(match[2])) return null;
  return canonicalIsoDate(
    `20${match[3]}-${String(MONTHS.get(match[2])).padStart(2, '0')}-${match[1]}`
  );
}

function validateCountyUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Lewis ${label} URL is invalid.`);
  }
  invariant(
    parsed.protocol === 'https:' &&
      ['lewiscountywa.gov', 'www.lewiscountywa.gov'].includes(parsed.hostname) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash,
    `Lewis ${label} URL is outside the official county host.`
  );
  return parsed;
}

async function readSourceConfig(configPath) {
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  invariant(config?.schemaVersion === SOURCE_SET_SCHEMA, 'Lewis source-set schema is invalid.');
  invariant(
    config.county === COUNTY && config.countyCode === COUNTY_CODE,
    'Lewis source-set county is invalid.'
  );
  invariant(
    Array.isArray(config.sources) &&
      config.sources.length === 2 &&
      config.sources[0]?.key === 'sales' &&
      config.sources[1]?.key === 'legend',
    'Lewis source-set must name the sales report and its legend.'
  );
  const officialSourceUrl = validateCountyUrl(config.officialSourceBaseUrl, 'official source');
  validateCountyUrl(config.indexUrl, 'source index');
  const start = canonicalIsoDate(config.sourceDateRange?.start);
  const end = canonicalIsoDate(config.sourceDateRange?.end);
  invariant(start && end && start <= end, 'Lewis source date range is invalid.');
  for (const source of config.sources) {
    invariant(
      basename(source.file) === source.file && SHA256_PATTERN.test(source.sha256),
      `Lewis ${source.key} source identity is invalid.`
    );
    const sourceUrl = validateCountyUrl(source.url, `${source.key} source`);
    const finalUrl = validateCountyUrl(source.finalUrl, `${source.key} final source`);
    invariant(
      [sourceUrl, finalUrl].every(url => url.hostname === officialSourceUrl.hostname),
      `Lewis ${source.key} payload is outside the attested official source family.`
    );
  }
  return { ...config, sourceDateRange: { start, end } };
}

function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function sourcePath(sourceDirectory, file) {
  const root = resolve(sourceDirectory);
  const path = resolve(root, file);
  invariant(path.startsWith(`${root}${sep}`), 'Lewis source escaped its source directory.');
  return path;
}

function hashedIdentity(value) {
  return createHash('sha256').update(value).digest('hex');
}

function pageItems(textContent) {
  return textContent.items
    .filter(item => nullableString(item.str))
    .map(item => ({
      text: String(item.str).trim(),
      x: Number(item.transform[4]),
      y: Number(item.transform[5]),
    }));
}

function textWithin(items, minimumX, maximumX) {
  return items
    .filter(item => item.x >= minimumX && item.x < maximumX)
    .sort((left, right) => left.x - right.x)
    .map(item => item.text)
    .join(' ')
    .trim();
}

function headerTextWithin(items, minimumX, maximumX) {
  return items
    .filter(item => item.x >= minimumX && item.x < maximumX)
    .sort((left, right) => right.y - left.y || left.x - right.x)
    .map(item => item.text)
    .join(' ')
    .trim();
}

function assertPageHeader(items, pageNumber) {
  const title = items
    .filter(item => item.y > 550)
    .sort((left, right) => right.y - left.y || left.x - right.x)
    .map(item => item.text)
    .join(' ');
  invariant(
    title === '2024 Sales All Sales All County',
    `Lewis sales page ${pageNumber} title drifted.`
  );
  const headerItems = items.filter(item => item.y >= 528 && item.y <= 550);
  const header = [
    headerTextWithin(headerItems, 45, 110),
    headerTextWithin(headerItems, 110, 140),
    headerTextWithin(headerItems, 140, 170),
    headerTextWithin(headerItems, 170, 210),
    headerTextWithin(headerItems, 210, 240),
    headerTextWithin(headerItems, 240, 270),
    headerTextWithin(headerItems, 270, 300),
    headerTextWithin(headerItems, 300, 335),
    headerTextWithin(headerItems, 335, 385),
    headerTextWithin(headerItems, 385, 480),
    headerTextWithin(headerItems, 480, 570),
    headerTextWithin(headerItems, 570, 640),
    headerTextWithin(headerItems, 640, 665),
    headerTextWithin(headerItems, 665, 700),
    headerTextWithin(headerItems, 700, 760),
  ].join(' ');
  invariant(header === EXPECTED_HEADER_TEXT, `Lewis sales page ${pageNumber} headers drifted.`);
}

export function projectLewisPdfRow(lineItems, pageNumber, pageRow) {
  const rawPriceAndAddress = textWithin(lineItems, 395, 570);
  const priceAndAddress = /^([\d,.]+)\s+(.+)$/.exec(rawPriceAndAddress);
  const rawAcres = textWithin(lineItems, 640, 675);
  const acresToken = /^(\d+(?:\.\d+)?)/.exec(rawAcres)?.[1] ?? null;
  return {
    ordinal: (pageNumber - 1) * EXPECTED_ROWS_PER_PAGE + pageRow,
    pageNumber,
    pageRow,
    parcelNumber: nullableString(textWithin(lineItems, 45, 110)),
    neighborhoodCode: nullableString(textWithin(lineItems, 110, 140)),
    propertyType: nullableString(textWithin(lineItems, 140, 170)),
    exciseId: nullableString(textWithin(lineItems, 170, 210)),
    deedType: nullableString(textWithin(lineItems, 210, 240)),
    verificationCode: nullableString(textWithin(lineItems, 240, 270)),
    multiParcel: nullableString(textWithin(lineItems, 270, 300)),
    benchmark: nullableString(textWithin(lineItems, 300, 335)),
    saleDate: parseLewisPdfDate(textWithin(lineItems, 335, 395)),
    salePrice: priceAndAddress ? nullablePositiveNumber(priceAndAddress[1]) : null,
    situsAddress: priceAndAddress ? nullableString(priceAndAddress[2]) : null,
    schoolDistrict: nullableString(textWithin(lineItems, 570, 640)),
    acres: nullableNonnegativeNumber(acresToken),
  };
}

async function readLewisSalesRows(bytes) {
  const document = await getDocument({ data: new Uint8Array(bytes), disableWorker: true }).promise;
  invariant(document.numPages === EXPECTED_PAGE_COUNT, 'Lewis sales PDF page count drifted.');
  const rows = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const items = pageItems(await page.getTextContent());
    assertPageHeader(items, pageNumber);
    const parcelItems = items.filter(
      item => item.x >= 45 && item.x < 110 && item.y < 528 && /^\d{12}$/.test(item.text)
    );
    invariant(
      parcelItems.length === EXPECTED_ROWS_PER_PAGE,
      `Lewis sales page ${pageNumber} row count drifted.`
    );
    parcelItems.forEach((parcelItem, index) => {
      const lineItems = items.filter(item => Math.abs(item.y - parcelItem.y) < 0.5);
      const candidate = projectLewisPdfRow(lineItems, pageNumber, index + 1);
      invariant(
        candidate.parcelNumber === parcelItem.text,
        `Lewis sales page ${pageNumber} row ${index + 1} parcel layout drifted.`
      );
      rows.push(candidate);
    });
  }
  return rows;
}

async function readLegendText(bytes) {
  const document = await getDocument({ data: new Uint8Array(bytes), disableWorker: true }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const items = pageItems(await page.getTextContent());
    pages.push(
      items
        .map(item => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
    );
  }
  return pages.join(' ');
}

function assertLegendAuthority(text) {
  invariant(
    text.includes('AA is the designation for a valid transaction'),
    'Lewis AA valid-transaction authority is missing or changed.'
  );
  invariant(
    text.includes(
      'Multi Parcel : Designates whether or not multiple parcels were sold in one transaction'
    ),
    'Lewis multi-parcel authority is missing or changed.'
  );
  invariant(
    text.includes('Benchmark : Evaluation to determine whether or not a sale has been verified'),
    'Lewis benchmark authority is missing or changed.'
  );
  invariant(
    text.includes('This shows as City on the website, but is actually the school district'),
    'Lewis school-district truth boundary is missing or changed.'
  );
}

export function findLewisExciseCollisions(candidates) {
  const groups = new Map();
  for (const candidate of candidates) {
    if (!candidate.exciseId || !candidate.parcelNumber) continue;
    const group = groups.get(candidate.exciseId) ?? { parcels: new Set(), rowCount: 0 };
    group.parcels.add(candidate.parcelNumber);
    group.rowCount += 1;
    groups.set(candidate.exciseId, group);
  }
  return new Map([...groups].filter(([, group]) => group.parcels.size > 1));
}

function mapRecord(candidate, source) {
  const saleYear = Number(candidate.saleDate.slice(0, 4));
  const identity = `${candidate.parcelNumber}|${candidate.saleDate}|${candidate.exciseId ?? ''}`;
  return {
    saleId: `WA-${COUNTY_CODE}-${hashedIdentity(identity).slice(0, 32)}`,
    county: COUNTY,
    countyCode: COUNTY_CODE,
    parcelNumber: candidate.parcelNumber,
    saleDate: candidate.saleDate,
    saleYear,
    salePrice: candidate.salePrice,
    adjustedSalePrice: null,
    documentNumber: candidate.exciseId,
    deedType: candidate.deedType,
    situsAddress: candidate.situsAddress,
    situsCity: null,
    situsZip: null,
    useCode: candidate.propertyType,
    acres: candidate.acres,
    grantor: null,
    grantee: null,
    saleNote: candidate.schoolDistrict ? `School district: ${candidate.schoolDistrict}` : null,
    neighborhoodCode: candidate.neighborhoodCode,
    currentNeighborhoodCode: candidate.neighborhoodCode,
    sourceMode: SOURCE_MODE,
    candidateSource: SOURCE_NAME,
    confidenceScore: 1,
    qualityScore: 1,
    qualityBand: 'official_benchmarked_valid_sale',
    reviewStatus: 'ready',
    grossLivingArea: null,
    lotSizeSqft: candidate.acres === null ? null : Math.round(candidate.acres * 43_560),
    yearBuilt: null,
    bedrooms: null,
    bathrooms: null,
    condition: null,
    qualityGrade: null,
    provenance: {
      sourceUrl: source.url,
      sourceFinalUrl: source.finalUrl,
      sourcePayloadPath: source.file,
      sourcePayloadSha256: source.sha256,
      candidateIndexSource: `${source.file}#page:${candidate.pageNumber}:row:${candidate.pageRow}`,
      candidateRecordType: 'official-assessor-benchmarked-valid-sale',
      candidateSourceOrdinal: candidate.ordinal,
      componentRows: [
        {
          sourceUrl: source.url,
          sourcePayloadPath: source.file,
          sourcePayloadSha256: source.sha256,
          candidateIndexSource: `${source.file}#page:${candidate.pageNumber}:row:${candidate.pageRow}`,
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

export async function buildLewisCountyPackage(
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
    'Lewis source range extends into the future.'
  );
  const salesSource = config.sources[0];
  const legendSource = config.sources[1];
  const salesPath = sourcePath(sourceDirectory, salesSource.file);
  const legendPath = sourcePath(sourceDirectory, legendSource.file);
  // Read each source exactly once so its digest, parsed content, and byte count
  // all describe the same immutable in-memory snapshot.
  const [salesBytes, legendBytes] = await Promise.all([readFile(salesPath), readFile(legendPath)]);
  const salesSha256 = sha256Bytes(salesBytes);
  const legendSha256 = sha256Bytes(legendBytes);
  invariant(salesSha256 === salesSource.sha256, 'Lewis sales PDF does not match its SHA-256.');
  invariant(legendSha256 === legendSource.sha256, 'Lewis sales legend does not match its SHA-256.');
  const [rows, legendText] = await Promise.all([
    readLewisSalesRows(salesBytes),
    readLegendText(legendBytes),
  ]);
  assertLegendAuthority(legendText);
  const sourceDisposition = {
    notOfficiallyValidTransaction: 0,
    invalidOrFutureSaleDate: 0,
    outsideStudyWindow: 0,
  };
  const candidates = [];
  for (const row of rows) {
    if (row.verificationCode !== 'AA') {
      sourceDisposition.notOfficiallyValidTransaction += 1;
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
  const quarantine = {
    missingParcelIdentity: 0,
    nonPositiveSalePrice: 0,
    multiParcelSales: 0,
    nonBenchmarkSales: 0,
    missingSitusAddress: 0,
    exciseReferenceCollisions: 0,
    duplicateParcelSales: 0,
  };
  const otherwisePublishable = candidates.filter(
    candidate =>
      candidate.parcelNumber &&
      candidate.salePrice !== null &&
      candidate.multiParcel === 'N' &&
      candidate.benchmark === 'Y' &&
      candidate.situsAddress
  );
  const exciseCollisions = findLewisExciseCollisions(otherwisePublishable);
  const exciseReferenceCollisionGroups = [...exciseCollisions]
    .map(([exciseId, group]) => ({
      identitySha256: hashedIdentity(exciseId),
      parcelCount: group.parcels.size,
      rowCount: group.rowCount,
    }))
    .sort((left, right) => left.identitySha256.localeCompare(right.identitySha256));
  const records = [];
  const seenParcelSales = new Set();
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
    if (candidate.benchmark !== 'Y') {
      quarantine.nonBenchmarkSales += 1;
      continue;
    }
    if (!candidate.situsAddress) {
      quarantine.missingSitusAddress += 1;
      continue;
    }
    if (candidate.exciseId && exciseCollisions.has(candidate.exciseId)) {
      quarantine.exciseReferenceCollisions += 1;
      continue;
    }
    const parcelSaleIdentity = `${candidate.parcelNumber}|${candidate.saleDate}`;
    if (seenParcelSales.has(parcelSaleIdentity)) {
      quarantine.duplicateParcelSales += 1;
      continue;
    }
    seenParcelSales.add(parcelSaleIdentity);
    records.push(mapRecord(candidate, salesSource));
  }
  records.sort(
    (left, right) =>
      right.saleDate.localeCompare(left.saleDate) || left.saleId.localeCompare(right.saleId)
  );
  invariant(records.length > 0, 'Lewis source produced no benchmarked valid sales.');
  invariant(
    new Set(records.map(record => record.saleId)).size === records.length,
    'Lewis generated duplicate sale identifiers.'
  );
  const quarantinedSales = Object.values(quarantine).reduce((total, count) => total + count, 0);
  invariant(
    candidates.length === records.length + quarantinedSales,
    'Lewis candidate disposition accounting is inconsistent.'
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
      rawStatus: 'official_sales_and_legend_pdfs_sha_verified',
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
    sourcePayloadSha256: [salesSha256, legendSha256],
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
    sourceRows: { sales: rows.length },
    sourcePages: { sales: EXPECTED_PAGE_COUNT, legend: 2 },
    sourceColumns: LEWIS_PDF_HEADERS,
    saleValidityAuthority: {
      verificationCode: 'AA',
      multiParcel: 'N',
      benchmark: 'Y',
      legendFile: legendSource.file,
      schoolDistrictIsNotCity: true,
    },
    sourceDisposition,
    candidateSales: candidates.length,
    stagedSales: records.length,
    quarantinedSales,
    quarantine,
    quarantineEvidence: { exciseReferenceCollisionGroups },
    sources: config.sources.map((source, index) => ({
      key: source.key,
      file: source.file,
      url: source.url,
      finalUrl: source.finalUrl,
      bytes: index === 0 ? salesBytes.byteLength : legendBytes.byteLength,
      sha256: index === 0 ? salesSha256 : legendSha256,
    })),
    omittedFields: [
      'owner',
      'mailingAddress',
      'legalDescription',
      'grantor',
      'grantee',
      'buyer',
      'seller',
      'schoolDistrictAsCity',
    ],
  };
  return { config, shard, statusEntry, detail, attestation, receipt };
}

export async function publishLewisPackage(
  sourceDirectory,
  outputPath,
  generatedAt,
  configPath = SOURCE_CONFIG_PATH
) {
  const lewis = await buildLewisCountyPackage(sourceDirectory, generatedAt, configPath);
  let manifestDigest = null;
  await publishWashingtonLaunchPackage(outputPath, async ({ outputRoot, writeJson }) => {
    const retained = await loadVerifiedRetainedWashingtonPackage(
      outputRoot,
      COUNTY_CODE,
      generatedAt,
      [join('receipts', 'lewis-source.json')]
    );
    for (const [relativePath, artifact] of retained.artifacts)
      await writeJson(relativePath, artifact);
    const status = {
      schemaVersion: STATUS_SCHEMA,
      generatedAt,
      sourcePosture: retained.statusEntries.length ? 'mixed_public_assessor_sources' : SOURCE_MODE,
      counties: [...retained.statusEntries, lewis.statusEntry].sort((left, right) =>
        left.countyCode.localeCompare(right.countyCode)
      ),
    };
    const attestations = [...retained.attestations, lewis.attestation].sort((left, right) =>
      left.countyCode.localeCompare(right.countyCode)
    );
    const shards = new Map(retained.shards);
    shards.set(COUNTY_CODE, lewis.shard);
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
    await writeJson(join('counties', `${COUNTY_CODE}.json`), lewis.detail);
    await writeJson(join('sales', 'by-county', `${COUNTY_CODE}.json`), lewis.shard);
    await writeJson(join('receipts', 'lewis-source.json'), lewis.receipt);
  });
  console.log(
    JSON.stringify(
      {
        county: COUNTY,
        countyCode: COUNTY_CODE,
        manifestCanonicalJsonSha256: manifestDigest,
        candidateSales: lewis.receipt.candidateSales,
        stagedSales: lewis.receipt.stagedSales,
        quarantinedSales: lewis.receipt.quarantinedSales,
        latestSaleDate: lewis.shard.summary.latestSaleDate,
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
    'Usage: lewis_public_sales.mjs <source-directory> <output-directory> <generated-at-iso>'
  );
  await publishLewisPackage(sourceDirectory, outputPath, generatedAt);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  await main();

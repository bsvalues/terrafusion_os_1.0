#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MANIFEST_SCHEMA = 'terrafusion.washington.launch-manifest.v1';
const STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const COUNTY_DETAIL_SCHEMA = 'terrafusion.washington.county-detail.v1';
const PACKAGE_PATH = '/launch-data/washington';
const COUNTY_DETAIL_PATH_PREFIX = `${PACKAGE_PATH}/counties`;
const SALES_SHARD_PATH_PREFIX = `${PACKAGE_PATH}/sales/by-county`;
const COUNTY_DETAIL_ROUTE_PATTERN = /^\/launch-data\/washington\/counties\/(\d{3})\.json$/;
const SALES_ROUTE_PATTERN = /^\/launch-data\/washington\/sales\/by-county\/(\d{3})\.json$/;
const SHA256_PATTERN = /^[a-f\d]{64}$/;
const FETCH_TIMEOUT_MS = 120_000;
const MAX_MANIFEST_BYTES = 5 * 1024 * 1024;
const MAX_STATUS_BYTES = 20 * 1024 * 1024;
const MAX_COUNTY_DETAIL_BYTES = 5 * 1024 * 1024;
const MAX_SHARD_BYTES = 512 * 1024 * 1024;
const SYNTHETIC_MARKERS = new Set([
  'repository_reference_demo',
  'synthetic_reference',
]);
const REPOSITORY_PUBLIC_SOURCE_INVENTORY_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../frontend/apps/os-shell/src/lib/washingtonPublicSourceInventory.data.json',
);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeCountyName(value) {
  return normalize(value).replace(/\s+county$/, '').trim();
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableString(value) {
  return value === null || typeof value === 'string';
}

function isNullableNumber(value) {
  return value === null || isFiniteNumber(value);
}

function isNullableCanonicalSaleDate(value) {
  if (value === null) return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp)
    && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function isCanonicalCountyRoute(route, countyCode, kind) {
  if (!route) return true;
  const prefix = kind === 'detail'
    ? COUNTY_DETAIL_PATH_PREFIX
    : SALES_SHARD_PATH_PREFIX;
  return route === `${prefix}/${countyCode}.json`;
}

function assertRuntimeCompatibleCountyStatusEntry(value, repositorySourceByCounty) {
  invariant(
    isRecord(value)
      && isRecord(value.confidence)
      && isRecord(value.staticRoutes)
      && isNonEmptyString(value.county)
      && typeof value.countyCode === 'string'
      && /^\d{3}$/.test(value.countyCode)
      && typeof value.priority === 'string'
      && typeof value.prometheusStatus === 'string'
      && typeof value.primarySourceMode === 'string'
      && isNullableString(value.latestSaleDate)
      && isFiniteNumber(value.candidateSales)
      && isFiniteNumber(value.stagedSales)
      && isFiniteNumber(value.needsReview)
      && isFiniteNumber(value.confidence.averageQualityScore)
      && typeof value.confidence.parserStatus === 'string'
      && typeof value.confidence.rawStatus === 'string'
      && typeof value.confidence.rawDriftDetected === 'boolean'
      && typeof value.staticRoutes.detail === 'string'
      && typeof value.staticRoutes.salesShard === 'string'
      && isCanonicalCountyRoute(value.staticRoutes.detail, value.countyCode, 'detail')
      && isCanonicalCountyRoute(value.staticRoutes.salesShard, value.countyCode, 'sales-shard'),
    'Washington county status contains an entry the browser runtime cannot load.',
  );
  const repositorySource = repositorySourceByCounty.get(normalizeCountyName(value.county));
  invariant(
    repositorySource?.countyCode === value.countyCode,
    `Washington county status does not match the canonical name/code pair for ${value.countyCode}.`,
  );
}

export function assertRuntimeCompatibleCountyDetail(
  value,
  countyStatus,
  expectedGeneratedAt,
) {
  const expectedCountyCode = countyStatus.countyCode;
  invariant(
    isRecord(value)
      && value.schemaVersion === COUNTY_DETAIL_SCHEMA
      && value.generatedAt === expectedGeneratedAt
      && isNonEmptyString(value.county)
      && typeof value.countyCode === 'string',
    `Washington county ${expectedCountyCode} detail has an invalid runtime shape or generation identity.`,
  );
  invariant(
    value.countyCode === expectedCountyCode
      && normalizeCountyName(value.county) === normalizeCountyName(countyStatus.county),
    `Washington county ${expectedCountyCode} detail identity is invalid.`,
  );
  invariant(
    value.operationalState === undefined
      || (
        isRecord(value.operationalState)
        && (
          value.operationalState.primarySourceMode === undefined
          || value.operationalState.primarySourceMode === countyStatus.primarySourceMode
        )
        && (
          value.operationalState.prometheusStatus === undefined
          || value.operationalState.prometheusStatus === countyStatus.prometheusStatus
        )
      ),
    `Washington county ${expectedCountyCode} detail operational state does not match attested status.`,
  );
  invariant(
    value.summary === undefined
      || (
        isRecord(value.summary)
        && (
          value.summary.records === undefined
          || (
            Number.isInteger(value.summary.records)
            && value.summary.records >= 0
            && value.summary.records === countyStatus.stagedSales
          )
        )
        && (
          value.summary.latestSaleDate === undefined
          || (
            isNullableCanonicalSaleDate(value.summary.latestSaleDate)
            && value.summary.latestSaleDate === countyStatus.latestSaleDate
          )
        )
      ),
    `Washington county ${expectedCountyCode} detail summary does not match attested status.`,
  );
  invariant(
    value.salesRoute === undefined
      || (
        typeof value.salesRoute === 'string'
        && value.salesRoute === countyStatus.staticRoutes.salesShard
      ),
    `Washington county ${expectedCountyCode} detail sales route does not match attested status.`,
  );
}

export function assertRuntimeCompatibleLaunchSaleRecord(
  value,
  expectedCountyCode,
  expectedCountyName,
  index,
) {
  invariant(
    isRecord(value)
      && isNonEmptyString(value.saleId)
      && typeof value.county === 'string'
      && typeof value.countyCode === 'string',
    `Washington county ${expectedCountyCode} shard has an invalid sale record at index ${index}.`,
  );
  invariant(
    value.countyCode === expectedCountyCode
      && normalizeCountyName(value.county) === normalizeCountyName(expectedCountyName),
    `Washington county ${expectedCountyCode} shard has a county mismatch at record ${index}.`,
  );
  invariant(
    isNullableString(value.parcelNumber)
      && isNullableCanonicalSaleDate(value.saleDate)
      && isNullableNumber(value.saleYear)
      && isNullableNumber(value.salePrice)
      && isNullableNumber(value.adjustedSalePrice)
      && isNullableString(value.documentNumber)
      && isNullableString(value.deedType)
      && isNullableString(value.situsAddress)
      && isNullableString(value.situsCity)
      && isNullableString(value.situsZip)
      && isNullableString(value.useCode)
      && (value.acres === null || typeof value.acres === 'string' || typeof value.acres === 'number')
      && isNullableString(value.grantor)
      && isNullableString(value.grantee)
      && isNullableString(value.saleNote)
      && isNullableString(value.neighborhoodCode)
      && isNullableString(value.currentNeighborhoodCode)
      && isNullableString(value.sourceMode)
      && isNullableString(value.candidateSource)
      && isNullableNumber(value.confidenceScore)
      && isNullableNumber(value.qualityScore)
      && isNullableString(value.qualityBand)
      && isNullableString(value.reviewStatus)
      && isRecord(value.provenance)
      && isRecord(value.flags)
      && isNullableString(value.provenance.sourceUrl)
      && isNullableString(value.provenance.sourceFinalUrl)
      && isNullableString(value.provenance.sourcePayloadPath)
      && isNullableString(value.provenance.sourcePayloadSha256)
      && isNullableString(value.provenance.candidateIndexSource)
      && isNullableString(value.provenance.candidateRecordType)
      && isNullableNumber(value.provenance.candidateSourceOrdinal)
      && typeof value.flags.duplicateRisk === 'boolean'
      && typeof value.flags.needsReview === 'boolean'
      && (value.flags.futureSaleDate === undefined
        || typeof value.flags.futureSaleDate === 'boolean')
      && typeof value.flags.manualException === 'boolean',
    `Washington county ${expectedCountyCode} shard has a runtime-incompatible sale record at index ${index}.`,
  );
}

export function assertRuntimeCompatibleCountyShard(
  value,
  expectedCountyCode,
  expectedCountyName,
) {
  invariant(
    isRecord(value)
      && typeof value.schemaVersion === 'string'
      && typeof value.generatedAt === 'string'
      && typeof value.county === 'string'
      && typeof value.countyCode === 'string'
      && isRecord(value.summary)
      && Array.isArray(value.records),
    `Washington county ${expectedCountyCode} shard has an invalid runtime shape.`,
  );
  invariant(
    value.countyCode === expectedCountyCode
      && normalizeCountyName(value.county) === normalizeCountyName(expectedCountyName),
    `Washington county ${expectedCountyCode} shard identity is invalid.`,
  );
  invariant(
    typeof value.summary.records === 'number'
      && value.summary.records === value.records.length
      && isNullableString(value.summary.latestSaleDate)
      && typeof value.summary.reviewRecords === 'number'
      && typeof value.summary.recordsWithNeighborhoodCode === 'number'
      && isRecord(value.summary.topNeighborhoodCodes),
    `Washington county ${expectedCountyCode} shard summary is runtime-incompatible.`,
  );

  const saleIds = new Set();
  value.records.forEach((record, index) => {
    assertRuntimeCompatibleLaunchSaleRecord(
      record,
      expectedCountyCode,
      expectedCountyName,
      index,
    );
    invariant(
      !saleIds.has(record.saleId),
      `Washington county ${expectedCountyCode} shard has duplicate saleId ${record.saleId}.`,
    );
    saleIds.add(record.saleId);
  });
}

function canonicalizeJson(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    const serialized = JSON.stringify(value);
    if (serialized !== undefined) return serialized;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const serialized = JSON.stringify(value);
    if (serialized !== undefined) return serialized;
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalizeJson).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`)
      .join(',')}}`;
  }
  throw new Error('Washington launch package contains a non-JSON value.');
}

function canonicalJsonSha256(value) {
  return createHash('sha256').update(canonicalizeJson(value)).digest('hex');
}

function parsePublicPackageRoot(rawValue) {
  let url;
  try {
    url = new URL(rawValue);
  } catch {
    throw new Error('WASHINGTON_LAUNCH_DATA_SOURCE_URL must be an absolute URL.');
  }

  invariant(url.protocol === 'https:', 'Washington launch package source must use HTTPS.');
  invariant(url.hostname.length > 0, 'Washington launch package source must name a host.');
  invariant(url.username === '' && url.password === '', 'Washington launch package source must not contain credentials.');
  invariant(url.search === '' && url.hash === '', 'Washington launch package source must not contain a query or fragment.');
  invariant(url.port === '' || url.port === '443', 'Washington launch package source must use the default HTTPS port.');
  invariant(
    url.pathname.replace(/\/+$/, '') === PACKAGE_PATH,
    `Washington launch package source path must be ${PACKAGE_PATH}.`,
  );
  url.pathname = `${PACKAGE_PATH}/`;
  return url;
}

function parseOfficialSourceUrl(rawValue) {
  invariant(isNonEmptyString(rawValue), 'Shard attestation must name an official public source.');
  let url;
  try {
    url = new URL(rawValue);
  } catch {
    throw new Error('Shard attestation official source must be an absolute URL.');
  }
  invariant(url.protocol === 'https:', 'Shard attestation official source must use HTTPS.');
  invariant(url.hostname.length > 0, 'Shard attestation official source must name a host.');
  invariant(url.username === '' && url.password === '', 'Shard attestation official source must not contain credentials.');
  invariant(url.port === '' || url.port === '443', 'Shard attestation official source must use the default HTTPS port.');
  return url;
}

export async function readRepositoryPublicSourceInventory() {
  let value;
  try {
    value = JSON.parse(await readFile(REPOSITORY_PUBLIC_SOURCE_INVENTORY_PATH, 'utf8'));
  } catch {
    throw new Error('Repository Washington public-source inventory is missing or invalid JSON.');
  }
  invariant(
    isRecord(value)
      && Array.isArray(value.counties)
      && value.counties.length === 39,
    'Repository Washington public-source inventory must contain all 39 counties.',
  );

  const sourceByCounty = new Map();
  const countyCodes = new Set();
  for (const entry of value.counties) {
    invariant(
      isRecord(entry)
        && isNonEmptyString(entry.county)
        && typeof entry.countyCode === 'string'
        && /^\d{3}$/.test(entry.countyCode)
        && isNonEmptyString(entry.officialAssessorBaseUrl)
        && isNonEmptyString(entry.acquisitionFamily)
        && (entry.status === 'adapter-ready' || entry.status === 'researched'),
      'Repository Washington public-source inventory contains an invalid county source.',
    );
    const countyKey = normalizeCountyName(entry.county);
    invariant(
      !sourceByCounty.has(countyKey),
      `Repository Washington public-source inventory duplicates ${entry.county}.`,
    );
    invariant(
      !countyCodes.has(entry.countyCode),
      `Repository Washington public-source inventory duplicates county code ${entry.countyCode}.`,
    );
    countyCodes.add(entry.countyCode);
    sourceByCounty.set(countyKey, {
      countyCode: entry.countyCode,
      officialSourceUrl: parseOfficialSourceUrl(entry.officialAssessorBaseUrl),
    });
  }
  return sourceByCounty;
}

export function bindAttestedOfficialSourceToRepository(
  attestedOfficialSource,
  countyName,
  countyCode,
  repositorySourceByCounty,
) {
  const repositorySource = repositorySourceByCounty.get(normalizeCountyName(countyName));
  invariant(
    repositorySource?.officialSourceUrl instanceof URL
      && repositorySource.countyCode === countyCode,
    `Repository public-source inventory is missing ${countyName} County.`,
  );
  const attestedSource = parseOfficialSourceUrl(attestedOfficialSource);
  invariant(
    attestedSource.origin === repositorySource.officialSourceUrl.origin,
    `Attested official source origin is inconsistent with the repository inventory for ${countyName} County.`,
  );
  return repositorySource.officialSourceUrl;
}

export function requireAttestedSourcePosture(
  attestedSourcePosture,
  statusSourcePosture,
  countyCode,
) {
  const normalizedPosture = normalize(attestedSourcePosture);
  invariant(
    normalizedPosture.length > 0
      && normalizedPosture === normalize(statusSourcePosture)
      && normalizedPosture !== 'unavailable'
      && !SYNTHETIC_MARKERS.has(normalizedPosture),
    `Attested source posture is inconsistent for ${countyCode}.`,
  );
  return normalizedPosture;
}

function sourceUrlMatchesOfficial(rawValue, officialUrl) {
  if (!isNonEmptyString(rawValue)) return false;
  let sourceUrl;
  try {
    sourceUrl = new URL(rawValue);
  } catch {
    return false;
  }
  if (
    sourceUrl.protocol !== 'https:'
    || sourceUrl.username !== ''
    || sourceUrl.password !== ''
    || (sourceUrl.port !== '' && sourceUrl.port !== '443')
  ) {
    return false;
  }
  const officialHostname = officialUrl.hostname.toLowerCase().replace(/^www\./, '');
  const sourceHostname = sourceUrl.hostname.toLowerCase().replace(/^www\./, '');
  return sourceHostname === officialHostname
    || sourceHostname.endsWith(`.${officialHostname}`);
}

async function fetchJson(url, maxBytes, label) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
      redirect: 'error',
      signal: controller.signal,
    });
    invariant(response.ok, `${label} is unavailable (HTTP ${response.status}).`);
    invariant(response.body !== null, `${label} returned no response body.`);

    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength)) {
      invariant(declaredLength <= maxBytes, `${label} exceeds its maximum allowed size.`);
    }

    const chunks = [];
    let receivedBytes = 0;
    for await (const chunk of response.body) {
      const bytes = Buffer.from(chunk);
      receivedBytes += bytes.byteLength;
      invariant(receivedBytes <= maxBytes, `${label} exceeds its maximum allowed size.`);
      chunks.push(bytes);
    }
    const body = Buffer.concat(chunks);
    let text;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(body);
    } catch {
      throw new Error(`${label} is not valid UTF-8 JSON.`);
    }
    try {
      return { body, value: JSON.parse(text) };
    } catch {
      throw new Error(`${label} is not valid JSON.`);
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`${label} did not complete within ${FETCH_TIMEOUT_MS} ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function packageUrlForRoute(packageRoot, route) {
  const match = SALES_ROUTE_PATTERN.exec(route);
  invariant(match !== null, `Shard route is outside ${PACKAGE_PATH}: ${String(route)}`);
  return {
    countyCode: match[1],
    relativePath: route.slice(`${PACKAGE_PATH}/`.length),
    url: new URL(route, packageRoot.origin),
  };
}

function packageUrlForCountyDetailRoute(packageRoot, route) {
  const match = COUNTY_DETAIL_ROUTE_PATTERN.exec(route);
  invariant(match !== null, `County detail route is outside ${PACKAGE_PATH}: ${String(route)}`);
  return {
    countyCode: match[1],
    relativePath: route.slice(`${PACKAGE_PATH}/`.length),
    url: new URL(route, packageRoot.origin),
  };
}

async function ensureAbsent(path) {
  try {
    await lstat(path);
  } catch (error) {
    if (error && error.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`Washington launch package output already exists: ${path}`);
}

async function writePackageFile(outputRoot, relativePath, body) {
  const target = resolve(outputRoot, relativePath);
  invariant(
    target.startsWith(`${outputRoot}${sep}`),
    `Refusing to write outside Washington package output: ${relativePath}`,
  );
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, body, { flag: 'wx', mode: 0o644 });
}

async function main() {
  const [sourceValue, expectedManifestSha256, outputValue] = process.argv.slice(2);
  invariant(
    sourceValue && expectedManifestSha256 && outputValue,
    'Usage: package_washington_launch_data.mjs <public-package-root> <manifest-sha256> <output-directory>',
  );
  invariant(
    SHA256_PATTERN.test(expectedManifestSha256),
    'Washington launch manifest pin must be a lowercase SHA-256 digest.',
  );

  const packageRoot = parsePublicPackageRoot(sourceValue);
  const outputRoot = resolve(outputValue);
  await ensureAbsent(outputRoot);
  const repositorySourceByCounty = await readRepositoryPublicSourceInventory();

  const manifestDocument = await fetchJson(
    new URL('manifest.json', packageRoot),
    MAX_MANIFEST_BYTES,
    'Washington launch manifest',
  );
  const manifest = manifestDocument.value;
  invariant(isRecord(manifest), 'Washington launch manifest must be a JSON object.');
  invariant(manifest.schemaVersion === MANIFEST_SCHEMA, 'Washington launch manifest schema is invalid.');
  invariant(
    canonicalJsonSha256(manifest) === expectedManifestSha256,
    'Washington launch manifest does not match the production trust pin.',
  );
  invariant(
    manifest.statusSchemaVersion === STATUS_SCHEMA
      && SHA256_PATTERN.test(manifest.statusCanonicalJsonSha256),
    'Washington launch manifest does not attest the complete county status document.',
  );
  invariant(
    Array.isArray(manifest.salesShardAttestations)
      && manifest.salesShardAttestations.length > 0
      && manifest.salesShardAttestations.length <= 39,
    'Washington launch manifest must attest between one and 39 county sales shards.',
  );

  const statusDocument = await fetchJson(
    new URL('counties/status.json', packageRoot),
    MAX_STATUS_BYTES,
    'Washington county status',
  );
  const status = statusDocument.value;
  invariant(isRecord(status), 'Washington county status must be a JSON object.');
  invariant(status.schemaVersion === STATUS_SCHEMA, 'Washington county status schema is invalid.');
  invariant(
    canonicalJsonSha256(status) === manifest.statusCanonicalJsonSha256,
    'Washington county status does not match its manifest attestation.',
  );
  invariant(status.generatedAt === manifest.generatedAt, 'Washington package generation identity is inconsistent.');
  invariant(
    normalize(status.sourcePosture) === normalize(manifest.sourcePosture),
    'Washington package source posture is inconsistent.',
  );
  invariant(
    Array.isArray(status.counties) && status.counties.length > 0 && status.counties.length <= 39,
    'Washington county status must contain between one and 39 county entries.',
  );

  const statusByCountyCode = new Map();
  for (const county of status.counties) {
    assertRuntimeCompatibleCountyStatusEntry(county, repositorySourceByCounty);
    invariant(!statusByCountyCode.has(county.countyCode), `Duplicate county status: ${county.countyCode}`);
    statusByCountyCode.set(county.countyCode, county);
  }

  await mkdir(outputRoot, { recursive: false });
  await writePackageFile(outputRoot, 'manifest.json', manifestDocument.body);
  await writePackageFile(outputRoot, 'counties/status.json', statusDocument.body);

  let packagedCountyDetailCount = 0;
  for (const countyStatus of status.counties) {
    if (!countyStatus.staticRoutes.detail) continue;

    const detailRoute = packageUrlForCountyDetailRoute(
      packageRoot,
      countyStatus.staticRoutes.detail,
    );
    invariant(
      detailRoute.countyCode === countyStatus.countyCode,
      `Washington county detail route identity is invalid: ${detailRoute.countyCode}`,
    );
    const detailDocument = await fetchJson(
      detailRoute.url,
      MAX_COUNTY_DETAIL_BYTES,
      `Washington county ${detailRoute.countyCode} detail`,
    );
    assertRuntimeCompatibleCountyDetail(
      detailDocument.value,
      countyStatus,
      status.generatedAt,
    );
    await writePackageFile(outputRoot, detailRoute.relativePath, detailDocument.body);
    packagedCountyDetailCount += 1;
  }

  const attestedCountyCodes = new Set();
  let attestedRecordCount = 0;
  for (const attestation of manifest.salesShardAttestations) {
    invariant(isRecord(attestation), 'Washington sales shard attestation must be a JSON object.');
    invariant(attestation.algorithm === 'SHA-256', 'Washington sales shard attestation algorithm is invalid.');
    invariant(
      SHA256_PATTERN.test(attestation.canonicalJsonSha256),
      'Washington sales shard attestation digest is invalid.',
    );
    const route = packageUrlForRoute(packageRoot, attestation.route);
    invariant(
      attestation.countyCode === route.countyCode
        && !attestedCountyCodes.has(route.countyCode),
      `Washington sales shard attestation identity is invalid: ${route.countyCode}`,
    );
    attestedCountyCodes.add(route.countyCode);

    const countyStatus = statusByCountyCode.get(route.countyCode);
    invariant(countyStatus, `Attested county ${route.countyCode} is absent from status.`);
    invariant(
      normalizeCountyName(attestation.county) === normalizeCountyName(countyStatus.county),
      `Attested county name is inconsistent for ${route.countyCode}.`,
    );
    invariant(
      countyStatus.staticRoutes.salesShard === attestation.route,
      `Attested sales route is inconsistent for ${route.countyCode}.`,
    );
    const attestedSourcePosture = requireAttestedSourcePosture(
      attestation.sourcePosture,
      countyStatus.primarySourceMode,
      route.countyCode,
    );
    const officialSourceUrl = bindAttestedOfficialSourceToRepository(
      attestation.officialSourceBaseUrl,
      countyStatus.county,
      route.countyCode,
      repositorySourceByCounty,
    );
    invariant(
      Array.isArray(attestation.sourcePayloadSha256)
        && attestation.sourcePayloadSha256.every((digest) => SHA256_PATTERN.test(digest)),
      `Attested source payload digests are invalid for ${route.countyCode}.`,
    );
    const sourcePayloadDigests = new Set(attestation.sourcePayloadSha256);

    const shardDocument = await fetchJson(
      route.url,
      MAX_SHARD_BYTES,
      `Washington county ${route.countyCode} sales shard`,
    );
    const shard = shardDocument.value;
    invariant(isRecord(shard), `Washington county ${route.countyCode} shard must be a JSON object.`);
    invariant(
      canonicalJsonSha256(shard) === attestation.canonicalJsonSha256,
      `Washington county ${route.countyCode} shard does not match its manifest attestation.`,
    );
    assertRuntimeCompatibleCountyShard(
      shard,
      route.countyCode,
      countyStatus.county,
    );

    for (const record of shard.records) {
      invariant(
        isRecord(record)
          && record.countyCode === route.countyCode
          && normalizeCountyName(record.county) === normalizeCountyName(countyStatus.county)
          && normalize(record.sourceMode) === attestedSourcePosture
          && isNonEmptyString(record.candidateSource)
          && !SYNTHETIC_MARKERS.has(normalize(record.sourceMode))
          && !SYNTHETIC_MARKERS.has(normalize(record.candidateSource))
          && isRecord(record.provenance),
        `Washington county ${route.countyCode} shard contains invalid or synthetic provenance.`,
      );
      const provenance = record.provenance;
      const sourceUrlIsOfficial = sourceUrlMatchesOfficial(provenance.sourceUrl, officialSourceUrl);
      const sourceFinalUrlIsOfficial = sourceUrlMatchesOfficial(
        provenance.sourceFinalUrl,
        officialSourceUrl,
      );
      invariant(
        (sourceUrlIsOfficial || sourceFinalUrlIsOfficial)
          && (provenance.sourceUrl === null || sourceUrlIsOfficial)
          && (provenance.sourceFinalUrl === null || sourceFinalUrlIsOfficial)
          && isNonEmptyString(provenance.sourcePayloadPath)
          && sourcePayloadDigests.has(provenance.sourcePayloadSha256)
          && isNonEmptyString(provenance.candidateIndexSource)
          && isNonEmptyString(provenance.candidateRecordType)
          && !SYNTHETIC_MARKERS.has(normalize(provenance.candidateRecordType)),
        `Washington county ${route.countyCode} record provenance is not bound to its official source attestation.`,
      );
    }

    attestedRecordCount += shard.records.length;
    await writePackageFile(outputRoot, route.relativePath, shardDocument.body);
  }

  invariant(
    attestedRecordCount > 0,
    'Washington launch package must contain at least one authenticated public sales record.',
  );
  console.log(
    `Packaged ${attestedRecordCount} authenticated Washington public sales records across ${attestedCountyCodes.size} counties with ${packagedCountyDetailCount} advertised county detail files.`,
  );
}

if (
  process.argv[1]
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}

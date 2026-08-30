#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { lstat, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

const MANIFEST_SCHEMA = 'terrafusion.washington.launch-manifest.v1';
const STATUS_SCHEMA = 'terrafusion.washington.county-status.v1';
const PACKAGE_PATH = '/launch-data/washington';
const SALES_ROUTE_PATTERN = /^\/launch-data\/washington\/sales\/by-county\/(\d{3})\.json$/;
const SHA256_PATTERN = /^[a-f\d]{64}$/;
const FETCH_TIMEOUT_MS = 120_000;
const MAX_MANIFEST_BYTES = 5 * 1024 * 1024;
const MAX_STATUS_BYTES = 20 * 1024 * 1024;
const MAX_SHARD_BYTES = 512 * 1024 * 1024;
const SYNTHETIC_MARKERS = new Set([
  'repository_reference_demo',
  'synthetic_reference',
]);

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
    invariant(
      isRecord(county)
        && /^\d{3}$/.test(county.countyCode)
        && isNonEmptyString(county.county)
        && isNonEmptyString(county.primarySourceMode)
        && isRecord(county.staticRoutes),
      'Washington county status contains an invalid county entry.',
    );
    invariant(!statusByCountyCode.has(county.countyCode), `Duplicate county status: ${county.countyCode}`);
    statusByCountyCode.set(county.countyCode, county);
  }

  await mkdir(outputRoot, { recursive: false });
  await writePackageFile(outputRoot, 'manifest.json', manifestDocument.body);
  await writePackageFile(outputRoot, 'counties/status.json', statusDocument.body);

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
    const attestedSourcePosture = normalize(attestation.sourcePosture);
    invariant(
      attestedSourcePosture === normalize(countyStatus.primarySourceMode)
        && attestedSourcePosture !== 'unavailable'
        && !SYNTHETIC_MARKERS.has(attestedSourcePosture),
      `Attested source posture is inconsistent for ${route.countyCode}.`,
    );
    const officialSourceUrl = parseOfficialSourceUrl(attestation.officialSourceBaseUrl);
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
    invariant(
      shard.countyCode === route.countyCode
        && normalizeCountyName(shard.county) === normalizeCountyName(countyStatus.county)
        && Array.isArray(shard.records)
        && isRecord(shard.summary)
        && shard.summary.records === shard.records.length,
      `Washington county ${route.countyCode} shard identity or record summary is invalid.`,
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
    `Packaged ${attestedRecordCount} authenticated Washington public sales records across ${attestedCountyCodes.size} counties.`,
  );
}

await main();

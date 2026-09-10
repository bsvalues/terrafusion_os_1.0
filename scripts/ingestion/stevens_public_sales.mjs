#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const COUNTY = 'Stevens';
const CODE = '065';
const OFFICIAL = 'https://stevenscountywa.gov';
const MODE = 'public_assessor_propertyaccess_sale_search_current_year';
const SEARCH = 'https://propertysearch.trueautomation.com/PropertyAccess/SaleSearch.aspx?cid=0';
const RESULTS = 'https://propertysearch.trueautomation.com/PropertyAccess/SearchResultsSales.aspx?cid=0';
const PAYLOAD = 'stevens-propertyaccess-sale-search-2026-sanitized.json';
const GENERATED_AT = process.argv[2] ?? new Date().toISOString();
const ROOT = process.argv[3] ?? 'frontend/apps/os-shell/public/launch-data/washington';
const START = '01/01/2026';
const END = '09/10/2026';

function inv(condition, message) {
  if (!condition) throw new Error(message);
}
function rec(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function canon(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    const serialized = JSON.stringify(value);
    if (serialized !== undefined) return serialized;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canon).join(',')}]`;
  if (rec(value)) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canon(value[key])}`).join(',')}}`;
  }
  throw new Error('non-json value');
}
function sha(value) {
  return createHash('sha256').update(canon(value)).digest('hex');
}
function entity(value) {
  return String(value ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8211;/g, 'â€“')
    .replace(/&#8217;/g, 'â€™')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}
function strip(html) {
  return entity(String(html).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' '));
}
function hidden(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<input[^>]+name=["']${escaped}["'][^>]*>`, 'i'))?.[0];
  return match?.match(/value=["']([^"']*)["']/i)?.[1]?.replace(/&quot;/g, '"').replace(/&amp;/g, '&') ?? '';
}
function date(value) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value ?? '').trim());
  inv(match, `bad Stevens date ${value}`);
  return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
}
function money(value) {
  const number = Number(String(value ?? '').replace(/[$,\s]/g, ''));
  return Number.isFinite(number) && number > 0 ? number : null;
}
async function fetchHtml(url, cookie) {
  const response = await fetch(url, { headers: { cookie, accept: 'text/html' }, redirect: 'manual' });
  inv(response.ok, `GET ${url} HTTP ${response.status}`);
  return await response.text();
}
function parseRows(html, page) {
  const rows = [];
  for (const match of html.matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
    const cells = [...match[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(cell => strip(cell[1]));
    if (cells.length !== 17 || !/\d{1,2}\/\d{1,2}\/\d{4}/.test(cells[11] ?? '') || !/\$/.test(cells[12] ?? '')) continue;
    const parcelNumber = cells[4] || cells[3] || null;
    const saleDate = date(cells[11]);
    const salePrice = money(cells[12]);
    const documentNumber = cells[14] || cells[13] || cells[2] || null;
    const situsAddress = cells[8] || null;
    const useCode = cells[7] || null;
    if (!parcelNumber || salePrice === null) continue;
    rows.push({ page, parcelNumber, saleDate, documentNumber, situsAddress, useCode, salePrice });
  }
  return rows;
}
async function fetchSales() {
  const first = await fetch(SEARCH, { headers: { accept: 'text/html' }, redirect: 'manual' });
  inv(first.ok, `search HTTP ${first.status}`);
  const cookie = (first.headers.get('set-cookie') ?? '').split(';')[0];
  inv(cookie, 'missing Stevens session cookie');
  const html = await first.text();
  const body = new URLSearchParams();
  for (const name of ['__VIEWSTATE', '__VIEWSTATEGENERATOR', '__EVENTVALIDATION']) body.set(name, hidden(html, name));
  body.set('saleSearchOptions$price_range_from', '1');
  body.set('saleSearchOptions$saleDateBegin', START);
  body.set('saleSearchOptions$saleDateEnd', END);
  body.set('saleSearchOptions$search', 'Search');
  const post = await fetch(SEARCH, {
    method: 'POST',
    headers: { cookie, referer: SEARCH, 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' },
    body,
    redirect: 'manual',
  });
  inv(post.status === 302, `Stevens search POST expected 302 got ${post.status}`);
  const result1 = new URL(post.headers.get('location') ?? '', SEARCH).href;
  const firstResult = await fetchHtml(result1, cookie);
  const count = Number(strip(firstResult).match(/1\s*-\s*25\s*of\s*([\d,]+)/i)?.[1]?.replace(/,/g, ''));
  inv(Number.isInteger(count) && count > 0, 'missing Stevens result count');
  const pages = Math.ceil(count / 25);
  const rows = [];
  for (let page = 1; page <= pages; page++) {
    const pageHtml = page === 1 ? firstResult : await fetchHtml(`${RESULTS}&rtype=address&page=${page}`, cookie);
    const pageRows = parseRows(pageHtml, page);
    const expected = page === pages ? count - (pages - 1) * 25 : 25;
    inv(pageRows.length === expected, `Stevens page ${page} row count ${pageRows.length} != ${expected}`);
    rows.push(...pageRows);
  }
  inv(rows.length === count, `Stevens parsed row count ${rows.length} != advertised ${count}`);
  return { count, rows, search: { url: SEARCH, resultUrl: RESULTS, start: START, end: END, pages } };
}
function mapRecord(row, ordinal, payloadHash, generatedDate) {
  if (row.saleDate > generatedDate) return null;
  const identity = [CODE, row.parcelNumber, row.documentNumber, row.saleDate, row.salePrice, row.useCode, ordinal].map(value => String(value ?? '').trim()).join('|');
  const candidateIndexSource = `${PAYLOAD}#page:${row.page}:parcel:${row.parcelNumber}:document:${row.documentNumber ?? 'unknown'}:ordinal:${ordinal}`;
  return {
    saleId: `WA-${CODE}-${createHash('sha256').update(identity).digest('hex').slice(0, 32)}`,
    county: COUNTY,
    countyCode: CODE,
    parcelNumber: row.parcelNumber,
    saleDate: row.saleDate,
    saleYear: Number(row.saleDate.slice(0, 4)),
    salePrice: row.salePrice,
    adjustedSalePrice: null,
    documentNumber: row.documentNumber,
    deedType: null,
    situsAddress: row.situsAddress,
    situsCity: null,
    situsZip: null,
    useCode: row.useCode,
    acres: null,
    grantor: null,
    grantee: null,
    saleNote: null,
    neighborhoodCode: null,
    currentNeighborhoodCode: null,
    sourceMode: MODE,
    candidateSource: 'stevens-official-propertyaccess-sale-search-current-year',
    confidenceScore: 0.95,
    qualityScore: 0.95,
    qualityBand: 'official_assessor_sale_search_public_record',
    reviewStatus: 'ready',
    grossLivingArea: null,
    lotSizeSqft: null,
    yearBuilt: null,
    bedrooms: null,
    bathrooms: null,
    condition: null,
    qualityGrade: null,
    provenance: {
      sourceUrl: SEARCH,
      sourceFinalUrl: RESULTS,
      sourcePayloadPath: PAYLOAD,
      sourcePayloadSha256: payloadHash,
      candidateIndexSource,
      candidateRecordType: 'official-propertyaccess-sale-search-row',
      candidateSourceOrdinal: ordinal,
      componentRows: [{ sourceKey: 'sale-search-row', sourceUrl: SEARCH, sourcePayloadPath: PAYLOAD, sourcePayloadSha256: payloadHash, candidateIndexSource }],
    },
    flags: { duplicateRisk: false, needsReview: false, futureSaleDate: false, manualException: false },
  };
}
async function rj(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}
async function wj(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value)}\n`, 'utf8');
}
function gen(value, generatedAt) {
  if (Array.isArray(value)) return value.map(item => gen(item, generatedAt));
  if (rec(value)) {
    const next = {};
    for (const [key, item] of Object.entries(value)) next[key] = key === 'generatedAt' ? generatedAt : gen(item, generatedAt);
    return next;
  }
  return value;
}
async function main() {
  inv(new Date(GENERATED_AT).toISOString() === GENERATED_AT, 'bad generatedAt');
  const generatedDate = GENERATED_AT.slice(0, 10);
  const payload = await fetchSales();
  const sanitized = { search: payload.search, count: payload.count, rows: payload.rows };
  const payloadHash = sha(sanitized);
  const records = payload.rows.map((row, index) => mapRecord(row, index + 1, payloadHash, generatedDate)).filter(Boolean).sort((left, right) => right.saleDate.localeCompare(left.saleDate) || left.saleId.localeCompare(right.saleId));
  inv(records.length === payload.count, 'Stevens record filter changed row count');
  inv(new Set(records.map(record => record.saleId)).size === records.length, 'duplicate Stevens sale IDs');
  const review = 0;
  const latest = records[0].saleDate;
  const salesRoute = `/launch-data/washington/sales/by-county/${CODE}.json`;
  const detailRoute = `/launch-data/washington/counties/${CODE}.json`;
  const shard = { schemaVersion: 'terrafusion.washington.sales-shard.v1', generatedAt: GENERATED_AT, county: COUNTY, countyCode: CODE, summary: { records: records.length, latestSaleDate: latest, reviewRecords: review, recordsWithNeighborhoodCode: 0, topNeighborhoodCodes: {} }, records };
  const detail = { schemaVersion: 'terrafusion.washington.county-detail.v1', generatedAt: GENERATED_AT, county: COUNTY, countyCode: CODE, operationalState: { primarySourceMode: MODE, prometheusStatus: 'public_data_ready' }, summary: { records: records.length, latestSaleDate: latest }, salesRoute };
  const statusEntry = { county: COUNTY, countyCode: CODE, priority: 'washington_assessor_launch', prometheusStatus: 'public_data_ready', primarySourceMode: MODE, latestSaleDate: latest, candidateSales: payload.count, stagedSales: records.length, needsReview: review, confidence: { averageQualityScore: 0.95, parserStatus: 'ready', rawStatus: 'official_propertyaccess_sale_search_verified', rawDriftDetected: false }, staticRoutes: { detail: detailRoute, salesShard: salesRoute } };
  const attestation = { algorithm: 'SHA-256', canonicalJsonSha256: sha(shard), county: COUNTY, countyCode: CODE, officialSourceBaseUrl: OFFICIAL, route: salesRoute, sourcePayloadSha256: [payloadHash], sourcePosture: MODE };
  const manifestPath = join(ROOT, 'manifest.json');
  const statusPath = join(ROOT, 'counties', 'status.json');
  const manifest = gen(await rj(manifestPath), GENERATED_AT);
  const status = gen(await rj(statusPath), GENERATED_AT);
  const keptAttestations = manifest.salesShardAttestations.filter(item => item.countyCode !== CODE);
  const keptStatus = status.counties.filter(item => item.countyCode !== CODE);
  const shards = new Map([[CODE, shard]]);
  for (const item of keptAttestations) {
    const salesPath = join(ROOT, 'sales', 'by-county', `${item.countyCode}.json`);
    const detailPath = join(ROOT, 'counties', `${item.countyCode}.json`);
    const existingShard = gen(await rj(salesPath), GENERATED_AT);
    const existingDetail = gen(await rj(detailPath), GENERATED_AT);
    await wj(salesPath, existingShard);
    await wj(detailPath, existingDetail);
    item.canonicalJsonSha256 = sha(existingShard);
    shards.set(item.countyCode, existingShard);
  }
  status.generatedAt = GENERATED_AT;
  status.sourcePosture = 'mixed_public_assessor_sources';
  status.counties = [...keptStatus, statusEntry].sort((a, b) => a.countyCode.localeCompare(b.countyCode));
  manifest.generatedAt = GENERATED_AT;
  manifest.sourcePosture = status.sourcePosture;
  manifest.statusCanonicalJsonSha256 = sha(status);
  manifest.salesShardAttestations = [...keptAttestations, attestation].sort((a, b) => a.countyCode.localeCompare(b.countyCode));
  manifest.summary = {
    counties: status.counties.length,
    rawLanded: status.counties.length,
    parserReady: status.counties.filter(item => item.confidence?.parserStatus === 'ready').length,
    candidateSales: status.counties.reduce((total, item) => total + item.candidateSales, 0),
    stagedSales: status.counties.reduce((total, item) => total + item.stagedSales, 0),
    needsReview: status.counties.reduce((total, item) => total + item.needsReview, 0),
    prometheusNeedsReview: status.counties.filter(item => item.prometheusStatus === 'needs_review').length,
    recordsWithNeighborhoodCode: [...shards.values()].reduce((total, item) => total + item.summary.recordsWithNeighborhoodCode, 0),
    futureSaleDateRecords: [...shards.values()].reduce((total, item) => total + item.records.filter(record => record.flags?.futureSaleDate === true).length, 0),
    criticalContradictions: 0,
    garfieldExceptions: 0,
    bentonCityAsNeighborhoodRecords: 0,
  };
  await wj(join(ROOT, 'sales', 'by-county', `${CODE}.json`), shard);
  await wj(join(ROOT, 'counties', `${CODE}.json`), detail);
  await wj(statusPath, status);
  await wj(manifestPath, manifest);
  await wj(join(ROOT, 'receipts', 'stevens-source.json'), { schemaVersion: 'terrafusion.washington.public-source-receipt.v1', county: COUNTY, countyCode: CODE, generatedAt: GENERATED_AT, sourceUrl: SEARCH, sourceFinalUrl: RESULTS, sourcePayloadPath: PAYLOAD, sourcePayloadRecords: payload.count, sourcePayloadSha256: payloadHash, candidateSales: payload.count, stagedSales: records.length, quarantinedSales: payload.count - records.length, needsReview: review, searchWindow: { start: START, end: END }, pages: payload.search.pages, omittedFields: ['owner', 'grantor', 'grantee', 'buyer', 'seller', 'legalDescription', 'geometry', 'map'] });
  console.log(JSON.stringify({ county: COUNTY, countyCode: CODE, sourcePayloadSha256: payloadHash, candidateRecords: payload.count, stagedRecords: records.length, quarantinedRecords: payload.count - records.length, reviewRecords: review, latestSaleDate: latest, manifestCanonicalJsonSha256: sha(manifest) }, null, 2));
}
await main();

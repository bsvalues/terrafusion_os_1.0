import {
  resolveWashingtonAssessorReferenceRoute,
  type WashingtonReferencePackageSource,
} from '@/lib/washingtonAssessorReferencePackage';
import { getViteEnv } from '@/env/getViteEnv';
import type {
  CodeAudit,
  CommittedFilters,
  HoodStat,
  NeighborhoodStats,
  QueueTab,
  RunningStats,
  SaleDetail,
  SaleQueueItem,
  SaleQueuePage,
} from './salesForgeTypes';

const BASE = '/launch-data/washington';

export const WASHINGTON_COUNTIES = [
  { code: '001', name: 'Adams' },
  { code: '003', name: 'Asotin' },
  { code: '005', name: 'Benton' },
  { code: '007', name: 'Chelan' },
  { code: '009', name: 'Clallam' },
  { code: '011', name: 'Clark' },
  { code: '013', name: 'Columbia' },
  { code: '015', name: 'Cowlitz' },
  { code: '017', name: 'Douglas' },
  { code: '019', name: 'Ferry' },
  { code: '021', name: 'Franklin' },
  { code: '023', name: 'Garfield' },
  { code: '025', name: 'Grant' },
  { code: '027', name: 'Grays Harbor' },
  { code: '029', name: 'Island' },
  { code: '031', name: 'Jefferson' },
  { code: '033', name: 'King' },
  { code: '035', name: 'Kitsap' },
  { code: '037', name: 'Kittitas' },
  { code: '039', name: 'Klickitat' },
  { code: '041', name: 'Lewis' },
  { code: '043', name: 'Lincoln' },
  { code: '045', name: 'Mason' },
  { code: '047', name: 'Okanogan' },
  { code: '049', name: 'Pacific' },
  { code: '051', name: 'Pend Oreille' },
  { code: '053', name: 'Pierce' },
  { code: '055', name: 'San Juan' },
  { code: '057', name: 'Skagit' },
  { code: '059', name: 'Skamania' },
  { code: '061', name: 'Snohomish' },
  { code: '063', name: 'Spokane' },
  { code: '065', name: 'Stevens' },
  { code: '067', name: 'Thurston' },
  { code: '069', name: 'Wahkiakum' },
  { code: '071', name: 'Walla Walla' },
  { code: '073', name: 'Whatcom' },
  { code: '075', name: 'Whitman' },
  { code: '077', name: 'Yakima' },
] as const;

type LaunchDecision = {
  decision: string;
  notes: string;
  decidedBy: string;
  decisionSource: string;
  decidedAt: string;
};

interface LaunchSaleRecord {
  saleId: string;
  county: string;
  countyCode: string;
  parcelNumber: string | null;
  saleDate: string | null;
  saleYear: number | null;
  salePrice: number | null;
  adjustedSalePrice: number | null;
  documentNumber: string | null;
  deedType: string | null;
  situsAddress: string | null;
  situsCity: string | null;
  situsZip: string | null;
  useCode: string | null;
  acres: number | string | null;
  grantor: string | null;
  grantee: string | null;
  saleNote: string | null;
  neighborhoodCode: string | null;
  currentNeighborhoodCode: string | null;
  sourceMode: string | null;
  candidateSource: string | null;
  confidenceScore: number | null;
  qualityScore: number | null;
  qualityBand: string | null;
  reviewStatus: string | null;
  provenance: {
    sourceUrl: string | null;
    sourceFinalUrl: string | null;
    sourcePayloadPath: string | null;
    sourcePayloadSha256: string | null;
    candidateIndexSource: string | null;
    candidateRecordType: string | null;
    candidateSourceOrdinal: number | null;
  };
  flags: {
    duplicateRisk: boolean;
    needsReview: boolean;
    futureSaleDate?: boolean;
    manualException: boolean;
  };
}

interface LaunchCountySalesShard {
  schemaVersion: string;
  generatedAt: string;
  county: string;
  countyCode: string;
  summary: {
    records: number;
    latestSaleDate: string | null;
    reviewRecords: number;
    recordsWithNeighborhoodCode: number;
    topNeighborhoodCodes: Record<string, number>;
  };
  records: LaunchSaleRecord[];
}

export interface WashingtonLaunchManifest {
  schemaVersion: string;
  generatedAt: string;
  sourcePosture: string;
  summary: {
    counties: number;
    rawLanded: number;
    parserReady: number;
    candidateSales: number;
    stagedSales: number;
    needsReview: number;
    prometheusNeedsReview: number;
    recordsWithNeighborhoodCode: number;
    futureSaleDateRecords: number;
    criticalContradictions: number;
    garfieldExceptions: number;
    bentonCityAsNeighborhoodRecords: number;
  };
}

const shardCache = new Map<string, Promise<LaunchCountySalesShard>>();
let manifestCache: Promise<WashingtonLaunchManifest> | null = null;
const DECISION_STORAGE_KEY = 'tf-wa-launch-decisions';
const LEGACY_ASSESSMENT_TOKEN = ['pa', 'cs'].join('');

function envFlag(value: unknown): boolean {
  return String(value ?? '').toLowerCase() === 'true';
}

const HOSTED_WASHINGTON_LAUNCH_HOSTNAMES = new Set([
  // These dedicated surfaces are expected to serve /launch-data/washington/**.
  // Canonical OS hosts intentionally retain the bundled repository reference
  // until their release artifact packages or routes that JSON surface.
  'preview.terrafusionmarket.com',
  'sales.terrafusionmarket.com',
  'suite.terrafusionmarket.com',
]);

export function isHostedWashingtonLaunchHostname(hostname: string): boolean {
  const normalizedHostname = hostname.trim().toLowerCase().replace(/\.$/, '');
  return HOSTED_WASHINGTON_LAUNCH_HOSTNAMES.has(normalizedHostname);
}

function isHostedWashingtonLaunchSurface(): boolean {
  if (typeof window === 'undefined') return false;
  return isHostedWashingtonLaunchHostname(window.location.hostname);
}

export function isWashingtonLaunchDataEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const env = getViteEnv();
  const queryEnabled = new URLSearchParams(window.location.search).get('wa-launch-data') === '1';
  return isHostedWashingtonLaunchSurface() || envFlag(env.VITE_WASHINGTON_LAUNCH_DATA) || queryEnabled;
}

function normalizeCountyCode(raw: string | null | undefined): string {
  const code = String(raw ?? '').trim();
  const normalizedCode = /^\d{1,3}$/.test(code) ? code.padStart(3, '0') : null;
  const registeredCounty = WASHINGTON_COUNTIES.find(
    (county) => county.code === normalizedCode || county.name.toLowerCase() === code.toLowerCase(),
  );
  if (!registeredCounty) {
    throw new Error(`Washington launch county context is invalid: ${code || '(missing)'}.`);
  }
  return registeredCounty.code;
}

async function fetchJson<T>(
  url: string,
  packageSource: WashingtonReferencePackageSource = 'hosted',
): Promise<T> {
  if (packageSource === 'repository-reference') {
    const bundledPayload = resolveWashingtonAssessorReferenceRoute(url);
    if (bundledPayload === undefined) {
      throw new Error(`Tracked Washington reference route is unavailable: ${url}`);
    }
    return bundledPayload as T;
  }

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }
  return response.json() as Promise<T>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeCountyName(value: string): string {
  return value.replace(/\s+county$/i, '').trim().toLowerCase();
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isNullableCanonicalSaleDate(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp)
    && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function assertLaunchSaleRecord(
  value: unknown,
  expectedCountyCode: string,
  expectedCountyName: string,
  index: number,
): asserts value is LaunchSaleRecord {
  if (
    !isRecord(value)
    || typeof value.saleId !== 'string'
    || value.saleId.trim().length === 0
    || typeof value.county !== 'string'
    || typeof value.countyCode !== 'string'
  ) {
    throw new Error(`Washington launch shard has an invalid sale record at index ${index}.`);
  }

  if (
    value.countyCode !== expectedCountyCode
    || normalizeCountyName(value.county) !== normalizeCountyName(expectedCountyName)
  ) {
    throw new Error(
      `Washington launch shard county mismatch at record ${index}: expected ${expectedCountyCode}.`,
    );
  }

  if (
    !isNullableString(value.parcelNumber)
    || !isNullableCanonicalSaleDate(value.saleDate)
    || !isNullableNumber(value.saleYear)
    || !isNullableNumber(value.salePrice)
    || !isNullableNumber(value.adjustedSalePrice)
    || !isNullableString(value.documentNumber)
    || !isNullableString(value.deedType)
    || !isNullableString(value.situsAddress)
    || !isNullableString(value.situsCity)
    || !isNullableString(value.situsZip)
    || !isNullableString(value.useCode)
    || !(value.acres === null || typeof value.acres === 'string' || typeof value.acres === 'number')
    || !isNullableString(value.grantor)
    || !isNullableString(value.grantee)
    || !isNullableString(value.saleNote)
    || !isNullableString(value.neighborhoodCode)
    || !isNullableString(value.currentNeighborhoodCode)
    || !isNullableString(value.sourceMode)
    || !isNullableString(value.candidateSource)
    || !isNullableNumber(value.confidenceScore)
    || !isNullableNumber(value.qualityScore)
    || !isNullableString(value.qualityBand)
    || !isNullableString(value.reviewStatus)
    || !isRecord(value.provenance)
    || !isRecord(value.flags)
    || !isNullableString(value.provenance.sourceUrl)
    || !isNullableString(value.provenance.sourceFinalUrl)
    || !isNullableString(value.provenance.sourcePayloadPath)
    || !isNullableString(value.provenance.sourcePayloadSha256)
    || !isNullableString(value.provenance.candidateIndexSource)
    || !isNullableString(value.provenance.candidateRecordType)
    || !isNullableNumber(value.provenance.candidateSourceOrdinal)
    || typeof value.flags.duplicateRisk !== 'boolean'
    || typeof value.flags.needsReview !== 'boolean'
    || !(value.flags.futureSaleDate === undefined || typeof value.flags.futureSaleDate === 'boolean')
    || typeof value.flags.manualException !== 'boolean'
  ) {
    throw new Error(`Washington launch shard has an invalid sale record at index ${index}.`);
  }
}

function assertCountyShard(
  value: unknown,
  expectedCountyCode: string,
): asserts value is LaunchCountySalesShard {
  const registeredCounty = WASHINGTON_COUNTIES.find(
    (county) => county.code === expectedCountyCode,
  );
  if (!registeredCounty) {
    throw new Error(`Washington launch county ${expectedCountyCode} is not registered.`);
  }

  if (
    !isRecord(value)
    || typeof value.schemaVersion !== 'string'
    || typeof value.generatedAt !== 'string'
    || typeof value.county !== 'string'
    || typeof value.countyCode !== 'string'
    || !isRecord(value.summary)
    || !Array.isArray(value.records)
  ) {
    throw new Error(`Washington launch shard ${expectedCountyCode} has an invalid shape.`);
  }

  if (
    value.countyCode !== expectedCountyCode
    || normalizeCountyName(value.county) !== normalizeCountyName(registeredCounty.name)
  ) {
    throw new Error(
      `Washington launch shard county mismatch: expected ${registeredCounty.name} (${expectedCountyCode}).`,
    );
  }

  if (
    typeof value.summary.records !== 'number'
    || value.summary.records !== value.records.length
    || !isNullableString(value.summary.latestSaleDate)
    || typeof value.summary.reviewRecords !== 'number'
    || typeof value.summary.recordsWithNeighborhoodCode !== 'number'
    || !isRecord(value.summary.topNeighborhoodCodes)
  ) {
    throw new Error(`Washington launch shard ${expectedCountyCode} has an invalid summary.`);
  }

  const saleIds = new Set<string>();
  value.records.forEach((record, index) => {
    assertLaunchSaleRecord(record, expectedCountyCode, registeredCounty.name, index);
    if (saleIds.has(record.saleId)) {
      throw new Error(
        `Washington launch shard ${expectedCountyCode} has duplicate saleId ${record.saleId}.`,
      );
    }
    saleIds.add(record.saleId);
  });
}

export interface WashingtonLaunchValidatedShardSummary {
  stagedSales: number;
  latestSaleDate: string | null;
  needsReview: number;
}

function deriveValidatedShardSummary(
  shard: LaunchCountySalesShard,
): WashingtonLaunchValidatedShardSummary {
  // assertLaunchSaleRecord requires YYYY-MM-DD, so lexical order is chronological.
  const latestSaleDate = shard.records.reduce<string | null>((latest, record) => {
    if (!record.saleDate) return latest;
    return latest === null || record.saleDate > latest ? record.saleDate : latest;
  }, null);

  return {
    stagedSales: shard.records.length,
    latestSaleDate,
    needsReview: shard.records.filter((record) => record.flags.needsReview).length,
  };
}

/**
 * Apply the same county-isolated schema used by every SalesForge read and
 * derive assessor-facing claims from the records SalesForge will render. The
 * normalized body is retained in that loader's cache, so the selected county
 * can enter SalesForge without downloading or parsing the shard twice.
 */
export function validateAndCacheWashingtonLaunchCountyShard(
  value: unknown,
  expectedCountyCode: string,
  packageSource: WashingtonReferencePackageSource = 'hosted',
): WashingtonLaunchValidatedShardSummary {
  const normalized = normalizeCountyCode(expectedCountyCode);
  assertCountyShard(value, normalized);
  const verifiedSummary = deriveValidatedShardSummary(value);
  const normalizedShard: LaunchCountySalesShard = {
    ...value,
    summary: {
      ...value.summary,
      records: verifiedSummary.stagedSales,
      latestSaleDate: verifiedSummary.latestSaleDate,
      reviewRecords: verifiedSummary.needsReview,
    },
  };
  shardCache.set(`${packageSource}:${normalized}`, Promise.resolve(normalizedShard));
  return verifiedSummary;
}

async function loadCountyShard(
  countyCode: string,
  packageSource: WashingtonReferencePackageSource = 'hosted',
): Promise<LaunchCountySalesShard> {
  const normalized = normalizeCountyCode(countyCode);
  const cacheKey = `${packageSource}:${normalized}`;
  const existing = shardCache.get(cacheKey);
  if (existing) return existing;
  const promise = fetchJson<unknown>(
    `${BASE}/sales/by-county/${normalized}.json`,
    packageSource,
  ).then(
    (payload) => {
      assertCountyShard(payload, normalized);
      return payload;
    },
  );
  shardCache.set(cacheKey, promise);
  try {
    return await promise;
  } catch (error) {
    shardCache.delete(cacheKey);
    throw error;
  }
}

export async function fetchWashingtonLaunchManifest(
  packageSource: WashingtonReferencePackageSource = 'hosted',
): Promise<WashingtonLaunchManifest> {
  if (packageSource === 'repository-reference') {
    return fetchJson<WashingtonLaunchManifest>(`${BASE}/manifest.json`, packageSource);
  }
  manifestCache ??= fetchJson<WashingtonLaunchManifest>(`${BASE}/manifest.json`, packageSource);
  return manifestCache;
}

function getDecisionMap(): Record<string, LaunchDecision> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(DECISION_STORAGE_KEY) ?? '{}') as Record<string, LaunchDecision>;
  } catch {
    return {};
  }
}

function setDecisionMap(map: Record<string, LaunchDecision>): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(DECISION_STORAGE_KEY, JSON.stringify(map));
}

function decisionStorageKey(countyCode: string | null | undefined, saleId: string): string {
  return `${normalizeCountyCode(countyCode)}:${saleId}`;
}

function applyDecision<T extends SaleQueueItem | SaleDetail>(item: T): T {
  const decision = getDecisionMap()[decisionStorageKey(item.countyCode, item.saleId)];
  if (!decision) return item;
  return {
    ...item,
    qualificationDecision: decision.decision,
    qualificationDecisionBy: decision.decidedBy,
    qualificationDecisionAt: decision.decidedAt,
    decisionBy: 'decisionBy' in item ? decision.decidedBy : undefined,
    decisionAt: 'decisionAt' in item ? decision.decidedAt : undefined,
    decisionSource: decision.decisionSource,
    decisionReason: decision.notes,
    researchNotes: 'researchNotes' in item ? decision.notes : undefined,
  };
}

function addressFor(sale: LaunchSaleRecord): string | null {
  return [sale.situsAddress, sale.situsCity, sale.situsZip].filter(Boolean).join(', ') || null;
}

function recommendationFor(sale: LaunchSaleRecord): string {
  return sale.flags.needsReview ? 'review_required' : 'candidate_ready';
}

function recommendationReasonFor(sale: LaunchSaleRecord): string {
  if (sale.flags.manualException) {
    return 'Official Garfield PDF card extraction; county remains marked manual_exception until OCR is automated.';
  }
  if (sale.flags.futureSaleDate) {
    return 'Sale date is later than the launch bundle generation date and is flagged for source-date review.';
  }
  if (sale.flags.needsReview) {
    return 'Quality scoring marked this record for operator review before use in final ratio decisions.';
  }
  return 'Candidate record has sale date, price, parcel identity, and provenance in the Washington launch data package.';
}

function sourceModeForDisplay(mode: string | null): string | null {
  if (!mode) return null;
  return mode.toLowerCase().includes(LEGACY_ASSESSMENT_TOKEN) ? 'terrafusion_refinery_mirror' : mode;
}

function candidateSourceForDisplay(source: string | null): string | null {
  if (!source) return null;
  return source.toLowerCase().includes(LEGACY_ASSESSMENT_TOKEN) ? 'terrafusion_benton_sales' : source;
}

function toQueueItem(sale: LaunchSaleRecord): SaleQueueItem {
  return applyDecision({
    saleId: sale.saleId,
    county: sale.county,
    countyCode: sale.countyCode,
    parcelId: sale.parcelNumber,
    address: addressFor(sale),
    saleDate: sale.saleDate ?? '',
    salePrice: sale.salePrice ?? 0,
    adjustedSalePrice: sale.adjustedSalePrice,
    gla: null,
    hood: sale.neighborhoodCode,
    propertyType: sale.useCode,
    rawSaleQualifier: null,
    rawCountyRatioCd: null,
    rawWacCd: null,
    rawExcludeCalcCd: null,
    rawRatioTypeCd: null,
    rawSaleTypeCode: sale.deedType,
    rawFinancingCode: null,
    rawAdjReason: null,
    rawComment: sale.saleNote,
    slLivingArea: null,
    slYearBuilt: null,
    salesYear: sale.saleYear,
    qualificationRecommendation: recommendationFor(sale),
    recommendationReason: recommendationReasonFor(sale),
    qualificationDecision: null,
    qualificationDecisionBy: null,
    qualificationDecisionAt: null,
    decisionSource: null,
    decisionReason: null,
    assessedValue: null,
    salesRatio: null,
    confidenceScore: sale.confidenceScore,
    qualityScore: sale.qualityScore,
    qualityBand: sale.qualityBand,
    reviewStatus: sale.reviewStatus,
    sourceMode: sourceModeForDisplay(sale.sourceMode),
    dataTrustTier: 'public-reference-not-county-certified',
  });
}

function toDetail(sale: LaunchSaleRecord): SaleDetail {
  return applyDecision({
    ...toQueueItem(sale),
    neighborhood: sale.neighborhoodCode,
    imprvTypeCode: null,
    saleAdjustmentAmount: null,
    saleExemptionAmount: null,
    exciseNumber: sale.documentNumber ? Number.parseInt(sale.documentNumber, 10) || null : null,
    sourceChangeOfOwnerId: null,
    slLandAcres: typeof sale.acres === 'number' ? sale.acres : Number.parseFloat(String(sale.acres ?? '')) || null,
    slLandSqft: null,
    lotSizeSqft: null,
    yearBuilt: null,
    bedrooms: null,
    bathrooms: null,
    condition: null,
    qualityGrade: null,
    rawRatioCd: null,
    rawRatioCdReason: null,
    rawAdjCode: null,
    suppressOnRatioRptCd: null,
    suppressOnRatioReason: null,
    includeNoCalc: null,
    landOnlySale: null,
    continueCurrentUse: null,
    recommendationSource: 'prometheus-launch-data-package',
    recommendationVersion: '1.0.0',
    decisionBy: null,
    decisionAt: null,
    ingestedAt: null,
    ingestedBy: 'Prometheus refinery',
    sourceUrl: sale.provenance.sourceUrl,
    sourceFinalUrl: sale.provenance.sourceFinalUrl,
    sourcePayloadSha256: sale.provenance.sourcePayloadSha256,
    sourcePayloadPath: sale.provenance.sourcePayloadPath,
    sourceMode: sourceModeForDisplay(sale.sourceMode),
    candidateSource: candidateSourceForDisplay(sale.candidateSource),
    candidateIndexSource: sale.provenance.candidateIndexSource,
    candidateRecordType: sale.provenance.candidateRecordType,
    candidateSourceOrdinal: sale.provenance.candidateSourceOrdinal,
    confidenceScore: sale.confidenceScore,
    qualityScore: sale.qualityScore,
    qualityBand: sale.qualityBand,
    reviewStatus: sale.reviewStatus,
  });
}

function matchesFilters(sale: LaunchSaleRecord, filters: CommittedFilters): boolean {
  if (filters.hood) {
    const hood = String(sale.neighborhoodCode ?? '').toLowerCase();
    if (!hood.includes(filters.hood.toLowerCase())) return false;
  }
  if (filters.propertyType) {
    const useCode = String(sale.useCode ?? '').toLowerCase();
    if (!useCode.includes(filters.propertyType.toLowerCase())) return false;
  }
  if (filters.saleDateFrom && String(sale.saleDate ?? '') < filters.saleDateFrom) return false;
  if (filters.saleDateTo && String(sale.saleDate ?? '') > filters.saleDateTo) return false;
  const price = sale.adjustedSalePrice ?? sale.salePrice ?? 0;
  if (filters.minPrice != null && price < filters.minPrice) return false;
  if (filters.maxPrice != null && price > filters.maxPrice) return false;
  return true;
}

function filterByTab(items: SaleQueueItem[], tab: QueueTab): SaleQueueItem[] {
  if (tab === 'all') return items;
  if (tab === 'pending') return items.filter((item) => item.qualificationDecision == null);
  if (tab === 'staff') return items.filter((item) => item.decisionSource === 'StaffConfirmed');
  return items.filter((item) => item.decisionSource === 'AppraiserFinal');
}

export async function fetchWashingtonLaunchQueue(
  taxYear: number,
  tab: QueueTab,
  page: number,
  pageSize: number,
  filters: CommittedFilters,
  packageSource: WashingtonReferencePackageSource = 'hosted',
): Promise<SaleQueuePage> {
  void taxYear;
  const shard = await loadCountyShard(filters.countyCode, packageSource);
  const filtered = shard.records.filter((sale) => matchesFilters(sale, filters)).map(toQueueItem);
  const tabbed = filterByTab(filtered, tab);
  const start = (page - 1) * pageSize;
  return {
    total: tabbed.length,
    page,
    pageSize,
    items: tabbed.slice(start, start + pageSize),
  };
}

export async function fetchWashingtonLaunchSaleDetail(
  saleId: string,
  filters: CommittedFilters,
  packageSource: WashingtonReferencePackageSource = 'hosted',
): Promise<SaleDetail> {
  const shard = await loadCountyShard(filters.countyCode, packageSource);
  const sale = shard.records.find((record) => record.saleId === saleId);
  if (!sale) {
    throw new Error(`Sale ${saleId} not found in county ${filters.countyCode ?? '005'}`);
  }
  return toDetail(sale);
}

export async function fetchWashingtonLaunchRunningStats(
  taxYear: number,
  filters: CommittedFilters,
  packageSource: WashingtonReferencePackageSource = 'hosted',
): Promise<RunningStats> {
  void taxYear;
  const shard = await loadCountyShard(filters.countyCode, packageSource);
  const filtered = shard.records.filter((sale) => matchesFilters(sale, filters));
  const decided = getDecisionMap();
  const qualified = filtered.filter(
    (sale) => decided[decisionStorageKey(sale.countyCode, sale.saleId)]?.decision === 'qualified',
  ).length;
  const nonQualified = filtered.filter((sale) => {
    const decision = decided[decisionStorageKey(sale.countyCode, sale.saleId)]?.decision;
    return decision != null && decision !== 'qualified';
  }).length;

  return {
    taxYear,
    filters: { hood: filters.hood, propertyType: filters.propertyType },
    counts: {
      total: filtered.length,
      qualified,
      nonQualified,
      pending: Math.max(0, filtered.length - qualified - nonQualified),
      withRatio: 0,
    },
    stats: {
      medianRatio: null,
      meanRatio: null,
      weightedMeanRatio: null,
      cod: null,
      prd: null,
      prb: null,
    },
    // The public package has no ratio observations, so compliance was not
    // calculated. Null preserves "unknown" instead of reporting four failures.
    iaaoCompliant: null,
  };
}

export async function fetchWashingtonLaunchNeighborhoodStats(
  taxYear: number,
  filters: CommittedFilters,
  packageSource: WashingtonReferencePackageSource = 'hosted',
): Promise<NeighborhoodStats> {
  void taxYear;
  const shard = await loadCountyShard(filters.countyCode, packageSource);
  const groups = new Map<string, HoodStat>();
  for (const sale of shard.records.filter((record) => matchesFilters(record, filters))) {
    const hood = sale.neighborhoodCode;
    if (!hood) continue;
    const current = groups.get(hood) ?? {
      hood,
      totalCount: 0,
      qualifiedCount: 0,
      pendingCount: 0,
      nonQualCount: 0,
      medianRatio: null,
      cod: null,
    };
    current.totalCount += 1;
    current.pendingCount += 1;
    groups.set(hood, current);
  }

  return {
    taxYear,
    propertyType: filters.propertyType,
    hoods: [...groups.values()].sort((a, b) => b.totalCount - a.totalCount),
    hoodDataGap: groups.size === 0,
    hoodDataGapAlert: groups.size === 0
      ? 'No TerraFusion neighborhood code is present for the selected county/filter window in the Washington launch data package.'
      : null,
  };
}

export async function fetchWashingtonLaunchCodeAudit(
  taxYear: number,
  filters: CommittedFilters,
  packageSource: WashingtonReferencePackageSource = 'hosted',
): Promise<CodeAudit> {
  void taxYear;
  const shard = await loadCountyShard(filters.countyCode, packageSource);
  const filtered = shard.records.filter((sale) => matchesFilters(sale, filters));
  const deedCounts = new Map<string, number>();
  const useCounts = new Map<string, number>();
  for (const sale of filtered) {
    deedCounts.set(sale.deedType ?? 'unknown', (deedCounts.get(sale.deedType ?? 'unknown') ?? 0) + 1);
    useCounts.set(sale.useCode ?? 'unknown', (useCounts.get(sale.useCode ?? 'unknown') ?? 0) + 1);
  }

  return {
    taxYear,
    totalSales: filtered.length,
    dataQualityAlert: 'Washington launch data package exposes deed/use-code distributions. WAC and ratio-code fields remain null unless present in the source county feed.',
    wacCdBreakdown: [{ wacCd: null, description: 'Not provided by Washington launch data package', count: filtered.length, isDataGap: true }],
    saleQualifierBreakdown: [...deedCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([code, count]) => ({ code, count })),
    countyRatioBreakdown: [],
    ratioTypeBreakdown: [],
    excludeCalcBreakdown: [...useCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([code, count]) => ({ code, count })),
  };
}

export async function fetchWashingtonLaunchCompsPool(
  params: {
    countyCode: string;
    hood?: string | null;
    propertyType?: string | null;
    page: number;
    pageSize: number;
  },
  packageSource: WashingtonReferencePackageSource = 'hosted',
): Promise<{
  total: number;
  page: number;
  pageSize: number;
  items: Array<{
    saleId: string;
    parcelId: string;
    address: string | null;
    hood: string | null;
    propertyType: string | null;
    saleDate: string;
    salePrice: number;
    rawSalePrice: number;
    adjustedSalePrice: number | null;
    gla: number | null;
    lotSizeSqft: number | null;
    yearBuilt: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    condition: string | null;
    qualityGrade: string | null;
    salesRatio: number | null;
    qualificationSource: 'decision' | 'recommendation';
  }>;
}> {
  const filters: CommittedFilters = {
    countyCode: normalizeCountyCode(params.countyCode),
    hood: params.hood ?? null,
    propertyType: params.propertyType ?? null,
    saleDateFrom: null,
    saleDateTo: null,
    minPrice: null,
    maxPrice: null,
  };
  const shard = await loadCountyShard(filters.countyCode, packageSource);
  const filtered = shard.records
    .filter((sale) => matchesFilters(sale, filters))
    .filter((sale) => (sale.salePrice ?? 0) > 0);
  const start = (params.page - 1) * params.pageSize;
  return {
    total: filtered.length,
    page: params.page,
    pageSize: params.pageSize,
    items: filtered.slice(start, start + params.pageSize).map((sale) => ({
      saleId: sale.saleId,
      parcelId: sale.parcelNumber ?? '',
      address: addressFor(sale),
      hood: sale.neighborhoodCode,
      propertyType: sale.useCode,
      saleDate: sale.saleDate ?? '',
      salePrice: sale.adjustedSalePrice ?? sale.salePrice ?? 0,
      rawSalePrice: sale.salePrice ?? 0,
      adjustedSalePrice: sale.adjustedSalePrice,
      gla: null,
      lotSizeSqft: null,
      yearBuilt: null,
      bedrooms: null,
      bathrooms: null,
      condition: null,
      qualityGrade: null,
      salesRatio: null,
      qualificationSource: 'recommendation',
    })),
  };
}

export async function patchWashingtonLaunchDecision(
  countyCode: string,
  saleId: string,
  decision: string,
  notes: string,
  decidedBy: string,
  decisionSource = 'StaffConfirmed',
): Promise<void> {
  const map = getDecisionMap();
  map[decisionStorageKey(countyCode, saleId)] = {
    decision,
    notes,
    decidedBy,
    decisionSource,
    decidedAt: new Date().toISOString(),
  };
  setDecisionMap(map);
}

export async function bulkPatchWashingtonLaunchDecision(
  countyCode: string,
  saleIds: string[],
  decision: string,
  notes: string,
  decidedBy: string,
): Promise<void> {
  for (const saleId of saleIds) {
    await patchWashingtonLaunchDecision(
      countyCode,
      saleId,
      decision,
      notes,
      decidedBy,
      'StaffConfirmed',
    );
  }
}

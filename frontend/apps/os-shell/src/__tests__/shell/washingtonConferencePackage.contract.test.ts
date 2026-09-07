import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE,
  WASHINGTON_REFERENCE_ROUTES,
} from '../../lib/washingtonAssessorReferencePackage';
import {
  fetchWashingtonCountyDetail,
  fetchWashingtonCountyStatus,
  resolveWashingtonCountyStatus,
} from '../../services/washingtonCountyLaunch';
import {
  evictWashingtonLaunchCountyShard,
  fetchWashingtonLaunchManifest,
  fetchWashingtonLaunchQueue,
} from '../../pages/forge/sales/washingtonLaunchApi';
import {
  getWashingtonSalesReviewCapability,
  parseWashingtonCountiesHubHandoff,
} from '../../pages/forge/sales/washingtonSalesReviewCapability';
import type { CommittedFilters } from '../../pages/forge/sales/salesForgeTypes';

const BENTON_STATUS = {
  schemaVersion: 'terrafusion.washington.county-status.v1',
  generatedAt: '2026-09-06T19:54:03.180Z',
  sourcePosture: WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE,
  counties: [{
    county: 'Benton',
    countyCode: '005',
    priority: 'conference_bounded',
    prometheusStatus: 'bounded_readonly_extract',
    primarySourceMode: WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE,
    latestSaleDate: '2025-01-08',
    candidateSales: 1,
    stagedSales: 1,
    needsReview: 1,
    confidence: {
      averageQualityScore: 0.75,
      parserStatus: 'bounded_extract_parser',
      rawStatus: 'county_derived_read_only',
      rawDriftDetected: false,
    },
    staticRoutes: {
      detail: WASHINGTON_REFERENCE_ROUTES.bentonDetail,
      salesShard: WASHINGTON_REFERENCE_ROUTES.bentonSales,
    },
  }],
};

const BENTON_DETAIL = {
  schemaVersion: 'terrafusion.washington.county-detail.v1',
  generatedAt: BENTON_STATUS.generatedAt,
  county: 'Benton',
  countyCode: '005',
  operationalState: {
    primarySourceMode: WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE,
    prometheusStatus: 'bounded_readonly_extract',
  },
  summary: { records: 1, latestSaleDate: '2025-01-08' },
  salesRoute: WASHINGTON_REFERENCE_ROUTES.bentonSales,
};

const BENTON_SHARD = {
  schemaVersion: 'terrafusion.washington.sales-shard.v1',
  generatedAt: BENTON_STATUS.generatedAt,
  county: 'Benton',
  countyCode: '005',
  summary: {
    records: 1,
    latestSaleDate: '2025-01-08',
    reviewRecords: 1,
    recordsWithNeighborhoodCode: 1,
    topNeighborhoodCodes: { '12122': 1 },
  },
  records: [{
    saleId: 'conference-fixture-005-1',
    county: 'Benton',
    countyCode: '005',
    parcelNumber: 'masked-005-1',
    saleDate: '2025-01-08',
    saleYear: 2025,
    salePrice: 300000,
    adjustedSalePrice: 300000,
    documentNumber: null,
    deedType: 'SWD',
    situsAddress: null,
    situsCity: null,
    situsZip: null,
    useCode: 'class:25',
    acres: 1,
    grantor: null,
    grantee: null,
    saleNote: 'County-derived bounded read-only extract; operator review required.',
    neighborhoodCode: '12122',
    currentNeighborhoodCode: '12122',
    sourceMode: WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE,
    candidateSource: 'county_bounded_readonly_extract',
    confidenceScore: 0.75,
    qualityScore: 0.75,
    qualityBand: 'bounded_review',
    reviewStatus: 'review_required',
    provenance: {
      sourceUrl: null,
      sourceFinalUrl: null,
      sourcePayloadPath: 'conference-fixture/005',
      sourcePayloadSha256: 'a'.repeat(64),
      candidateIndexSource: 'conference-fixture/005',
      candidateRecordType: 'county_sales_extract',
      candidateSourceOrdinal: 1,
    },
    flags: {
      duplicateRisk: false,
      needsReview: true,
      manualException: false,
    },
  }],
};

const BENTON_MANIFEST = {
  schemaVersion: 'terrafusion.washington.launch-manifest.v1',
  generatedAt: BENTON_STATUS.generatedAt,
  sourcePosture: WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE,
  summary: {
    counties: 1,
    rawLanded: 1,
    parserReady: 1,
    candidateSales: 1,
    stagedSales: 1,
    needsReview: 1,
    prometheusNeedsReview: 1,
    recordsWithNeighborhoodCode: 1,
    futureSaleDateRecords: 0,
    criticalContradictions: 0,
    garfieldExceptions: 0,
    bentonCityAsNeighborhoodRecords: 0,
  },
};

const BENTON_FILTERS: CommittedFilters = {
  countyCode: '005',
  hood: null,
  propertyType: null,
  saleDateFrom: null,
  saleDateTo: null,
  minPrice: null,
  maxPrice: null,
};

function response(payload: unknown) {
  return { ok: true, status: 200, json: async () => payload };
}

describe('Washington conference-local package contract', () => {
  afterEach(() => {
    evictWashingtonLaunchCountyShard('005', 'conference-local');
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('selects the same-origin package flag and loads status, detail, manifest, and county shard read-only', async () => {
    vi.stubEnv('VITE_WASHINGTON_CONFERENCE_LOCAL_PACKAGE', 'true');
    const fetchMock = vi.fn((url: string) => {
      if (url === WASHINGTON_REFERENCE_ROUTES.status) return Promise.resolve(response(BENTON_STATUS));
      if (url === WASHINGTON_REFERENCE_ROUTES.bentonDetail) return Promise.resolve(response(BENTON_DETAIL));
      if (url === WASHINGTON_REFERENCE_ROUTES.bentonSales) return Promise.resolve(response(BENTON_SHARD));
      if (url === WASHINGTON_REFERENCE_ROUTES.manifest) return Promise.resolve(response(BENTON_MANIFEST));
      return Promise.reject(new Error(`Unexpected route: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    const resolution = await resolveWashingtonCountyStatus();
    expect(resolution.packageSource).toBe('conference-local');
    expect(resolution.usedRepositoryFallback).toBe(false);
    expect(resolution.counties[0]).toMatchObject({
      county: 'Benton',
      countyCode: '005',
      packageSource: 'conference-local',
      primarySourceMode: WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE,
      salesShardVerification: 'not-required',
    });

    const county = resolution.counties[0];
    expect(county).toBeDefined();
    expect(getWashingtonSalesReviewCapability(county!)).toMatchObject({
      eligible: true,
      referenceData: {
        posture: WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE,
        isSyntheticReference: false,
      },
    });
    expect(parseWashingtonCountiesHubHandoff({
      countyCode: '005',
      countyName: 'Benton',
      resetValuationScope: true,
      launchContext: 'washington-counties-hub',
      dataTrustTier: 'public-reference-not-county-certified',
      referencePackageSource: 'conference-local',
      referenceDataPosture: WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE,
      referenceRecordCount: 1,
      latestReferenceSaleDate: '2025-01-08',
      salesReviewAvailability: 'available',
      salesReviewUnavailableMessage: null,
    })).toMatchObject({
      dataTrustTier: 'conference-local-readonly-not-certified',
      referencePackageSource: 'conference-local',
    });
    await expect(fetchWashingtonCountyDetail(county!, undefined, 'conference-local'))
      .resolves.toMatchObject({ county: 'Benton', countyCode: '005' });
    await expect(fetchWashingtonLaunchManifest('conference-local'))
      .resolves.toMatchObject({ sourcePosture: WASHINGTON_CONFERENCE_LOCAL_SOURCE_POSTURE });
    await expect(fetchWashingtonLaunchQueue(
      2025,
      'all',
      1,
      25,
      BENTON_FILTERS,
      'conference-local',
    )).resolves.toMatchObject({ total: 1 });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      WASHINGTON_REFERENCE_ROUTES.status,
      WASHINGTON_REFERENCE_ROUTES.bentonDetail,
      WASHINGTON_REFERENCE_ROUTES.manifest,
      WASHINGTON_REFERENCE_ROUTES.bentonSales,
    ]);
    expect(fetchMock.mock.calls.every(([, init]) => init?.cache === 'no-store')).toBe(true);
  });

  it('rejects a local status package that carries a synthetic marker', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({
      ...BENTON_STATUS,
      counties: [{
        ...BENTON_STATUS.counties[0],
        confidence: { ...BENTON_STATUS.counties[0].confidence, rawStatus: 'synthetic_reference' },
      }],
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWashingtonCountyStatus(undefined, 'conference-local'))
      .rejects.toThrow(/county-bounded, non-certified read-only package/i);
  });

  it('rejects a local shard that carries a synthetic record marker', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({
      ...BENTON_SHARD,
      records: [{
        ...BENTON_SHARD.records[0],
        provenance: {
          ...BENTON_SHARD.records[0].provenance,
          candidateRecordType: 'synthetic_reference',
        },
      }],
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWashingtonLaunchQueue(
      2025,
      'all',
      1,
      25,
      BENTON_FILTERS,
      'conference-local',
    )).rejects.toThrow(/non-certified record/i);
  });
});

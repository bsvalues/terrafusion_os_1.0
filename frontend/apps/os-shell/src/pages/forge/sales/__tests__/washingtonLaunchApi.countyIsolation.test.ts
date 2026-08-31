/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CommittedFilters } from '../salesForgeTypes';
import {
  evictWashingtonLaunchCountyShard,
  fetchWashingtonLaunchCodeAudit,
  fetchWashingtonLaunchNeighborhoodStats,
  fetchWashingtonLaunchVerifiedComparableSales,
  fetchWashingtonLaunchQueue,
  fetchWashingtonLaunchRunningStats,
  fetchWashingtonLaunchSaleDetail,
  isHostedWashingtonLaunchHostname,
  patchWashingtonLaunchDecision,
  validateAndCacheAttestedWashingtonLaunchCountyShard,
} from '../washingtonLaunchApi';

const SPOKANE_FILTERS: CommittedFilters = {
  countyCode: '063',
  hood: null,
  propertyType: null,
  saleDateFrom: null,
  saleDateTo: null,
  minPrice: null,
  maxPrice: null,
};

const YAKIMA_FILTERS: CommittedFilters = {
  ...SPOKANE_FILTERS,
  countyCode: '077',
};

function summary(records: number) {
  return {
    records,
    latestSaleDate: null,
    reviewRecords: 0,
    recordsWithNeighborhoodCode: 0,
    topNeighborhoodCodes: {},
  };
}

function saleRecord(county: string, countyCode: string, saleId: string) {
  return {
    saleId,
    county,
    countyCode,
    parcelNumber: `${countyCode}-parcel`,
    saleDate: '2025-01-15',
    saleYear: 2025,
    salePrice: 300_000,
    adjustedSalePrice: null,
    documentNumber: null,
    deedType: null,
    situsAddress: null,
    situsCity: null,
    situsZip: null,
    useCode: null,
    acres: null,
    grantor: null,
    grantee: null,
    saleNote: null,
    neighborhoodCode: null,
    currentNeighborhoodCode: null,
    sourceMode: null,
    candidateSource: null,
    confidenceScore: null,
    qualityScore: null,
    qualityBand: null,
    reviewStatus: null,
    provenance: {
      sourceUrl: null,
      sourceFinalUrl: null,
      sourcePayloadPath: null,
      sourcePayloadSha256: null,
      candidateIndexSource: null,
      candidateRecordType: null,
      candidateSourceOrdinal: null,
    },
    flags: {
      duplicateRisk: false,
      needsReview: false,
      manualException: false,
    },
  };
}

function countyShard(county: string, countyCode: string, saleIds: string[]) {
  return {
    schemaVersion: '1.0.0',
    generatedAt: '2026-08-28T00:00:00.000Z',
    county,
    countyCode,
    summary: summary(saleIds.length),
    records: saleIds.map((saleId) => saleRecord(county, countyCode, saleId)),
  };
}

describe('Washington hosted launch hostname routing', () => {
  it.each([
    'preview.terrafusionmarket.com',
    'sales.terrafusionmarket.com',
    'suite.terrafusionmarket.com',
    'PREVIEW.TERRAFUSIONMARKET.COM.',
  ])('uses the hosted public-data package on %s', (hostname) => {
    expect(isHostedWashingtonLaunchHostname(hostname)).toBe(true);
  });

  it.each([
    'localhost',
    '127.0.0.1',
    'terrafusionmarket.com',
    'staging.terrafusionmarket.com',
    'terrafusionmarket.com.example.test',
    'staging-terrafusionmarket.com',
    '',
  ])('retains the repository reference on an unserved or untrusted hostname %s', (hostname) => {
    expect(isHostedWashingtonLaunchHostname(hostname)).toBe(false);
  });
});

describe('Washington launch shard county isolation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
    ['005', '063', '073', '077'].forEach((countyCode) => {
      evictWashingtonLaunchCountyShard(countyCode, 'hosted');
    });
  });

  it('loads the tracked Spokane reference shard without an HTTP request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const queue = await fetchWashingtonLaunchQueue(
      2025,
      'all',
      1,
      25,
      SPOKANE_FILTERS,
      'repository-reference',
    );

    expect(queue.total).toBe(3);
    expect(queue.items[0]).toMatchObject({
      county: 'Spokane',
      countyCode: '063',
      dataTrustTier: 'public-reference-not-county-certified',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a direct hosted read that has not crossed the attestation boundary', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWashingtonLaunchQueue(
      2025, 'all', 1, 25, SPOKANE_FILTERS,
    )).rejects.toThrow(/authenticated package verification/i);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reuses a hosted Spokane shard only after package verification cached it', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    validateAndCacheAttestedWashingtonLaunchCountyShard(
      countyShard('Spokane', '063', ['hosted-spokane-sale']),
      '063',
      'hosted',
    );

    const queue = await fetchWashingtonLaunchQueue(
      2025, 'all', 1, 25, SPOKANE_FILTERS,
    );

    expect(queue.total).toBe(1);
    expect(queue.items[0]?.saleId).toBe('hosted-spokane-sale');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps every year-scoped projection within the selected tax year', async () => {
    validateAndCacheAttestedWashingtonLaunchCountyShard({
      ...countyShard('Spokane', '063', ['sale-2025', 'sale-2024', 'sale-year-unknown']),
      records: [
        {
          ...saleRecord('Spokane', '063', 'sale-2025'),
          deedType: 'WD',
          neighborhoodCode: 'N-2025',
          useCode: 'R1',
        },
        {
          ...saleRecord('Spokane', '063', 'sale-2024'),
          deedType: 'QC',
          neighborhoodCode: 'N-2024',
          saleDate: '2024-01-15',
          saleYear: 2024,
          useCode: 'C1',
        },
        {
          ...saleRecord('Spokane', '063', 'sale-year-unknown'),
          neighborhoodCode: 'N-UNKNOWN',
          saleDate: null,
          saleYear: null,
        },
      ],
    }, '063', 'hosted');

    const [queue, stats, neighborhoods, audit] = await Promise.all([
      fetchWashingtonLaunchQueue(2025, 'all', 1, 25, SPOKANE_FILTERS),
      fetchWashingtonLaunchRunningStats(2025, SPOKANE_FILTERS),
      fetchWashingtonLaunchNeighborhoodStats(2025, SPOKANE_FILTERS),
      fetchWashingtonLaunchCodeAudit(2025, SPOKANE_FILTERS),
    ]);

    expect(queue).toMatchObject({
      total: 1,
      items: [expect.objectContaining({ saleId: 'sale-2025' })],
    });
    expect(stats.counts).toMatchObject({ total: 1, pending: 1 });
    expect(neighborhoods.hoods).toEqual([
      expect.objectContaining({ hood: 'N-2025', totalCount: 1 }),
    ]);
    expect(audit).toMatchObject({
      totalSales: 1,
      saleQualifierBreakdown: [{ code: 'WD', count: 1 }],
      excludeCalcBreakdown: [{ code: 'R1', count: 1 }],
    });
  });

  it('serves CompsForge candidates from only the current attested hosted body', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWashingtonLaunchVerifiedComparableSales('063', 'hosted'),
    ).rejects.toThrow(/authenticated package verification/i);

    validateAndCacheAttestedWashingtonLaunchCountyShard({
      ...countyShard('Spokane', '063', ['first-package-sale']),
      records: [{
        ...saleRecord('Spokane', '063', 'first-package-sale'),
        parcelNumber: 'SP-FIRST',
        situsAddress: '100 First Package Ave',
        grossLivingArea: '1800',
        reviewStatus: 'candidate_ready',
      }],
    }, '063', 'hosted');

    await expect(
      fetchWashingtonLaunchVerifiedComparableSales('063', 'hosted'),
    ).resolves.toEqual([
      expect.objectContaining({
        parcelId: 'SP-FIRST',
        address: '100 First Package Ave',
        grossLivingArea: 1800,
        saleQualification: 'candidate_ready',
      }),
    ]);

    validateAndCacheAttestedWashingtonLaunchCountyShard({
      ...countyShard('Spokane', '063', ['refreshed-package-sale']),
      records: [{
        ...saleRecord('Spokane', '063', 'refreshed-package-sale'),
        parcelNumber: 'SP-REFRESHED',
        situsAddress: '200 Refreshed Package Ave',
        flags: {
          duplicateRisk: false,
          needsReview: true,
          manualException: false,
        },
      }],
    }, '063', 'hosted');

    const refreshed = await fetchWashingtonLaunchVerifiedComparableSales('063', 'hosted');
    expect(refreshed).toEqual([
      expect.objectContaining({
        parcelId: 'SP-REFRESHED',
        address: '200 Refreshed Package Ave',
        saleQualification: 'review_required',
      }),
    ]);
    expect(refreshed).not.toEqual([
      expect.objectContaining({ parcelId: 'SP-FIRST' }),
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a shard whose declared county does not match the requested county', async () => {
    expect(() => validateAndCacheAttestedWashingtonLaunchCountyShard({
      schemaVersion: '1.0.0',
      generatedAt: '2026-08-28T00:00:00.000Z',
      county: 'Benton',
      countyCode: '005',
      summary: summary(0),
      records: [],
    }, '077', 'hosted')).toThrow(/shard county mismatch: expected Yakima \(077\)/i);
  });

  it('rejects a mismatched record inside an otherwise Yakima-declared shard', async () => {
    expect(() => validateAndCacheAttestedWashingtonLaunchCountyShard({
      schemaVersion: '1.0.0',
      generatedAt: '2026-08-28T00:00:00.000Z',
      county: 'Yakima',
      countyCode: '077',
      summary: summary(1),
      records: [
        {
          saleId: 'benton-record-in-yakima-shard',
          county: 'Benton',
          countyCode: '005',
        },
      ],
    }, '077', 'hosted')).toThrow(/county mismatch at record 0: expected 077/i);
  });

  it('rejects invalid county context before issuing a shard request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWashingtonLaunchQueue(2025, 'all', 1, 25, {
        ...SPOKANE_FILTERS,
        countyCode: 'Not A County',
      }),
    ).rejects.toThrow(/county context is invalid/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects duplicate sale identifiers within a county shard', async () => {
    expect(() => validateAndCacheAttestedWashingtonLaunchCountyShard(
      countyShard('Yakima', '077', ['duplicate-sale', 'duplicate-sale']),
      '077',
      'hosted',
    )).toThrow(/duplicate saleId duplicate-sale/i);
  });

  it('keeps browser-local decisions isolated when counties share a sale identifier', async () => {
    await patchWashingtonLaunchDecision(
      '077',
      'shared-sale',
      'qualified',
      'Yakima reference review',
      'Test reviewer',
    );
    validateAndCacheAttestedWashingtonLaunchCountyShard(
      countyShard('Yakima', '077', ['shared-sale']),
      '077',
      'hosted',
    );
    validateAndCacheAttestedWashingtonLaunchCountyShard(
      countyShard('Benton', '005', ['shared-sale']),
      '005',
      'hosted',
    );

    const [yakima, benton] = await Promise.all([
      fetchWashingtonLaunchQueue(2025, 'all', 1, 25, YAKIMA_FILTERS),
      fetchWashingtonLaunchQueue(2025, 'all', 1, 25, {
        ...SPOKANE_FILTERS,
        countyCode: '005',
      }),
    ]);

    expect(yakima.items[0]?.qualificationDecision).toBe('qualified');
    expect(benton.items[0]?.qualificationDecision).toBeNull();

    const stats = await fetchWashingtonLaunchRunningStats(2025, YAKIMA_FILTERS);
    expect(stats.counts.withRatio).toBe(0);
    expect(stats.iaaoCompliant).toBeNull();
  });

  it('preserves public source and quality evidence for an assessor review', async () => {
    const record = {
      ...saleRecord('Whatcom', '073', 'whatcom-evidence-sale'),
      documentNumber: '00A-00127',
      grantor: 'Northwest Holdings LLC',
      grantee: 'Riverbend Housing Trust',
      sourceMode: 'public_recorder_export',
      candidateSource: 'whatcom_sales_candidate_index',
      confidenceScore: 0.91,
      qualityScore: 0.78,
      qualityBand: 'review_required',
      reviewStatus: 'needs_source_confirmation',
      provenance: {
        sourceUrl: 'https://example.wa.gov/sales',
        sourceFinalUrl: 'https://example.wa.gov/sales/record-1',
        sourcePayloadPath: 'washington/whatcom/record-1.json',
        sourcePayloadSha256: 'abc123',
        candidateIndexSource: 'whatcom-public-sales-index',
        candidateRecordType: 'public_sale_candidate',
        candidateSourceOrdinal: 7,
      },
    };
    validateAndCacheAttestedWashingtonLaunchCountyShard({
      schemaVersion: '1.0.0',
      generatedAt: '2026-08-28T00:00:00.000Z',
      county: 'Whatcom',
      countyCode: '073',
      summary: summary(1),
      records: [record],
    }, '073', 'hosted');

    const detail = await fetchWashingtonLaunchSaleDetail(
      'whatcom-evidence-sale',
      { ...SPOKANE_FILTERS, countyCode: '073' },
    );

    expect(detail).toMatchObject({
      countyCode: '073',
      documentNumber: '00A-00127',
      grantor: 'Northwest Holdings LLC',
      grantee: 'Riverbend Housing Trust',
      exciseNumber: null,
      dataTrustTier: 'public-reference-not-county-certified',
      sourceMode: 'public_recorder_export',
      candidateSource: 'whatcom_sales_candidate_index',
      confidenceScore: 0.91,
      qualityScore: 0.78,
      qualityBand: 'review_required',
      reviewStatus: 'needs_source_confirmation',
      sourceUrl: 'https://example.wa.gov/sales',
      sourceFinalUrl: 'https://example.wa.gov/sales/record-1',
      sourcePayloadPath: 'washington/whatcom/record-1.json',
      sourcePayloadSha256: 'abc123',
      candidateIndexSource: 'whatcom-public-sales-index',
      candidateRecordType: 'public_sale_candidate',
      candidateSourceOrdinal: 7,
    });
  });
});

/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CommittedFilters } from '../salesForgeTypes';
import {
  fetchWashingtonLaunchQueue,
  fetchWashingtonLaunchRunningStats,
  fetchWashingtonLaunchSaleDetail,
  patchWashingtonLaunchDecision,
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

describe('Washington launch shard county isolation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
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

  it('prefers the hosted Spokane shard when no repository source is requested', async () => {
    const fetchMock = vi.fn(async () => Response.json(
      countyShard('Spokane', '063', ['hosted-spokane-sale']),
    ));
    vi.stubGlobal('fetch', fetchMock);

    const queue = await fetchWashingtonLaunchQueue(
      2025,
      'all',
      1,
      25,
      SPOKANE_FILTERS,
    );

    expect(queue.total).toBe(1);
    expect(queue.items[0]?.saleId).toBe('hosted-spokane-sale');
    expect(fetchMock).toHaveBeenCalledWith(
      '/launch-data/washington/sales/by-county/063.json',
      { cache: 'no-store' },
    );
  });

  it('rejects a shard whose declared county does not match the requested county', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      schemaVersion: '1.0.0',
      generatedAt: '2026-08-28T00:00:00.000Z',
      county: 'Benton',
      countyCode: '005',
      summary: summary(0),
      records: [],
    })));

    await expect(
      fetchWashingtonLaunchQueue(2025, 'all', 1, 25, YAKIMA_FILTERS),
    ).rejects.toThrow(/shard county mismatch: expected Yakima \(077\)/i);
  });

  it('rejects a mismatched record inside an otherwise Yakima-declared shard', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
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
    })));

    await expect(
      fetchWashingtonLaunchQueue(2025, 'all', 1, 25, YAKIMA_FILTERS),
    ).rejects.toThrow(/county mismatch at record 0: expected 077/i);
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
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(
      countyShard('Yakima', '077', ['duplicate-sale', 'duplicate-sale']),
    )));

    await expect(
      fetchWashingtonLaunchQueue(2025, 'all', 1, 25, YAKIMA_FILTERS),
    ).rejects.toThrow(/duplicate saleId duplicate-sale/i);
  });

  it('keeps browser-local decisions isolated when counties share a sale identifier', async () => {
    await patchWashingtonLaunchDecision(
      '077',
      'shared-sale',
      'qualified',
      'Yakima reference review',
      'Test reviewer',
    );
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      return Response.json(
        url.endsWith('/077.json')
          ? countyShard('Yakima', '077', ['shared-sale'])
          : countyShard('Benton', '005', ['shared-sale']),
      );
    }));

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
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      schemaVersion: '1.0.0',
      generatedAt: '2026-08-28T00:00:00.000Z',
      county: 'Whatcom',
      countyCode: '073',
      summary: summary(1),
      records: [record],
    })));

    const detail = await fetchWashingtonLaunchSaleDetail(
      'whatcom-evidence-sale',
      { ...SPOKANE_FILTERS, countyCode: '073' },
    );

    expect(detail).toMatchObject({
      countyCode: '073',
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

/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CommittedFilters } from '../salesForgeTypes';
import {
  fetchWashingtonLaunchQueue,
  fetchWashingtonLaunchRunningStats,
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
      fetchWashingtonLaunchQueue(2025, 'all', 1, 25, SPOKANE_FILTERS),
    ).rejects.toThrow(/shard county mismatch: expected Spokane \(063\)/i);
  });

  it('rejects a mismatched record inside an otherwise Spokane-declared shard', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      schemaVersion: '1.0.0',
      generatedAt: '2026-08-28T00:00:00.000Z',
      county: 'Spokane',
      countyCode: '063',
      summary: summary(1),
      records: [
        {
          saleId: 'benton-record-in-spokane-shard',
          county: 'Benton',
          countyCode: '005',
        },
      ],
    })));

    await expect(
      fetchWashingtonLaunchQueue(2025, 'all', 1, 25, SPOKANE_FILTERS),
    ).rejects.toThrow(/county mismatch at record 0: expected 063/i);
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
      countyShard('Spokane', '063', ['duplicate-sale', 'duplicate-sale']),
    )));

    await expect(
      fetchWashingtonLaunchQueue(2025, 'all', 1, 25, SPOKANE_FILTERS),
    ).rejects.toThrow(/duplicate saleId duplicate-sale/i);
  });

  it('keeps browser-local decisions isolated when counties share a sale identifier', async () => {
    await patchWashingtonLaunchDecision(
      '063',
      'shared-sale',
      'qualified',
      'Spokane reference review',
      'Test reviewer',
    );
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      return Response.json(
        url.endsWith('/063.json')
          ? countyShard('Spokane', '063', ['shared-sale'])
          : countyShard('Benton', '005', ['shared-sale']),
      );
    }));

    const [spokane, benton] = await Promise.all([
      fetchWashingtonLaunchQueue(2025, 'all', 1, 25, SPOKANE_FILTERS),
      fetchWashingtonLaunchQueue(2025, 'all', 1, 25, {
        ...SPOKANE_FILTERS,
        countyCode: '005',
      }),
    ]);

    expect(spokane.items[0]?.qualificationDecision).toBe('qualified');
    expect(benton.items[0]?.qualificationDecision).toBeNull();

    const stats = await fetchWashingtonLaunchRunningStats(2025, SPOKANE_FILTERS);
    expect(stats.counts.withRatio).toBe(0);
    expect(stats.iaaoCompliant).toBeNull();
  });
});

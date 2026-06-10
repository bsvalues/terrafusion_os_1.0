import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiFetchJson: vi.fn(),
  headers: {
    'Content-Type': 'application/json',
    'x-county-id': 'benton',
  },
}));

vi.mock('@/auth/session', () => ({
  getSession: () => ({
    userId: 'assessor-1',
    countyId: 'benton',
    role: 'assessor',
    mode: 'county',
  }),
}));

vi.mock('@/auth/authStorage', () => ({
  getToken: () => null,
}));

vi.mock('@/services/countyIsolation', () => ({
  buildCountyScopedSessionHeaders: () => ({
    headers: mocks.headers,
    isolated: true,
  }),
}));

vi.mock('@/lib/apiBase', () => ({
  apiFetchJson: mocks.apiFetchJson,
}));

import { useTerraGamaStore } from '../terraGamaStore';

describe('terraGamaStore', () => {
  beforeEach(() => {
    mocks.apiFetchJson.mockReset();
    useTerraGamaStore.setState({
      loading: false,
      error: null,
      countyStats: null,
      neighborhoods: [],
      spatial: null,
      variance: null,
      stats: {
        parcels: 0,
        neighborhoods: 0,
        geocodedSales: 0,
        moransI: null,
        icc: null,
      },
      source: null,
    });

    mocks.apiFetchJson.mockImplementation((path: string) => {
      if (path.startsWith('/terraforge/county-stats')) {
        return Promise.resolve({
          taxYear: 2026,
          totalParcels: 12345,
          averageAssessedValue: 411000,
          assessedThisYear: 12000,
          pendingAssessments: 345,
          assessmentCompletionPercent: 97.2,
        });
      }
      if (path.startsWith('/terraforge/comparison-snapshots')) {
        return Promise.resolve([
          {
            neighborhood_code: 'KENN-01',
            parcel_count: 42,
            median_ratio: 0.982,
            cod: 9.4,
            prd: 1.011,
            sale_count: 31,
          },
        ]);
      }
      if (path.startsWith('/terraforge/ratio-study/spatial-autocorrelation')) {
        return Promise.resolve({
          taxYear: 2026,
          sampleSize: 80,
          sampleWithCoords: 76,
          kNeighbors: 8,
          moransI: 0.1324,
          expectedI: -0.0133,
          variance: 0.0019,
          zScore: 3.12,
          pValue: 0.0018,
          significantClustering: true,
          interpretation: 'Significant positive spatial autocorrelation detected.',
        });
      }
      if (path.startsWith('/terraforge/ratio-study/variance-decomposition')) {
        return Promise.resolve({
          taxYear: 2026,
          totalSampleSize: 115,
          neighborhoodCount: 7,
          icc: 0.2841,
          ssBetween: 10.5,
          ssWithin: 26.5,
          ssTotal: 37,
          interpretation: '28.4% of ratio variance is explained by neighborhood membership.',
          neighborhoods: [
            {
              neighborhood: 'KENN-01',
              count: 31,
              medianRatio: 0.982,
              meanRatio: 0.991,
              stdDev: 0.081,
              deviationFromGrandMean: 0.042,
            },
          ],
        });
      }
      return Promise.reject(new Error(`Unhandled path: ${path}`));
    });
  });

  it('loads TerraGAMA from county-scoped TerraForge spatial and ratio-study endpoints', async () => {
    await useTerraGamaStore.getState().fetchRuntimeData(2026);

    expect(mocks.apiFetchJson).toHaveBeenCalledWith(
      '/terraforge/county-stats?taxYear=2026&countyId=benton',
      expect.objectContaining({ headers: mocks.headers }),
    );
    expect(mocks.apiFetchJson).toHaveBeenCalledWith(
      '/terraforge/comparison-snapshots?taxYear=2026&countyId=benton',
      expect.objectContaining({ headers: mocks.headers }),
    );
    expect(mocks.apiFetchJson).toHaveBeenCalledWith(
      '/terraforge/ratio-study/spatial-autocorrelation?taxYear=2026&countyId=benton',
      expect.objectContaining({ headers: mocks.headers }),
    );
    expect(mocks.apiFetchJson).toHaveBeenCalledWith(
      '/terraforge/ratio-study/variance-decomposition?taxYear=2026&countyId=benton',
      expect.objectContaining({ headers: mocks.headers }),
    );

    const state = useTerraGamaStore.getState();
    expect(state.error).toBeNull();
    expect(state.stats).toMatchObject({
      parcels: 12345,
      neighborhoods: 1,
      geocodedSales: 76,
      moransI: 0.1324,
      icc: 0.2841,
    });
    expect(state.source).toContain('TerraForge spatial ratio-study endpoints');
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../terraGamaStore', () => {
  const store = vi.fn((selector?: (s: unknown) => unknown) => {
    const state = {
      loading: false,
      error: null,
      taxYear: 2026,
      countyScope: {
        countyId: 'benton',
        isolated: true,
        message: null,
      },
      countyStats: {
        totalParcels: 12345,
        averageAssessedValue: 411000,
        assessedThisYear: 12000,
        pendingAssessments: 345,
        assessmentCompletionPercent: 97.2,
      },
      neighborhoods: [
        {
          neighborhood_code: 'KENN-01',
          parcel_count: 42,
          median_ratio: 0.982,
          cod: 9.4,
          prd: 1.011,
          sale_count: 31,
        },
      ],
      spatial: {
        sampleSize: 80,
        sampleWithCoords: 76,
        kNeighbors: 8,
        moransI: 0.1324,
        expectedI: -0.0133,
        zScore: 3.12,
        pValue: 0.0018,
        significantClustering: true,
        interpretation: 'Significant positive spatial autocorrelation detected.',
      },
      variance: {
        totalSampleSize: 115,
        neighborhoodCount: 7,
        icc: 0.2841,
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
      },
      stats: {
        parcels: 12345,
        neighborhoods: 1,
        geocodedSales: 76,
        moransI: 0.1324,
        icc: 0.2841,
      },
      source: 'Benton County TerraForge spatial ratio-study endpoints',
      fetchRuntimeData: vi.fn(),
    };
    return selector ? selector(state) : state;
  });

  return { useTerraGamaStore: store };
});

import TerraGamaPage from '../TerraGamaPage';

describe('TerraGamaPage', () => {
  it('renders the live TerraGAMA runtime surface with spatial diagnostics', () => {
    render(<TerraGamaPage />);

    expect(screen.getByTestId('terra-gama')).toBeInTheDocument();
    expect(screen.getByText('TerraGAMA')).toBeInTheDocument();
    expect(screen.getByText('Live API')).toBeInTheDocument();
    expect(screen.getAllByText("Moran's I").length).toBeGreaterThan(0);
    expect(screen.getAllByText('0.1324').length).toBeGreaterThan(0);
    expect(screen.getByText('ICC')).toBeInTheDocument();
    expect(screen.getByText('0.2841')).toBeInTheDocument();
    expect(screen.getByText('KENN-01')).toBeInTheDocument();
    expect(screen.getByText(/TerraForge spatial ratio-study endpoints/i)).toBeInTheDocument();
    expect(screen.queryByText(/Planned scene/i)).not.toBeInTheDocument();
  });
});

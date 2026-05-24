import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchJsonMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());
const getTokenMock = vi.hoisted(() => vi.fn());
const buildHeadersMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/apiBase', () => ({
  apiFetchJson: apiFetchJsonMock,
}));

vi.mock('@/auth/session', () => ({
  getSession: getSessionMock,
}));

vi.mock('@/auth/authStorage', () => ({
  getToken: getTokenMock,
}));

vi.mock('@/services/countyIsolation', () => ({
  buildCountyScopedSessionHeaders: buildHeadersMock,
}));

import { CoefficientPreview } from '../CoefficientPreview';

const sourceRegression = {
  taxYear: 2026,
  totalPool: 42,
  usedForFit: 35,
  insufficientData: false,
  model: {
    predictors: ['intercept', 'GLA_sqft', 'YearBuilt'],
    beta: [350000, 245.5, -1825],
    rSquared: 0.72,
    rSquaredAdj: 0.69,
    rmse: 41250,
    n: 35,
  },
  residuals: [],
};

const candidateRegression = {
  taxYear: 2025,
  totalPool: 37,
  usedForFit: 31,
  insufficientData: false,
  model: {
    predictors: ['intercept', 'GLA_sqft', 'YearBuilt'],
    beta: [341000, 231.25, -1710],
    rSquared: 0.68,
    rSquaredAdj: 0.64,
    rmse: 43750,
    n: 31,
  },
  residuals: [],
};

const comparison = {
  modelA: {
    label: '2026 study',
    medianRatio: 0.991,
    cod: 8.4,
    prd: 1.012,
    prb: -0.01,
    sampleSize: 35,
  },
  modelB: {
    label: '2025 study',
    medianRatio: 0.978,
    cod: 9.1,
    prd: 1.018,
    prb: -0.02,
    sampleSize: 31,
  },
  deltas: {
    cod: 0.7,
    prd: 0.006,
    prb: -0.01,
    medianRatio: -0.013,
    sampleSize: -4,
  },
  improvedMetrics: [],
  degradedMetrics: ['cod', 'prd', 'medianRatio'],
};

describe('CoefficientPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockReturnValue({ countyId: 'benton-wa' });
    getTokenMock.mockReturnValue('token-1');
    buildHeadersMock.mockReturnValue({
      isolated: true,
      headers: { 'X-TerraFusion-County': 'benton-wa' },
    });
  });

  it('generates a live county-scoped coefficient preview from TerraForge regression data', async () => {
    const rawFetchSpy = vi.spyOn(window, 'fetch');
    apiFetchJsonMock.mockImplementation((path: string) => {
      if (path === '/terraforge/regression?taxYear=2026&countyId=benton-wa') {
        return Promise.resolve(sourceRegression);
      }
      if (path === '/terraforge/regression?taxYear=2025&countyId=benton-wa') {
        return Promise.resolve(candidateRegression);
      }
      if (path === '/MassAppraisal/compare') {
        return Promise.resolve(comparison);
      }
      throw new Error(`Unexpected path ${path}`);
    });

    render(<CoefficientPreview />);

    const previewButton = screen.getByTestId('coeff-preview-btn');
    expect(previewButton).not.toBeDisabled();
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(apiFetchJsonMock).toHaveBeenCalledWith(
        '/terraforge/regression?taxYear=2026&countyId=benton-wa',
        {
          headers: {
            Authorization: 'Bearer token-1',
            'X-TerraFusion-County': 'benton-wa',
          },
        },
      );
    });

    expect(apiFetchJsonMock).toHaveBeenCalledWith(
      '/terraforge/regression?taxYear=2025&countyId=benton-wa',
      {
        headers: {
          Authorization: 'Bearer token-1',
          'X-TerraFusion-County': 'benton-wa',
        },
      },
    );
    expect(apiFetchJsonMock).toHaveBeenCalledWith('/MassAppraisal/compare', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token-1',
        'Content-Type': 'application/json',
        'X-TerraFusion-County': 'benton-wa',
      },
      body: JSON.stringify({ ModelIdA: '2026', ModelIdB: '2025' }),
    });
    expect(rawFetchSpy).not.toHaveBeenCalled();

    expect(await screen.findByText('2026 study')).toBeInTheDocument();
    expect(screen.getByText('2025 study')).toBeInTheDocument();
    expect(screen.getByText('GLA_sqft')).toBeInTheDocument();
    expect(screen.getByText('-14.25')).toBeInTheDocument();
    expect(screen.getByText('YearBuilt')).toBeInTheDocument();
    expect(screen.getByText('+115.00')).toBeInTheDocument();
    expect(screen.getByTestId('coeff-apply-mode')).toHaveTextContent(
      'Mode: Preview Only',
    );
  });

  it('renders backend insufficiency as unavailable instead of fabricating coefficient rows', async () => {
    apiFetchJsonMock.mockImplementation((path: string) => {
      if (path.includes('taxYear=2026')) {
        return Promise.resolve({
          ...sourceRegression,
          usedForFit: 3,
          minimumRequired: 5,
          insufficientData: true,
          model: null,
        });
      }
      if (path.includes('taxYear=2025')) {
        return Promise.resolve(candidateRegression);
      }
      if (path === '/MassAppraisal/compare') {
        return Promise.resolve(comparison);
      }
      throw new Error(`Unexpected path ${path}`);
    });

    render(<CoefficientPreview />);
    fireEvent.click(screen.getByTestId('coeff-preview-btn'));

    expect(
      await screen.findByText(/Insufficient observations for source regression: 3 available, 5 required/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('coeff-delta-table')).not.toBeInTheDocument();
  });
});

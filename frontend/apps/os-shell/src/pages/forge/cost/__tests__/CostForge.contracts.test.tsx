import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CostForge from '../CostForge';
import {
  COSTFORGE_TRIAGE_CONTRACT_CLASSIFICATION,
  TriageTab,
} from '../tabs/TriageTab';
import { useCostForgeWorkspaceStore } from '../costForgeWorkspaceStore';

const apiFetchJsonMock = vi.hoisted(() => vi.fn());

vi.mock('@/auth/session', () => ({
  getSession: () => ({ countyId: 'benton', countyCode: '005' }),
}));

vi.mock('@/services/countyIsolation', () => ({
  buildCountyScopedSessionHeaders: () => ({
    headers: { 'X-TerraFusion-County': 'benton' },
    isolated: true,
  }),
}));

vi.mock('@/lib/apiBase', () => ({
  apiFetchJson: apiFetchJsonMock,
}));

vi.mock('@/auth/authStorage', () => ({
  getToken: () => 'dev-token',
}));

describe('CostForge contract classification', () => {
  beforeEach(() => {
    apiFetchJsonMock.mockImplementation((path: string) => {
      if (path.startsWith('/equity/deciles')) {
        return Promise.resolve({
          saleCount: 12,
          decileMedianRatios: Array.from({ length: 10 }, () => 1),
          d1D10Spread: 0.02,
          pattern: 'uniform',
        });
      }
      return Promise.resolve({
        neighborhoods: [],
        outOfCompliance: 0,
        source: 'test',
      });
    });
    useCostForgeWorkspaceStore.setState({
      taxYear: 2025,
      selectedHoodCd: null,
      activeTab: 'triage',
    });
  });

  it('labels triage with the CostForge calibration priority contract', async () => {
    render(<TriageTab />);

    const classification = screen.getByTestId('costforge-triage-contract-classification');
    expect(classification).toHaveAttribute(
      'data-contract-status',
      COSTFORGE_TRIAGE_CONTRACT_CLASSIFICATION.status,
    );
    expect(classification).toHaveAttribute(
      'data-contract-id',
      COSTFORGE_TRIAGE_CONTRACT_CLASSIFICATION.contractId,
    );
    expect(classification).toHaveTextContent(
      COSTFORGE_TRIAGE_CONTRACT_CLASSIFICATION.trustPosture,
    );

    expect(await screen.findByText(/All 0 neighborhoods in IAAO compliance/i)).toBeInTheDocument();
  });

  it('Suite-launched CostForge shows live triage data even when dashboard stats are unavailable', async () => {
    apiFetchJsonMock.mockImplementation((path: string) => {
      if (path.startsWith('/costforge/dashboard-stats')) {
        return Promise.reject(new Error('[apiFetchJson] 504 Gateway Timeout for /costforge/dashboard-stats'));
      }
      if (path.startsWith('/equity/deciles')) {
        return Promise.resolve({
          saleCount: 12,
          decileMedianRatios: Array.from({ length: 10 }, () => 1),
          d1D10Spread: 0.02,
          pattern: 'uniform',
        });
      }
      if (path.startsWith('/costforge/calibration/neighborhood-matrix')) {
        return Promise.resolve({
          neighborhoods: [
            {
              hoodCd: 'RCH-01',
              name: 'Richland Core',
              saleCount: 42,
              medianRatio: 0.884,
              cod: 18.7,
              prd: 1.043,
              prb: -0.061,
              p25: 0.82,
              p75: 0.94,
              ratioOk: false,
              codOk: false,
              iaaoCompliant: false,
            },
          ],
          outOfCompliance: 1,
          source: 'live',
        });
      }
      return Promise.reject(new Error(`unexpected path ${path}`));
    });

    render(
      <CostForge
        metadata={{
          launchContext: 'terraforge-suite',
          dataSource: 'terrafusion-api',
          runtimePath: 'costforge-triage',
          countyId: '19190019-1919-1919-1919-191919191919',
          taxYear: 2026,
        }}
      />,
    );

    expect(await screen.findByTestId('costforge-suite-runtime-badge')).toHaveTextContent(
      /TerraForge Suite · Benton CostForge triage API/i,
    );
    expect(await screen.findByText('RCH-01')).toBeInTheDocument();
    expect(screen.getByText(/Richland Core/i)).toBeInTheDocument();
    expect(screen.getByText(/1 of 1 neighborhoods out of IAAO compliance/i)).toBeInTheDocument();
    expect(screen.getByText(/504 Gateway Timeout/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(apiFetchJsonMock).toHaveBeenCalledWith(
        '/costforge/calibration/neighborhood-matrix?taxYear=2026&minSales=3',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer dev-token',
            'X-TerraFusion-County': 'benton',
          }),
        }),
      );
    });
  });
});

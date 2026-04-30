import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
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
});

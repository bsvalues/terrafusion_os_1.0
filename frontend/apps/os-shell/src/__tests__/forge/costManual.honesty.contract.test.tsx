/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CostManual } from '../../pages/forge/cost/CostManual';
import { CostManualComponent } from '../../components/forge/CostManualComponent';
import { apiFetchJson } from '@/lib/apiBase';
import { getCostSchedule } from '@/services/forge/propertyValuationClientService';

vi.mock('@/lib/apiBase', () => ({
  apiFetchJson: vi.fn(),
}));

vi.mock('@/services/forge/propertyValuationClientService', () => ({
  getCostSchedule: vi.fn(),
}));

vi.mock('../../pages/forge/cost/countyScope', () => ({
  getCostForgeCountyScope: () => ({
    countyId: '19190019-1919-1919-1919-191919191919',
    headers: { 'x-county-id': '19190019-1919-1919-1919-191919191919' },
    isolated: true,
  }),
}));

vi.mock('../../pages/forge/countyCertification', () => ({
  supportsCertifiedCostScheduleLane: () => true,
}));

const mockedApiFetchJson = vi.mocked(apiFetchJson);
const mockedGetCostSchedule = vi.mocked(getCostSchedule);

describe('CostManual honesty contract', () => {
  beforeEach(() => {
    mockedApiFetchJson.mockReset();
    mockedGetCostSchedule.mockReset();
    // The root vitest setup enables fake timers globally; findByTestId
    // poll loops use setInterval and never advance under fake time, so
    // restore real timers for these async-mock-driven assertions.
    vi.useRealTimers();
  });

  it('renders an explicit unavailable state instead of sample replacement when the live page fetch fails', async () => {
    mockedApiFetchJson.mockRejectedValue(new Error('schedule service unavailable'));

    render(<CostManual />);

    expect(await screen.findByTestId('cost-manual-unavailable')).toBeInTheDocument();
    expect(screen.queryByText('DEMO DATA')).not.toBeInTheDocument();
    expect(
      screen.getByText('Certified schedule rows are not being replaced with sample data on this surface.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Cost schedule unavailable. No certified schedule rows are being shown.')
    ).toBeInTheDocument();
  });

  it('renders governed primary and secondary live rows when the live page fetch succeeds', async () => {
    mockedApiFetchJson.mockResolvedValue([
      {
        code: 'R1',
        description: 'Single Family Residence',
        qualityClass: 'STANDARD',
        baseCost: 125.25,
        unit: '$/SF',
        effectiveDate: '2026-01-01',
      },
      {
        matrixType: 'SecondaryFeature',
        code: 'DETGAR',
        description: 'Detached Garage',
        secondaryFeaturePctOfBiv: 0.12,
        revalArea: 'Benton',
        effectiveDate: '2026-01-01',
      },
    ]);

    render(<CostManual />);

    expect(await screen.findByText('Single Family Residence')).toBeInTheDocument();
    expect(screen.queryByTestId('cost-manual-unavailable')).not.toBeInTheDocument();
    expect(screen.getByText('STANDARD')).toBeInTheDocument();
    expect(screen.getByText('$125.25')).toBeInTheDocument();
    expect(screen.getByText('Detached Garage')).toBeInTheDocument();
    expect(screen.getByText('12%')).toBeInTheDocument();
  });
});

describe('CostManualComponent honesty contract', () => {
  beforeEach(() => {
    mockedApiFetchJson.mockReset();
    mockedGetCostSchedule.mockReset();
    vi.useRealTimers();
  });

  it('clears stale rows and shows unavailable state when a subsequent governed fetch fails', async () => {
    mockedGetCostSchedule
      .mockResolvedValueOnce([
        {
          code: 'R1',
          description: 'Single Family Residence',
          qualityClass: 'STANDARD',
          baseCost: 125.25,
          unit: '$/SF',
          effectiveDate: '2026-01-01',
        },
      ])
      .mockRejectedValueOnce(new Error('schedule service unavailable'));

    const { rerender } = render(<CostManualComponent qualityClass="STANDARD" />);

    expect(await screen.findByText('Single Family Residence')).toBeInTheDocument();

    rerender(<CostManualComponent qualityClass="LUXURY" />);

    expect(
      await screen.findByTestId('cost-manual-component-unavailable')
    ).toBeInTheDocument();
    expect(screen.queryByText('Single Family Residence')).not.toBeInTheDocument();
    expect(
      screen.getByText('Cost schedule unavailable. No certified schedule rows are being shown.')
    ).toBeInTheDocument();
  });
});

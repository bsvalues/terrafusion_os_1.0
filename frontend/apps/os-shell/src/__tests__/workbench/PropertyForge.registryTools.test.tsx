import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import type { ReactElement } from 'react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as pilotApi from '../../api/pilotApi';
import { CostApproach } from '../../pages/workbench/tabs/forge/CostApproach';
import { ForgeOverview } from '../../pages/workbench/tabs/forge/ForgeOverview';

vi.mock('../../api/pilotApi');

vi.mock('../../hooks/forge/useForgeValuation', () => {
  const costData = {
    parcelId: '12345-001',
    taxYear: 2026,
    replacementCostNew: 320000,
    physicalDepreciation: 48000,
    physicalDepreciationPct: 15,
    functionalObsolescence: 0,
    functionalObsolescencePct: 0,
    externalObsolescence: 0,
    externalObsolescencePct: 0,
    depreciatedCost: 272000,
    landValue: 90000,
    indicatedValue: 362000,
    yearBuilt: 2010,
    effectiveAge: 12,
    qualityGrade: 'standard',
    conditionGrade: 'average',
    buildingSqFt: 2100,
    landAreaSqFt: 7200,
    landAreaAcres: 0.17,
    fireplaces: 1,
    countyPercentGood: 85,
    segments: [],
  };
  const emptySource = { data: null, loading: false, error: null, source: 'unavailable' as const };
  return {
    useCostApproach: () => ({ data: costData, loading: false, error: null, source: 'live' as const }),
    useSalesComparison: () => emptySource,
    useIncomeApproach: () => emptySource,
    useReconciliation: () => emptySource,
  };
});

const mockInvokeTool = pilotApi.invokeTool as vi.MockedFunction<typeof pilotApi.invokeTool>;

const renderWithParcel = (element: ReactElement, parcelId = '12345-001') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/property/${parcelId}/forge`]}>
        <Routes>
          <Route path='/property/:parcelId' element={<div><Outlet context={{ parcelId }} /></div>}>
            <Route path='forge' element={element} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('PropertyForge registry tool wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeTool.mockResolvedValue({
      success: true,
      correlationId: 'corr-forge-registry',
      result: { toolId: 'registry-tool', output: JSON.stringify({ ok: true }) },
    });
  });

  it('invokes calculate_depreciation from CostApproach with returned cost fields', async () => {
    renderWithParcel(<CostApproach taxYear={2026} onHistoryRecord={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Calculate Depreciation/i }));
    });

    await waitFor(() => {
      expect(mockInvokeTool).toHaveBeenCalledWith({
        toolId: 'calculate_depreciation',
        params: {
          county: 'benton',
          actualAge: 16,
          effectiveAge: 12,
          condition: 'average',
          quality: 'standard',
          replacementCostNew: 320000,
        },
        parcelId: '12345-001',
      });
    });
  });

  it('invokes classify_county_finding from ForgeOverview with finding context', async () => {
    renderWithParcel(<ForgeOverview taxYear={2026} onHistoryRecord={vi.fn()} history={[]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Classify County Finding/i }));
    });

    await waitFor(() => {
      expect(mockInvokeTool).toHaveBeenCalledWith({
        toolId: 'classify_county_finding',
        params: {
          county: 'benton',
          taxYear: 2026,
          scope: 'parcel',
          signal: 'condition',
          subjectId: 'finding-12345-001',
          includeSpatialContext: true,
        },
        parcelId: '12345-001',
      });
    });
  });
});
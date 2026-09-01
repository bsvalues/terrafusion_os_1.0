/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SaleFilterBar } from '../components/SaleFilterBar';
import { useSalesForgeStore } from '../salesForgeStore';

describe('SalesForge filter county scope', () => {
  beforeEach(() => {
    act(() => {
      const store = useSalesForgeStore.getState();
      store.applyCountyStudioScope('005', null);
      store.clearFilters();
    });
  });

  it('clears subordinate Spokane filters without falling back to Benton', () => {
    act(() => {
      const store = useSalesForgeStore.getState();
      store.applyCountyStudioScope('063', null);
      store.setFilterForm({ hood: 'SPK-01', minPrice: '250000' });
      store.applyFilters();
    });

    render(<SaleFilterBar />);

    expect(screen.getByRole('combobox', { name: 'County' })).toHaveValue('063');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    const state = useSalesForgeStore.getState();
    expect(state.filterForm.countyCode).toBe('063');
    expect(state.committedFilters.countyCode).toBe('063');
    expect(state.filterForm.hood).toBe('');
    expect(state.committedFilters.hood).toBeNull();
    expect(state.committedFilters.minPrice).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('does not present county scope itself as a clearable filter', () => {
    act(() => {
      useSalesForgeStore.getState().applyCountyStudioScope('063', null);
    });

    render(<SaleFilterBar />);

    expect(screen.getByRole('combobox', { name: 'County' })).toHaveValue('063');
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('atomically clears every Spokane-derived result before applying Adams scope', () => {
    act(() => {
      const store = useSalesForgeStore.getState();
      store.applyCountyStudioScope('063', null);
      useSalesForgeStore.setState({
        queueData: { total: 1, page: 1, pageSize: 25, items: [] },
        queueLoading: true,
        queueError: 'old queue error',
        selectedSaleId: 'spokane-sale',
        saleDetail: {} as never,
        detailLoading: true,
        detailError: 'old detail error',
        runningStats: {} as never,
        statsLoading: true,
        statsError: 'old stats error',
        patchState: { 'spokane-sale': 'done' },
        hoodStats: {} as never,
        hoodStatsLoading: true,
        hoodStatsError: 'old neighborhood error',
        codeAudit: {} as never,
        codeAuditLoading: true,
        codeAuditError: 'old code error',
      });
      store.setFilterForm({ countyCode: '001' });
      store.applyFilters();
    });

    const state = useSalesForgeStore.getState();
    expect(state.committedFilters.countyCode).toBe('001');
    expect(state.queueData).toBeNull();
    expect(state.queueLoading).toBe(false);
    expect(state.queueError).toBeNull();
    expect(state.selectedSaleId).toBeNull();
    expect(state.saleDetail).toBeNull();
    expect(state.detailLoading).toBe(false);
    expect(state.detailError).toBeNull();
    expect(state.runningStats).toBeNull();
    expect(state.statsLoading).toBe(false);
    expect(state.statsError).toBeNull();
    expect(state.patchState).toEqual({});
    expect(state.hoodStats).toBeNull();
    expect(state.hoodStatsLoading).toBe(false);
    expect(state.hoodStatsError).toBeNull();
    expect(state.codeAudit).toBeNull();
    expect(state.codeAuditLoading).toBe(false);
    expect(state.codeAuditError).toBeNull();
  });
});

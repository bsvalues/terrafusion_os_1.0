// frontend/apps/os-shell/src/pages/suites/modules/__tests__/CompsForgeModule.deeplink.test.tsx
//
// Task D3 — CompsForgeModule deeplink consumption.
// Verifies the mount-time handler for County Studio Inspector metadata:
//   - parcelIds (array or comma-separated string) → preloadedSampleIds populated
//   - segmentId + segmentLabel → Scoped From chip renders
//   - chip click → activateModule('county-studio', { metadata: { segmentId } })
//   - deeplinkQuery-only fallback parsing still produces the same effects
//   - no-metadata mount leaves handoff store pristine

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import CompsForgeModule from '../CompsForgeModule';
import { useCompsForgeHandoffStore } from '../compsForgeHandoffStore';

const activateModuleMock = vi.hoisted(() => vi.fn());
vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));

// Stub the comps-pool fetch so the component doesn't hit a real endpoint.
vi.mock('@/lib/apiBase', () => ({
  apiFetch: vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ total: 0, page: 1, pageSize: 12, items: [] }),
  }),
}));

vi.mock('@/api/pilotApi', () => ({
  invokeTool: vi.fn(),
}));

function resetStore() {
  act(() => {
    useCompsForgeHandoffStore.getState().clearHandoffContext();
  });
}

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('CompsForgeModule — County Studio deeplink consumption (Task D3)', () => {
  beforeEach(() => {
    activateModuleMock.mockReset();
    resetStore();
  });

  it('does not touch handoff store when no metadata is provided', () => {
    renderWithClient(<CompsForgeModule />);
    const s = useCompsForgeHandoffStore.getState();
    expect(s.preloadedSampleIds).toBeNull();
    expect(s.contextSegmentId).toBeNull();
    expect(screen.queryByTestId('cf-scoped-from-chip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cf-preloaded-section')).not.toBeInTheDocument();
  });

  it('consumes pre-split metadata (parcelIds array / segmentId / label) on mount', () => {
    renderWithClient(
      <CompsForgeModule
        metadata={{
          parcelIds:    ['HP-0', 'HP-1', 'HP-2'],
          segmentId:    'seg-42',
          segmentLabel: 'Kennewick NBHD-K1',
        }}
      />,
    );
    const s = useCompsForgeHandoffStore.getState();
    expect(s.preloadedSampleIds).toEqual(['HP-0', 'HP-1', 'HP-2']);
    expect(s.contextSegmentId).toBe('seg-42');
    expect(s.contextSegmentLabel).toBe('Kennewick NBHD-K1');

    const chip = screen.getByTestId('cf-scoped-from-chip');
    expect(chip).toHaveAttribute('data-segment-id', 'seg-42');
    expect(chip.textContent).toMatch(/Kennewick NBHD-K1/);

    const preloaded = screen.getByTestId('cf-preloaded-section');
    expect(preloaded).toBeInTheDocument();
    const items = screen.getAllByTestId('cf-preloaded-parcel');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveAttribute('data-parcel-id', 'HP-0');
  });

  it('falls back to parsing raw deeplinkQuery when pre-split fields are absent', () => {
    renderWithClient(
      <CompsForgeModule
        metadata={{ deeplinkQuery: '?segmentId=seg-7&sample=HP-A,HP-B' }}
      />,
    );
    const s = useCompsForgeHandoffStore.getState();
    expect(s.preloadedSampleIds).toEqual(['HP-A', 'HP-B']);
    expect(s.contextSegmentId).toBe('seg-7');

    const chip = screen.getByTestId('cf-scoped-from-chip');
    expect(chip.textContent).toMatch(/seg-7/);
  });

  it('Scoped From chip click fires activateModule("county-studio") with segmentId', () => {
    renderWithClient(
      <CompsForgeModule
        metadata={{ parcelIds: ['HP-X'], segmentId: 'seg-back', segmentLabel: 'Back Label' }}
      />,
    );
    const chip = screen.getByTestId('cf-scoped-from-chip');
    fireEvent.click(chip);
    expect(activateModuleMock).toHaveBeenCalledWith(
      'county-studio',
      expect.objectContaining({
        source: 'system',
        metadata: expect.objectContaining({ segmentId: 'seg-back' }),
      }),
    );
  });

  it('accepts comma-separated parcelIds string', () => {
    renderWithClient(
      <CompsForgeModule
        metadata={{ parcelIds: 'HP-1,HP-2,HP-3,HP-4', segmentId: 'seg-csv' }}
      />,
    );
    const s = useCompsForgeHandoffStore.getState();
    expect(s.preloadedSampleIds).toEqual(['HP-1', 'HP-2', 'HP-3', 'HP-4']);
    const items = screen.getAllByTestId('cf-preloaded-parcel');
    expect(items).toHaveLength(4);
  });
});

/**
 * useParcelSearch Hook Tests
 *
 * Slice 7.3: Validates the API-backed parcel search hook used by CommandPalette.
 *
 * @module shell/command-palette/__tests__/useParcelSearch.test
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useParcelSearch } from '../useParcelSearch';

// ============================================================================
// Mocks
// ============================================================================

// The hook uses getDataProvider().search(), not atlasService directly.
const mockSearch = vi.fn();

vi.mock('../../../services/dataProvider', () => ({
  getDataProvider: () => ({
    search: (...args: unknown[]) => mockSearch(...args),
  }),
}));

// ============================================================================
// Helpers
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockSearch.mockResolvedValue({
    items: [],
    total: 0,
    hasMore: false,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// Hook call shape: { text, pageSize }; response shape: { items: [{ parcelId, address, ownerName }] }
const SAMPLE_RESULTS = {
  items: [
    { parcelId: 'P001', address: '123 Main St', ownerName: 'John Doe' },
    { parcelId: 'P002', address: '456 Oak Ave', ownerName: 'Jane Smith' },
  ],
  total: 2,
  hasMore: false,
};

// ============================================================================
// Tests
// ============================================================================

describe('useParcelSearch', () => {
  describe('initial state', () => {
    it('returns empty results, not loading, no error initially', () => {
      const { result } = renderHook(() => useParcelSearch('', true));
      expect(result.current.results).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('query gating', () => {
    it('does not search when disabled', async () => {
      renderHook(() => useParcelSearch('Main Street', false));
      await act(async () => { vi.advanceTimersByTime(500); });
      expect(mockSearch).not.toHaveBeenCalled();
    });

    it('does not search when query is shorter than 3 chars', async () => {
      renderHook(() => useParcelSearch('ab', true));
      await act(async () => { vi.advanceTimersByTime(500); });
      expect(mockSearch).not.toHaveBeenCalled();
    });

    it('does not search when query is all digits (handled by existing shortcut)', async () => {
      renderHook(() => useParcelSearch('123456', true));
      await act(async () => { vi.advanceTimersByTime(500); });
      expect(mockSearch).not.toHaveBeenCalled();
    });

    it('does search when query is 3+ non-digit characters', async () => {
      mockSearch.mockResolvedValue(SAMPLE_RESULTS);
      renderHook(() => useParcelSearch('Main', true));
      await act(async () => { vi.advanceTimersByTime(500); });
      expect(mockSearch).toHaveBeenCalledWith({ text: 'Main', pageSize: 5 });
    });

    it('searches for mixed alphanumeric queries', async () => {
      mockSearch.mockResolvedValue(SAMPLE_RESULTS);
      renderHook(() => useParcelSearch('123 Main', true));
      await act(async () => { vi.advanceTimersByTime(500); });
      expect(mockSearch).toHaveBeenCalledWith({ text: '123 Main', pageSize: 5 });
    });
  });

  describe('debounce behavior', () => {
    it('does not call API before debounce period', async () => {
      renderHook(() => useParcelSearch('Main St', true));
      await act(async () => { vi.advanceTimersByTime(200); });
      expect(mockSearch).not.toHaveBeenCalled();
    });

    it('calls API after debounce period (300ms)', async () => {
      mockSearch.mockResolvedValue(SAMPLE_RESULTS);
      renderHook(() => useParcelSearch('Main St', true));
      await act(async () => { vi.advanceTimersByTime(300); });
      expect(mockSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe('result mapping', () => {
    it('maps API results to ParcelSearchResult shape', async () => {
      mockSearch.mockResolvedValue(SAMPLE_RESULTS);
      const { result } = renderHook(() => useParcelSearch('Main', true));

      await act(async () => { vi.advanceTimersByTime(500); });

      expect(result.current.results).toEqual([
        { parcelNumber: 'P001', address: '123 Main St', ownerName: 'John Doe' },
        { parcelNumber: 'P002', address: '456 Oak Ave', ownerName: 'Jane Smith' },
      ]);
    });

    it('sets isLoading true while waiting for response', () => {
      // Use a never-resolving promise to keep loading state
      mockSearch.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() => useParcelSearch('Main', true));

      act(() => { vi.advanceTimersByTime(300); });

      // isLoading should be true after debounce fires but before resolve
      expect(result.current.isLoading).toBe(true);
    });

    it('sets isLoading false after response', async () => {
      mockSearch.mockResolvedValue(SAMPLE_RESULTS);
      const { result } = renderHook(() => useParcelSearch('Main', true));

      await act(async () => { vi.advanceTimersByTime(500); });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('sets error and empty results on API failure', async () => {
      mockSearch.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useParcelSearch('Main St', true));

      await act(async () => { vi.advanceTimersByTime(500); });

      expect(result.current.results).toEqual([]);
      expect(result.current.error).toBe('Parcel search failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('clears results when query becomes empty', async () => {
      mockSearch.mockResolvedValue(SAMPLE_RESULTS);
      const { result, rerender } = renderHook(
        ({ q, e }) => useParcelSearch(q, e),
        { initialProps: { q: 'Main', e: true } }
      );

      await act(async () => { vi.advanceTimersByTime(500); });
      expect(result.current.results).toHaveLength(2);

      rerender({ q: '', e: true });
      expect(result.current.results).toEqual([]);
    });

    it('clears results when disabled', async () => {
      mockSearch.mockResolvedValue(SAMPLE_RESULTS);
      const { result, rerender } = renderHook(
        ({ q, e }) => useParcelSearch(q, e),
        { initialProps: { q: 'Main', e: true } }
      );

      await act(async () => { vi.advanceTimersByTime(500); });
      expect(result.current.results).toHaveLength(2);

      rerender({ q: 'Main', e: false });
      expect(result.current.results).toEqual([]);
    });
  });
});

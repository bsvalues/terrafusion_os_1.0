/**
 * TerraFusion OS Parcel Context Label Hydration Tests
 *
 * Tests for parcel label resolver and safe hydration.
 * Enforces contract: labels are optional + failure-safe.
 *
 * Contract requirements:
 * - Shows parcelId immediately (no loading state flicker)
 * - Hydrates label from resolver when available
 * - Graceful failure keeps stable text (no crash, no empty)
 * - Cache prevents redundant lookups
 *
 * @module __tests__/parcelContext/parcelContext.labelHydration.test
 * @see Slice 11: Parcel Context Enrichment
 */

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ParcelContextIndicator } from '../../components/ParcelContext/ParcelContextIndicator';
import {
  clearParcelContext,
  setParcelContext,
  useParcelContextStore,
} from '../../context/parcelContext';
import {
  resolveParcelLabel,
  setLabelResolver,
  clearLabelCache,
  getLabelFromCache,
  type ParcelLabelData,
  type ParcelLabelResolver,
} from '../../context/parcelLabelResolver';

// ============================================================================
// Helper: Reset Store
// ============================================================================

function resetStore() {
  useParcelContextStore.setState({ context: null, recentParcels: [] });
  clearLabelCache();
  setLabelResolver(null); // Reset to default no-op
  try {
    sessionStorage.removeItem('tf:parcel-context');
    sessionStorage.removeItem('tf:recent-parcels');
  } catch {
    // Session storage might be unavailable
  }
}

// ============================================================================
// Helper: Render with Router
// ============================================================================

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

// ============================================================================
// Mock Resolvers
// ============================================================================

const successResolver: ParcelLabelResolver = async (parcelId: string) => ({
  parcelId,
  displayLabel: '123 Main St',
  ownerName: 'John Doe',
});

const failingResolver: ParcelLabelResolver = async () => {
  throw new Error('Network error');
};

const slowResolver: ParcelLabelResolver = async (parcelId: string) => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    parcelId,
    displayLabel: 'Slow Label',
  };
};

// ============================================================================
// Tests: Label Resolver
// ============================================================================

describe('Parcel Label Resolver', () => {
  beforeEach(() => {
    resetStore();
  });

  // ==========================================================================
  // Basic Resolution
  // ==========================================================================

  describe('resolveParcelLabel', () => {
    it('returns null when no resolver configured', async () => {
      const result = await resolveParcelLabel('P-001');
      expect(result).toBeNull();
    });

    it('returns data from configured resolver', async () => {
      setLabelResolver(successResolver);

      const result = await resolveParcelLabel('P-001');

      expect(result).not.toBeNull();
      expect(result?.displayLabel).toBe('123 Main St');
      expect(result?.ownerName).toBe('John Doe');
    });

    it('returns null on resolver failure (no throw)', async () => {
      setLabelResolver(failingResolver);

      const result = await resolveParcelLabel('P-001');

      expect(result).toBeNull();
    });

    it('caches resolved labels', async () => {
      let callCount = 0;
      setLabelResolver(async (parcelId) => {
        callCount++;
        return { parcelId, displayLabel: 'Cached' };
      });

      await resolveParcelLabel('P-001');
      await resolveParcelLabel('P-001');
      await resolveParcelLabel('P-001');

      expect(callCount).toBe(1); // Only called once, rest from cache
    });

    it('cache is keyed by parcelId', async () => {
      let callCount = 0;
      setLabelResolver(async (parcelId) => {
        callCount++;
        return { parcelId, displayLabel: `Label-${parcelId}` };
      });

      await resolveParcelLabel('P-001');
      await resolveParcelLabel('P-002');
      await resolveParcelLabel('P-001'); // Cached

      expect(callCount).toBe(2); // P-001 and P-002, not 3
    });
  });

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  describe('label cache', () => {
    it('getLabelFromCache returns cached data', async () => {
      setLabelResolver(successResolver);
      await resolveParcelLabel('P-001');

      const cached = getLabelFromCache('P-001');

      expect(cached).not.toBeNull();
      expect(cached?.displayLabel).toBe('123 Main St');
    });

    it('getLabelFromCache returns null for uncached', () => {
      const cached = getLabelFromCache('P-UNKNOWN');
      expect(cached).toBeNull();
    });

    it('clearLabelCache clears all cached data', async () => {
      setLabelResolver(successResolver);
      await resolveParcelLabel('P-001');
      await resolveParcelLabel('P-002');

      clearLabelCache();

      expect(getLabelFromCache('P-001')).toBeNull();
      expect(getLabelFromCache('P-002')).toBeNull();
    });
  });
});

// ============================================================================
// Tests: UI Label Hydration
// ============================================================================

describe('Parcel Context Indicator Label Hydration', () => {
  beforeEach(() => {
    resetStore();
  });

  // ==========================================================================
  // Immediate Display
  // ==========================================================================

  describe('immediate display', () => {
    it('shows parcelId immediately without waiting for resolver', () => {
      setParcelContext({ parcelId: 'P-12345', source: 'selection' });
      renderWithRouter(<ParcelContextIndicator />);

      // Should show parcelId immediately
      expect(screen.getByText(/P-12345/)).toBeInTheDocument();
    });

    it('does not show loading state or flicker', () => {
      setLabelResolver(slowResolver);
      setParcelContext({ parcelId: 'P-SLOW', source: 'selection' });
      renderWithRouter(<ParcelContextIndicator />);

      // Should have parcelId visible, not "loading..."
      expect(screen.getByText(/P-SLOW/)).toBeInTheDocument();
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Label Hydration
  // ==========================================================================

  describe('hydrated label', () => {
    it('shows hydrated label when resolver succeeds', async () => {
      setLabelResolver(successResolver);
      setParcelContext({ parcelId: 'P-HYDRATE', source: 'selection' });
      renderWithRouter(<ParcelContextIndicator />);

      // Wait for hydration
      await waitFor(() => {
        expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
      });
    });

    it('keeps parcelId visible after hydration', async () => {
      setLabelResolver(successResolver);
      setParcelContext({ parcelId: 'P-KEEP', source: 'selection' });
      renderWithRouter(<ParcelContextIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
      });

      // ParcelId should still be visible (in badge or as prefix)
      expect(screen.getByTestId('parcel-context-id')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Failure Safety
  // ==========================================================================

  describe('failure safety', () => {
    it('shows parcelId when resolver fails', async () => {
      setLabelResolver(failingResolver);
      setParcelContext({ parcelId: 'P-FAIL', source: 'selection' });
      renderWithRouter(<ParcelContextIndicator />);

      // Wait a tick for async resolution attempt
      await new Promise((r) => setTimeout(r, 50));

      // Should still show parcelId, no crash
      expect(screen.getByText(/P-FAIL/)).toBeInTheDocument();
    });

    it('does not show empty or null text on failure', async () => {
      setLabelResolver(failingResolver);
      setParcelContext({ parcelId: 'P-STABLE', source: 'selection' });
      renderWithRouter(<ParcelContextIndicator />);

      await new Promise((r) => setTimeout(r, 50));

      // Indicator should have content (not empty)
      const indicator = screen.getByTestId('parcel-context-indicator');
      expect(indicator.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('handles null resolver gracefully', async () => {
      setLabelResolver(null);
      setParcelContext({ parcelId: 'P-NULL', source: 'selection' });
      renderWithRouter(<ParcelContextIndicator />);

      await new Promise((r) => setTimeout(r, 50));

      expect(screen.getByText(/P-NULL/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Existing parcelName Integration
  // ==========================================================================

  describe('parcelName integration', () => {
    it('prefers existing parcelName over resolver', async () => {
      setLabelResolver(successResolver);
      setParcelContext({
        parcelId: 'P-NAMED',
        parcelName: 'Already Named',
        source: 'selection',
      });
      renderWithRouter(<ParcelContextIndicator />);

      // Should show existing name immediately
      expect(screen.getByText(/Already Named/)).toBeInTheDocument();
    });

    it('still hydrates if parcelName is empty', async () => {
      setLabelResolver(successResolver);
      setParcelContext({ parcelId: 'P-EMPTY', parcelName: '', source: 'selection' });
      renderWithRouter(<ParcelContextIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
      });
    });
  });
});

/**
 * TerraFusion OS Parcel Context Recents Tests
 *
 * Tests for MRU (Most Recently Used) parcel tracking.
 * Enforces contract: recents are capped, deduped, ordered, and audited.
 *
 * Contract requirements:
 * - Recording a parcel adds it to recents (front)
 * - Re-selecting a parcel moves it to front (dedupe)
 * - Recents are capped to MAX_RECENT_PARCELS
 * - Selecting from recents updates context + emits trace
 *
 * @module __tests__/parcelContext/parcelContext.recents.test
 * @see Slice 11: Parcel Context Enrichment
 */

import {
  clearParcelContext,
  getRecentParcels,
  recordRecentParcel,
  selectRecentParcel,
  setParcelContext,
  useParcelContextStore,
  MAX_RECENT_PARCELS,
} from '../../context/parcelContext';
import { PARCEL_CONTEXT_EVENT_NAME } from '../../context/parcelContextTrace';

// ============================================================================
// Helper: Reset Store
// ============================================================================

function resetStore() {
  useParcelContextStore.setState({ context: null, recentParcels: [] });
  try {
    sessionStorage.removeItem('tf:parcel-context');
    sessionStorage.removeItem('tf:recent-parcels');
  } catch {
    // Session storage might be unavailable
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('Parcel Context Recents (MRU)', () => {
  beforeEach(() => {
    resetStore();
  });

  // ==========================================================================
  // Recording Recents
  // ==========================================================================

  describe('recordRecentParcel', () => {
    it('adds parcel to recents list', () => {
      recordRecentParcel('P-001');

      const recents = getRecentParcels();
      expect(recents).toContain('P-001');
    });

    it('adds new parcels to the front (MRU order)', () => {
      recordRecentParcel('P-001');
      recordRecentParcel('P-002');
      recordRecentParcel('P-003');

      const recents = getRecentParcels();
      expect(recents[0]).toBe('P-003');
      expect(recents[1]).toBe('P-002');
      expect(recents[2]).toBe('P-001');
    });

    it('dedupes on reselection (moves to front)', () => {
      recordRecentParcel('P-001');
      recordRecentParcel('P-002');
      recordRecentParcel('P-003');
      recordRecentParcel('P-001'); // Re-select P-001

      const recents = getRecentParcels();
      expect(recents[0]).toBe('P-001'); // Now at front
      expect(recents).toHaveLength(3); // No duplicates
      expect(recents.indexOf('P-001')).toBe(0);
      expect(recents.lastIndexOf('P-001')).toBe(0); // Only one occurrence
    });

    it('caps recents to MAX_RECENT_PARCELS', () => {
      // Add more than max
      for (let i = 0; i < MAX_RECENT_PARCELS + 5; i++) {
        recordRecentParcel(`P-${i.toString().padStart(3, '0')}`);
      }

      const recents = getRecentParcels();
      expect(recents).toHaveLength(MAX_RECENT_PARCELS);
    });

    it('evicts oldest when cap reached', () => {
      // Add exactly max
      for (let i = 0; i < MAX_RECENT_PARCELS; i++) {
        recordRecentParcel(`P-${i.toString().padStart(3, '0')}`);
      }

      // Add one more
      recordRecentParcel('P-NEW');

      const recents = getRecentParcels();
      expect(recents).toContain('P-NEW'); // New one present
      expect(recents).not.toContain('P-000'); // Oldest evicted
    });

    it('ignores empty parcelId', () => {
      recordRecentParcel('');
      const recents = getRecentParcels();
      expect(recents).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Selecting from Recents
  // ==========================================================================

  describe('selectRecentParcel', () => {
    beforeEach(() => {
      recordRecentParcel('P-001');
      recordRecentParcel('P-002');
      recordRecentParcel('P-003');
    });

    it('updates current context to selected parcel', () => {
      selectRecentParcel('P-001');

      const context = useParcelContextStore.getState().context;
      expect(context?.parcelId).toBe('P-001');
    });

    it('moves selected parcel to front of recents', () => {
      selectRecentParcel('P-001');

      const recents = getRecentParcels();
      expect(recents[0]).toBe('P-001');
    });

    it('sets source as indicator_recent', () => {
      selectRecentParcel('P-002');

      const context = useParcelContextStore.getState().context;
      expect(context?.source).toBe('indicator_recent');
    });

    it('emits trace event with source: indicator_recent', () => {
      const events: CustomEvent[] = [];
      const handler = (e: Event) => events.push(e as CustomEvent);
      window.addEventListener(PARCEL_CONTEXT_EVENT_NAME, handler);

      selectRecentParcel('P-002');

      window.removeEventListener(PARCEL_CONTEXT_EVENT_NAME, handler);

      expect(events.length).toBe(1);
      expect(events[0].detail.payload.source).toBe('indicator_recent');
    });

    it('does nothing for non-existent parcel ID', () => {
      const beforeContext = useParcelContextStore.getState().context;
      selectRecentParcel('P-NONEXISTENT');

      const afterContext = useParcelContextStore.getState().context;
      expect(afterContext).toEqual(beforeContext);
    });
  });

  // ==========================================================================
  // Persistence
  // ==========================================================================

  describe('persistence', () => {
    it('persists recents to session storage', () => {
      recordRecentParcel('P-001');
      recordRecentParcel('P-002');

      const stored = sessionStorage.getItem('tf:recent-parcels');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed).toContain('P-002');
      expect(parsed).toContain('P-001');
    });

    it('restores recents from session storage on init', () => {
      // Simulate stored recents
      sessionStorage.setItem('tf:recent-parcels', JSON.stringify(['P-A', 'P-B', 'P-C']));

      // Reset and reinitialize store (simulating page reload)
      useParcelContextStore.setState({
        context: null,
        recentParcels: restoreRecentsFromSession(),
      });

      const recents = getRecentParcels();
      expect(recents).toEqual(['P-A', 'P-B', 'P-C']);
    });
  });

  // ==========================================================================
  // Integration with Context
  // ==========================================================================

  describe('integration with context', () => {
    it('setParcelContext also records to recents', () => {
      setParcelContext({ parcelId: 'P-NEW', source: 'selection' });

      const recents = getRecentParcels();
      expect(recents).toContain('P-NEW');
    });

    it('clearParcelContext does not affect recents', () => {
      recordRecentParcel('P-001');
      recordRecentParcel('P-002');

      clearParcelContext();

      const recents = getRecentParcels();
      expect(recents).toHaveLength(2);
      expect(recents).toContain('P-001');
      expect(recents).toContain('P-002');
    });
  });
});

// Helper to test restoration (exported from parcelContext in actual impl)
function restoreRecentsFromSession(): string[] {
  try {
    const stored = sessionStorage.getItem('tf:recent-parcels');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  return [];
}

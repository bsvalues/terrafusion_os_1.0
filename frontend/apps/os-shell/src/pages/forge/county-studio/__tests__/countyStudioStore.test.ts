/**
 * TerraFusion County Studio Store Tests
 *
 * Tests for County Studio Zustand store:
 * - Initial state validation
 * - Study, segment, sync state, metric, and selection mutations
 *
 * @module pages/forge/county-studio/__tests__/countyStudioStore.test
 * @vitest-environment jsdom
 */

import { act } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountyStudySessionDto } from '../types/countyStudio.types';

// ============================================================================
// Helpers
// ============================================================================

const MOCK_STUDY: CountyStudySessionDto = {
  studyId: 'study-abc-123',
  countyId: 'benton-wa',
  taxYear: 2026,
  studyType: 'RatioStudy',
  status: 'Active',
  baselineVersion: null,
  activeSegmentSetId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  createdBy: 'assessor@benton.wa.gov',
  updatedBy: 'assessor@benton.wa.gov',
};

// ============================================================================
// Reset before each test
// ============================================================================

beforeEach(() => {
  act(() => {
    const store = useCountyStudioStore.getState();
    store.setStudy(null);
    store.setSegments([]);
    store.setCohorts([]);
    store.setScenarios([]);
    store.selectSegment(null);
    store.setActiveScenario(null);
    store.setScenarioPreview(null);
    store.setSyncState('DISCONNECTED');
    store.setActiveMetric('ratio');
    store.setPendingSelection(null);
  });
});

// ============================================================================
// Tests
// ============================================================================

describe('countyStudioStore', () => {
  describe('Initial State', () => {
    it('activeStudy is null by default', () => {
      const { activeStudy } = useCountyStudioStore.getState();
      expect(activeStudy).toBeNull();
    });

    it('syncState is DISCONNECTED by default', () => {
      const { syncState } = useCountyStudioStore.getState();
      expect(syncState).toBe('DISCONNECTED');
    });

    it('segments is an empty array by default', () => {
      const { segments } = useCountyStudioStore.getState();
      expect(segments).toEqual([]);
    });

    it('selectedSegmentId is null by default', () => {
      const { selectedSegmentId } = useCountyStudioStore.getState();
      expect(selectedSegmentId).toBeNull();
    });

    it('activeMetric is "ratio" by default', () => {
      const { activeMetric } = useCountyStudioStore.getState();
      expect(activeMetric).toBe('ratio');
    });

    it('pendingSelection is null by default', () => {
      const { pendingSelection } = useCountyStudioStore.getState();
      expect(pendingSelection).toBeNull();
    });
  });

  describe('setStudy', () => {
    it('updates activeStudy.studyId', () => {
      act(() => {
        useCountyStudioStore.getState().setStudy(MOCK_STUDY);
      });

      const { activeStudy } = useCountyStudioStore.getState();
      expect(activeStudy?.studyId).toBe('study-abc-123');
    });
  });

  describe('selectSegment', () => {
    it('updates selectedSegmentId', () => {
      act(() => {
        useCountyStudioStore.getState().selectSegment('seg-001');
      });

      const { selectedSegmentId } = useCountyStudioStore.getState();
      expect(selectedSegmentId).toBe('seg-001');
    });
  });

  describe('setSyncState', () => {
    it('transitions syncState to LIVE', () => {
      act(() => {
        useCountyStudioStore.getState().setSyncState('LIVE');
      });

      const { syncState } = useCountyStudioStore.getState();
      expect(syncState).toBe('LIVE');
    });
  });

  describe('setPendingSelection', () => {
    it('stores selection with parcelCount', () => {
      act(() => {
        useCountyStudioStore.getState().setPendingSelection({
          parcelIds: ['parcel-1', 'parcel-2', 'parcel-3'],
          source: 'lasso',
          parcelCount: 3,
        });
      });

      const { pendingSelection } = useCountyStudioStore.getState();
      expect(pendingSelection?.parcelCount).toBe(3);
      expect(pendingSelection?.source).toBe('lasso');
      expect(pendingSelection?.parcelIds).toHaveLength(3);
    });
  });
});

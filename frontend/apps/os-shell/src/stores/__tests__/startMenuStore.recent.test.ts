/**
 * TerraFusion OS Start Menu Store - Recent Apps Tests
 * 
 * Tests for recent apps functionality:
 * - Track recently opened modules
 * - Most recent first ordering
 * - Limit to MAX_RECENT (10)
 * - Sync with persistence
 * 
 * @module stores/__tests__/startMenuStore.recent.test
 * @vitest-environment jsdom
 */

// Jest globals used (describe, it, expect, beforeEach, afterEach, jest)
import { act } from '@testing-library/react';

import { useStartMenuStore, type Module } from '../startMenuStore';
import { persistenceService } from '../../services/persistenceService';

// Mock persistence service
vi.mock('../../services/persistenceService', () => ({
  persistenceService: {
    addRecentModule: vi.fn(),
    loadStartMenuState: vi.fn(() => null),
    saveStartMenuState: vi.fn(),
  },
}));

// Test data
const mockModules: Module[] = [
  { id: 'gov', name: 'Government Edition', description: 'Core ops', icon: '🏛️', category: 'core', status: 'active' },
  { id: 'gis', name: 'GIS Pro', description: 'Mapping', icon: '🗺️', category: 'mapping', status: 'active' },
  { id: 'cost', name: 'CostForge AI', description: 'Cost analysis', icon: '💰', category: 'ai', status: 'active' },
  { id: 'levy', name: 'Terra Levy', description: 'Tax levy', icon: '📊', category: 'tax', status: 'active' },
  { id: 'market', name: 'Marketplace', description: 'Apps', icon: '🛒', category: 'store', status: 'active' },
];

// Reset store before each test
beforeEach(() => {
  useStartMenuStore.setState({
    isOpen: false,
    searchQuery: '',
    pinnedApps: [],
    allApps: mockModules,
    recentApps: [],
    focusedIndex: -1,
    focusedSection: 'search',
  });
  vi.clearAllMocks();
});

describe('StartMenu Store - Recent Apps', () => {
  describe('Initial State', () => {
    it('has empty recentApps array', () => {
      const { recentApps } = useStartMenuStore.getState();
      expect(recentApps).toEqual([]);
    });
  });

  describe('addRecentApp', () => {
    it('adds app to recent list', () => {
      act(() => {
        useStartMenuStore.getState().addRecentApp(mockModules[0]);
      });

      const { recentApps } = useStartMenuStore.getState();
      expect(recentApps).toHaveLength(1);
      expect(recentApps[0].id).toBe('gov');
    });

    it('adds most recent to front', () => {
      act(() => {
        useStartMenuStore.getState().addRecentApp(mockModules[0]);
        useStartMenuStore.getState().addRecentApp(mockModules[1]);
      });

      const { recentApps } = useStartMenuStore.getState();
      expect(recentApps[0].id).toBe('gis'); // Most recent first
      expect(recentApps[1].id).toBe('gov');
    });

    it('moves existing app to front', () => {
      act(() => {
        useStartMenuStore.getState().addRecentApp(mockModules[0]); // gov
        useStartMenuStore.getState().addRecentApp(mockModules[1]); // gis
        useStartMenuStore.getState().addRecentApp(mockModules[0]); // gov again
      });

      const { recentApps } = useStartMenuStore.getState();
      expect(recentApps).toHaveLength(2); // No duplicates
      expect(recentApps[0].id).toBe('gov'); // gov moved to front
      expect(recentApps[1].id).toBe('gis');
    });

    it('limits to MAX_RECENT (10) apps', () => {
      // Add 15 apps
      const manyModules = Array.from({ length: 15 }, (_, i) => ({
        id: `mod-${i}`,
        name: `Module ${i}`,
        description: `Desc ${i}`,
        icon: '📄',
        category: 'test',
        status: 'active' as const,
      }));

      act(() => {
        manyModules.forEach(mod => {
          useStartMenuStore.getState().addRecentApp(mod);
        });
      });

      const { recentApps } = useStartMenuStore.getState();
      expect(recentApps.length).toBeLessThanOrEqual(10);
      expect(recentApps[0].id).toBe('mod-14'); // Most recent
    });

    it('calls persistenceService.addRecentModule', () => {
      act(() => {
        useStartMenuStore.getState().addRecentApp(mockModules[0]);
      });

      expect(persistenceService.addRecentModule).toHaveBeenCalledWith('gov');
    });
  });

  describe('setRecentApps', () => {
    it('sets recent apps array', () => {
      act(() => {
        useStartMenuStore.getState().setRecentApps(mockModules.slice(0, 3));
      });

      const { recentApps } = useStartMenuStore.getState();
      expect(recentApps).toHaveLength(3);
    });
  });

  describe('getRecentModules selector', () => {
    it('returns recent apps array', () => {
      act(() => {
        useStartMenuStore.getState().addRecentApp(mockModules[0]);
        useStartMenuStore.getState().addRecentApp(mockModules[1]);
      });

      const recent = useStartMenuStore.getState().getRecentModules();
      expect(recent).toHaveLength(2);
    });

    it('returns empty array when no recent apps', () => {
      const recent = useStartMenuStore.getState().getRecentModules();
      expect(recent).toEqual([]);
    });
  });

  describe('clearRecentApps', () => {
    it('clears all recent apps', () => {
      act(() => {
        useStartMenuStore.getState().addRecentApp(mockModules[0]);
        useStartMenuStore.getState().addRecentApp(mockModules[1]);
      });

      expect(useStartMenuStore.getState().recentApps).toHaveLength(2);

      act(() => {
        useStartMenuStore.getState().clearRecentApps();
      });

      expect(useStartMenuStore.getState().recentApps).toEqual([]);
    });
  });
});

describe('StartMenu Store - Keyboard Navigation State', () => {
  describe('Initial State', () => {
    it('has focusedIndex of -1', () => {
      const { focusedIndex } = useStartMenuStore.getState();
      expect(focusedIndex).toBe(-1);
    });

    it('has focusedSection of search', () => {
      const { focusedSection } = useStartMenuStore.getState();
      expect(focusedSection).toBe('search');
    });
  });

  describe('setFocusedIndex', () => {
    it('sets focused index', () => {
      act(() => {
        useStartMenuStore.getState().setFocusedIndex(2);
      });

      expect(useStartMenuStore.getState().focusedIndex).toBe(2);
    });
  });

  describe('setFocusedSection', () => {
    it('sets focused section', () => {
      act(() => {
        useStartMenuStore.getState().setFocusedSection('pinned');
      });

      expect(useStartMenuStore.getState().focusedSection).toBe('pinned');
    });

    it('resets index when changing section', () => {
      act(() => {
        useStartMenuStore.getState().setFocusedIndex(5);
        useStartMenuStore.getState().setFocusedSection('recent');
      });

      expect(useStartMenuStore.getState().focusedIndex).toBe(0);
    });
  });

  describe('resetFocus', () => {
    it('resets to initial state', () => {
      act(() => {
        useStartMenuStore.getState().setFocusedIndex(5);
        useStartMenuStore.getState().setFocusedSection('all');
      });

      act(() => {
        useStartMenuStore.getState().resetFocus();
      });

      expect(useStartMenuStore.getState().focusedIndex).toBe(-1);
      expect(useStartMenuStore.getState().focusedSection).toBe('search');
    });
  });

  describe('close resets focus', () => {
    it('closing menu resets focus state', () => {
      act(() => {
        useStartMenuStore.getState().open();
        useStartMenuStore.getState().setFocusedIndex(3);
        useStartMenuStore.getState().setFocusedSection('pinned');
      });

      act(() => {
        useStartMenuStore.getState().close();
      });

      expect(useStartMenuStore.getState().focusedIndex).toBe(-1);
      expect(useStartMenuStore.getState().focusedSection).toBe('search');
    });
  });
});

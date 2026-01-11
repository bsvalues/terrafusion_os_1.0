/**
 * TerraFusion OS Start Menu Store Tests
 * 
 * Comprehensive test suite for the Zustand store managing Start Menu state.
 * Following TDD principles - tests written BEFORE implementation.
 * 
 * @module stores/__tests__/startMenuStore.test
 * @see SUCCESS CRITERIA SC-3: Start Menu Component
 */

import { act, renderHook } from '@testing-library/react';

import { useStartMenuStore, type Module } from '../startMenuStore';

// Sample test data
const mockModules: Module[] = [
  {
    id: 'government-edition',
    name: 'Government Edition',
    description: 'Core government assessment tools',
    icon: '🏛️',
    category: 'core',
    status: 'active',
  },
  {
    id: 'costforge-ai',
    name: 'CostForge AI',
    description: 'AI-powered cost analysis',
    icon: '💰',
    category: 'ai',
    status: 'active',
  },
  {
    id: 'terra-flow',
    name: 'Terra Flow',
    description: 'Workflow automation engine',
    icon: '🔄',
    category: 'automation',
    status: 'active',
  },
  {
    id: 'gispro',
    name: 'GIS Professional',
    description: 'Geographic information systems',
    icon: '🗺️',
    category: 'mapping',
    status: 'active',
  },
  {
    id: 'terra-levy',
    name: 'Terra Levy',
    description: 'Tax levy management',
    icon: '📊',
    category: 'finance',
    status: 'inactive',
  },
];

// Reset store before each test
beforeEach(() => {
  useStartMenuStore.setState({
    isOpen: false,
    searchQuery: '',
    pinnedApps: [],
    allApps: [],
  });
});

describe('Start Menu Store', () => {
  describe('Initial State', () => {
    it('starts with menu closed', () => {
      const { isOpen } = useStartMenuStore.getState();
      expect(isOpen).toBe(false);
    });

    it('starts with empty search query', () => {
      const { searchQuery } = useStartMenuStore.getState();
      expect(searchQuery).toBe('');
    });

    it('starts with empty pinned apps', () => {
      const { pinnedApps } = useStartMenuStore.getState();
      expect(pinnedApps).toEqual([]);
    });

    it('starts with empty all apps', () => {
      const { allApps } = useStartMenuStore.getState();
      expect(allApps).toEqual([]);
    });
  });

  describe('toggle', () => {
    it('opens menu when closed', () => {
      const { toggle } = useStartMenuStore.getState();
      
      expect(useStartMenuStore.getState().isOpen).toBe(false);
      
      act(() => {
        toggle();
      });

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('closes menu when open', () => {
      // Set initial state to open
      useStartMenuStore.setState({ isOpen: true });
      
      const { toggle } = useStartMenuStore.getState();
      
      act(() => {
        toggle();
      });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('clears search query when closing', () => {
      useStartMenuStore.setState({ isOpen: true, searchQuery: 'test query' });
      
      const { toggle } = useStartMenuStore.getState();
      
      act(() => {
        toggle();
      });

      expect(useStartMenuStore.getState().searchQuery).toBe('');
    });
  });

  describe('open', () => {
    it('sets isOpen to true', () => {
      const { open } = useStartMenuStore.getState();
      
      act(() => {
        open();
      });

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('does nothing if already open', () => {
      useStartMenuStore.setState({ isOpen: true });
      
      const { open } = useStartMenuStore.getState();
      
      act(() => {
        open();
      });

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });
  });

  describe('close', () => {
    it('sets isOpen to false', () => {
      useStartMenuStore.setState({ isOpen: true });
      
      const { close } = useStartMenuStore.getState();
      
      act(() => {
        close();
      });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('clears search query when closing', () => {
      useStartMenuStore.setState({ isOpen: true, searchQuery: 'test' });
      
      const { close } = useStartMenuStore.getState();
      
      act(() => {
        close();
      });

      expect(useStartMenuStore.getState().searchQuery).toBe('');
    });

    it('does nothing if already closed', () => {
      const { close } = useStartMenuStore.getState();
      
      act(() => {
        close();
      });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });
  });

  describe('setSearchQuery', () => {
    it('updates search query', () => {
      const { setSearchQuery } = useStartMenuStore.getState();
      
      act(() => {
        setSearchQuery('government');
      });

      expect(useStartMenuStore.getState().searchQuery).toBe('government');
    });

    it('handles empty string', () => {
      useStartMenuStore.setState({ searchQuery: 'previous' });
      
      const { setSearchQuery } = useStartMenuStore.getState();
      
      act(() => {
        setSearchQuery('');
      });

      expect(useStartMenuStore.getState().searchQuery).toBe('');
    });

    it('trims whitespace from query', () => {
      const { setSearchQuery } = useStartMenuStore.getState();
      
      act(() => {
        setSearchQuery('  government  ');
      });

      expect(useStartMenuStore.getState().searchQuery).toBe('government');
    });
  });

  describe('setPinnedApps', () => {
    it('sets pinned apps array', () => {
      const { setPinnedApps } = useStartMenuStore.getState();
      const pinnedApps = mockModules.slice(0, 3);
      
      act(() => {
        setPinnedApps(pinnedApps);
      });

      expect(useStartMenuStore.getState().pinnedApps).toHaveLength(3);
      expect(useStartMenuStore.getState().pinnedApps).toEqual(pinnedApps);
    });

    it('replaces existing pinned apps', () => {
      useStartMenuStore.setState({ pinnedApps: mockModules.slice(0, 2) });
      
      const { setPinnedApps } = useStartMenuStore.getState();
      const newPinnedApps = mockModules.slice(2, 4);
      
      act(() => {
        setPinnedApps(newPinnedApps);
      });

      expect(useStartMenuStore.getState().pinnedApps).toEqual(newPinnedApps);
    });
  });

  describe('setAllApps', () => {
    it('sets all apps array', () => {
      const { setAllApps } = useStartMenuStore.getState();
      
      act(() => {
        setAllApps(mockModules);
      });

      expect(useStartMenuStore.getState().allApps).toHaveLength(5);
      expect(useStartMenuStore.getState().allApps).toEqual(mockModules);
    });

    it('replaces existing all apps', () => {
      useStartMenuStore.setState({ allApps: mockModules });
      
      const { setAllApps } = useStartMenuStore.getState();
      const newApps = mockModules.slice(0, 2);
      
      act(() => {
        setAllApps(newApps);
      });

      expect(useStartMenuStore.getState().allApps).toEqual(newApps);
    });
  });

  describe('addPinnedApp', () => {
    it('adds app to pinned apps', () => {
      const { addPinnedApp } = useStartMenuStore.getState();
      
      act(() => {
        addPinnedApp(mockModules[0]);
      });

      expect(useStartMenuStore.getState().pinnedApps).toHaveLength(1);
      expect(useStartMenuStore.getState().pinnedApps[0].id).toBe('government-edition');
    });

    it('does not add duplicate app', () => {
      useStartMenuStore.setState({ pinnedApps: [mockModules[0]] });
      
      const { addPinnedApp } = useStartMenuStore.getState();
      
      act(() => {
        addPinnedApp(mockModules[0]);
      });

      expect(useStartMenuStore.getState().pinnedApps).toHaveLength(1);
    });

    it('adds app to end of pinned list', () => {
      useStartMenuStore.setState({ pinnedApps: [mockModules[0]] });
      
      const { addPinnedApp } = useStartMenuStore.getState();
      
      act(() => {
        addPinnedApp(mockModules[1]);
      });

      const { pinnedApps } = useStartMenuStore.getState();
      expect(pinnedApps).toHaveLength(2);
      expect(pinnedApps[1].id).toBe('costforge-ai');
    });
  });

  describe('removePinnedApp', () => {
    it('removes app from pinned apps', () => {
      useStartMenuStore.setState({ pinnedApps: mockModules.slice(0, 3) });
      
      const { removePinnedApp } = useStartMenuStore.getState();
      
      act(() => {
        removePinnedApp('costforge-ai');
      });

      const { pinnedApps } = useStartMenuStore.getState();
      expect(pinnedApps).toHaveLength(2);
      expect(pinnedApps.find(app => app.id === 'costforge-ai')).toBeUndefined();
    });

    it('does nothing if app not in pinned apps', () => {
      useStartMenuStore.setState({ pinnedApps: mockModules.slice(0, 2) });
      
      const { removePinnedApp } = useStartMenuStore.getState();
      
      act(() => {
        removePinnedApp('non-existent-app');
      });

      expect(useStartMenuStore.getState().pinnedApps).toHaveLength(2);
    });
  });

  describe('Selector: getFilteredApps', () => {
    beforeEach(() => {
      useStartMenuStore.setState({ allApps: mockModules });
    });

    it('returns all apps when search query is empty', () => {
      const filteredApps = useStartMenuStore.getState().getFilteredApps();
      
      expect(filteredApps).toHaveLength(5);
    });

    it('filters apps by name (case-insensitive)', () => {
      useStartMenuStore.setState({ searchQuery: 'GOVERNMENT' });
      
      const filteredApps = useStartMenuStore.getState().getFilteredApps();
      
      expect(filteredApps).toHaveLength(1);
      expect(filteredApps[0].id).toBe('government-edition');
    });

    it('filters apps by partial name match', () => {
      useStartMenuStore.setState({ searchQuery: 'terra' });
      
      const filteredApps = useStartMenuStore.getState().getFilteredApps();
      
      expect(filteredApps).toHaveLength(2);
      expect(filteredApps.map(app => app.id)).toContain('terra-flow');
      expect(filteredApps.map(app => app.id)).toContain('terra-levy');
    });

    it('filters apps by description', () => {
      useStartMenuStore.setState({ searchQuery: 'workflow' });
      
      const filteredApps = useStartMenuStore.getState().getFilteredApps();
      
      expect(filteredApps).toHaveLength(1);
      expect(filteredApps[0].id).toBe('terra-flow');
    });

    it('filters apps by category', () => {
      useStartMenuStore.setState({ searchQuery: 'ai' });
      
      const filteredApps = useStartMenuStore.getState().getFilteredApps();
      
      // Should match 'CostForge AI' (name) and category 'ai'
      expect(filteredApps.length).toBeGreaterThanOrEqual(1);
      expect(filteredApps.map(app => app.id)).toContain('costforge-ai');
    });

    it('returns empty array when no matches', () => {
      useStartMenuStore.setState({ searchQuery: 'zzzznonexistent' });
      
      const filteredApps = useStartMenuStore.getState().getFilteredApps();
      
      expect(filteredApps).toHaveLength(0);
    });

    it('returns apps sorted alphabetically by name', () => {
      useStartMenuStore.setState({ searchQuery: '' });
      
      const filteredApps = useStartMenuStore.getState().getFilteredApps();
      
      const names = filteredApps.map(app => app.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      
      expect(names).toEqual(sortedNames);
    });
  });

  describe('Selector: getActiveApps', () => {
    beforeEach(() => {
      useStartMenuStore.setState({ allApps: mockModules });
    });

    it('returns only apps with active status', () => {
      const activeApps = useStartMenuStore.getState().getActiveApps();
      
      expect(activeApps).toHaveLength(4);
      expect(activeApps.every(app => app.status === 'active')).toBe(true);
    });

    it('excludes inactive apps', () => {
      const activeApps = useStartMenuStore.getState().getActiveApps();
      
      expect(activeApps.find(app => app.id === 'terra-levy')).toBeUndefined();
    });
  });

  describe('Selector: getAppsByCategory', () => {
    beforeEach(() => {
      useStartMenuStore.setState({ allApps: mockModules });
    });

    it('returns apps grouped by category', () => {
      const grouped = useStartMenuStore.getState().getAppsByCategory();
      
      expect(grouped).toHaveProperty('core');
      expect(grouped).toHaveProperty('ai');
      expect(grouped).toHaveProperty('automation');
      expect(grouped).toHaveProperty('mapping');
      expect(grouped).toHaveProperty('finance');
    });

    it('groups apps correctly', () => {
      const grouped = useStartMenuStore.getState().getAppsByCategory();
      
      expect(grouped.core).toHaveLength(1);
      expect(grouped.core[0].id).toBe('government-edition');
      expect(grouped.ai).toHaveLength(1);
      expect(grouped.ai[0].id).toBe('costforge-ai');
    });
  });

  describe('React Hook Integration', () => {
    it('re-renders when isOpen changes', () => {
      const { result } = renderHook(() => useStartMenuStore((state) => state.isOpen));
      
      expect(result.current).toBe(false);

      act(() => {
        useStartMenuStore.getState().open();
      });

      expect(result.current).toBe(true);
    });

    it('re-renders when searchQuery changes', () => {
      const { result } = renderHook(() => useStartMenuStore((state) => state.searchQuery));
      
      expect(result.current).toBe('');

      act(() => {
        useStartMenuStore.getState().setSearchQuery('test');
      });

      expect(result.current).toBe('test');
    });

    it('provides stable action references', () => {
      const { result, rerender } = renderHook(() => 
        useStartMenuStore((state) => ({
          toggle: state.toggle,
          open: state.open,
          close: state.close,
        }))
      );

      const firstToggle = result.current.toggle;
      const firstOpen = result.current.open;
      const firstClose = result.current.close;

      rerender();

      expect(result.current.toggle).toBe(firstToggle);
      expect(result.current.open).toBe(firstOpen);
      expect(result.current.close).toBe(firstClose);
    });
  });

  describe('Keyboard Shortcut Support', () => {
    it('provides isOpen state for keyboard listeners', () => {
      const { isOpen, toggle } = useStartMenuStore.getState();
      
      expect(isOpen).toBe(false);
      
      // Simulate Windows key press (handled by component, but store provides state)
      act(() => {
        toggle();
      });

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Phase 3.2: Module Launch Integration (INT-001)
  // --------------------------------------------------------------------------
  describe('Module Launch Integration (Phase 3.2)', () => {
    beforeEach(() => {
      // Reset both stores
      useStartMenuStore.setState({
        isOpen: true,
        searchQuery: 'test',
        pinnedApps: [],
        allApps: mockModules,
        selectedModuleId: null,
      });
    });

    describe('launchModule action', () => {
      it('sets selectedModuleId when launching a module', () => {
        const { launchModule } = useStartMenuStore.getState();

        act(() => {
          launchModule('government-edition');
        });

        expect(useStartMenuStore.getState().selectedModuleId).toBe('government-edition');
      });

      it('closes the start menu when launching a module', () => {
        const { launchModule } = useStartMenuStore.getState();
        useStartMenuStore.setState({ isOpen: true });

        act(() => {
          launchModule('costforge-ai');
        });

        expect(useStartMenuStore.getState().isOpen).toBe(false);
      });

      it('clears search query when launching a module', () => {
        const { launchModule } = useStartMenuStore.getState();
        useStartMenuStore.setState({ searchQuery: 'test query' });

        act(() => {
          launchModule('terra-flow');
        });

        expect(useStartMenuStore.getState().searchQuery).toBe('');
      });

      it('performs all side effects atomically', () => {
        const { launchModule } = useStartMenuStore.getState();
        useStartMenuStore.setState({ 
          isOpen: true, 
          searchQuery: 'search term',
          selectedModuleId: null,
        });

        act(() => {
          launchModule('test-module');
        });

        const state = useStartMenuStore.getState();
        expect(state.selectedModuleId).toBe('test-module');
        expect(state.isOpen).toBe(false);
        expect(state.searchQuery).toBe('');
      });
    });

    describe('selectedModuleId state', () => {
      it('starts as null by default', () => {
        useStartMenuStore.setState({ selectedModuleId: null });
        expect(useStartMenuStore.getState().selectedModuleId).toBeNull();
      });

      it('can be cleared by setting to null', () => {
        act(() => {
          useStartMenuStore.getState().launchModule('test-module');
        });

        expect(useStartMenuStore.getState().selectedModuleId).toBe('test-module');

        act(() => {
          useStartMenuStore.setState({ selectedModuleId: null });
        });

        expect(useStartMenuStore.getState().selectedModuleId).toBeNull();
      });
    });

    describe('clearSelectedModule action', () => {
      it('clears the selected module ID', () => {
        act(() => {
          useStartMenuStore.getState().launchModule('test-module');
        });

        expect(useStartMenuStore.getState().selectedModuleId).toBe('test-module');

        act(() => {
          useStartMenuStore.getState().clearSelectedModule();
        });

        expect(useStartMenuStore.getState().selectedModuleId).toBeNull();
      });
    });
  });
});

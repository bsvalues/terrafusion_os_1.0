/**
 * TerraFusion OS Command Palette Store Tests
 *
 * Priority 10: Tests for command palette state management.
 *
 * @module stores/__tests__/commandPaletteStore.test
 */

import { act } from 'react';
import { useCommandPaletteStore, MAX_RECENT_COMMANDS } from '../commandPaletteStore';

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  act(() => {
    useCommandPaletteStore.setState({
      isOpen: false,
      searchQuery: '',
      recentCommands: [],
    });
  });
});

// ============================================================================
// Tests
// ============================================================================

describe('commandPaletteStore', () => {
  // ==========================================================================
  // Initial State
  // ==========================================================================

  describe('initial state', () => {
    it('starts with palette closed', () => {
      const { isOpen } = useCommandPaletteStore.getState();
      expect(isOpen).toBe(false);
    });

    it('starts with empty search query', () => {
      const { searchQuery } = useCommandPaletteStore.getState();
      expect(searchQuery).toBe('');
    });

    it('starts with empty recent commands', () => {
      const { recentCommands } = useCommandPaletteStore.getState();
      expect(recentCommands).toEqual([]);
    });
  });

  // ==========================================================================
  // Open/Close/Toggle
  // ==========================================================================

  describe('open/close/toggle', () => {
    it('open() sets isOpen to true', () => {
      act(() => {
        useCommandPaletteStore.getState().open();
      });

      expect(useCommandPaletteStore.getState().isOpen).toBe(true);
    });

    it('open() clears search query', () => {
      act(() => {
        useCommandPaletteStore.setState({ searchQuery: 'test' });
        useCommandPaletteStore.getState().open();
      });

      expect(useCommandPaletteStore.getState().searchQuery).toBe('');
    });

    it('close() sets isOpen to false', () => {
      act(() => {
        useCommandPaletteStore.setState({ isOpen: true });
        useCommandPaletteStore.getState().close();
      });

      expect(useCommandPaletteStore.getState().isOpen).toBe(false);
    });

    it('close() clears search query', () => {
      act(() => {
        useCommandPaletteStore.setState({ isOpen: true, searchQuery: 'test' });
        useCommandPaletteStore.getState().close();
      });

      expect(useCommandPaletteStore.getState().searchQuery).toBe('');
    });

    it('toggle() opens when closed', () => {
      act(() => {
        useCommandPaletteStore.getState().toggle();
      });

      expect(useCommandPaletteStore.getState().isOpen).toBe(true);
    });

    it('toggle() closes when open', () => {
      act(() => {
        useCommandPaletteStore.setState({ isOpen: true });
        useCommandPaletteStore.getState().toggle();
      });

      expect(useCommandPaletteStore.getState().isOpen).toBe(false);
    });
  });

  // ==========================================================================
  // Search Query
  // ==========================================================================

  describe('search query', () => {
    it('setSearchQuery updates query', () => {
      act(() => {
        useCommandPaletteStore.getState().setSearchQuery('costforge');
      });

      expect(useCommandPaletteStore.getState().searchQuery).toBe('costforge');
    });

    it('setSearchQuery can be cleared', () => {
      act(() => {
        useCommandPaletteStore.getState().setSearchQuery('test');
        useCommandPaletteStore.getState().setSearchQuery('');
      });

      expect(useCommandPaletteStore.getState().searchQuery).toBe('');
    });
  });

  // ==========================================================================
  // Recent Commands
  // ==========================================================================

  describe('recent commands', () => {
    it('addToRecent adds command to list', () => {
      act(() => {
        useCommandPaletteStore.getState().addToRecent('costforge');
      });

      expect(useCommandPaletteStore.getState().recentCommands).toContain('costforge');
    });

    it('addToRecent adds to front of list', () => {
      act(() => {
        useCommandPaletteStore.getState().addToRecent('first');
        useCommandPaletteStore.getState().addToRecent('second');
      });

      const { recentCommands } = useCommandPaletteStore.getState();
      expect(recentCommands[0]).toBe('second');
      expect(recentCommands[1]).toBe('first');
    });

    it('addToRecent prevents duplicates', () => {
      act(() => {
        useCommandPaletteStore.getState().addToRecent('costforge');
        useCommandPaletteStore.getState().addToRecent('settings');
        useCommandPaletteStore.getState().addToRecent('costforge');
      });

      const { recentCommands } = useCommandPaletteStore.getState();
      const costforgeCount = recentCommands.filter((id) => id === 'costforge').length;
      expect(costforgeCount).toBe(1);
    });

    it('addToRecent moves existing to front', () => {
      act(() => {
        useCommandPaletteStore.getState().addToRecent('first');
        useCommandPaletteStore.getState().addToRecent('second');
        useCommandPaletteStore.getState().addToRecent('first');
      });

      const { recentCommands } = useCommandPaletteStore.getState();
      expect(recentCommands[0]).toBe('first');
      expect(recentCommands[1]).toBe('second');
    });

    it('addToRecent limits to MAX_RECENT_COMMANDS', () => {
      act(() => {
        for (let i = 0; i < 10; i++) {
          useCommandPaletteStore.getState().addToRecent(`command-${i}`);
        }
      });

      const { recentCommands } = useCommandPaletteStore.getState();
      expect(recentCommands.length).toBe(MAX_RECENT_COMMANDS);
    });

    it('clearRecent empties the list', () => {
      act(() => {
        useCommandPaletteStore.getState().addToRecent('one');
        useCommandPaletteStore.getState().addToRecent('two');
        useCommandPaletteStore.getState().clearRecent();
      });

      expect(useCommandPaletteStore.getState().recentCommands).toEqual([]);
    });
  });

  // ==========================================================================
  // Constants
  // ==========================================================================

  describe('constants', () => {
    it('MAX_RECENT_COMMANDS is 5', () => {
      expect(MAX_RECENT_COMMANDS).toBe(5);
    });
  });
});

/**
 * TerraFusion OS Command Palette Store
 *
 * Manages command palette state including:
 * - Open/close state
 * - Recent commands history
 * - Search query
 *
 * @module stores/commandPaletteStore
 * @see Priority 10: Global Search
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type CommandCategory = 'modules' | 'settings' | 'shortcuts' | 'actions' | 'navigation';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category: CommandCategory;
  keywords?: string[];
  shortcut?: string;
  action: () => void;
}

export interface CommandPaletteState {
  // State
  isOpen: boolean;
  searchQuery: string;
  recentCommands: string[]; // Array of command IDs

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  setSearchQuery: (query: string) => void;
  addToRecent: (commandId: string) => void;
  clearRecent: () => void;
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of recent commands to store */
export const MAX_RECENT_COMMANDS = 5;

// ============================================================================
// Store Implementation
// ============================================================================

export const useCommandPaletteStore = create<CommandPaletteState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      searchQuery: '',
      recentCommands: [],

      open: () => set({ isOpen: true, searchQuery: '' }),
      close: () => set({ isOpen: false, searchQuery: '' }),
      toggle: () => {
        const { isOpen } = get();
        set({ isOpen: !isOpen, searchQuery: '' });
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      addToRecent: (commandId) => {
        set((state) => {
          // Remove if already exists, then add to front
          const filtered = state.recentCommands.filter((id) => id !== commandId);
          const updated = [commandId, ...filtered].slice(0, MAX_RECENT_COMMANDS);
          return { recentCommands: updated };
        });
      },

      clearRecent: () => set({ recentCommands: [] }),
    }),
    {
      name: 'terrafusion-command-palette',
      version: 1,
      partialize: (state) => ({
        recentCommands: state.recentCommands,
      }),
    }
  )
);

// ============================================================================
// Convenience Hooks
// ============================================================================

/** Hook for command palette open state */
export const useCommandPaletteOpen = () =>
  useCommandPaletteStore((state) => state.isOpen);

/** Hook for search query */
export const useCommandPaletteSearch = () =>
  useCommandPaletteStore((state) => state.searchQuery);

/** Hook for recent commands */
export const useRecentCommands = () =>
  useCommandPaletteStore((state) => state.recentCommands);

/** Hook for command palette actions */
export const useCommandPaletteActions = () =>
  useCommandPaletteStore((state) => ({
    open: state.open,
    close: state.close,
    toggle: state.toggle,
    setSearchQuery: state.setSearchQuery,
    addToRecent: state.addToRecent,
    clearRecent: state.clearRecent,
  }));

export default useCommandPaletteStore;

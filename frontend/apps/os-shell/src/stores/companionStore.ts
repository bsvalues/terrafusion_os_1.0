/**
 * TerraFusion OS — Companion Store
 *
 * Manages TerraPilot/TerraMuse companion panel state and the OS context bus.
 *
 * The companion is a system-level service, not a window. It lives as a
 * persistent panel in the shell chrome and subscribes to OS context events
 * to know what the operator is looking at without being told.
 *
 * Context bus fields are written by:
 *   - parcelContext.openWorkbenchWindow() → setActiveParcel()
 *   - Suite activation → setActiveSuite()
 *   - Workbench tab changes → setActiveTab()
 *
 * @module stores/companionStore
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface CompanionContext {
  /** Parcel currently open in the Workbench, or null if no workbench is open. */
  activeParcelId: string | null;
  /** Suite currently in focus (forge, atlas, dais, dossier, gpt), or null. */
  activeSuite: string | null;
  /** Workbench tab currently active (summary, forge, dais, etc.), or null. */
  activeTab: string | null;
}

interface CompanionState extends CompanionContext {
  /** Whether the companion panel is slid open. */
  isOpen: boolean;

  // Panel controls
  open: () => void;
  close: () => void;
  toggle: () => void;

  // Context bus writers
  setActiveParcel: (parcelId: string | null) => void;
  setActiveSuite: (suiteId: string | null) => void;
  setActiveTab: (tabId: string | null) => void;
}

// ============================================================================
// Store
// ============================================================================

export const useCompanionStore = create<CompanionState>((set) => ({
  // Panel state — starts closed
  isOpen: false,

  // Context bus — starts empty
  activeParcelId: null,
  activeSuite: null,
  activeTab: null,

  // Panel controls
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  // Context bus writers
  setActiveParcel: (parcelId) => set({ activeParcelId: parcelId }),
  setActiveSuite: (suiteId) => set({ activeSuite: suiteId }),
  setActiveTab: (tabId) => set({ activeTab: tabId }),
}));

export default useCompanionStore;
